// Business Suite – Campaign Detail
// Route: /admin/campaigns/[id]

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import toast from "react-hot-toast";
import AdminLayout from "@/components/admin/Layout";
import PostPreviewModal from "@/components/admin/PostPreviewModal";
import {
  getCampaign,
  getApplications,
  updateApplicationStatus,
  getWorkSubmissions,
  updateWorkSubmission,
  getCampaignAnalytics,
  getTimeSeriesAnalytics,
} from "@/services/vendor";
import { useCurrency } from "@/hooks/useCurrency";
import {
  FaArrowLeft, FaSpinner, FaMoneyBillWave, FaCalendarAlt, FaUsers,
  FaCheckCircle, FaTimesCircle, FaClock, FaExclamationTriangle,
  FaBullhorn, FaFileAlt, FaChevronRight, FaEye, FaEdit,
  FaHeart, FaComment, FaRetweet, FaChartLine, FaChartBar,
  FaShareAlt, FaGlobeAmericas, FaBolt, FaFire,
} from "react-icons/fa";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
} from "recharts";

// ── helpers ──────────────────────────────────────────────────────────────────
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function daysLeft(endDate: string) {
  const end = new Date(endDate); end.setHours(23, 59, 59, 999);
  return Math.ceil((end.getTime() - Date.now()) / 86400000);
}
function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function summarizePlatforms(platforms?: string[]): string {
  const list = (platforms || []).map((p) => p.toLowerCase());
  if (list.length === 0 || list.length >= 5) return "All Platforms";
  const labels = list.map((p) =>
    p === "x" || p === "twitter" ? "Twitter/X" :
    p === "instagram" ? "Instagram" :
    p === "facebook" ? "Facebook" :
    p === "tiktok" ? "TikTok" :
    p === "youtube" ? "YouTube" :
    p === "linkedin" ? "LinkedIn" : p
  );
  return Array.from(new Set(labels)).join(", ");
}

function ensureHash(tag: string): string {
  const t = tag.trim();
  if (!t) return t;
  return t.startsWith("#") ? t : `#${t.replace(/^#+/, "")}`;
}

// ── sub-components ───────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE: "bg-green-500/15 text-green-300 border-green-500/20",
    PENDING: "bg-yellow-500/15 text-yellow-300 border-yellow-500/20",
    COMPLETED: "bg-blue-500/15 text-blue-300 border-blue-500/20",
    PAUSED: "bg-slate-500/15 text-slate-300 border-slate-500/20",
    APPROVED: "bg-green-500/15 text-green-300 border-green-500/20",
    REJECTED: "bg-red-500/15 text-red-300 border-red-500/20",
    CANCELLED: "bg-red-500/15 text-red-300 border-red-500/20",
  };
  return <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${map[status] || map.PENDING}`}>{status}</span>;
}

function KPICard({ icon: Icon, label, val, sub, color }: { icon: React.ElementType; label: string; val: any; sub?: string; color: string }) {
  const c: Record<string, string> = {
    green:   "border-green-200   dark:border-green-500/20   bg-green-50   dark:bg-green-500/5   text-green-600   dark:text-green-400",
    emerald: "border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400",
    blue:    "border-blue-200    dark:border-blue-500/20    bg-blue-50    dark:bg-blue-500/5    text-blue-600    dark:text-blue-400",
    purple:  "border-purple-200  dark:border-purple-500/20  bg-purple-50  dark:bg-purple-500/5  text-purple-600  dark:text-purple-400",
    indigo:  "border-indigo-200  dark:border-indigo-500/20  bg-indigo-50  dark:bg-indigo-500/5  text-indigo-600  dark:text-indigo-400",
    pink:    "border-pink-200    dark:border-pink-500/20    bg-pink-50    dark:bg-pink-500/5    text-pink-600    dark:text-pink-400",
    orange:  "border-orange-200  dark:border-orange-500/20  bg-orange-50  dark:bg-orange-500/5  text-orange-600  dark:text-orange-400",
    cyan:    "border-cyan-200    dark:border-cyan-500/20    bg-cyan-50    dark:bg-cyan-500/5    text-cyan-600    dark:text-cyan-400",
  };
  return (
    <div className={`rounded-2xl border p-4 ${c[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium opacity-80">{label}</p>
        <Icon className="h-4 w-4 opacity-70" />
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{val}</p>
      {sub && <p className="text-xs mt-0.5 opacity-60">{sub}</p>}
    </div>
  );
}

