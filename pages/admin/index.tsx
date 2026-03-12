// Business Suite – Admin Dashboard Overview
// Route: /admin

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import toast from "react-hot-toast";
import AdminLayout from "@/components/admin/Layout";
import { getDashboard, getVendorBalance } from "@/services/vendor";
import { getCurrentUser } from "@/services/auth";
import { useCurrency } from "@/hooks/useCurrency";
import {
  FaChartLine,
  FaMoneyBillWave,
  FaUserFriends,
  FaSpinner,
  FaPlus,
  FaFileAlt,
  FaUsers,
  FaStar,
  FaCheckCircle,
  FaExclamationTriangle,
  FaBuilding,
  FaBullhorn,
  FaEnvelope,
  FaChevronRight,
  FaCode,
} from "react-icons/fa";

function getDaysRemaining(endDate: string): number {
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  return Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function isExpired(endDate: string) {
  return getDaysRemaining(endDate) < 0;
}

function getAvatarColor(name?: string | null, id?: string) {
  const str = name || id || "A";
  const colors = [
    "bg-blue-600","bg-green-600","bg-purple-600","bg-pink-600",
    "bg-indigo-600","bg-red-600","bg-yellow-600","bg-teal-600",
    "bg-orange-600","bg-cyan-600",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name?: string | null) {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.charAt(0).toUpperCase();
}

const AdminDashboard: React.FC = () => {
  const router = useRouter();
  const { formatFromUSD } = useCurrency();
  const [stats, setStats] = useState<any>({
    totalCampaigns: 0, activeCampaigns: 0, totalBudget: 0,
    totalApplications: 0, activeAffiliates: 0, activeInfluencers: 0,
    totalEarned: 0, topCampaigns: [], topCreatorsInNiche: [],
    recentApplications: [], pendingReviewsCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [balance, setBalance] = useState<number | null>(null);
  const [userName, setUserName] = useState<string>("Agency");

  useEffect(() => {
    const user = getCurrentUser();
    if (user) setUserName(user.name || user.email || "Agency");
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setIsLoading(true);
      const [dashData, balData] = await Promise.all([
        getDashboard().catch(() => null),
        getVendorBalance().catch(() => ({ balance: 0 })),
      ]);
      if (dashData) setStats(dashData);
      setBalance(balData?.balance ?? 0);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
        router.push("/admin/auth");
        return;
      }
      toast.error(err?.response?.data?.error || "Failed to load dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const endedCampaigns = (stats.topCampaigns || []).filter(
    (c: any) => c.endDate && isExpired(c.endDate)
  );
  const expiringSoon = (stats.topCampaigns || []).filter((c: any) => {
    if (!c.endDate) return false;
    const d = getDaysRemaining(c.endDate);
    return d >= 0 && d <= 7;
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <FaSpinner className="animate-spin text-3xl text-emerald-500" />
        </div>
      </AdminLayout>
    );
  }

  const spentBudget = stats.totalEarned || 0;
  const remainingBudget = Math.max(0, (stats.totalBudget || 0) - spentBudget);
  const totalBudget = stats.totalBudget || 1;
  const spentPct = Math.round((spentBudget / totalBudget) * 100);
  const remainPct = 100 - spentPct;

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* ── Welcome hero ── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-white/8 p-6 sm:p-8 shadow-xl">
          <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-emerald-500/8 blur-3xl" />
          <div className="absolute bottom-0 left-20 h-40 w-40 rounded-full bg-indigo-500/8 blur-3xl" />
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400 mb-2">
                Business Suite — Agency Control Room
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 leading-tight">
                Welcome back, {userName}!
              </h1>
              <p className="text-slate-400 text-sm max-w-lg">
                High-signal snapshot — brands, campaigns, partners, and approvals
                all in one place. Ready to drive results.
              </p>
            </div>
            <Link href="/admin/campaigns/create">
              <button className="flex items-center gap-2 bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 text-slate-950 font-semibold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/30 hover:opacity-90 transition-all whitespace-nowrap">
                <FaPlus className="h-3.5 w-3.5" />
                New Campaign
              </button>
            </Link>
          </div>
        </div>

        {/* ── Stats grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Campaigns"
            value={stats.totalCampaigns}
            sub={`${stats.activeCampaigns} active`}
            icon={FaBullhorn}
            color="blue"
          />
          <StatCard
            label="Campaign Budget"
            value={formatFromUSD(stats.totalBudget || 0)}
            sub="Allocated"
            icon={FaMoneyBillWave}
            color="green"
          />
          <StatCard
            label="Active Creators"
            value={stats.activeInfluencers || stats.activeAffiliates || 0}
            sub="Working with you"
            icon={FaUserFriends}
            color="purple"
          />
          <Link href="/admin/campaigns" className="block">
            <StatCard
              label="Wallet Balance"
              value={balance !== null ? formatFromUSD(balance) : "—"}
              sub="Available"
              icon={FaMoneyBillWave}
              color="indigo"
              clickable
            />
          </Link>
        </div>

        {/* ── Expiry alerts ── */}
        {(endedCampaigns.length > 0 || expiringSoon.length > 0) && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FaExclamationTriangle className="h-4 w-4 text-orange-500" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Campaign Expiry Alerts</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {endedCampaigns.length > 0 && (
                <AlertBlock title={`${endedCampaigns.length} Ended`} hint="Past end date — review or archive" campaigns={endedCampaigns} color="red" basePath="/admin/campaigns" daysLabel={(c) => `${Math.abs(getDaysRemaining(c.endDate))}d ago`} />
              )}
              {expiringSoon.length > 0 && (
                <AlertBlock title={`${expiringSoon.length} Expiring Soon`} hint="Act now to extend or wrap up" campaigns={expiringSoon} color="yellow" basePath="/admin/campaigns" daysLabel={(c) => { const d = getDaysRemaining(c.endDate); return d === 0 ? "Ends today" : `${d}d left`; }} />
              )}
            </div>
          </div>
        )}

        {/* ── Budget + performance ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Budget donut */}
          <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-6">Budget Overview</h2>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative flex-shrink-0 h-44 w-44">
                <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
                  {spentPct > 0 && <circle cx="100" cy="100" r="80" fill="none" stroke="url(#sg)" strokeWidth="40" strokeDasharray={`${(spentPct / 100) * 502} 502`} />}
                  {remainPct > 0 && <circle cx="100" cy="100" r="80" fill="none" stroke="url(#rg)" strokeWidth="40" strokeDasharray={`${(remainPct / 100) * 502} 502`} strokeDashoffset={`-${(spentPct / 100) * 502}`} />}
                  <defs>
                    <linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#3B82F6" /><stop offset="100%" stopColor="#8B5CF6" /></linearGradient>
                    <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#10B981" /><stop offset="100%" stopColor="#34D399" /></linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-slate-900 dark:text-white">{spentPct}%</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Spent</span>
                </div>
              </div>
              <div className="flex-1 space-y-3 w-full">
                <LegendRow label="Spent" value={formatFromUSD(spentBudget)} pct={spentPct} dot="from-blue-500 to-purple-600" />
                <LegendRow label="Remaining" value={formatFromUSD(remainingBudget)} pct={remainPct} dot="from-green-500 to-emerald-400" />
                <div className="pt-3 border-t border-slate-200 dark:border-white/8 flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Total Budget</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">{formatFromUSD(totalBudget)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Campaign performance */}
          <div className="rounded-2xl border border-indigo-200 dark:border-indigo-900/40 bg-indigo-50 dark:bg-gradient-to-br dark:from-indigo-950/40 dark:to-purple-950/30 p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-6">Campaign Performance</h2>
            <div className="space-y-4">
              <PerfRow label="Total Earned by Creators" value={formatFromUSD(stats.totalEarned || 0)} icon={FaMoneyBillWave} color="green" />
              <PerfRow label="Active Applications" value={stats.totalApplications} icon={FaFileAlt} color="purple" />
              <PerfRow label="Pending Reviews" value={stats.pendingReviewsCount || 0} icon={FaCheckCircle} color="orange" />
              <PerfRow label="Top Campaigns" value={stats.topCampaigns?.length || 0} icon={FaChartLine} color="blue" />
            </div>
          </div>
        </div>

        {/* ── Top Creators + Recent Activity ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Creators */}
          <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-white/8 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Top Creators</h2>
              <Link href="/admin/partners" className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300">
                Discover More →
              </Link>
            </div>
            <div className="p-5">
              {stats.topCreatorsInNiche?.length > 0 ? (
                <div className="space-y-3">
                  {stats.topCreatorsInNiche.slice(0, 4).map((creator: any) => (
                    <Link key={creator.id} href={`/admin/partners/${creator.id}`}
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/3 hover:bg-slate-100 dark:hover:bg-white/6 border border-slate-200 dark:border-white/6 hover:border-slate-300 dark:hover:border-white/12 transition-all group">
                      <div className={`h-10 w-10 rounded-full flex-shrink-0 overflow-hidden border border-slate-200 dark:border-white/10 ${!creator.picture ? getAvatarColor(creator.name, creator.id) : ""}`}>
                        {creator.picture
                          ? <img src={creator.picture} alt={creator.name} className="h-full w-full object-cover" />
                          : <div className="h-full w-full flex items-center justify-center text-white font-bold text-sm">{getInitials(creator.name)}</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">{creator.name || "Unknown Creator"}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{creator.niche || "General"} · {creator.totalFollowers ? `${(creator.totalFollowers / 1000).toFixed(1)}K followers` : "New Creator"}</p>
                      </div>
                      {creator.averageRating > 0 && (
                        <div className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-500/10 border border-yellow-300 dark:border-yellow-500/20 px-2 py-0.5 rounded-full">
                          <FaStar className="h-2.5 w-2.5 text-yellow-500 dark:text-yellow-400" />
                          <span className="text-[10px] font-semibold text-yellow-700 dark:text-yellow-300">{creator.averageRating.toFixed(1)}</span>
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState icon={FaUsers} message="No creators yet" hint="Discover partners to curate for your campaigns" cta="Browse Partners" ctaHref="/admin/partners" />
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-white/8 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Recent Activity</h2>
              <Link href="/admin/applications" className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300">
                View All →
              </Link>
            </div>
            <div className="p-5">
              {stats.recentApplications?.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentApplications.slice(0, 4).map((app: any) => (
                    <div key={app.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/3 border border-slate-200 dark:border-white/6">
                      <div className={`h-10 w-10 rounded-full flex-shrink-0 overflow-hidden border border-slate-200 dark:border-white/10 ${!app.partner?.picture ? getAvatarColor(app.partner?.name, app.partner?.id) : ""}`}>
                        {app.partner?.picture
                          ? <img src={app.partner.picture} alt={app.partner.name} className="h-full w-full object-cover" />
                          : <div className="h-full w-full flex items-center justify-center text-white font-bold text-sm">{getInitials(app.partner?.name)}</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{app.partner?.name || "Unknown"}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Applied to: {app.campaign?.title || "Campaign"}</p>
                      </div>
                      <StatusBadge status={app.status} />
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={FaFileAlt} message="No recent activity" hint="Applications will appear here when creators apply" />
              )}
            </div>
          </div>
        </div>

        {/* ── Quick actions ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { href: "/admin/brands", icon: FaBuilding, label: "Manage Brands", color: "emerald", hint: "Multi-brand workspace" },
            { href: "/admin/campaigns/create", icon: FaBullhorn, label: "New Campaign", color: "blue", hint: "Launch in minutes" },
            { href: "/admin/partners", icon: FaUsers, label: "Browse Partners", color: "purple", hint: "Discover & curate" },
            { href: "/admin/api-access", icon: FaCode, label: "API Access", color: "indigo", hint: "Integrate Trend360" },
          ].map(({ href, icon: Icon, label, color, hint }) => (
            <Link key={href} href={href}>
              <div className={`rounded-2xl border p-5 hover:scale-[1.02] transition-all cursor-pointer group
                ${color === "emerald" ? "border-emerald-300 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/5 hover:bg-emerald-100 dark:hover:bg-emerald-500/10" : ""}
                ${color === "blue" ? "border-blue-300 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/5 hover:bg-blue-100 dark:hover:bg-blue-500/10" : ""}
                ${color === "purple" ? "border-purple-300 dark:border-purple-500/20 bg-purple-50 dark:bg-purple-500/5 hover:bg-purple-100 dark:hover:bg-purple-500/10" : ""}
                ${color === "indigo" ? "border-indigo-300 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/5 hover:bg-indigo-100 dark:hover:bg-indigo-500/10" : ""}
              `}>
                <Icon className={`h-6 w-6 mb-3
                  ${color === "emerald" ? "text-emerald-600 dark:text-emerald-400" : ""}
                  ${color === "blue" ? "text-blue-600 dark:text-blue-400" : ""}
                  ${color === "purple" ? "text-purple-600 dark:text-purple-400" : ""}
                  ${color === "indigo" ? "text-indigo-600 dark:text-indigo-400" : ""}
                `} />
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{hint}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* ── Quick links ── */}
        <div className="flex items-center gap-2">
          <Link href="/admin/messages" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/8 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
            <FaEnvelope className="h-3.5 w-3.5" /> Messages
          </Link>
          <Link href="/admin/analytics" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/8 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
            <FaChartLine className="h-3.5 w-3.5" /> Analytics
          </Link>
        </div>

      </div>
    </AdminLayout>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StatCardProps {
  label: string; value: string | number; sub: string;
  icon: React.ElementType; color: "blue" | "green" | "purple" | "indigo"; clickable?: boolean;
}

function StatCard({ label, value, sub, icon: Icon, color, clickable }: StatCardProps) {
  const map = {
    blue: { bg: "from-blue-50 to-white dark:from-blue-950/40 dark:to-blue-900/20", border: "border-blue-200 dark:border-blue-800/40", text: "text-blue-600 dark:text-blue-400", iconBg: "bg-blue-100 dark:bg-blue-500/10" },
    green: { bg: "from-green-50 to-white dark:from-green-950/40 dark:to-green-900/20", border: "border-green-200 dark:border-green-800/40", text: "text-green-600 dark:text-green-400", iconBg: "bg-green-100 dark:bg-green-500/10" },
    purple: { bg: "from-purple-50 to-white dark:from-purple-950/40 dark:to-purple-900/20", border: "border-purple-200 dark:border-purple-800/40", text: "text-purple-600 dark:text-purple-400", iconBg: "bg-purple-100 dark:bg-purple-500/10" },
    indigo: { bg: "from-indigo-50 to-white dark:from-indigo-950/40 dark:to-blue-900/20", border: "border-indigo-200 dark:border-indigo-800/40", text: "text-indigo-600 dark:text-indigo-400", iconBg: "bg-indigo-100 dark:bg-indigo-500/10" },
  };
  const s = map[color];
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${s.bg} border ${s.border} p-4 shadow-sm hover:shadow-md transition-all ${clickable ? "cursor-pointer hover:scale-[1.01]" : ""}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-xs font-medium mb-0.5 ${s.text}`}>{label}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
          <p className={`text-xs mt-0.5 ${s.text}`}>{sub}</p>
        </div>
        <div className={`rounded-full p-3 ${s.iconBg}`}>
          <Icon className={`h-6 w-6 ${s.text}`} />
        </div>
      </div>
    </div>
  );
}

function LegendRow({ label, value, pct, dot }: { label: string; value: string; pct: number; dot: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/3 border border-slate-200 dark:border-white/8">
      <div className="flex items-center gap-2.5">
        <div className={`h-4 w-4 rounded-full bg-gradient-to-r ${dot}`} />
        <span className="text-sm text-slate-600 dark:text-slate-300">{label}</span>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold text-slate-900 dark:text-white">{value}</p>
        <p className="text-[10px] text-slate-400 dark:text-slate-500">{pct}%</p>
      </div>
    </div>
  );
}

function PerfRow({ label, value, icon: Icon, color }: { label: string; value: any; icon: React.ElementType; color: string }) {
  const ic: Record<string, string> = {
    green: "bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400",
    purple: "bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400",
    orange: "bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400",
    blue: "bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400",
  };
  return (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/8">
      <p className="text-sm text-slate-600 dark:text-slate-300">{label}</p>
      <div className="flex items-center gap-3">
        <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        <div className={`rounded-full p-2.5 ${ic[color] || ic.blue}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    APPROVED: "bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-300 border-green-300 dark:border-green-500/20",
    PENDING: "bg-yellow-100 dark:bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-500/20",
    REJECTED: "bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300 border-red-300 dark:border-red-500/20",
  };
  return (
    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${map[status] || map.PENDING}`}>
      {status}
    </span>
  );
}

interface AlertBlockProps {
  title: string; hint: string; campaigns: any[]; color: "red" | "yellow";
  basePath: string; daysLabel: (c: any) => string;
}
function AlertBlock({ title, hint, campaigns, color, basePath, daysLabel }: AlertBlockProps) {
  const s = {
    red: { wrap: "from-red-50 to-rose-50 dark:from-red-950/40 dark:to-rose-950/30 border-red-200 dark:border-red-800/40", icon: "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/10", text: "text-red-700 dark:text-red-300", badge: "text-red-600 dark:text-red-400" },
    yellow: { wrap: "from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/20 border-yellow-200 dark:border-yellow-800/40", icon: "text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-500/10", text: "text-yellow-700 dark:text-yellow-300", badge: "text-yellow-600 dark:text-yellow-400" },
  }[color];
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${s.wrap} border p-5`}>
      <div className="flex items-center gap-2.5 mb-3">
        <div className={`rounded-full p-2 ${s.icon}`}><FaExclamationTriangle className="h-3.5 w-3.5" /></div>
        <div>
          <p className={`text-sm font-bold ${s.text}`}>{title}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>
        </div>
      </div>
      <div className="space-y-2">
        {campaigns.slice(0, 3).map((c: any) => (
          <Link key={c.id} href={`${basePath}/${c.id}`}>
            <div className="flex items-center justify-between p-2.5 bg-white dark:bg-white/3 rounded-xl border border-slate-200 dark:border-white/6 hover:bg-slate-50 dark:hover:bg-white/6 transition-colors cursor-pointer">
              <span className="text-sm text-slate-900 dark:text-white truncate">{c.title}</span>
              <span className={`text-xs font-semibold ml-2 ${s.badge}`}>{daysLabel(c)}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, message, hint, cta, ctaHref }: {
  icon: React.ElementType; message: string; hint: string; cta?: string; ctaHref?: string;
}) {
  return (
    <div className="text-center py-8">
      <Icon className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
      <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{message}</p>
      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 mb-4">{hint}</p>
      {cta && ctaHref && (
        <Link href={ctaHref} className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300">
          {cta} <FaChevronRight className="h-2.5 w-2.5" />
        </Link>
      )}
    </div>
  );
}

export default AdminDashboard;
