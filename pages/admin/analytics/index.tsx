// Business Suite – Comprehensive Analytics Dashboard
// Route: /admin/analytics
// Full: KPIs, time series charts, funnel analytics, partner performance, ROI metrics

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import toast from "react-hot-toast";
import AdminLayout from "@/components/admin/Layout";
import { 
  getAnalytics, 
  getCampaigns, 
  getCampaignAnalytics, 
  getFunnelAnalytics,
  getTimeSeriesAnalytics,
  getPartnerAnalytics,
  AnalyticsSummary 
} from "@/services/vendor";
import { useBrand } from "@/contexts/BrandContext";
import { useCurrency } from "@/hooks/useCurrency";
import {
  FaChartBar, FaSpinner, FaMoneyBillWave, FaBullhorn, FaUsers,
  FaChartLine, FaCheckCircle, FaStar, FaArrowUp, FaArrowDown,
  FaCalendarAlt, FaFilter, FaTrophy, FaExternalLinkAlt, FaBuilding,
  FaPercentage, FaDownload,
  FaEye, FaMousePointer, FaShoppingCart, FaFunnelDollar,
} from "react-icons/fa";

function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function getInitials(name?: string | null) {
  if (!name) return "?";
  const p = name.trim().split(" ");
  return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : name.charAt(0).toUpperCase();
}