// Custom tooltip for recharts (dark-mode friendly)
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-white/10 rounded-xl p-3 shadow-xl text-xs">
      {label && <p className="text-slate-300 font-semibold mb-1.5">{label}</p>}
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
          <span className="text-slate-400">{p.name}:</span>
          <span className="text-white font-semibold">{Number(p.value).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

// Platform colour palette
const PLATFORM_COLORS: Record<string, string> = {
  Instagram: "#E4405F",
  Facebook: "#1877F2",
  Youtube: "#FF0000",
  Tiktok: "#000000",
  Twitter: "#1DA1F2",
  Linkedin: "#0A66C2",
  Pinterest: "#E60023",
  Snapchat: "#FFFC00",
  Other: "#6B7280",
};
const CHART_PALETTE = ["#6366f1", "#ec4899", "#f97316", "#06b6d4", "#10b981", "#f59e0b", "#8b5cf6", "#14b8a6"];

type TabKey = "overview" | "analytics" | "applications" | "work" | "partners";

export default function CampaignDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { formatFromUSD } = useCurrency();
  const [campaign, setCampaign] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [workSubmissions, setWorkSubmissions] = useState<any[]>([]);
  const [campaignAnalytics, setCampaignAnalytics] = useState<any>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [previewSub, setPreviewSub] = useState<any>(null);

  // ── derived post metrics ──────────────────────────────────────────────────
  const allPosts = useMemo(() => {
    if (!campaign || !Array.isArray(campaign.applications)) return [];
    return campaign.applications.flatMap((app: any) => app.posts || []);
  }, [campaign]);

  const validatedPosts = useMemo(() => allPosts.filter((p: any) => p?.validated), [allPosts]);

  const platformStats = useMemo(() => {
    const statsMap = new Map<string, {
      platform: string; posts: number; validatedPosts: number;
      likes: number; comments: number; shares: number;
      views: number; impressions: number; reach: number;
    }>();

    allPosts.forEach((p: any) => {
      const key = (p?.platform || "Other").toString();
      const cap = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
      const cur = statsMap.get(cap) || {
        platform: cap, posts: 0, validatedPosts: 0,
        likes: 0, comments: 0, shares: 0, views: 0, impressions: 0, reach: 0,
      };
      cur.posts += 1;
      if (p?.validated) cur.validatedPosts += 1;
      cur.likes       += p?.likes       ?? 0;
      cur.comments    += p?.comments    ?? 0;
      cur.shares      += p?.shares      ?? 0;
      cur.views       += p?.views       ?? 0;
      cur.impressions += p?.impressions ?? 0;
      cur.reach       += p?.reach       ?? 0;
      statsMap.set(cap, cur);
    });

    return Array.from(statsMap.values()).sort((a, b) => b.posts - a.posts);
  }, [allPosts]);

  const platformChartData = useMemo(
    () => platformStats.map((p) => ({
      platform: p.platform,
      Posts: p.posts,
      "Validated Posts": p.validatedPosts,
      Reach: p.reach,
      Likes: p.likes,
      Comments: p.comments,
      Shares: p.shares,
    })),
    [platformStats]
  );

  const reachByPlatformPieData = useMemo(
    () => platformStats.filter((p) => p.reach > 0).map((p) => ({ name: p.platform, value: p.reach })),
    [platformStats]
  );

  const metrics = campaign?.campaignMetrics;
  const totalReach = metrics?.totalReach ?? metrics?.totalViews ?? 0;

  const engagementBreakdownData = useMemo(() => {
    if (!metrics) return [];
    return [
      { name: "Posts",       value: metrics.totalPosts       ?? 0 },
      { name: "Impressions", value: metrics.totalImpressions ?? 0 },
      { name: "Reach",       value: totalReach },
      { name: "Likes",       value: metrics.totalLikes       ?? 0 },
      { name: "Comments",    value: metrics.totalComments    ?? 0 },
      { name: "Shares",      value: metrics.totalShares      ?? 0 },
    ].filter((d) => d.value > 0);
  }, [metrics, totalReach]);

  const engagementRate = useMemo(() => {
    if (!metrics || totalReach === 0) return null;
    const interactions = (metrics.totalLikes ?? 0) + (metrics.totalComments ?? 0) + (metrics.totalShares ?? 0);
    return ((interactions / totalReach) * 100).toFixed(2);
  }, [metrics, totalReach]);

  // ── data fetching ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id || typeof id !== "string") return;
    (async () => {
      try {
        setIsLoading(true);
        const [c, apps, work] = await Promise.all([
          getCampaign(id),
          getApplications({ campaignId: id }).catch(() => ({ data: [] })),
          getWorkSubmissions({ campaignId: id }).catch(() => ({ data: [] })),
        ]);
        setCampaign(c);
        setApplications(apps.data || []);
        setWorkSubmissions(work.data || []);
      } catch (err: any) {
        toast.error(err?.response?.data?.error || "Failed to load campaign");
        router.push("/admin/campaigns");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id, router]);

  // Fetch campaign analytics when analytics tab is active
  useEffect(() => {
    if (activeTab !== "analytics" || !id || typeof id !== "string") return;
    fetchAnalytics();
  }, [activeTab, id, timeRange]);

  const fetchAnalytics = async () => {
    if (!id || typeof id !== "string") return;
    setAnalyticsLoading(true);
    try {
      const [analytics, timeSeries] = await Promise.all([
        getCampaignAnalytics({ campaignId: id, timeRange }).catch(() => null),
        getTimeSeriesAnalytics({ metric: "applications", timeRange, groupBy: "day" }).catch(() => null),
      ]);
      setCampaignAnalytics(analytics);
      if (Array.isArray(timeSeries)) setTimeSeriesData(timeSeries);
      else if (timeSeries?.data) setTimeSeriesData(timeSeries.data);
    } catch {
      // silent – analytics are supplemental
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // ── actions ───────────────────────────────────────────────────────────────
  const handleWorkAction = async (subId: string, action: "APPROVED" | "REJECTED") => {
    setActionLoading(subId);
    try {
      await updateWorkSubmission(subId, action);
      toast.success(`Work ${action.toLowerCase()}`);
      setWorkSubmissions((prev) => prev.map((s) => s.id === subId ? { ...s, status: action } : s));
      setPreviewSub(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Action failed");
    } finally { setActionLoading(null); }
  };

  const handleAppAction = async (appId: string, action: "APPROVED" | "REJECTED") => {
    setActionLoading(appId);
    try {
      await updateApplicationStatus(appId, action);
      toast.success(`Application ${action.toLowerCase()}`);
      setApplications((prev) => prev.map((a) => (a.id === appId ? { ...a, status: action } : a)));
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Action failed");
    } finally { setActionLoading(null); }
  };

  // ── loading / empty states ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <FaSpinner className="animate-spin text-3xl text-emerald-400" />
        </div>
      </AdminLayout>
    );
  }

  if (!campaign) return null;

  const spent = (campaign.budget || 0) - (campaign.remainingBudget ?? campaign.budget ?? 0);
  const spentPct = Math.round((spent / Math.max(campaign.budget, 1)) * 100);
  const dLeft = campaign.endDate ? daysLeft(campaign.endDate) : null;

  const pending  = applications.filter((a) => a.status === "PENDING");
  const approved = applications.filter((a) => a.status === "APPROVED");
  const rejected = applications.filter((a) => a.status === "REJECTED");

  const hasEngagement = metrics && (
    (metrics.totalPosts ?? 0) > 0 ||
    (metrics.totalLikes ?? 0) > 0 ||
    (metrics.totalComments ?? 0) > 0
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Back */}
        <Link href="/admin/campaigns" className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
          <FaArrowLeft className="h-3 w-3" /> All Campaigns
        </Link>

        {/* Campaign hero */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/8 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6 shadow-xl">
          <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-emerald-500/8 dark:bg-emerald-500/8 blur-3xl" />
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <StatusBadge status={campaign.status} />
                {campaign.endDate && dLeft !== null && (
                  <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border inline-flex items-center gap-1 ${
                    dLeft < 0 ? "bg-red-500/15 text-red-300 border-red-500/20" :
                    dLeft <= 7 ? "bg-yellow-500/15 text-yellow-300 border-yellow-500/20" :
                    "bg-green-500/10 text-green-300 border-green-500/15"
                  }`}>
                    <FaClock className="h-2.5 w-2.5" />
                    {dLeft < 0 ? `Ended ${Math.abs(dLeft)}d ago` : dLeft === 0 ? "Ends today" : `${dLeft}d remaining`}
                  </span>
                )}
                {campaign.isPublic !== undefined && (
                  <span className="px-2 py-0.5 text-[10px] font-medium rounded-full border border-indigo-500/20 bg-indigo-500/10 text-indigo-300">
                    {campaign.isPublic ? "Public" : "Private"}
                  </span>
                )}
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{campaign.title}</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl">{campaign.description}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Link href={`/admin/campaigns/${id}/edit`}>
                <button className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/5 text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/10 transition-all">
                  <FaEdit className="h-3 w-3 inline mr-1.5" />Edit Campaign
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Campaign image */}
        {campaign.image && (
          <div className="rounded-2xl border border-slate-200 dark:border-white/8 overflow-hidden shadow-lg">
            <img src={campaign.image} alt={campaign.title} className="w-full h-64 object-cover" />
          </div>
        )}

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard icon={FaMoneyBillWave}  label="Total Budget"   val={formatFromUSD(campaign.budget || 0)}                                       color="green"   sub="Allocated" />
          <KPICard icon={FaMoneyBillWave}  label="Remaining"      val={formatFromUSD(campaign.remainingBudget ?? campaign.budget ?? 0)}            color="emerald" sub={`${spentPct}% spent`} />
          <KPICard icon={FaUsers}          label="Applications"   val={applications.length}                                                        color="blue"    sub={`${approved.length} approved`} />
          <KPICard icon={FaCheckCircle}    label="Work Reviews"   val={workSubmissions.length}                                                     color="purple"  sub={`${workSubmissions.filter(s => ["PENDING","PENDING_REVIEW"].includes(s.status)).length} pending`} />
        </div>

        {/* Engagement KPI strip (shown if metrics exist) */}
        {hasEngagement && (
          <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 p-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs">
                <FaFileAlt className="h-3.5 w-3.5 text-indigo-400" />
                <span className="font-bold text-slate-900 dark:text-white text-base">{fmtNum(metrics.totalPosts ?? 0)}</span>
                <span>posts <span className="text-slate-400">({validatedPosts.length} validated)</span></span>
              </div>
              {totalReach > 0 && (
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs">
                  <FaGlobeAmericas className="h-3.5 w-3.5 text-orange-400" />
                  <span className="font-bold text-slate-900 dark:text-white text-base">{fmtNum(totalReach)}</span>
                  <span>reach</span>
                </div>
              )}
              {(metrics.totalImpressions ?? 0) > 0 && (
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs">
                  <FaEye className="h-3.5 w-3.5 text-cyan-400" />
                  <span className="font-bold text-slate-900 dark:text-white text-base">{fmtNum(metrics.totalImpressions ?? 0)}</span>
                  <span>impressions</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs">
                <FaHeart className="h-3.5 w-3.5 text-pink-400" />
                <span className="font-bold text-slate-900 dark:text-white text-base">{fmtNum(metrics.totalLikes ?? 0)}</span>
                <span>likes</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs">
                <FaComment className="h-3.5 w-3.5 text-purple-400" />
                <span className="font-bold text-slate-900 dark:text-white text-base">{fmtNum(metrics.totalComments ?? 0)}</span>
                <span>comments</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs">
                <FaShareAlt className="h-3.5 w-3.5 text-blue-400" />
                <span className="font-bold text-slate-900 dark:text-white text-base">{fmtNum(metrics.totalShares ?? 0)}</span>
                <span>shares</span>
              </div>
              {engagementRate !== null && (
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs ml-auto">
                  <FaBolt className="h-3.5 w-3.5 text-yellow-400" />
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-base">{engagementRate}%</span>
                  <span>eng. rate</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Budget bar */}
        <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Budget utilisation</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">{spentPct}% spent</span>
          </div>
          <div className="h-3 rounded-full bg-slate-200 dark:bg-white/8 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all"
              style={{ width: `${Math.min(spentPct, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Spent: {formatFromUSD(spent)}</span>
            <span>Remaining: {formatFromUSD(campaign.remainingBudget ?? campaign.budget ?? 0)}</span>
          </div>
        </div>

        {/* Campaign meta grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Objective",          val: campaign.objective?.replace(/_/g, " ") },
            { label: "Start date",         val: campaign.startDate ? fmtDate(campaign.startDate) : "—" },
            { label: "End date",           val: campaign.endDate ? fmtDate(campaign.endDate) : "—" },
            { label: "Payment structure",  val: campaign.paymentStructure || "—" },
            { label: "Pay per influencer", val: campaign.paymentPerInfluencer ? formatFromUSD(campaign.paymentPerInfluencer) : "—" },
            { label: "Max influencers",    val: campaign.maxInfluencers ?? "—" },
          ].map(({ label, val }) => (
            <div key={label} className="rounded-xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-white/3 p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{label}</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white capitalize">{val || "—"}</p>
            </div>
          ))}
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────────── */}
        <div>
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-900/80 rounded-xl p-1 border border-slate-200 dark:border-white/8 w-fit mb-5 flex-wrap">
            {(["overview", "analytics", "applications", "work", "partners"] as TabKey[]).map((t) => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
                  activeTab === t
                    ? "bg-gradient-to-r from-emerald-400 to-cyan-400 dark:from-emerald-500/30 dark:to-cyan-500/20 text-slate-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}>
                {t === "work" ? `Work (${workSubmissions.length})` : t === "applications" ? `Applications (${applications.length})` : t}
              </button>
            ))}
          </div>

          {/* ── Overview tab ──────────────────────────────────────────────── */}
          {activeTab === "overview" && (
            <div className="space-y-5">
              {(campaign.socialPlatforms?.length > 0 || campaign.hashtags?.length > 0) && (
                <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 p-5">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Where to Post & Hashtags</h3>
                  <div className="space-y-3">
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      <span className="text-slate-500 dark:text-slate-400">Content style:</span>{" "}
                      <span className="font-semibold">
                        {campaign.contentStyle === "AS_BRIEFED" ? "Post As Briefed" : "Creator Creativity (Recommended)"}
                      </span>
                    </p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      <span className="text-slate-500 dark:text-slate-400">Post on:</span>{" "}
                      <span className="font-semibold">{summarizePlatforms(campaign.socialPlatforms)}</span>
                    </p>
                    {campaign.socialPlatforms?.some((p: string) => ["x", "twitter"].includes(String(p).toLowerCase())) && (
                      <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-2.5 py-1.5 inline-block">
                        Twitter/X is manual tracking (no official API).
                      </p>
                    )}
                    {campaign.hashtags?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {campaign.hashtags.map((tag: string) => (
                          <span key={tag} className="text-xs px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                            {ensureHash(tag)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Requirements */}
              {campaign.requirements?.length > 0 && (
                <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 p-5">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Requirements</h3>
                  <ul className="space-y-2">
                    {campaign.requirements.map((r: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <FaCheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" /> {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Application status mini-grid */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Pending",  val: pending.length,  color: "yellow" },
                  { label: "Approved", val: approved.length, color: "green" },
                  { label: "Rejected", val: rejected.length, color: "red" },
                ].map(({ label, val, color }) => (
                  <div key={label} className={`rounded-xl border p-4 text-center
                    ${color === "yellow" ? "border-yellow-200 dark:border-yellow-500/20 bg-yellow-50 dark:bg-yellow-500/5" : ""}
                    ${color === "green"  ? "border-green-200  dark:border-green-500/20  bg-green-50  dark:bg-green-500/5"  : ""}
                    ${color === "red"    ? "border-red-200    dark:border-red-500/20    bg-red-50    dark:bg-red-500/5"    : ""}`}>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{val}</p>
                    <p className={`text-xs mt-0.5 ${color === "yellow" ? "text-yellow-600 dark:text-yellow-400" : color === "green" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                      {label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Inline engagement charts (compact, in Overview) */}
              {hasEngagement && (
                <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <FaChartBar className="h-4 w-4 text-emerald-500" />
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Engagement snapshot</h3>
                    <button
                      onClick={() => setActiveTab("analytics")}
                      className="ml-auto text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      Full analytics <FaChevronRight className="h-2.5 w-2.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Engagement bar */}
                    {engagementBreakdownData.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Engagement by metric</p>
                        <div className="h-56">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={engagementBreakdownData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} tickFormatter={fmtNum} />
                              <Tooltip content={<ChartTooltip />} />
                              <Bar dataKey="value" name="Total" fill="#6366f1" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                    {/* Platform pie */}
                    {reachByPlatformPieData.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Reach by platform</p>
                        <div className="h-56">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={reachByPlatformPieData}
                                dataKey="value" nameKey="name"
                                cx="50%" cy="50%"
                                innerRadius="50%" outerRadius="80%"
                                paddingAngle={2}
                                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                labelLine={false}
                              >
                                {reachByPlatformPieData.map((entry, idx) => (
                                  <Cell key={entry.name} fill={PLATFORM_COLORS[entry.name] ?? CHART_PALETTE[idx % CHART_PALETTE.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(v: any) => Number(v).toLocaleString()} contentStyle={{ backgroundColor: "#0f172a", borderRadius: 8, borderColor: "#1e293b", color: "#f8fafc", fontSize: 11 }} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Analytics tab ─────────────────────────────────────────────── */}
          {activeTab === "analytics" && (
            <div className="space-y-5">
              {/* Time range selector */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FaChartLine className="h-4 w-4 text-emerald-500" />
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Campaign Analytics & Insights</h2>
                </div>
                <div className="flex gap-1.5">
                  {(["7d", "30d", "90d", "1y"] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setTimeRange(r)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        timeRange === r
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-transparent hover:border-slate-200 dark:hover:border-white/10"
                      }`}
                    >
                      {r === "7d" ? "7 days" : r === "30d" ? "30 days" : r === "90d" ? "90 days" : "1 year"}
                    </button>
                  ))}
                </div>
              </div>

              {analyticsLoading ? (
                <div className="flex items-center justify-center h-40">
                  <FaSpinner className="animate-spin text-2xl text-emerald-400" />
                </div>
              ) : (
                <>
                  {/* Extended KPI cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {[
                      { label: "Total Posts",  val: fmtNum(metrics?.totalPosts ?? 0),       icon: FaFileAlt,       color: "indigo" },
                      { label: "Validated",    val: fmtNum(validatedPosts.length),           icon: FaCheckCircle,   color: "emerald" },
                      { label: "Total Reach",  val: fmtNum(totalReach),                      icon: FaGlobeAmericas, color: "orange" },
                      { label: "Impressions",  val: fmtNum(metrics?.totalImpressions ?? 0),  icon: FaEye,           color: "cyan" },
                      { label: "Likes",        val: fmtNum(metrics?.totalLikes ?? 0),        icon: FaHeart,         color: "pink" },
                      { label: "Comments",     val: fmtNum(metrics?.totalComments ?? 0),     icon: FaComment,       color: "purple" },
                    ].map(({ label, val, icon, color }) => (
                      <KPICard key={label} icon={icon} label={label} val={val} color={color} />
                    ))}
                  </div>

                  {/* Engagement breakdown full chart */}
                  {engagementBreakdownData.length > 0 && (
                    <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 p-5">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Engagement by metric</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Total engagement across all posts in this campaign</p>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={engagementBreakdownData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} tickFormatter={fmtNum} />
                            <Tooltip content={<ChartTooltip />} />
                            <Bar dataKey="value" name="Total" radius={[6, 6, 0, 0]}>
                              {engagementBreakdownData.map((_, i) => (
                                <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* Platform charts row */}
                  {platformStats.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {/* Reach by platform – donut */}
                      {reachByPlatformPieData.length > 0 && (
                        <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 p-5">
                          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Reach by platform</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Distribution of total reach across social platforms</p>
                          <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={reachByPlatformPieData}
                                  dataKey="value" nameKey="name"
                                  cx="50%" cy="50%"
                                  innerRadius="48%" outerRadius="80%"
                                  paddingAngle={3}
                                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                  labelLine={{ stroke: "rgba(148,163,184,0.4)" }}
                                >
                                  {reachByPlatformPieData.map((entry, idx) => (
                                    <Cell key={entry.name} fill={PLATFORM_COLORS[entry.name] ?? CHART_PALETTE[idx % CHART_PALETTE.length]} />
                                  ))}
                                </Pie>
                                <Tooltip formatter={(v: any) => Number(v).toLocaleString()} contentStyle={{ backgroundColor: "#0f172a", borderRadius: 8, borderColor: "#1e293b", color: "#f8fafc", fontSize: 11 }} />
                                <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}

                      {/* Posts & validated posts by platform */}
                      <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 p-5">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Posts by platform</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Total vs validated posts per social platform</p>
                        <div className="h-72">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={platformChartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }} barGap={4}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                              <XAxis dataKey="platform" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                              <Tooltip content={<ChartTooltip />} />
                              <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
                              <Bar dataKey="Posts"            name="Total Posts"      fill="#6366f1" radius={[4, 4, 0, 0]} />
                              <Bar dataKey="Validated Posts"  name="Validated Posts"  fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Full platform metrics bar chart */}
                  {platformChartData.length > 0 && platformChartData.some((p) => p.Reach > 0 || p.Likes > 0) && (
                    <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 p-5">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Metrics per social platform</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Reach, likes, comments and shares broken down by platform</p>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={platformChartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }} barCategoryGap="20%" barGap={3}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                            <XAxis dataKey="platform" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} tickFormatter={fmtNum} />
                            <Tooltip content={<ChartTooltip />} />
                            <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
                            <Bar dataKey="Reach"    name="Reach"    fill="#f97316" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Likes"    name="Likes"    fill="#ec4899" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Comments" name="Comments" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Shares"   name="Shares"   fill="#06b6d4" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* Platform stats table */}
                  {platformStats.length > 0 && (
                    <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 overflow-hidden">
                      <div className="p-5 border-b border-slate-200 dark:border-white/8">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Platform breakdown</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Detailed engagement metrics per platform</p>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-white/8">
                          <thead className="bg-slate-50 dark:bg-white/3">
                            <tr>
                              {["Platform", "Posts", "Validated", "Reach", "Impressions", "Likes", "Comments", "Shares"].map((h) => (
                                <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-white/8">
                            {platformStats.map((p) => (
                              <tr key={p.platform} className="hover:bg-slate-50 dark:hover:bg-white/3 transition-colors">
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                      style={{ backgroundColor: PLATFORM_COLORS[p.platform] ?? "#6B7280" }} />
                                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{p.platform}</span>
                                  </div>
                                </td>
                                {[p.posts, p.validatedPosts, p.reach, p.impressions, p.likes, p.comments, p.shares].map((v, i) => (
                                  <td key={i} className="px-4 py-3 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">
                                    {v.toLocaleString()}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Time-series chart (if data from API) */}
                  {timeSeriesData.length > 0 && (
                    <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 p-5">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Applications over time</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Daily application count for the selected time range</p>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={timeSeriesData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                            <defs>
                              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                            <Tooltip content={<ChartTooltip />} />
                            <Area type="monotone" dataKey="value" name="Applications" stroke="#10b981" strokeWidth={2} fill="url(#areaGrad)" dot={false} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* Campaign-level analytics from API */}
                  {campaignAnalytics && (
                    <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <FaFire className="h-4 w-4 text-orange-400" />
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Campaign performance</h3>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {Object.entries(campaignAnalytics)
                          .filter(([, v]) => typeof v === "number")
                          .slice(0, 8)
                          .map(([k, v]: [string, any]) => (
                            <div key={k} className="rounded-xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-white/3 p-3">
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-1 capitalize">{k.replace(/([A-Z])/g, " $1").trim()}</p>
                              <p className="text-lg font-bold text-slate-900 dark:text-white">{typeof v === "number" ? fmtNum(v) : v}</p>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Empty state */}
                  {!hasEngagement && !campaignAnalytics && timeSeriesData.length === 0 && (
                    <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 p-14 text-center">
                      <FaChartLine className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">No analytics data yet</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Analytics will appear here once partners start creating posts for this campaign.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Applications tab ──────────────────────────────────────────── */}
          {activeTab === "applications" && (
            <div className="space-y-3">
              {applications.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 p-10 text-center">
                  <FaFileAlt className="h-10 w-10 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-600 dark:text-slate-300">No applications yet</p>
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Applications will appear here when creators apply</p>
                </div>
              ) : (
                applications.map((app) => (
                  <div key={app.id} className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {app.partner?.name?.charAt(0) || "P"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{app.partner?.name || "Unknown Creator"}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{app.partner?.email || ""}</p>
                      </div>
                    </div>
                    <StatusBadge status={app.status} />
                    {app.status === "PENDING" && (
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleAppAction(app.id, "APPROVED")}
                          disabled={actionLoading === app.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/15 border border-green-500/25 text-green-300 text-xs font-semibold hover:bg-green-500/25 disabled:opacity-50 transition-all"
                        >
                          {actionLoading === app.id ? <FaSpinner className="animate-spin h-3 w-3" /> : <FaCheckCircle className="h-3 w-3" />}
                          Approve
                        </button>
                        <button
                          onClick={() => handleAppAction(app.id, "REJECTED")}
                          disabled={actionLoading === app.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/25 text-red-300 text-xs font-semibold hover:bg-red-500/25 disabled:opacity-50 transition-all"
                        >
                          <FaTimesCircle className="h-3 w-3" /> Decline
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── Work tab ──────────────────────────────────────────────────── */}
          {activeTab === "work" && (
            <div className="space-y-3">
              {workSubmissions.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 p-10 text-center">
                  <FaFileAlt className="h-10 w-10 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-600 dark:text-slate-300">No work submissions yet</p>
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Submitted content will appear here for review</p>
                </div>
              ) : (
                workSubmissions.map((sub) => {
                  const isPending = ["PENDING", "PENDING_REVIEW"].includes(sub.status);
                  return (
                    <div key={sub.id} className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {sub.partner?.name?.charAt(0) || "C"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{sub.partner?.name || "Creator"}</p>
                          {sub.submittedUrl && (
                            <a href={sub.submittedUrl} target="_blank" rel="noopener noreferrer"
                              className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline truncate">
                              View submission ↗
                            </a>
                          )}
                        </div>
                      </div>
                      <StatusBadge status={sub.status} />
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => setPreviewSub(sub)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-white/10 transition-all">
                          <FaEye className="h-3 w-3" /> Preview
                        </button>
                        {isPending && (
                          <>
                            <button onClick={() => handleWorkAction(sub.id, "APPROVED")} disabled={actionLoading === sub.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/15 border border-green-500/25 text-green-300 text-xs font-semibold hover:bg-green-500/25 disabled:opacity-50 transition-all">
                              {actionLoading === sub.id ? <FaSpinner className="animate-spin h-3 w-3" /> : <FaCheckCircle className="h-3 w-3" />}
                              Approve
                            </button>
                            <button onClick={() => handleWorkAction(sub.id, "REJECTED")} disabled={actionLoading === sub.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/25 text-red-300 text-xs font-semibold hover:bg-red-500/25 disabled:opacity-50 transition-all">
                              <FaTimesCircle className="h-3 w-3" /> Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ── Partners tab ──────────────────────────────────────────────── */}
          {activeTab === "partners" && (
            <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 p-10 text-center">
              <FaUsers className="h-10 w-10 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-600 dark:text-slate-300">Curate partners for this campaign</p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 mb-4">Browse your saved lists or discover new creators</p>
              <Link href="/admin/partners">
                <button className="bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 font-semibold text-xs px-4 py-2 rounded-xl">
                  Browse Partners
                </button>
              </Link>
            </div>
          )}
        </div>

        {/* Post preview modal */}
        {previewSub && (
          <PostPreviewModal
            submission={{ ...previewSub, campaign }}
            onClose={() => setPreviewSub(null)}
            onApprove={["PENDING", "PENDING_REVIEW"].includes(previewSub.status) ? () => handleWorkAction(previewSub.id, "APPROVED") : undefined}
            onReject={["PENDING", "PENDING_REVIEW"].includes(previewSub.status) ? () => handleWorkAction(previewSub.id, "REJECTED") : undefined}
            actionLoading={actionLoading === previewSub.id}
          />
        )}
      </div>
    </AdminLayout>
  );
}
