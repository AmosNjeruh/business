// Advanced campaign analytics — compact dashboard layout (light / dark).
// Route: /admin/campaigns/[id]/analytics

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import AdminLayout from "@/components/admin/Layout";
import {
  AnalyticsPageShell,
  AnalyticsHero,
  AnalyticsSummaryBanner,
  AnalyticsTierTabs,
  AnalyticsCard,
  AnalyticsCardHeader,
  AnalyticsCardBody,
  AnalyticsCpmCard,
  AnalyticsMiniStatGrid,
  AnalyticsKpiStrip,
  AnalyticsPlatformFilter,
  AnalyticsPillToggle,
  AnalyticsChartTooltip,
  AnalyticsTableWrap,
  AnalyticsInsightList,
  useAnalyticsChartPalette,
  ANALYTICS_PLATFORM_COLORS,
  AnalyticsDonutCenter,
  filterRowsByAllowedPlatforms,
  isHiddenAnalyticsMetricKey,
  sortAnalyticsPlatformRows,
  isAnalyticsTwitterPlatform,
} from "@/components/admin/analytics/AnalyticsDashboard";
import {
  getCampaign,
  getApplications,
  getCampaignMetricsDto,
  getCampaignMetricsTimeSeries,
  getCampaignAnalytics,
  getTimeSeriesAnalytics,
  type MetricsTimeSeriesWindow,
} from "@/services/vendor";
import { useCurrency } from "@/hooks/useCurrency";
import { FaSpinner, FaChartLine, FaLayerGroup, FaTable, FaBullseye, FaBolt, FaUsers } from "react-icons/fa";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  BarChart,
  Bar,
} from "recharts";

const TS_WINDOWS: MetricsTimeSeriesWindow[] = ["30m", "1h", "2h", "12h", "24h"];
const RANGE = ["7d", "30d", "90d", "1y"] as const;
const TIER_TABS = [
  { id: "all" as const, label: "All", hint: "Everything" },
  { id: "pulse" as const, label: "Pulse", hint: "KPIs & ROI" },
  { id: "streams" as const, label: "Streams", hint: "Trends & snapshots" },
  { id: "tables" as const, label: "Data", hint: "Breakdowns" },
];

/** Chart series — aligned with Finance emerald / cyan / indigo accents */
const PALETTE = ["#059669", "#0891b2", "#6366f1", "#d97706", "#db2777", "#7c3aed", "#0d9488", "#4f46e5"];

const PROGRAM_PERF_LABELS: Record<string, string> = {
  applications: "APPLICATIONS (Submitted pipeline)",
  approvals: "APPROVALS (Accepted partners)",
  completions: "COMPLETIONS (Delivered work)",
  budget: "BUDGET (Allocated cap)",
  spent: "SPENT (Partner earnings out)",
  campaignTitle: "TITLE (Campaign name)",
  conversionRate: "CR (Conversion rate)",
  roi: "ROI (Return on investment)",
};

function programPerfLabel(rawKey: string): string {
  const k = rawKey.trim();
  if (PROGRAM_PERF_LABELS[k]) return PROGRAM_PERF_LABELS[k];
  return k
    .replace(/([A-Z])/g, " $1")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

type ParticipantPerfRow = {
  id: string;
  partnerName: string;
  status: string;
  postCount: number;
  validatedCount: number;
  platformsLabel: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  reach: number;
  impressions: number;
};

function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(Math.round(n * 10) / 10);
}

function labelPlatform(p: string) {
  if (!p) return "—";
  const lower = p.toLowerCase();
  if (lower === "youtube") return "YouTube";
  if (lower === "tiktok") return "TikTok";
  if (lower === "twitter" || lower === "x") return "X (Twitter)";
  return p.charAt(0) + p.slice(1).toLowerCase();
}

function flattenMetricRows(obj: Record<string, unknown> | null | undefined): { key: string; value: string }[] {
  if (!obj || typeof obj !== "object") return [];
  const rows: { key: string; value: string }[] = [];
  for (const [k, v] of Object.entries(obj)) {
    if (isHiddenAnalyticsMetricKey(k)) continue;
    if (v === null || v === undefined) rows.push({ key: k, value: "—" });
    else if (typeof v === "number" || typeof v === "boolean" || typeof v === "string") rows.push({ key: k, value: String(v) });
    else if (Array.isArray(v)) rows.push({ key: k, value: `[${v.length}]` });
    else rows.push({ key: k, value: "…" });
  }
  return rows.sort((a, b) => a.key.localeCompare(b.key));
}

/** Spend in USD: analytics API earned total, else budget − remaining when both exist. */
function resolveCampaignSpendUsd(perf: Record<string, unknown> | null | undefined, campaign: { budget?: unknown; remainingBudget?: unknown } | null) {
  const fromPerf = perf && typeof perf.spent === "number" ? Number(perf.spent) : NaN;
  if (Number.isFinite(fromPerf) && fromPerf >= 0) return fromPerf;
  const b = campaign?.budget != null ? Number(campaign.budget) : NaN;
  const r = campaign?.remainingBudget != null ? Number(campaign.remainingBudget) : NaN;
  if (Number.isFinite(b) && Number.isFinite(r)) return Math.max(0, b - r);
  return 0;
}