// ── Time Series Line Chart ──────────────────────────────────────────────────────
function TimeSeriesChart({ 
  data, 
  color = "#34d399", 
  label,
  height = 200 
}: { 
  data: Array<{ date: string; value: number }>; 
  color?: string; 
  label?: string;
  height?: number;
}) {
  if (!data || data.length < 2) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500 text-sm">
        No data available
      </div>
    );
  }

  const values = data.map(d => d.value);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const width = 100;
  const chartHeight = height - 40;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = chartHeight - ((d.value - min) / range) * chartHeight;
    return `${x},${y}`;
  }).join(" ");

  const areaPath = `M 0,${chartHeight} L ${data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = chartHeight - ((d.value - min) / range) * chartHeight;
    return `${x},${y}`;
  }).join(" L ")} L ${width},${chartHeight} Z`;

  return (
    <div className="w-full">
      {label && <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">{label}</p>}
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height: `${height}px` }}>
        <defs>
          <linearGradient id={`grad-${color.replace("#", "")}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#grad-${color.replace("#", "")})`} />
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {data.map((d, i) => {
          const x = (i / (data.length - 1)) * width;
          const y = chartHeight - ((d.value - min) / range) * chartHeight;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="2"
              fill={color}
              className="hover:r-3 transition-all"
            />
          );
        })}
      </svg>
      <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-1">
        <span>{data[0]?.date ? new Date(data[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</span>
        <span>{data[data.length - 1]?.date ? new Date(data[data.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</span>
      </div>
    </div>
  );
}

// ── Funnel Chart ────────────────────────────────────────────────────────────────
function FunnelChart({ stages }: { stages: Array<{ label: string; value: number; color?: string }> }) {
  if (!stages || stages.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 dark:text-slate-500 text-sm">
        No funnel data available
      </div>
    );
  }

  const maxValue = Math.max(...stages.map(s => s.value), 1);
  const colors = ['from-blue-500 to-indigo-600', 'from-purple-500 to-pink-600', 'from-emerald-500 to-teal-600', 'from-orange-500 to-amber-600', 'from-red-500 to-rose-600'];

  return (
    <div className="space-y-3">
      {stages.map((stage, i) => {
        const width = (stage.value / maxValue) * 100;
        const color = stage.color || colors[i % colors.length];
        const prevValue = i > 0 ? stages[i - 1].value : stage.value;
        const dropoffPct = prevValue > 0 ? ((prevValue - stage.value) / prevValue * 100) : 0;
        const dropoff = dropoffPct.toFixed(1);

        return (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700 dark:text-slate-300">{stage.label}</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white">{fmtNum(stage.value)}</span>
                {i > 0 && dropoffPct > 0 && (
                  <span className="text-red-500 dark:text-red-400 text-[10px]">-{dropoff}%</span>
                )}
              </div>
            </div>
            <div className="h-8 rounded-lg bg-slate-100 dark:bg-slate-700 overflow-hidden relative">
              <div
                className={`h-full bg-gradient-to-r ${color} rounded-lg transition-all duration-500 flex items-center justify-end pr-2`}
                style={{ width: `${width}%` }}
              >
                {width > 15 && (
                  <span className="text-[10px] font-bold text-white">{Math.round(width)}%</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Mini sparkline (SVG) ──────────────────────────────────────────────────────
function Sparkline({ data, color = "#34d399" }: { data: number[]; color?: string }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const width = 120;
  const height = 36;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");
  const area = `0,${height} ` + data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(" ") + ` ${width},${height}`;
  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`sg-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#sg-${color.replace("#", "")})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Bar chart (horizontal) ────────────────────────────────────────────────────
function HorizontalBar({ label, value, max, color, sub }: { label: string; value: number; max: number; color: string; sub?: string }) {
  const pct = Math.round((value / Math.max(max, 1)) * 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{label}</span>
        <span className="text-xs font-bold text-slate-900 dark:text-white ml-2">{sub || value}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 dark:bg-white/8 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── KPI card ──────────────────────────────────────────────────────────────────
function KPICard({
  label, value, sub, icon: Icon, color, trend, sparkData,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string; trend?: number; sparkData?: number[];
}) {
  const colors: Record<string, { bg: string; border: string; text: string; iconBg: string; sparkColor: string }> = {
    emerald: { bg: "from-emerald-50 to-green-50 dark:from-emerald-950/40 dark:to-emerald-900/20", border: "border-emerald-200 dark:border-emerald-800/40", text: "text-emerald-600 dark:text-emerald-400", iconBg: "bg-emerald-100 dark:bg-emerald-500/10", sparkColor: "#34d399" },
    blue: { bg: "from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-blue-900/20", border: "border-blue-200 dark:border-blue-800/40", text: "text-blue-600 dark:text-blue-400", iconBg: "bg-blue-100 dark:bg-blue-500/10", sparkColor: "#60a5fa" },
    purple: { bg: "from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-purple-900/20", border: "border-purple-200 dark:border-purple-800/40", text: "text-purple-600 dark:text-purple-400", iconBg: "bg-purple-100 dark:bg-purple-500/10", sparkColor: "#a78bfa" },
    orange: { bg: "from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-orange-900/20", border: "border-orange-200 dark:border-orange-800/40", text: "text-orange-600 dark:text-orange-400", iconBg: "bg-orange-100 dark:bg-orange-500/10", sparkColor: "#fb923c" },
  };
  const s = colors[color] || colors.blue;
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${s.bg} border ${s.border} p-5 shadow-sm`}>
      <div className="flex items-start justify-between">
        <div className={`rounded-xl p-2.5 ${s.iconBg}`}>
          <Icon className={`h-5 w-5 ${s.text}`} />
        </div>
        {typeof trend === "number" && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${trend >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
            {trend >= 0 ? <FaArrowUp className="h-2.5 w-2.5" /> : <FaArrowDown className="h-2.5 w-2.5" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="mt-3 flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
          <p className={`text-xs font-medium mt-0.5 ${s.text}`}>{label}</p>
          {sub && <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{sub}</p>}
        </div>
        {sparkData && <Sparkline data={sparkData} color={s.sparkColor} />}
      </div>
    </div>
  );
}

const TIME_RANGES = [
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
  { label: "90 days", value: "90d" },
  { label: "1 year", value: "1y" },
  { label: "All time", value: "all" },
];

const AdminAnalyticsPage: React.FC = () => {
  const router = useRouter();
  const { selectedBrand } = useBrand();
  const { formatFromUSD } = useCurrency();
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [campaignData, setCampaignData] = useState<any>(null);
  const [funnelData, setFunnelData] = useState<any>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<{
    spend?: Array<{ date: string; value: number }>;
    applications?: Array<{ date: string; value: number }>;
    approvals?: Array<{ date: string; value: number }>;
    completions?: Array<{ date: string; value: number }>;
  }>({});
  const [partnerAnalytics, setPartnerAnalytics] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y" | "all">("30d");
  const [isLoading, setIsLoading] = useState(true);
  const [isCampaignLoading, setIsCampaignLoading] = useState(false);
  const [isFunnelLoading, setIsFunnelLoading] = useState(false);
  const [isTimeSeriesLoading, setIsTimeSeriesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'partners' | 'funnel'>('overview');

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const [a, c] = await Promise.all([
          getAnalytics({ timeRange } as any),
          getCampaigns({ limit: 50 }),
        ]);
        setAnalytics(a);
        setCampaigns(c.data || []);
      } catch (err: any) {
        if (err?.response?.status === 401) { router.push("/admin/auth"); return; }
        toast.error("Failed to load analytics");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [timeRange, router]);

  useEffect(() => {
    if (!selectedCampaign) { setCampaignData(null); return; }
    (async () => {
      setIsCampaignLoading(true);
      try {
        const data = await getCampaignAnalytics({ campaignId: selectedCampaign, timeRange } as any);
        setCampaignData(data);
      } catch {
        toast.error("Failed to load campaign analytics");
      } finally {
        setIsCampaignLoading(false);
      }
    })();
  }, [selectedCampaign, timeRange]);

  useEffect(() => {
    (async () => {
      setIsFunnelLoading(true);
      try {
        const data = await getFunnelAnalytics({ timeRange });
        setFunnelData(data);
      } catch {
        // Funnel analytics might not be available
        setFunnelData(null);
      } finally {
        setIsFunnelLoading(false);
      }
    })();
  }, [timeRange]);

  useEffect(() => {
    (async () => {
      setIsTimeSeriesLoading(true);
      try {
        const [spend, applications, approvals, completions] = await Promise.all([
          getTimeSeriesAnalytics({ metric: 'spend', timeRange: timeRange as any, groupBy: 'day' }).catch(() => ({ data: [] })),
          getTimeSeriesAnalytics({ metric: 'applications', timeRange: timeRange as any, groupBy: 'day' }).catch(() => ({ data: [] })),
          getTimeSeriesAnalytics({ metric: 'approvals', timeRange: timeRange as any, groupBy: 'day' }).catch(() => ({ data: [] })),
          getTimeSeriesAnalytics({ metric: 'completions', timeRange: timeRange as any, groupBy: 'day' }).catch(() => ({ data: [] })),
        ]);
        setTimeSeriesData({
          spend: spend.data || [],
          applications: applications.data || [],
          approvals: approvals.data || [],
          completions: completions.data || [],
        });
      } catch {
        // Time series might not be available
      } finally {
        setIsTimeSeriesLoading(false);
      }
    })();
  }, [timeRange]);

  useEffect(() => {
    if (activeTab === 'partners') {
      (async () => {
        try {
          const data = await getPartnerAnalytics({ timeRange, limit: 20 });
          setPartnerAnalytics(data.data || []);
        } catch {
          toast.error("Failed to load partner analytics");
        }
      })();
    }
  }, [activeTab, timeRange]);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <FaSpinner className="animate-spin text-3xl text-emerald-500" />
        </div>
      </AdminLayout>
    );
  }

  const a = analytics;
  const topCampaignBudget = Math.max(...(a?.topCampaigns?.map((c: any) => c.budget || 0) || [1]), 1);
  const topCreatorFollowers = Math.max(...(a?.topCreatorsInNiche?.map((c: any) => c.totalFollowers || 0) || [1]), 1);

  // Calculate ROI
  const totalSpent = typeof a?.totalBudget === 'number' ? a.totalBudget : 0;
  const totalEarned = typeof a?.totalEarned === 'number' ? a.totalEarned : 0;
  const roi = totalSpent > 0 ? ((totalEarned / totalSpent) * 100).toFixed(1) : '0.0';
  const totalApps = typeof a?.totalApplications === 'number' ? a.totalApplications : 0;
  const totalConvs = typeof a?.totalConversions === 'number' ? a.totalConversions : 0;
  const conversionRate = totalApps > 0 
    ? ((totalConvs / totalApps) * 100).toFixed(1) 
    : '0.0';

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: FaChartBar },
    { id: 'campaigns' as const, label: 'Campaigns', icon: FaBullhorn },
    { id: 'partners' as const, label: 'Partners', icon: FaUsers },
    { id: 'funnel' as const, label: 'Funnel', icon: FaFunnelDollar },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {selectedBrand && (
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <FaBuilding className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{selectedBrand.name}</span>
                </div>
              )}
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics Dashboard</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Comprehensive performance insights and metrics</p>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-1">
            {TIME_RANGES.map(({ label, value }) => (
              <button key={value} onClick={() => setTimeRange(value as "7d" | "30d" | "90d" | "1y" | "all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  timeRange === value
                    ? "bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-white/10"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-1 justify-center ${
                activeTab === t.id
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <t.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            TAB: OVERVIEW
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <>
            {/* KPI grid */}
            <div className="bus-responsive-stat-grid gap-4">
              <KPICard
                label="Total Campaigns"
                value={a?.totalCampaigns || 0}
                sub={`${a?.activeCampaigns || 0} active`}
                icon={FaBullhorn}
                color="blue"
              />
              <KPICard
                label="Campaign Budget"
                value={formatFromUSD(a?.totalBudget || 0)}
                sub="Total allocated"
                icon={FaMoneyBillWave}
                color="emerald"
              />
              <KPICard
                label="Active Creators"
                value={(a as any)?.activeInfluencers || (a as any)?.activeAffiliates || 0}
                sub={`${(a as any)?.activeInfluencers || 0} influencers · ${(a as any)?.activeAffiliates || 0} affiliates`}
                icon={FaUsers}
                color="purple"
              />
              <KPICard
                label="Total Earned by Creators"
                value={formatFromUSD(a?.totalEarned || 0)}
                sub={`${a?.totalConversions || 0} conversions`}
                icon={FaChartLine}
                color="orange"
              />
            </div>

            {/* ROI and Conversion Metrics */}
            <div className="bus-responsive-stat-grid gap-4">
              {[
                { label: "ROI", val: `${roi}%`, icon: FaChartLine, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20", desc: "Return on investment" },
                { label: "Conversion Rate", val: `${conversionRate}%`, icon: FaPercentage, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/5 border-blue-200 dark:border-blue-500/20", desc: "Applications to conversions" },
                { label: "Applications", val: fmtNum(a?.totalApplications || 0), icon: FaCheckCircle, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-500/5 border-indigo-200 dark:border-indigo-500/20", desc: "Total received" },
                { label: "Pending Reviews", val: fmtNum(a?.pendingReviewsCount || 0), icon: FaFilter, color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-50 dark:bg-yellow-500/5 border-yellow-200 dark:border-yellow-500/20", desc: "Awaiting approval" },
              ].map(({ label, val, icon: Icon, color, bg, desc }) => (
                <div key={label} className={`rounded-2xl border ${bg} p-4 text-center`}>
                  <Icon className={`h-5 w-5 ${color} mx-auto mb-2`} />
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{val}</p>
                  <p className={`text-[10px] font-medium mt-0.5 ${color}`}>{label}</p>
                  {desc && <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">{desc}</p>}
                </div>
              ))}
            </div>

            {/* Time Series Charts */}
            {!isTimeSeriesLoading && (
              <div className="bus-responsive-two-col gap-6">
                <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <FaMoneyBillWave className="h-4 w-4 text-emerald-500" />
                    Campaign Spend Over Time
                  </h3>
                  <TimeSeriesChart 
                    data={timeSeriesData.spend || []} 
                    color="#34d399" 
                    height={200}
                  />
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <FaUsers className="h-4 w-4 text-blue-500" />
                    Applications Over Time
                  </h3>
                  <TimeSeriesChart 
                    data={timeSeriesData.applications || []} 
                    color="#60a5fa" 
                    height={200}
                  />
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <FaCheckCircle className="h-4 w-4 text-purple-500" />
                    Approvals Over Time
                  </h3>
                  <TimeSeriesChart 
                    data={timeSeriesData.approvals || []} 
                    color="#a78bfa" 
                    height={200}
                  />
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <FaChartLine className="h-4 w-4 text-orange-500" />
                    Completions Over Time
                  </h3>
                  <TimeSeriesChart 
                    data={timeSeriesData.completions || []} 
                    color="#fb923c" 
                    height={200}
                  />
                </div>
              </div>
            )}

            {/* Two-column: Top Campaigns + Top Creators */}
            <div className="bus-responsive-two-col gap-6">
              {/* Top Campaigns */}
              <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200 dark:border-white/8 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FaTrophy className="h-4 w-4 text-yellow-500" /> Top Campaigns
                  </h2>
                  <Link href="/admin/campaigns" className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline">View all →</Link>
                </div>
                <div className="p-5 space-y-4">
                  {(a?.topCampaigns || []).slice(0, 5).length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">No campaign data yet</p>
                  ) : (
                    (a?.topCampaigns || []).slice(0, 5).map((c: any) => (
                      <HorizontalBar
                        key={c.id}
                        label={c.title}
                        value={c.budget || 0}
                        max={topCampaignBudget}
                        color="bg-gradient-to-r from-blue-500 to-purple-600"
                        sub={formatFromUSD(c.budget || 0)}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Top Creators */}
              <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200 dark:border-white/8 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FaStar className="h-4 w-4 text-yellow-500" /> Top Creators
                  </h2>
                  <Link href="/admin/partners" className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline">Browse all →</Link>
                </div>
                <div className="p-5 space-y-3">
                  {(a?.topCreatorsInNiche || []).slice(0, 5).length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">No creator data yet</p>
                  ) : (
                    (a?.topCreatorsInNiche || []).slice(0, 5).map((creator: any, i: number) => (
                      <div key={creator.id || i} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 w-4 text-center">{i + 1}</span>
                        <div className="h-8 w-8 rounded-full overflow-hidden bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-[10px] font-bold text-slate-950 flex-shrink-0">
                          {creator.picture
                            ? <img src={creator.picture} alt="" className="h-full w-full object-cover" />
                            : getInitials(creator.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{creator.name || "Creator"}</p>
                            {creator.averageRating > 0 && (
                              <div className="flex items-center gap-0.5">
                                <FaStar className="h-2.5 w-2.5 text-yellow-500" />
                                <span className="text-[10px] font-medium text-slate-700 dark:text-slate-300">{creator.averageRating.toFixed(1)}</span>
                              </div>
                            )}
                          </div>
                          <div className="mt-0.5">
                            <div className="h-1.5 rounded-full bg-slate-100 dark:bg-white/8 overflow-hidden">
                              <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-500"
                                style={{ width: `${Math.round((creator.totalFollowers || 0) / topCreatorFollowers * 100)}%` }} />
                            </div>
                          </div>
                          <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">
                            {creator.totalFollowers ? `${(creator.totalFollowers / 1000).toFixed(0)}K followers` : "New"} · {creator.niche || "General"}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Affiliates performance */}
            {((a as any)?.topAffiliates || []).length > 0 && (
              <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 shadow-sm p-5">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Top Affiliates</h2>
                <div className="bus-responsive-card-grid gap-4">
                  {((a as any)?.topAffiliates || []).slice(0, 6).map((aff: any, i: number) => (
                    <div key={aff.id || i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/3 border border-slate-100 dark:border-white/6">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                        {getInitials(aff.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{aff.name}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {aff.totalConversions || 0} conversions · {formatFromUSD(aff.totalEarned || 0)} earned
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-yellow-600 dark:text-yellow-400">#{i + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB: CAMPAIGNS
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'campaigns' && (
          <div className="space-y-6">
            {/* Campaign deep-dive */}
            <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Campaign Performance Deep-Dive</h2>
                <div className="flex items-center gap-2">
                  <FaFilter className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                  <select value={selectedCampaign || ""} onChange={(e) => setSelectedCampaign(e.target.value || null)}
                    className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 outline-none min-w-[200px]">
                    <option value="">Select a campaign…</option>
                    {campaigns.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
              </div>

              {!selectedCampaign ? (
                <div className="text-center py-8">
                  <FaChartLine className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-600 dark:text-slate-400">Select a campaign to view detailed analytics</p>
                </div>
              ) : isCampaignLoading ? (
                <div className="flex justify-center py-10">
                  <FaSpinner className="animate-spin text-2xl text-emerald-500" />
                </div>
              ) : campaignData ? (
                <div className="space-y-6">
                  <div className="bus-responsive-dense-grid gap-3">
                    {[
                      { label: "Impressions", val: fmtNum(campaignData.impressions || 0), icon: FaEye, color: "text-blue-600 dark:text-blue-400" },
                      { label: "Clicks", val: fmtNum(campaignData.clicks || 0), icon: FaMousePointer, color: "text-purple-600 dark:text-purple-400" },
                      { label: "Conversions", val: fmtNum(campaignData.conversions || 0), icon: FaShoppingCart, color: "text-emerald-600 dark:text-emerald-400" },
                      { label: "Engagement", val: `${(campaignData.engagementRate || 0).toFixed(1)}%`, icon: FaChartBar, color: "text-pink-600 dark:text-pink-400" },
                      { label: "Posts", val: campaignData.postsCount || 0, icon: FaBullhorn, color: "text-orange-600 dark:text-orange-400" },
                      { label: "Earnings", val: formatFromUSD(campaignData.earnings || 0), icon: FaMoneyBillWave, color: "text-yellow-600 dark:text-yellow-400" },
                    ].map(({ label, val, icon: Icon, color }) => (
                      <div key={label} className="rounded-xl bg-slate-50 dark:bg-white/3 border border-slate-100 dark:border-white/6 p-3 text-center">
                        <Icon className={`h-4 w-4 ${color} mx-auto mb-1`} />
                        <p className={`text-lg font-bold ${color}`}>{val}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>
                  {campaignData.ctr && (
                    <div className="bus-responsive-stat-grid gap-4">
                      <div className="rounded-xl bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20 p-4 text-center">
                        <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">CTR</p>
                        <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{(campaignData.ctr * 100).toFixed(2)}%</p>
                      </div>
                      <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 p-4 text-center">
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Conversion Rate</p>
                        <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                          {campaignData.clicks > 0 ? ((campaignData.conversions / campaignData.clicks) * 100).toFixed(2) : '0.00'}%
                        </p>
                      </div>
                      <div className="rounded-xl bg-purple-50 dark:bg-purple-500/5 border border-purple-200 dark:border-purple-500/20 p-4 text-center">
                        <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">CPC</p>
                        <p className="text-xl font-bold text-purple-700 dark:text-purple-300">
                          {campaignData.clicks > 0 ? formatFromUSD((campaignData.budget || 0) / campaignData.clicks) : formatFromUSD(0)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">No analytics data for this campaign yet</p>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB: PARTNERS
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'partners' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 dark:border-white/8">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FaUsers className="h-4 w-4 text-blue-500" /> Partner Performance Analytics
                </h2>
              </div>
              <div className="p-5">
                {partnerAnalytics.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-8">No partner analytics data yet</p>
                ) : (
                  <div className="space-y-4">
                    {partnerAnalytics.map((partner: any, i: number) => (
                      <div key={partner.id || i} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-white/3 border border-slate-100 dark:border-white/6">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                          {partner.picture ? (
                            <img src={partner.picture} alt="" className="h-full w-full object-cover rounded-full" />
                          ) : (
                            getInitials(partner.name)
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{partner.name || "Partner"}</p>
                            <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400">#{i + 1}</span>
                          </div>
                          <div className="bus-responsive-stat-grid gap-3 text-xs">
                            <div>
                              <p className="text-slate-500 dark:text-slate-400">Campaigns</p>
                              <p className="font-bold text-slate-900 dark:text-white">{partner.campaignsCount || 0}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 dark:text-slate-400">Conversions</p>
                              <p className="font-bold text-slate-900 dark:text-white">{fmtNum(partner.conversions || 0)}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 dark:text-slate-400">Earned</p>
                              <p className="font-bold text-slate-900 dark:text-white">{formatFromUSD(partner.earned || 0)}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 dark:text-slate-400">Rating</p>
                              <div className="flex items-center gap-1">
                                <FaStar className="h-3 w-3 text-yellow-500" />
                                <p className="font-bold text-slate-900 dark:text-white">{(partner.rating || 0).toFixed(1)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB: FUNNEL
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'funnel' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 p-6 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <FaFunnelDollar className="h-4 w-4 text-purple-500" /> Conversion Funnel
              </h2>
              {isFunnelLoading ? (
                <div className="flex justify-center py-10">
                  <FaSpinner className="animate-spin text-2xl text-emerald-500" />
                </div>
              ) : funnelData ? (
                <FunnelChart
                  stages={[
                    { label: 'Impressions', value: funnelData.impressions || 0, color: 'from-blue-500 to-indigo-600' },
                    { label: 'Clicks', value: funnelData.clicks || 0, color: 'from-purple-500 to-pink-600' },
                    { label: 'Applications', value: funnelData.applications || 0, color: 'from-indigo-500 to-purple-600' },
                    { label: 'Approvals', value: funnelData.approvals || 0, color: 'from-emerald-500 to-teal-600' },
                    { label: 'Completions', value: funnelData.completions || 0, color: 'from-orange-500 to-amber-600' },
                    { label: 'Conversions', value: funnelData.conversions || 0, color: 'from-red-500 to-rose-600' },
                  ]}
                />
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-8">No funnel data available</p>
              )}
            </div>
          </div>
        )}

        {/* Export hint */}
        <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-white/3 p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Export Analytics Report</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Download comprehensive analytics data via API</p>
          </div>
          <Link href="/admin/api-access">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-all">
              <FaExternalLinkAlt className="h-3 w-3" /> API Access
            </button>
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAnalyticsPage;
