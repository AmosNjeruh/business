// Challenge analytics — compact dashboard (light / dark).
// Route: /admin/challenges/[id]/analytics

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
} from "@/components/admin/analytics/AnalyticsDashboard";
import {
  vendorGetChallenge,
  vendorGetChallengeSocialMetrics,
  vendorGetChallengeSocialMetricsTimeSeries,
  vendorGetLeaderboard,
  type Challenge,
  type ChallengeMetricsTimeSeriesWindow,
  type LeaderboardEntry,
} from "@/services/challenges";
import { useCurrency } from "@/hooks/useCurrency";
import { FaSpinner, FaLayerGroup, FaTable, FaTrophy, FaUsers } from "react-icons/fa";
import { Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, CartesianGrid, XAxis, YAxis } from "recharts";

const USD_TO_KES_RATE = 130;
const TS_WINDOWS: ChallengeMetricsTimeSeriesWindow[] = ["30m", "1h", "2h", "12h", "24h"];
const CHALLENGE_TIERS = [
  { id: "all" as const, label: "All", hint: "Full report" },
  { id: "pulse" as const, label: "Pulse", hint: "KPIs & fees" },
  { id: "motion" as const, label: "Motion", hint: "Snapshots" },
  { id: "ranks" as const, label: "Ranks", hint: "Board & grid" },
];

const PALETTE = ["#059669", "#0891b2", "#6366f1", "#d97706", "#db2777", "#7c3aed"];

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

