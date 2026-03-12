// Business Suite – Campaigns List
// Route: /admin/campaigns

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import AdminLayout from "@/components/admin/Layout";
import { getCampaigns } from "@/services/vendor";
import { useCurrency } from "@/hooks/useCurrency";
import { useBrand } from "@/contexts/BrandContext";
import {
  FaPlus, FaSearch, FaSpinner, FaBriefcase, FaMoneyBillWave,
  FaCalendarAlt, FaChevronRight, FaExclamationTriangle, FaClock,
  FaCheckCircle,
} from "react-icons/fa";
import { FaList, FaTh } from "react-icons/fa";
function fmtDate(d: string | Date) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function daysLeft(endDate: string) {
  const end = new Date(endDate); end.setHours(23, 59, 59, 999);
  return Math.ceil((end.getTime() - Date.now()) / 86400000);
}

function ExpiryBadge({ endDate }: { endDate: string }) {
  const d = daysLeft(endDate);
  if (d < 0) return <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-300 border border-red-300 dark:border-red-500/20 text-[10px] font-bold rounded-full"><FaExclamationTriangle className="h-2.5 w-2.5" /> ENDED</span>;
  if (d === 0) return <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 dark:bg-orange-500/15 text-orange-600 dark:text-orange-300 border border-orange-300 dark:border-orange-500/20 text-[10px] font-bold rounded-full"><FaClock className="h-2.5 w-2.5" /> Ends Today</span>;
  if (d <= 7) return <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 dark:bg-yellow-500/15 text-yellow-600 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-500/20 text-[10px] font-bold rounded-full"><FaClock className="h-2.5 w-2.5" /> {d}d left</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-300 border border-green-300 dark:border-green-500/15 text-[10px] font-medium rounded-full"><FaCheckCircle className="h-2.5 w-2.5" /> {d}d left</span>;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE: "bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-300 border-green-300 dark:border-green-500/20",
    PENDING: "bg-yellow-100 dark:bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-500/20",
    COMPLETED: "bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-500/20",
    PAUSED: "bg-slate-100 dark:bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-500/20",
    CANCELLED: "bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300 border-red-300 dark:border-red-500/20",
  };
  return <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${map[status] || map.PENDING}`}>{status}</span>;
}

const AdminCampaignsPage: React.FC = () => {
  const router = useRouter();
  const { formatFromUSD } = useCurrency();
  const { brandId } = router.query;
  const { selectedBrand } = useBrand();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewMode, setViewMode] = useState<"table" | "cards">("cards");
  
  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total?: number;
    totalPages?: number;
  }>({ page: 1, limit: 18 });
  const [stats, setStats] = useState({ total: 0, active: 0, totalBudgetUSD: 0, expiringSoon: 0, ended: 0 });
  const [brandName, setBrandName] = useState<string | null>(null);

  useEffect(() => {
    if (brandId && typeof brandId === "string") {
      import("@/services/vendor").then(({ getBrand }) =>
        getBrand(brandId).then((b) => setBrandName(b?.name || null)).catch(() => {})
      );
    } else {
      setBrandName(null);
    }
  }, [brandId]);

  const fetchCampaigns = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: any = {};
      params.page = pagination.page;
      params.limit = pagination.limit;
      if (debouncedSearch) params.search = debouncedSearch;
      if (filterStatus !== "all") params.status = filterStatus;
      // Prefer explicit query param, otherwise default to selected brand context.
      if (brandId && typeof brandId === "string") params.brandId = brandId;
      else if (selectedBrand?.id) params.brandId = selectedBrand.id;
      const res = await getCampaigns(params);
      const list: any[] = res.data || [];
      if (res.pagination) setPagination((p) => ({ ...p, ...res.pagination }));
      setCampaigns(list);
      const now = Date.now();
      // Use pagination.total if available, otherwise calculate from current page
      const total = (res.pagination?.total as number | undefined) ?? list.length;
      setStats({
        total,
        active: list.filter((c) => c.status === "ACTIVE").length,
        totalBudgetUSD: list.reduce((s, c) => s + (c.budget || 0), 0),
        ended: list.filter((c) => c.endDate && new Date(c.endDate).getTime() < now).length,
        expiringSoon: list.filter((c) => { if (!c.endDate) return false; const d = daysLeft(c.endDate); return d >= 0 && d <= 7; }).length,
      });
    } catch (err: any) {
      if (err?.response?.status === 401) { router.push("/admin/auth"); return; }
      toast.error(err?.response?.data?.error || "Failed to load campaigns");
    } finally { setIsLoading(false); }
  }, [debouncedSearch, filterStatus, brandId, selectedBrand?.id, pagination.page, pagination.limit, router]);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  if (isLoading) return (
    <AdminLayout>
      <div className="flex justify-center items-center h-64">
        <FaSpinner className="animate-spin text-3xl text-emerald-500" />
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {brandName ? `${brandName} — Campaigns` : "Campaigns"}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {brandName ? `Campaigns running for ${brandName}` : "Create and manage your marketing campaigns"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-white/8 rounded-xl p-1">
              <button
                onClick={() => setViewMode("table")}
                className={`px-3 py-2 rounded-lg border text-sm flex items-center gap-1 transition-colors ${
                  viewMode === "table"
                    ? "bg-emerald-500 text-white border-emerald-500"
                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10"
                }`}
                title="Table view"
              >
                <FaList className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("cards")}
                className={`px-3 py-2 rounded-lg border text-sm flex items-center gap-1 transition-colors ${
                  viewMode === "cards"
                    ? "bg-emerald-500 text-white border-emerald-500"
                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10"
                }`}
                title="Card view"
              >
                <FaTh className="h-4 w-4" />
              </button>
            </div>
            <Link href="/admin/campaigns/create">
              <button className="flex items-center gap-2 bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 text-slate-950 font-semibold text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/30 hover:opacity-90 transition-all">
                <FaPlus className="h-3.5 w-3.5" /> Create Campaign
              </button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Campaigns", val: stats.total, sub: `${stats.active} active`, light: "border-blue-200 bg-blue-50 text-blue-600", dark: "dark:border-blue-500/20 dark:bg-blue-500/5 dark:text-blue-400" },
            { label: "Total Budget", val: formatFromUSD(stats.totalBudgetUSD), sub: "Allocated", light: "border-green-200 bg-green-50 text-green-600", dark: "dark:border-green-500/20 dark:bg-green-500/5 dark:text-green-400" },
            { label: "Expiring Soon", val: stats.expiringSoon, sub: "Within 7 days", light: "border-yellow-200 bg-yellow-50 text-yellow-600", dark: "dark:border-yellow-500/20 dark:bg-yellow-500/5 dark:text-yellow-400" },
            { label: "Ended", val: stats.ended, sub: "Past end date", light: "border-red-200 bg-red-50 text-red-600", dark: "dark:border-red-500/20 dark:bg-red-500/5 dark:text-red-400" },
          ].map(({ label, val, sub, light, dark }) => (
            <div key={label} className={`rounded-2xl border p-4 ${light} ${dark}`}>
              <p className="text-xs font-medium mb-1">{label}</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{val}</p>
              <p className="text-xs mt-0.5 opacity-70">{sub}</p>
            </div>
          ))}
        </div>

        {/* Search + Filter */}
        <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search campaigns…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-400 dark:focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/15 transition-all"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300 outline-none focus:border-emerald-400/50 min-w-[140px]"
              >
                <option value="all">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="PENDING">Pending</option>
                <option value="COMPLETED">Completed</option>
                <option value="PAUSED">Paused</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <button onClick={() => { setPagination((p) => ({ ...p, page: 1 })); }} className="px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 text-sm font-medium hover:bg-emerald-100 dark:hover:bg-emerald-500/30 transition-colors">
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Campaign list */}
        {campaigns.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 p-12 text-center">
            <FaBriefcase className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">No campaigns found</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              {search || filterStatus !== "all" ? "Try adjusting your search or filters" : "Get started by creating your first campaign"}
            </p>
            {!search && filterStatus === "all" && (
              <Link href="/admin/campaigns/create">
                <button className="bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 font-semibold text-sm px-5 py-2 rounded-xl">
                  Create Campaign
                </button>
              </Link>
            )}
          </div>
        ) : viewMode === "table" ? (
          <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-white/10">
                <thead className="bg-slate-50 dark:bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Campaign
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Budget
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Ends
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                  {campaigns.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{c.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[520px]">
                            {c.description || "—"}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-white">
                        {formatFromUSD(c.budget || 0)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-600 dark:text-slate-300">
                        {c.startDate && c.endDate ? `${fmtDate(c.startDate)} – ${fmtDate(c.endDate)}` : "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {c.endDate ? <ExpiryBadge endDate={c.endDate} /> : "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <Link
                          href={`/admin/campaigns/${c.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
                        >
                          View <FaChevronRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {campaigns.map((campaign) => {
              const expired = campaign.endDate && daysLeft(campaign.endDate) < 0;
              const urgent = !expired && campaign.endDate && daysLeft(campaign.endDate) <= 7;
              return (
                <Link key={campaign.id} href={`/admin/campaigns/${campaign.id}`}>
                  <div className={`rounded-2xl border p-5 hover:scale-[1.01] transition-all cursor-pointer group shadow-sm hover:shadow-lg
                    ${expired ? "border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-950/20 hover:border-red-300 dark:hover:border-red-700/50" :
                      urgent ? "border-yellow-200 dark:border-yellow-800/40 bg-yellow-50 dark:bg-yellow-950/10 hover:border-yellow-300 dark:hover:border-yellow-700/50" :
                      "border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 hover:border-emerald-300 dark:hover:border-emerald-500/30"}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors line-clamp-2 flex-1">
                        {campaign.title}
                      </h3>
                      <div className="ml-2 flex flex-col items-end gap-1 flex-shrink-0">
                        <StatusBadge status={campaign.status} />
                        {campaign.endDate && <ExpiryBadge endDate={campaign.endDate} />}
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 min-h-[2rem]">
                      {campaign.description || "No description provided"}
                    </p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-green-50 dark:bg-green-500/5 border border-green-200 dark:border-green-500/15">
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                          <FaMoneyBillWave className="h-3.5 w-3.5" />
                          <span className="text-xs font-medium">Budget</span>
                        </div>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{formatFromUSD(campaign.budget || 0)}</span>
                      </div>
                      <div className={`flex items-center justify-between px-3 py-2 rounded-lg border ${
                        expired ? "bg-red-50 dark:bg-red-500/5 border-red-200 dark:border-red-500/15" :
                        urgent ? "bg-yellow-50 dark:bg-yellow-500/5 border-yellow-200 dark:border-yellow-500/15" :
                        "bg-blue-50 dark:bg-blue-500/5 border-blue-200 dark:border-blue-500/15"}`}
                      >
                        <div className={`flex items-center gap-2 ${expired ? "text-red-500 dark:text-red-400" : urgent ? "text-yellow-500 dark:text-yellow-400" : "text-blue-500 dark:text-blue-400"}`}>
                          <FaCalendarAlt className="h-3.5 w-3.5" />
                          <span className="text-xs font-medium">Duration</span>
                        </div>
                        <span className="text-xs text-slate-600 dark:text-slate-300">
                          {fmtDate(campaign.startDate)} – {fmtDate(campaign.endDate)}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200 dark:border-white/8 flex items-center justify-between">
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                        View Details
                      </span>
                      <FaChevronRight className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {(pagination.totalPages || 0) > 1 && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Page <span className="font-semibold text-slate-900 dark:text-white">{pagination.page}</span> of{" "}
              <span className="font-semibold text-slate-900 dark:text-white">{pagination.totalPages}</span>
              {typeof pagination.total === "number" && (
                <>
                  {" "}· <span className="font-semibold text-slate-900 dark:text-white">{pagination.total}</span> total
                </>
              )}
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
                className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={!!pagination.totalPages && pagination.page >= (pagination.totalPages || 1)}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminCampaignsPage;