export default function CampaignAdvancedAnalyticsPage() {
  const router = useRouter();
  const { id } = router.query;
  const { formatFromUSD } = useCurrency();
  const cp = useAnalyticsChartPalette();
  const [tier, setTier] = useState<(typeof TIER_TABS)[number]["id"]>("all");
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<any>(null);
  const [metricsDto, setMetricsDto] = useState<any>(null);
  const [snapWindow, setSnapWindow] = useState<MetricsTimeSeriesWindow>("24h");
  const [snapshotTs, setSnapshotTs] = useState<any>(null);
  const [perf, setPerf] = useState<any>(null);
  const [workflowRange, setWorkflowRange] = useState<(typeof RANGE)[number]>("30d");
  const [tsApps, setTsApps] = useState<any>(null);
  const [tsApprovals, setTsApprovals] = useState<any>(null);
  const [tsCompletions, setTsCompletions] = useState<any>(null);
  const [tsSpend, setTsSpend] = useState<any>(null);
  const [appPartnerById, setAppPartnerById] = useState<Map<string, string>>(new Map());
  const [platformFilter, setPlatformFilter] = useState<string>("ALL");

  useEffect(() => {
    setPlatformFilter("ALL");
  }, [id]);

  useEffect(() => {
    if (!id || typeof id !== "string") return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const c = await getCampaign(id);
        if (cancelled) return;
        setCampaign(c);
        const appsListPromise = getApplications({ campaignId: id, limit: 100 }).catch(() => ({ data: [] as any[] }));
        const [dto, perfRes, apps, appr, comp, spend, appsList] = await Promise.all([
          getCampaignMetricsDto(id).catch(() => null),
          getCampaignAnalytics({ campaignId: id, timeRange: workflowRange }).catch(() => null),
          getTimeSeriesAnalytics({ metric: "applications", timeRange: workflowRange, groupBy: "day", campaignId: id }).catch(() => null),
          getTimeSeriesAnalytics({ metric: "approvals", timeRange: workflowRange, groupBy: "day", campaignId: id }).catch(() => null),
          getTimeSeriesAnalytics({ metric: "completions", timeRange: workflowRange, groupBy: "day", campaignId: id }).catch(() => null),
          getTimeSeriesAnalytics({ metric: "spend", timeRange: workflowRange, groupBy: "day", campaignId: id }).catch(() => null),
          appsListPromise,
        ]);
        if (cancelled) return;
        const rows = appsList?.data ?? [];
        setAppPartnerById(new Map(rows.map((a: any) => [a.id, a.partner?.name ?? "—"])));
        setMetricsDto(dto);
        setPerf(perfRes);
        setTsApps(apps);
        setTsApprovals(appr);
        setTsCompletions(comp);
        setTsSpend(spend);
      } catch (e: any) {
        toast.error(e?.response?.data?.error || "Failed to load analytics");
        router.push(`/admin/campaigns/${id}`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, router, workflowRange]);

  useEffect(() => {
    if (!id || typeof id !== "string") return;
    let cancelled = false;
    (async () => {
      const snap = await getCampaignMetricsTimeSeries(id, snapWindow).catch(() => null);
      if (!cancelled) setSnapshotTs(snap);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, snapWindow]);

  const totals = metricsDto?.totals;
  const byPlatform = useMemo(() => {
    const raw = (metricsDto?.byPlatform ?? []) as any[];
    return filterRowsByAllowedPlatforms(raw);
  }, [metricsDto?.byPlatform]);

  const platformFilterOptions = useMemo(() => {
    const opts = byPlatform.map((p) => {
      const id = String(p.platform);
      return {
        id,
        platform: id,
        label: labelPlatform(id),
        hint: isAnalyticsTwitterPlatform(id) ? "Manual link — not auto-tracked" : undefined,
      };
    });
    return sortAnalyticsPlatformRows(opts).map(({ id, label, hint }) => ({ id, label, hint }));
  }, [byPlatform]);

  const filteredTotals = useMemo(() => {
    if (!totals) return null;
    if (platformFilter === "ALL") return totals;
    const row = byPlatform.find((p) => String(p.platform).toUpperCase() === platformFilter.toUpperCase());
    if (!row) return totals;
    return {
      posts: row.posts ?? 0,
      views: row.views ?? 0,
      impressions: row.impressions ?? 0,
      reach: row.reach ?? 0,
      likes: row.likes ?? 0,
      comments: row.comments ?? 0,
      shares: row.shares ?? 0,
      engagementRate: row.engagementRate ?? 0,
    };
  }, [totals, platformFilter, byPlatform]);

  const workflowLinesData = useMemo(() => {
    const dates = new Set<string>();
    const collect = (arr: any[] | undefined) => arr?.forEach((p: any) => p?.date && dates.add(String(p.date)));
    collect(tsApps?.dataPoints);
    collect(tsApprovals?.dataPoints);
    collect(tsCompletions?.dataPoints);
    collect(tsSpend?.dataPoints);
    const pick = (arr: any, d: string) => {
      const pt = arr?.dataPoints?.find((x: any) => String(x.date) === d);
      return typeof pt?.value === "number" ? pt.value : Number(pt?.value ?? 0) || 0;
    };
    return [...dates]
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      .map((date) => ({
        date,
        applications: pick(tsApps, date),
        approvals: pick(tsApprovals, date),
        completions: pick(tsCompletions, date),
        spend: pick(tsSpend, date),
      }));
  }, [tsApps, tsApprovals, tsCompletions, tsSpend]);

  const platformEngagementBars = useMemo(() => {
    let rows = byPlatform;
    if (platformFilter !== "ALL") {
      rows = rows.filter((p) => String(p.platform).toUpperCase() === platformFilter.toUpperCase());
    }
    const mapped = rows.map((p) => ({
      name: labelPlatform(String(p.platform)),
      platform: String(p.platform),
      views: Number(p.views ?? 0),
      likes: Number(p.likes ?? 0),
      comments: Number(p.comments ?? 0),
      reach: Number(p.reach ?? 0),
    }));
    return sortAnalyticsPlatformRows(mapped);
  }, [byPlatform, platformFilter]);

  const snapChartData = useMemo(() => {
    const pts = snapshotTs?.points ?? [];
    return pts.map((p: any) => ({
      t: new Date(p.timestamp).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
      ...p,
    }));
  }, [snapshotTs]);

  const validatedPosts = useMemo(() => {
    if (!campaign?.applications) return [];
    return campaign.applications.flatMap((app: any) =>
      (app.posts ?? []).map((post: any) => ({
        ...post,
        partnerName: appPartnerById.get(app.id) ?? "—",
        applicationStatus: app.status,
      }))
    );
  }, [campaign, appPartnerById]);

  const pieReach = useMemo(() => {
    let rows = byPlatform;
    if (platformFilter !== "ALL") {
      rows = rows.filter((p) => String(p.platform).toUpperCase() === platformFilter.toUpperCase());
    }
    const mapped = rows.map((p) => {
      const activity = Math.max(
        Number(p.reach ?? 0),
        Number(p.views ?? 0),
        Number(p.impressions ?? 0),
        Number(p.likes ?? 0),
        Number(p.comments ?? 0),
        Number(p.shares ?? 0),
      );
      const posts = Number(p.posts ?? 0);
      const value = activity > 0 ? activity : posts;
      return {
        name: labelPlatform(String(p.platform)),
        platform: String(p.platform),
        value,
      };
    });
    return sortAnalyticsPlatformRows(mapped).filter((e) => e.value > 0);
  }, [byPlatform, platformFilter]);

  const participantPerformanceRows = useMemo((): ParticipantPerfRow[] => {
    if (!campaign?.applications?.length) return [];
    return campaign.applications
      .map((app: any): ParticipantPerfRow => {
        const posts = app.posts ?? [];
        const acc = { views: 0, likes: 0, comments: 0, shares: 0, reach: 0, impressions: 0 };
        const plats = new Set<string>();
        for (const post of posts) {
          acc.views += Number(post.views ?? 0);
          acc.likes += Number(post.likes ?? 0);
          acc.comments += Number(post.comments ?? 0);
          acc.shares += Number(post.shares ?? 0);
          acc.reach += Number(post.reach ?? 0);
          acc.impressions += Number(post.impressions ?? 0);
          if (post.platform) plats.add(labelPlatform(String(post.platform)));
        }
        const validatedCount = posts.filter((x: any) => x.validated).length;
        return {
          id: String(app.id),
          partnerName: appPartnerById.get(app.id) ?? app.partner?.name ?? "—",
          status: String(app.status ?? "—"),
          postCount: posts.length,
          validatedCount,
          platformsLabel: [...plats].join(", ") || "—",
          ...acc,
        };
      })
      .sort((a: ParticipantPerfRow, b: ParticipantPerfRow) => b.likes + b.comments - (a.likes + a.comments));
  }, [campaign?.applications, appPartnerById]);

  const participantPerformanceRowsFiltered = useMemo((): ParticipantPerfRow[] => {
    if (platformFilter === "ALL") return participantPerformanceRows;
    const pf = platformFilter.toUpperCase();
    return participantPerformanceRows.filter((r: ParticipantPerfRow) => {
      const app = campaign?.applications?.find((a: any) => String(a.id) === r.id);
      const posts = app?.posts ?? [];
      return posts.some((p: any) => String(p.platform).toUpperCase() === pf);
    });
  }, [participantPerformanceRows, platformFilter, campaign?.applications]);

  const validatedPostsFiltered = useMemo(() => {
    if (platformFilter === "ALL") return validatedPosts;
    return validatedPosts.filter((post: any) => String(post.platform).toUpperCase() === platformFilter.toUpperCase());
  }, [validatedPosts, platformFilter]);

  const insights = useMemo(() => {
    const out: string[] = [];
    if (platformFilter !== "ALL") {
      out.push(`Filtered to ${labelPlatform(platformFilter)} — totals below reflect this channel only.`);
    }
    const top = [...byPlatform].sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0))[0];
    if (top?.platform) out.push(`Strongest engagement signals on ${labelPlatform(String(top.platform))} by interactions.`);
    if (filteredTotals?.posts) out.push(`${fmtNum(filteredTotals.posts)} tracked posts in this view.`);
    if (perf?.conversionRate != null) out.push(`Application-to-conversion rate is ${Number(perf.conversionRate).toFixed(1)}% for the selected workflow window.`);
    return out.slice(0, 4);
  }, [byPlatform, filteredTotals, perf, platformFilter]);

  const budgetSpend = useMemo(() => {
    if (!campaign) return { budgetUsd: 0, spendUsd: 0, remainingLabel: "—", utilPct: null as number | null };
    const budgetUsd = Number(perf?.budget ?? campaign.budget ?? 0);
    const spendUsd = resolveCampaignSpendUsd(perf as Record<string, unknown> | undefined, campaign);
    let remainingLabel = "—";
    if (campaign.remainingBudget != null && Number.isFinite(Number(campaign.remainingBudget))) {
      remainingLabel = formatFromUSD(Number(campaign.remainingBudget));
    } else if (Number.isFinite(budgetUsd)) {
      remainingLabel = formatFromUSD(Math.max(0, budgetUsd - spendUsd));
    }
    const utilPct = budgetUsd > 0 ? Math.min(100, (spendUsd / budgetUsd) * 100) : null;
    return { budgetUsd, spendUsd, remainingLabel, utilPct };
  }, [perf, campaign, formatFromUSD]);

  const cpmInsight = useMemo(() => {
    if (!filteredTotals) return null;
    const spend = budgetSpend.spendUsd;
    const impressions =
      typeof filteredTotals.impressions === "number" && Number.isFinite(filteredTotals.impressions) && filteredTotals.impressions > 0
        ? filteredTotals.impressions
        : 0;
    const cpm = spend > 0 && impressions > 0 ? formatFromUSD((spend / impressions) * 1000) : null;
    return { cpm, impressions, spend, scoped: platformFilter !== "ALL" };
  }, [filteredTotals, budgetSpend.spendUsd, formatFromUSD, platformFilter]);

  if (loading || !campaign) {
    return (
      <AdminLayout>
        <AnalyticsPageShell>
          <div className="flex justify-center items-center min-h-[50vh]">
            <FaSpinner className="animate-spin text-3xl text-emerald-600" />
          </div>
        </AnalyticsPageShell>
      </AdminLayout>
    );
  }

  const lastUpdated = new Date().toLocaleString();
  const status = String(campaign.status ?? "");
  const statusTone =
    status === "ACTIVE" ? "live" : status === "PENDING" || status === "DRAFT" ? "draft" : "muted";

  const showPulse = tier === "all" || tier === "pulse";
  const showStreams = tier === "all" || tier === "streams";
  const showTables = tier === "all" || tier === "tables";

  const kpiItems =
    filteredTotals &&
    (
      [
        ["POSTS (Tracked live)", "posts"],
        ["VIEWS (Content views)", "views"],
        ["IMP (Impressions)", "impressions"],
        ["REACH (Accounts reached)", "reach"],
        ["LIKES", "likes"],
        ["CMT (Comments)", "comments"],
        ["SHARES", "shares"],
        ["ER (Engagement rate %)", "engagementRate"],
      ] as const
    ).map(([label, key]) => {
      const val = filteredTotals[key];
      const display =
        key === "engagementRate" ? `${typeof val === "number" ? val : Number(val) || 0}%` : typeof val === "number" ? fmtNum(val) : String(val);
      return { label, value: display };
    });

  return (
    <AdminLayout>
      <AnalyticsPageShell>
        <div className="space-y-6 pb-8">
          <AnalyticsHero
            backHref={`/admin/campaigns/${id}`}
            backLabel="Campaign"
            eyebrow="Campaign analytics"
            title={String(campaign.title ?? "Campaign")}
            subtitle="Live metrics from your API — engagement, snapshots, workflow timeline, and post-level detail."
            lastUpdated={lastUpdated}
            statusLabel={status}
            statusTone={statusTone}
            rightSlot={
              <>
                <AnalyticsTierTabs tabs={TIER_TABS} active={tier} onChange={setTier} />
                <AnalyticsPillToggle label="Workflow window" options={RANGE} value={workflowRange} onChange={setWorkflowRange} />
              </>
            }
          />

          {showPulse && campaign && (
            <AnalyticsSummaryBanner
              columns={[
                {
                  label: "Campaign budget",
                  value: formatFromUSD(budgetSpend.budgetUsd),
                  sub: String(status || "—"),
                  wide: true,
                },
                {
                  label: "Spend (earned)",
                  value: formatFromUSD(budgetSpend.spendUsd),
                  sub:
                    perf?.applications != null
                      ? `${fmtNum(Number(perf.applications))} applications`
                      : undefined,
                },
                {
                  label: "Remaining",
                  value: budgetSpend.remainingLabel,
                  sub: "Wallet / allocation",
                },
                {
                  label: "Budget used",
                  value: budgetSpend.utilPct != null ? `${budgetSpend.utilPct.toFixed(1)}%` : "—",
                  sub: workflowRange ? `Window · ${workflowRange}` : undefined,
                },
              ]}
            />
          )}

          <div className="rounded-2xl border border-slate-200/90 dark:border-white/[0.07] bg-gradient-to-br from-white via-orange-50/25 to-rose-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 p-3 sm:p-4 md:p-5 shadow-xl dark:shadow-[0_0_80px_-24px_rgba(249,115,22,0.15)] ring-1 ring-orange-200/40 dark:ring-orange-500/10 space-y-4">
            {platformFilterOptions.length > 0 && (
              <AnalyticsPlatformFilter
                value={platformFilter}
                onChange={setPlatformFilter}
                platforms={platformFilterOptions}
                colors={ANALYTICS_PLATFORM_COLORS}
              />
            )}

            {kpiItems && showPulse && (
              <AnalyticsCard accent="emerald">
                <AnalyticsCardHeader
                  icon={<FaBolt />}
                  title="Engagement pulse"
                  description="Live totals from tracked posts — use platform chips above to isolate a channel. Nothing is clipped: cards expand to fit full numbers."
                />
                <AnalyticsCardBody>
                  <AnalyticsKpiStrip items={kpiItems} />
                </AnalyticsCardBody>
              </AnalyticsCard>
            )}

            {showPulse && cpmInsight && (
              <AnalyticsCpmCard
                value={cpmInsight.cpm ?? "—"}
                footnote={
                  cpmInsight.impressions > 0 && cpmInsight.spend > 0 ? (
                    <>
                      Partner spend to date <span className="font-semibold text-slate-800 dark:text-slate-200">{formatFromUSD(cpmInsight.spend)}</span>{" "}
                      across <span className="font-semibold text-slate-800 dark:text-slate-200">{fmtNum(cpmInsight.impressions)}</span> impressions in
                      this view.
                      {cpmInsight.scoped && (
                        <span className="block mt-1 text-amber-700 dark:text-amber-300/90">
                          Spend is still campaign-wide; impressions follow your platform filter.
                        </span>
                      )}
                    </>
                  ) : (
                    "CPM needs positive spend and impression totals. Spend follows partner earnings when available, otherwise budget minus remaining."
                  )
                }
              />
            )}

          {showPulse && perf && (
            <div className="bus-responsive-two-col gap-3 items-start">
              <AnalyticsCard accent="none" className="border border-slate-200 dark:border-gray-700 shadow-md bg-white dark:bg-gray-800/90 w-full rounded-xl self-start">
                <AnalyticsCardHeader icon={<FaBullseye />} title="Program performance" description="Budget, pipeline, ROI — internal IDs are hidden." />
                <AnalyticsCardBody>
                  <AnalyticsMiniStatGrid
                    cells={flattenMetricRows(perf as any).map((row) => ({
                      label: programPerfLabel(row.key),
                      value: row.key === "budget" || row.key === "spent" ? formatFromUSD(Number(row.value)) : row.value,
                    }))}
                  />
                </AnalyticsCardBody>
              </AnalyticsCard>
              <AnalyticsCard accent="none" className="border border-slate-200 dark:border-gray-700 shadow-md bg-white dark:bg-gray-800/90 w-full rounded-xl self-start">
                <AnalyticsCardHeader icon={<FaChartLine />} title="Key signals" description="Derived from current totals — not predictions." />
                <AnalyticsCardBody>
                  <AnalyticsInsightList items={insights} />
                </AnalyticsCardBody>
              </AnalyticsCard>
            </div>
          )}

          {showPulse && (byPlatform.length > 0 || platformEngagementBars.length > 0) && (
            <div className="bus-responsive-two-col gap-4">
              {byPlatform.length > 0 && (
                <AnalyticsCard accent="none" className="border border-slate-200 dark:border-gray-700 shadow-md bg-white dark:bg-gray-800/90">
                  <AnalyticsCardHeader title="Reach mix" description="Donut + breakdown — uses the strongest signal per platform (or post count when metrics are still zero)." />
                  <AnalyticsCardBody>
                    {pieReach.length > 0 ? (
                      (() => {
                        const pieTotal = pieReach.reduce((s, e) => s + (Number(e.value) || 0), 0);
                        return (
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6">
                            <div className="relative w-full max-w-[240px] h-[240px] mx-auto sm:mx-0 shrink-0">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={pieReach}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={56}
                                    outerRadius={88}
                                    paddingAngle={2}
                                  >
                                    {pieReach.map((e) => (
                                      <Cell
                                        key={e.name}
                                        fill={
                                          ANALYTICS_PLATFORM_COLORS[String((e as { platform?: string }).platform).toUpperCase()] ?? "#64748b"
                                        }
                                        stroke="rgba(15,23,42,0.12)"
                                        strokeWidth={1}
                                      />
                                    ))}
                                  </Pie>
                                  <Tooltip content={<AnalyticsChartTooltip />} />
                                </PieChart>
                              </ResponsiveContainer>
                              <AnalyticsDonutCenter>
                                <span className="text-2xl font-black text-slate-900 dark:text-gray-100 tabular-nums">
                                  {fmtNum(pieTotal)}
                                </span>
                                <span className="text-xs text-slate-500 dark:text-gray-400">weighted</span>
                              </AnalyticsDonutCenter>
                            </div>
                            <div className="flex-1 min-w-0 space-y-3">
                              {pieReach.map((e) => {
                                const plat = String((e as { platform?: string }).platform);
                                const fill = ANALYTICS_PLATFORM_COLORS[plat.toUpperCase()] ?? "#64748b";
                                const pct = pieTotal > 0 ? Math.round((Number(e.value) / pieTotal) * 100) : 0;
                                return (
                                  <div key={e.name} className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full shrink-0 ring-2 ring-black/5 dark:ring-white/10" style={{ background: fill }} />
                                    <span className="text-sm text-slate-700 dark:text-gray-300 flex-1 min-w-0 truncate">{e.name}</span>
                                    <span className="text-sm font-bold text-slate-900 dark:text-gray-100 tabular-nums shrink-0">{pct}%</span>
                                    <span className="text-xs text-slate-400 dark:text-gray-500 tabular-nums shrink-0">
                                      {fmtNum(Number(e.value))}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <p className="text-sm text-center text-slate-500 dark:text-slate-400 py-10 px-4 leading-relaxed">
                        Platform breakdown is loaded, but there is no post or metric volume to chart yet. Check back after partners submit links and metrics sync.
                      </p>
                    )}
                  </AnalyticsCardBody>
                </AnalyticsCard>
              )}
              {platformEngagementBars.length > 0 && (
                <AnalyticsCard accent="none" className="border border-slate-200 dark:border-gray-700 shadow-md bg-white dark:bg-gray-800/90">
                  <AnalyticsCardHeader
                    icon={<FaChartLine />}
                    title="Engagement by platform"
                    description="Grouped bars (not lines) so reach vs views and other metrics stay readable. X (Twitter) is last — manual links, not auto-tracked."
                  />
                  <AnalyticsCardBody>
                    <div className="h-[300px] sm:h-[340px] min-h-[260px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={platformEngagementBars} margin={{ top: 8, right: 8, left: 0, bottom: 36 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={cp.grid} vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 10, fill: cp.tickSm }} interval={0} angle={-14} textAnchor="end" height={48} />
                          <YAxis tick={{ fontSize: 10, fill: cp.tickSm }} width={44} tickFormatter={fmtNum} />
                          <Tooltip content={<AnalyticsChartTooltip />} />
                          <Legend wrapperStyle={{ fontSize: 10 }} />
                          <Bar dataKey="reach" name="REACH (Accounts reached)" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={18} />
                          <Bar dataKey="views" name="VIEWS (Content views)" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={18} />
                          <Bar dataKey="likes" name="LIKES" fill="#ec4899" radius={[4, 4, 0, 0]} maxBarSize={18} />
                          <Bar dataKey="comments" name="CMT (Comments)" fill="#a855f7" radius={[4, 4, 0, 0]} maxBarSize={18} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </AnalyticsCardBody>
                </AnalyticsCard>
              )}
            </div>
          )}

          {showStreams && (
            <>
              <AnalyticsCard accent="cyan">
                <AnalyticsCardHeader
                  icon={<FaLayerGroup />}
                  title="Metric snapshots"
                  description={`Bucketed post metrics · ${snapshotTs?.window ?? snapWindow} · ${snapshotTs?.bucketMinutes ?? "—"}m`}
                  actions={<AnalyticsPillToggle options={TS_WINDOWS} value={snapWindow} onChange={setSnapWindow} />}
                />
                <AnalyticsCardBody>
                  {snapChartData.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">No snapshot rows in this window.</p>
                  ) : (
                    <div className="h-[300px] sm:h-[340px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={snapChartData} margin={{ top: 4, right: 8, left: -12, bottom: 52 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={cp.grid} vertical={false} />
                          <XAxis dataKey="t" tick={{ fontSize: 8, fill: cp.tickSm }} interval="preserveStartEnd" angle={-20} textAnchor="end" height={56} />
                          <YAxis tick={{ fontSize: 9, fill: cp.tickSm }} tickFormatter={fmtNum} width={36} />
                          <Tooltip content={<AnalyticsChartTooltip />} />
                          <Legend wrapperStyle={{ fontSize: 9 }} />
                          <Bar dataKey="likes" name="LIKES" stackId="m" fill={PALETTE[0]} maxBarSize={28} />
                          <Bar dataKey="comments" name="CMT (Comments)" stackId="m" fill={PALETTE[1]} maxBarSize={28} />
                          <Bar dataKey="shares" name="SHARES" stackId="m" fill={PALETTE[2]} maxBarSize={28} />
                          <Bar dataKey="views" name="VIEWS" stackId="m" fill={PALETTE[3]} maxBarSize={28} />
                          <Bar dataKey="impressions" name="IMP (Impressions)" stackId="m" fill={PALETTE[4]} maxBarSize={28} />
                          <Bar dataKey="reach" name="REACH" stackId="m" fill={PALETTE[5]} maxBarSize={28} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </AnalyticsCardBody>
              </AnalyticsCard>

              <AnalyticsCard accent="indigo">
                <AnalyticsCardHeader
                  icon={<FaChartLine />}
                  title="Workflow timeline"
                  description="Applications, approvals, completions, and spend on one axis — dual scale so spend doesn’t flatten counts."
                />
                <AnalyticsCardBody>
                  {workflowLinesData.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-10">No daily workflow rows in this range.</p>
                  ) : (
                    <div className="h-[300px] sm:h-[340px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={workflowLinesData} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={cp.grid} />
                          <XAxis dataKey="date" tick={{ fontSize: 9, fill: cp.tickSm }} interval="preserveStartEnd" />
                          <YAxis
                            yAxisId="left"
                            tick={{ fontSize: 9, fill: cp.tickSm }}
                            width={36}
                            tickFormatter={fmtNum}
                            allowDecimals={false}
                          />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            tick={{ fontSize: 9, fill: cp.tickSm }}
                            width={52}
                            tickFormatter={(v) => fmtNum(Number(v))}
                          />
                          <Tooltip content={<AnalyticsChartTooltip />} />
                          <Legend wrapperStyle={{ fontSize: 10 }} />
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="applications"
                            name="Applications"
                            stroke="#8B5CF6"
                            strokeWidth={2.5}
                            dot={{ r: 2 }}
                            activeDot={{ r: 4 }}
                          />
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="approvals"
                            name="Approvals"
                            stroke="#22C55E"
                            strokeWidth={2.5}
                            dot={{ r: 2 }}
                          />
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="completions"
                            name="Completions"
                            stroke="#FBBF24"
                            strokeWidth={2.5}
                            dot={{ r: 2 }}
                          />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="spend"
                            name="Spend (USD)"
                            stroke="#EC4899"
                            strokeWidth={2.5}
                            dot={{ r: 2 }}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </AnalyticsCardBody>
              </AnalyticsCard>
            </>
          )}

          {showTables && byPlatform.length > 0 && (
            <AnalyticsCard>
              <AnalyticsCardHeader icon={<FaTable />} title="Platform matrix" description="All returned dimensions per channel." />
              <AnalyticsTableWrap>
                <table className="min-w-full text-[11px]">
                  <thead className="sticky top-0 z-[1] bg-slate-50 dark:bg-slate-700/50 text-left border-b border-slate-200 dark:border-white/10">
                    <tr>
                      {["Platform", "Posts", "Views", "IMP (Impr.)", "Reach", "Likes", "CMT", "Shares", "ER %"].map((h) => (
                        <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {(platformFilter === "ALL"
                      ? byPlatform
                      : byPlatform.filter((p) => String(p.platform).toUpperCase() === platformFilter.toUpperCase())
                    ).map((p) => (
                      <tr key={String(p.platform)} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white whitespace-nowrap">
                          <span
                            className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle"
                            style={{ background: ANALYTICS_PLATFORM_COLORS[String(p.platform).toUpperCase()] ?? "#6b7280" }}
                          />
                          {labelPlatform(String(p.platform))}
                        </td>
                        <td className="px-4 py-3 text-sm tabular-nums text-slate-700 dark:text-slate-300">{p.posts ?? 0}</td>
                        <td className="px-4 py-3 text-sm tabular-nums text-slate-700 dark:text-slate-300">{fmtNum(p.views ?? 0)}</td>
                        <td className="px-4 py-3 text-sm tabular-nums text-slate-700 dark:text-slate-300">{fmtNum(p.impressions ?? 0)}</td>
                        <td className="px-4 py-3 text-sm tabular-nums text-slate-700 dark:text-slate-300">{fmtNum(p.reach ?? 0)}</td>
                        <td className="px-4 py-3 text-sm tabular-nums text-slate-700 dark:text-slate-300">{fmtNum(p.likes ?? 0)}</td>
                        <td className="px-4 py-3 text-sm tabular-nums text-slate-700 dark:text-slate-300">{fmtNum(p.comments ?? 0)}</td>
                        <td className="px-4 py-3 text-sm tabular-nums text-slate-700 dark:text-slate-300">{fmtNum(p.shares ?? 0)}</td>
                        <td className="px-4 py-3 text-sm tabular-nums text-slate-700 dark:text-slate-300">{p.engagementRate ?? 0}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </AnalyticsTableWrap>
            </AnalyticsCard>
          )}

          {showTables && validatedPostsFiltered.length > 0 && (
            <AnalyticsCard>
              <AnalyticsCardHeader title="Post ledger" description="Every tracked post row — respects platform filter above." />
              <AnalyticsTableWrap>
                <table className="min-w-full text-[10px]">
                  <thead className="sticky top-0 z-[1] bg-slate-50 dark:bg-slate-700/50 text-left border-b border-slate-200 dark:border-white/10">
                    <tr>
                      {["Partner", "Plat.", "OK", "Likes", "Cmt", "Sh", "Views", "Impr.", "Reach", ""].map((h, idx) => (
                        <th key={`${h}-${idx}`} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {h || "Link"}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {validatedPostsFiltered.map((post: any) => (
                      <tr key={post.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-4 py-3 text-sm text-slate-900 dark:text-white max-w-[160px] break-words">{post.partnerName}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{labelPlatform(String(post.platform))}</td>
                        <td className="px-4 py-3 text-sm">{post.validated ? "✓" : "—"}</td>
                        <td className="px-4 py-3 text-sm tabular-nums text-slate-700 dark:text-slate-300">{post.likes ?? 0}</td>
                        <td className="px-4 py-3 text-sm tabular-nums text-slate-700 dark:text-slate-300">{post.comments ?? 0}</td>
                        <td className="px-4 py-3 text-sm tabular-nums text-slate-700 dark:text-slate-300">{post.shares ?? 0}</td>
                        <td className="px-4 py-3 text-sm tabular-nums text-slate-700 dark:text-slate-300">{post.views ?? 0}</td>
                        <td className="px-4 py-3 text-sm tabular-nums text-slate-700 dark:text-slate-300">{post.impressions ?? 0}</td>
                        <td className="px-4 py-3 text-sm tabular-nums text-slate-700 dark:text-slate-300">{post.reach ?? 0}</td>
                        <td className="px-4 py-3 text-sm">
                          {post.link ? (
                            <a
                              href={post.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                            >
                              Open
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </AnalyticsTableWrap>
            </AnalyticsCard>
          )}

          {showTables && (
            <AnalyticsCard accent="none">
              <AnalyticsCardHeader title="Campaign record" />
              <AnalyticsCardBody className="!py-2">
                <div className="bus-responsive-stat-grid gap-x-4 gap-y-2 text-sm">
                  {[
                    ["Status", campaign.status],
                    ["Objective", campaign.objective],
                    ["Budget", formatFromUSD(campaign.budget ?? 0)],
                    ["Remaining", formatFromUSD(campaign.remainingBudget ?? 0)],
                    ["Start", campaign.startDate ? new Date(campaign.startDate).toLocaleDateString() : "—"],
                    ["End", campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : "—"],
                    ["Applications", campaign._count?.applications ?? campaign.applications?.length ?? "—"],
                  ].map(([k, v]) => (
                    <div key={String(k)} className="flex justify-between gap-3 py-2.5 border-b border-slate-200 dark:border-white/10">
                      <span className="text-slate-500 dark:text-slate-400">{k}</span>
                      <span className="font-semibold text-slate-900 dark:text-white text-right truncate">{String(v ?? "—")}</span>
                    </div>
                  ))}
                </div>
              </AnalyticsCardBody>
            </AnalyticsCard>
          )}

          {participantPerformanceRowsFiltered.length > 0 && (
            <AnalyticsCard accent="none" className="border border-slate-200 dark:border-gray-700 shadow-md bg-white dark:bg-gray-800/90 rounded-xl">
              <AnalyticsCardHeader
                icon={<FaUsers />}
                title="Participants & performance"
                description="Per-application rollup from tracked posts — sorted by engagement. Respects platform filter. Shown at the bottom of the report."
              />
              <AnalyticsTableWrap>
                <table className="min-w-full text-[11px]">
                  <thead className="sticky top-0 z-[1] bg-slate-50 dark:bg-slate-700/50 text-left border-b border-slate-200 dark:border-white/10">
                    <tr>
                      {[
                        "Partner",
                        "STATUS (Application)",
                        "POSTS",
                        "PLATFORMS",
                        "VIEWS",
                        "LIKES",
                        "CMT",
                        "SHARES",
                        "REACH",
                        "IMP",
                        "OK / posts",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {participantPerformanceRowsFiltered.map((row: ParticipantPerfRow) => (
                      <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-3 py-2 text-sm font-medium text-slate-900 dark:text-white max-w-[140px] break-words">{row.partnerName}</td>
                        <td className="px-3 py-2 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">{row.status}</td>
                        <td className="px-3 py-2 text-sm tabular-nums text-slate-700 dark:text-slate-300">{row.postCount}</td>
                        <td className="px-3 py-2 text-xs text-slate-600 dark:text-slate-400 max-w-[120px]">{row.platformsLabel}</td>
                        <td className="px-3 py-2 text-sm tabular-nums text-slate-700 dark:text-slate-300">{fmtNum(row.views)}</td>
                        <td className="px-3 py-2 text-sm tabular-nums text-slate-700 dark:text-slate-300">{fmtNum(row.likes)}</td>
                        <td className="px-3 py-2 text-sm tabular-nums text-slate-700 dark:text-slate-300">{fmtNum(row.comments)}</td>
                        <td className="px-3 py-2 text-sm tabular-nums text-slate-700 dark:text-slate-300">{fmtNum(row.shares)}</td>
                        <td className="px-3 py-2 text-sm tabular-nums text-slate-700 dark:text-slate-300">{fmtNum(row.reach)}</td>
                        <td className="px-3 py-2 text-sm tabular-nums text-slate-700 dark:text-slate-300">{fmtNum(row.impressions)}</td>
                        <td className="px-3 py-2 text-sm tabular-nums text-slate-700 dark:text-slate-300">
                          {row.validatedCount}/{row.postCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </AnalyticsTableWrap>
            </AnalyticsCard>
          )}
          </div>
        </div>
      </AnalyticsPageShell>
    </AdminLayout>
  );
}