function flattenStats(obj: Record<string, unknown> | null | undefined): { key: string; value: string }[] {
  if (!obj) return [];
  return Object.entries(obj)
    .filter(([k]) => !isHiddenAnalyticsMetricKey(k))
    .filter(([, v]) => v === null || typeof v === "number" || typeof v === "boolean" || typeof v === "string")
    .map(([k, v]) => ({ key: k, value: v === null ? "—" : String(v) }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

export default function ChallengeAdvancedAnalyticsPage() {
  const router = useRouter();
  const { id } = router.query;
  const { formatPrice, formatFromUSD } = useCurrency();
  const cp = useAnalyticsChartPalette();
  const [tier, setTier] = useState<(typeof CHALLENGE_TIERS)[number]["id"]>("all");
  const [loading, setLoading] = useState(true);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [social, setSocial] = useState<any>(null);
  const [snapWindow, setSnapWindow] = useState<ChallengeMetricsTimeSeriesWindow>("24h");
  const [snapshotTs, setSnapshotTs] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    if (!id || typeof id !== "string") return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const raw = await vendorGetChallenge(id);
        if (cancelled) return;
        const ch: Challenge = (raw as any)?.challenge ?? raw;
        const st = (raw as any)?.stats ?? null;
        setChallenge(ch);
        setStats(st);
        const socialTypes = ["LIKES", "SHARES", "VIEWS"];
        const [soc, lb] = await Promise.all([
          socialTypes.includes(ch.metricType) ? vendorGetChallengeSocialMetrics(id).catch(() => null) : Promise.resolve(null),
          vendorGetLeaderboard(id).catch(() => ({ entries: [] as LeaderboardEntry[] })),
        ]);
        if (cancelled) return;
        setSocial(soc);
        setLeaderboard(lb?.entries ?? []);
      } catch (e: any) {
        toast.error(e?.response?.data?.error || "Failed to load challenge");
        router.push("/admin/challenges");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, router]);

  useEffect(() => {
    if (!id || typeof id !== "string" || !challenge) return;
    const socialTypes = ["LIKES", "SHARES", "VIEWS"];
    if (!socialTypes.includes(challenge.metricType)) {
      setSnapshotTs(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const snap = await vendorGetChallengeSocialMetricsTimeSeries(id, snapWindow).catch(() => null);
      if (!cancelled) setSnapshotTs(snap);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, snapWindow, challenge?.metricType]);

  const totals = social?.totals;
  const byPlatform = useMemo(() => {
    const raw = (social?.byPlatform ?? []) as any[];
    return filterRowsByAllowedPlatforms(raw);
  }, [social?.byPlatform]);
  const statRows = useMemo(() => flattenStats(stats ?? undefined), [stats]);

  const snapChartData = useMemo(() => {
    const pts = snapshotTs?.points ?? [];
    return pts.map((p: any) => ({
      t: new Date(p.timestamp).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
      ...p,
    }));
  }, [snapshotTs]);

  const pieReach = useMemo(() => {
    const mapped = byPlatform.map((p) => {
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
  }, [byPlatform]);

  const insights = useMemo(() => {
    const out: string[] = [];
    if (challenge?.metricType) out.push(`Goal type: ${challenge.metricType} — progress from participations API.`);
    const top = leaderboard[0];
    if (top) out.push(`Leader: ${top.partnerName} at ${top.percentComplete?.toFixed?.(1) ?? top.percentComplete}% of target.`);
    if (statRows.length) out.push(`${statRows.length} participation stats surfaced from the challenge payload.`);
    return out.slice(0, 4);
  }, [challenge?.metricType, leaderboard, statRows.length]);

  const challengeBudget = useMemo(() => {
    if (!challenge) return { prizeUsd: 0, setupUsd: 0, platformCutUsd: 0, netPoolUsd: 0, participants: 0 };
    const prizeUsd = Number(challenge.prizeBudget ?? 0);
    const setupUsd = Number(challenge.platformSetupFee ?? 0);
    const cutFromStats = stats && typeof stats.platformCut === "number" ? Number(stats.platformCut) : NaN;
    const netFromStats = stats && typeof stats.netPrizePool === "number" ? Number(stats.netPrizePool) : NaN;
    const pct = Number(challenge.platformPercentageFee ?? 0);
    const platformCutUsd = Number.isFinite(cutFromStats)
      ? cutFromStats
      : setupUsd + (prizeUsd * pct) / 100;
    const netPoolUsd = Number.isFinite(netFromStats) ? netFromStats : Math.max(0, prizeUsd - platformCutUsd);
    const participants =
      stats && typeof (stats as { totalParticipants?: number }).totalParticipants === "number"
        ? Number((stats as { totalParticipants: number }).totalParticipants)
        : challenge.totalParticipants ?? challenge._count?.participations ?? 0;
    return { prizeUsd, setupUsd, platformCutUsd, netPoolUsd, participants };
  }, [challenge, stats]);

  const challengeCpm = useMemo(() => {
    if (!challenge) return null;
    const basis = challengeBudget.prizeUsd;
    const impressions =
      totals && typeof totals.impressions === "number" && Number.isFinite(totals.impressions) && totals.impressions > 0
        ? totals.impressions
        : 0;
    const cpm = basis > 0 && impressions > 0 ? formatFromUSD((basis / impressions) * 1000) : null;
    return { cpm, impressions, basis };
  }, [challenge, challengeBudget.prizeUsd, totals, formatFromUSD]);

  if (loading || !challenge) {
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
  const st = String(challenge.status ?? "");
  const tone = st === "ACTIVE" ? "live" : st === "DRAFT" || st === "PENDING_REVIEW" ? "draft" : "muted";

  const showPulse = tier === "all" || tier === "pulse";
  const showMotion = tier === "all" || tier === "motion";
  const showRanks = tier === "all" || tier === "ranks";

  const kpiItems =
    totals &&
    (["Posts", "Views", "Impr.", "Reach", "Likes", "Cmt", "Shares", "Eng.%"] as const).map((label, i) => {
      const keys = ["posts", "views", "impressions", "reach", "likes", "comments", "shares", "engagementRate"] as const;
      const val = totals[keys[i]];
      return { label, value: typeof val === "number" ? fmtNum(val) : String(val) };
    });

  return (
    <AdminLayout>
      <AnalyticsPageShell>
        <div className="space-y-6 pb-8">
          <AnalyticsHero
            backHref={`/admin/challenges/${id}`}
            backLabel="Challenge"
            eyebrow="Challenge analytics"
            title={challenge.title}
            subtitle="Participation, aggregate social proof, snapshots, and leaderboard — all from live API data."
            lastUpdated={lastUpdated}
            statusLabel={st}
            statusTone={tone}
            rightSlot={<AnalyticsTierTabs tabs={CHALLENGE_TIERS} active={tier} onChange={setTier} />}
          />

          {showPulse && (
            <AnalyticsSummaryBanner
              columns={[
                {
                  label: "Prize budget",
                  value: formatFromUSD(challengeBudget.prizeUsd),
                  sub: String(challenge.metricType ?? ""),
                  wide: true,
                },
                {
                  label: "Platform + fees",
                  value: formatFromUSD(challengeBudget.platformCutUsd),
                  sub: "Setup + % of prize",
                },
                {
                  label: "Net prize pool",
                  value: formatFromUSD(challengeBudget.netPoolUsd),
                  sub: "After fees",
                },
                {
                  label: "Participants",
                  value: String(challengeBudget.participants),
                  sub: leaderboard.length ? `${leaderboard.length} on leaderboard` : undefined,
                },
              ]}
            />
          )}

          {showPulse && statRows.length > 0 && (
            <AnalyticsCard accent="none" className="border border-slate-200 dark:border-gray-700 shadow-md bg-white dark:bg-gray-800/90">
              <AnalyticsCardHeader icon={<FaTrophy />} title="Participation & fees" description="Numeric stats from the challenge response — IDs hidden." />
              <AnalyticsCardBody>
                <AnalyticsMiniStatGrid
                  cells={statRows.map((row) => ({
                    label: row.key.replace(/([A-Z])/g, " $1").trim(),
                    value: ["platformCut", "netPrizePool"].includes(row.key) ? formatPrice(Number(row.value) * USD_TO_KES_RATE) : row.value,
                  }))}
                />
              </AnalyticsCardBody>
            </AnalyticsCard>
          )}

          {showPulse && challengeCpm && (
            <AnalyticsCpmCard
              value={challengeCpm.cpm ?? "—"}
              footnote={
                challengeCpm.impressions > 0 && challengeCpm.basis > 0 ? (
                  <>
                    Uses committed prize budget{" "}
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{formatFromUSD(challengeCpm.basis)}</span> over{" "}
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{fmtNum(challengeCpm.impressions)}</span> aggregate impressions
                    from participant posts.
                  </>
                ) : (
                  "CPM uses prize budget ÷ 1K impressions. Load social metrics (views-type challenges) so impressions are available."
                )
              }
            />
          )}

          {showPulse && kpiItems && (
            <div className="bus-responsive-two-col gap-3 items-start">
              <AnalyticsCard accent="none" className="border border-slate-200 dark:border-gray-700 shadow-md bg-white dark:bg-gray-800/90 w-full rounded-xl self-start">
                <AnalyticsCardHeader title="Social aggregate" description="Validated activity across participants." />
                <AnalyticsCardBody>
                  <AnalyticsKpiStrip items={kpiItems} />
                </AnalyticsCardBody>
              </AnalyticsCard>
              <AnalyticsCard accent="none" className="border border-slate-200 dark:border-gray-700 shadow-md bg-white dark:bg-gray-800/90 w-full rounded-xl self-start">
                <AnalyticsCardHeader title="Signals" description="Readable takeaways from current data." />
                <AnalyticsCardBody>
                  <AnalyticsInsightList items={insights} />
                </AnalyticsCardBody>
              </AnalyticsCard>
            </div>
          )}

          {showPulse && byPlatform.length > 0 && (
            <AnalyticsCard accent="none" className="border border-slate-200 dark:border-gray-700 shadow-md bg-white dark:bg-gray-800/90">
              <AnalyticsCardHeader title="Platform mix" description="Donut + list — strongest signal per platform (or post count). Same ordering as campaign analytics." />
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
                                    fill={ANALYTICS_PLATFORM_COLORS[String(e.platform).toUpperCase()] ?? "#64748b"}
                                    stroke="rgba(15,23,42,0.12)"
                                    strokeWidth={1}
                                  />
                                ))}
                              </Pie>
                              <Tooltip content={<AnalyticsChartTooltip />} />
                            </PieChart>
                          </ResponsiveContainer>
                          <AnalyticsDonutCenter>
                            <span className="text-2xl font-black text-slate-900 dark:text-gray-100 tabular-nums">{fmtNum(pieTotal)}</span>
                            <span className="text-xs text-slate-500 dark:text-gray-400">weighted</span>
                          </AnalyticsDonutCenter>
                        </div>
                        <div className="flex-1 min-w-0 space-y-3">
                          {pieReach.map((e) => {
                            const fill = ANALYTICS_PLATFORM_COLORS[String(e.platform).toUpperCase()] ?? "#64748b";
                            const pct = pieTotal > 0 ? Math.round((Number(e.value) / pieTotal) * 100) : 0;
                            return (
                              <div key={e.name} className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full shrink-0 ring-2 ring-black/5 dark:ring-white/10" style={{ background: fill }} />
                                <span className="text-sm text-slate-700 dark:text-gray-300 flex-1 min-w-0 truncate">{e.name}</span>
                                <span className="text-sm font-bold text-slate-900 dark:text-gray-100 tabular-nums shrink-0">{pct}%</span>
                                <span className="text-xs text-slate-400 dark:text-gray-500 tabular-nums shrink-0">{fmtNum(Number(e.value))}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <p className="text-sm text-center text-slate-500 dark:text-slate-400 py-10 px-4 leading-relaxed">
                    Platforms are listed in the API, but there is no post or metric volume to chart yet. The donut will appear as participant activity syncs.
                  </p>
                )}
              </AnalyticsCardBody>
            </AnalyticsCard>
          )}

          {showMotion && ["LIKES", "SHARES", "VIEWS"].includes(challenge.metricType) && (
            <AnalyticsCard accent="cyan">
              <AnalyticsCardHeader
                icon={<FaLayerGroup />}
                title="Metric motion"
                description={`${challenge.metricType} · ${snapshotTs?.window ?? snapWindow} · ${snapshotTs?.bucketMinutes ?? "—"}m buckets`}
                actions={<AnalyticsPillToggle options={TS_WINDOWS} value={snapWindow} onChange={setSnapWindow} />}
              />
              <AnalyticsCardBody>
                {snapChartData.length === 0 ? (
                  <p className="text-[11px] text-slate-500 text-center py-10">No snapshots in this horizon.</p>
                ) : (
                  <div className="h-[280px] sm:h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={snapChartData} margin={{ top: 4, right: 8, left: -18, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={cp.grid} />
                        <XAxis dataKey="t" tick={{ fontSize: 9, fill: cp.tickSm }} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 9, fill: cp.tickSm }} tickFormatter={fmtNum} width={36} />
                        <Tooltip content={<AnalyticsChartTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                        <Line type="monotone" dataKey="reach" name="Metric / reach" stroke="#059669" dot={false} strokeWidth={2.4} strokeOpacity={0.95} />
                        <Line type="monotone" dataKey="views" name="Views" stroke="#0891b2" dot={false} strokeWidth={2.4} strokeOpacity={0.95} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <p className="text-[10px] text-slate-500 dark:text-slate-500 mt-2 leading-snug">
                  Snapshot API maps the challenge goal into reach/views fields for charting.
                </p>
              </AnalyticsCardBody>
            </AnalyticsCard>
          )}

          {showMotion && !["LIKES", "SHARES", "VIEWS"].includes(challenge.metricType) && (
            <AnalyticsCard accent="amber">
              <AnalyticsCardBody>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 text-center py-10">
                  Snapshot charts apply to likes / shares / views challenges only. Use <strong>All</strong>, <strong>Pulse</strong>, or{" "}
                  <strong>Ranks</strong> for this format.
                </p>
              </AnalyticsCardBody>
            </AnalyticsCard>
          )}

          {showRanks && byPlatform.length > 0 && (
            <AnalyticsCard>
              <AnalyticsCardHeader icon={<FaTable />} title="Platform matrix" />
              <AnalyticsTableWrap>
                <table className="min-w-full text-[11px]">
                  <thead className="sticky top-0 z-[1] bg-slate-50 dark:bg-slate-700/50 text-left border-b border-slate-200 dark:border-white/10">
                    <tr>
                      {["Platform", "Posts", "Views", "Impr.", "Reach", "Likes", "Cmt", "Shares", "Eng.%"].map((h) => (
                        <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {byPlatform.map((p) => (
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

          {showRanks && (
            <AnalyticsCard>
              <AnalyticsCardHeader title="Parameters" />
              <AnalyticsCardBody className="!py-2">
                <div className="bus-responsive-stat-grid gap-x-4 gap-y-2 text-sm">
                  {[
                    ["Status", challenge.status],
                    ["Metric", challenge.metricType],
                    ["Goal / partner", challenge.goalValue?.toLocaleString() ?? "—"],
                    ["Start", new Date(challenge.startDate).toLocaleDateString()],
                    ["End", new Date(challenge.endDate).toLocaleDateString()],
                    ["Prize (USD)", String(challenge.prizeBudget ?? "—")],
                  ].map(([k, v]) => (
                    <div key={String(k)} className="flex justify-between gap-3 py-2.5 border-b border-slate-200 dark:border-white/10">
                      <span className="text-slate-500 dark:text-slate-400">{k}</span>
                      <span className="font-semibold text-slate-900 dark:text-white text-right truncate">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </AnalyticsCardBody>
            </AnalyticsCard>
          )}

          {leaderboard.length > 0 && (
            <AnalyticsCard accent="none" className="border border-slate-200 dark:border-gray-700 shadow-md bg-white dark:bg-gray-800/90 rounded-xl">
              <AnalyticsCardHeader
                icon={<FaUsers />}
                title="Participants & performance"
                description="Leaderboard — live metric vs goal. Always shown at the bottom of this page (every tab)."
              />
              <AnalyticsTableWrap>
                <table className="min-w-full text-[11px]">
                  <thead className="sticky top-0 z-[1] bg-slate-50 dark:bg-slate-700/50 text-left border-b border-slate-200 dark:border-white/10">
                    <tr>
                      {["#", "PARTNER", "NOW (Metric)", "GOAL", "% COMPLETE", "JOINED"].map((h) => (
                        <th key={h} className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {leaderboard.map((e, idx) => (
                      <tr
                        key={e.partnerId}
                        className={
                          idx < 3
                            ? "bg-emerald-50/80 dark:bg-emerald-900/15"
                            : "hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                        }
                      >
                        <td className="px-4 py-3 text-sm font-bold tabular-nums w-10 text-slate-900 dark:text-white">{e.rank}</td>
                        <td className="px-4 py-3 text-sm text-slate-900 dark:text-white max-w-[160px] break-words font-medium">{e.partnerName}</td>
                        <td className="px-4 py-3 text-sm tabular-nums text-slate-700 dark:text-slate-300">{e.metricValue?.toLocaleString?.() ?? e.metricValue}</td>
                        <td className="px-4 py-3 text-sm tabular-nums text-slate-600 dark:text-slate-400">{e.goalValue?.toLocaleString?.() ?? e.goalValue}</td>
                        <td className="px-4 py-3 text-sm tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                          {e.percentComplete?.toFixed?.(1) ?? e.percentComplete}%
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 tabular-nums whitespace-nowrap text-xs">
                          {e.joinedAt ? new Date(e.joinedAt).toLocaleDateString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </AnalyticsTableWrap>
            </AnalyticsCard>
          )}
        </div>
      </AnalyticsPageShell>
    </AdminLayout>
  );
}
