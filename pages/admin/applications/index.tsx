// Business Suite – Applications Hub
// Route: /admin/applications

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import AdminLayout from "@/components/admin/Layout";
import { getApplications, getCampaigns, updateApplicationStatus } from "@/services/vendor";
import {
  FaFileAlt, FaCheckCircle, FaTimesCircle, FaSpinner, FaSearch,
} from "react-icons/fa";
import { FaList, FaTh } from "react-icons/fa";
import { FaFilter } from "react-icons/fa";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    APPROVED: "bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-300 border-green-300 dark:border-green-500/20",
    PENDING: "bg-yellow-100 dark:bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-500/20",
    REJECTED: "bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300 border-red-300 dark:border-red-500/20",
  };
  return <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${map[status] || map.PENDING}`}>{status}</span>;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const AdminApplicationsPage: React.FC = () => {
  const router = useRouter();
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [filterCampaign, setFilterCampaign] = useState("all");
  const [pagination, setPagination] = useState<{ page: number; limit: number; total?: number; totalPages?: number }>({
    page: 1,
    limit: 20,
  });
  const [selectedApplications, setSelectedApplications] = useState<Set<string>>(new Set());
  const [showBulkApproveConfirm, setShowBulkApproveConfirm] = useState(false);
  const [isBulkApproving, setIsBulkApproving] = useState(false);
  const [showBulkRejectConfirm, setShowBulkRejectConfirm] = useState(false);
  const [isBulkRejecting, setIsBulkRejecting] = useState(false);
  const [bulkRejectReason, setBulkRejectReason] = useState("");

  // Debounce search to match vendor/finalboss feel
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    getCampaigns({ limit: 100 })
      .then((r) => setCampaigns(r.data || []))
      .catch(() => setCampaigns([]));
  }, []);

  const fetchApps = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: any = { page: pagination.page, limit: pagination.limit };
      if (filterStatus !== "all") params.status = filterStatus;
      if (filterCampaign !== "all") params.campaignId = filterCampaign;
      if (debouncedSearch) params.search = debouncedSearch;
      const res = await getApplications(params);
      const list = res.data || [];
      setApplications(list);
      if (res.pagination) setPagination((p) => ({ ...p, ...res.pagination }));
    } catch (err: any) {
      if (err?.response?.status === 401) { router.push("/admin/auth"); return; }
      toast.error("Failed to load applications");
    } finally { setIsLoading(false); }
  }, [filterStatus, filterCampaign, debouncedSearch, pagination.page, pagination.limit, router]);

  useEffect(() => { fetchApps(); }, [fetchApps]);

  const handleAction = async (appId: string, action: "APPROVED" | "REJECTED") => {
    setActionLoading(appId);
    try {
      await updateApplicationStatus(appId, action);
      toast.success(`Application ${action.toLowerCase()}`);
      setApplications((prev) => prev.map((a) => (a.id === appId ? { ...a, status: action } : a)));
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Action failed");
    } finally { setActionLoading(null); }
  };

  const toggleSelect = (appId: string, status: string) => {
    if (status !== "PENDING") return;
    setSelectedApplications((prev) => {
      const next = new Set(prev);
      if (next.has(appId)) next.delete(appId);
      else next.add(appId);
      return next;
    });
  };

  const selectAllPendingVisible = () => {
    const pendingIds = applications.filter((a) => a.status === "PENDING").map((a) => a.id);
    const pendingSet = new Set(pendingIds);
    if (pendingSet.size > 0 && selectedApplications.size === pendingSet.size) {
      setSelectedApplications(new Set());
    } else {
      setSelectedApplications(pendingSet);
    }
  };

  const bulkApprove = async () => {
    if (selectedApplications.size === 0) return;
    setIsBulkApproving(true);
    try {
      const ids = Array.from(selectedApplications);
      const results = await Promise.allSettled(ids.map((id) => updateApplicationStatus(id, "APPROVED")));
      const successCount = results.filter((r) => r.status === "fulfilled").length;
      const failCount = results.length - successCount;
      if (successCount) toast.success(`Approved ${successCount} application${successCount === 1 ? "" : "s"}${failCount ? ` (${failCount} failed)` : ""}`);
      if (failCount) toast.error(`${failCount} failed to approve`);
      setSelectedApplications(new Set());
      fetchApps();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Bulk approve failed");
    } finally {
      setIsBulkApproving(false);
    }
  };

  const bulkReject = async () => {
    if (selectedApplications.size === 0) return;
    setIsBulkRejecting(true);
    try {
      const ids = Array.from(selectedApplications);
      const results = await Promise.allSettled(ids.map((id) => updateApplicationStatus(id, "REJECTED", bulkRejectReason || undefined)));
      const successCount = results.filter((r) => r.status === "fulfilled").length;
      const failCount = results.length - successCount;
      if (successCount) toast.success(`Rejected ${successCount} application${successCount === 1 ? "" : "s"}${failCount ? ` (${failCount} failed)` : ""}`);
      if (failCount) toast.error(`${failCount} failed to reject`);
      setSelectedApplications(new Set());
      setBulkRejectReason("");
      fetchApps();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Bulk reject failed");
    } finally {
      setIsBulkRejecting(false);
    }
  };

  // Calculate stats from current page data (for display) - backend should provide totals
  const pending = applications.filter((a) => a.status === "PENDING");
  const approved = applications.filter((a) => a.status === "APPROVED");
  const rejected = applications.filter((a) => a.status === "REJECTED");
  const workReady = applications.filter((a) => a.status === "APPROVED" && a.workCompletedByPartner && !a.workApprovedByVendor);
  
  // Use pagination.total if available, otherwise fall back to current page counts
  const totalApplications = pagination.total ?? applications.length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Applications</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Review and approve creator applications across all campaigns</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {pending.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={selectAllPendingVisible}
                  className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300"
                >
                  {selectedApplications.size > 0 && selectedApplications.size === pending.length ? "Deselect Pending" : "Select Pending"}
                </button>
                <button
                  onClick={() => setShowBulkApproveConfirm(true)}
                  disabled={selectedApplications.size === 0 || isBulkApproving}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white"
                >
                  {isBulkApproving ? "Approving…" : `Approve Selected (${selectedApplications.size})`}
                </button>
                <button
                  onClick={() => setShowBulkRejectConfirm(true)}
                  disabled={selectedApplications.size === 0 || isBulkRejecting}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white"
                >
                  {isBulkRejecting ? "Rejecting…" : `Reject Selected (${selectedApplications.size})`}
                </button>
              </div>
            )}

            <div className="flex items-center gap-1 bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-white/8 rounded-xl p-1 w-fit">
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
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total", val: totalApplications, light: "border-blue-200 bg-blue-50 hover:bg-blue-100", dark: "dark:border-blue-500/20 dark:bg-blue-500/5 dark:hover:bg-blue-500/10", textLight: "text-blue-600", textDark: "dark:text-blue-400", clickable: false },
            { label: "Pending", val: pending.length, light: "border-yellow-200 bg-yellow-50 hover:bg-yellow-100", dark: "dark:border-yellow-500/20 dark:bg-yellow-500/5 dark:hover:bg-yellow-500/10", textLight: "text-yellow-600", textDark: "dark:text-yellow-400", clickable: true },
            { label: "Approved", val: approved.length, light: "border-green-200 bg-green-50 hover:bg-green-100", dark: "dark:border-green-500/20 dark:bg-green-500/5 dark:hover:bg-green-500/10", textLight: "text-green-600", textDark: "dark:text-green-400", clickable: true },
            { label: "Rejected", val: rejected.length, light: "border-red-200 bg-red-50 hover:bg-red-100", dark: "dark:border-red-500/20 dark:bg-red-500/5 dark:hover:bg-red-500/10", textLight: "text-red-600", textDark: "dark:text-red-400", clickable: true },
          ].map(({ label, val, light, dark, textLight, textDark, clickable }) => (
            <div key={label}
              className={`rounded-2xl border p-4 text-center transition-all ${light} ${dark} ${clickable ? 'cursor-pointer' : ''}`}
              onClick={() => {
                if (!clickable) return;
                setPagination((p) => ({ ...p, page: 1 }));
                setFilterStatus(label === "Pending" ? "PENDING" : label === "Approved" ? "APPROVED" : "REJECTED");
              }}
            >
              <p className={`text-2xl font-bold text-slate-900 dark:text-white`}>{val}</p>
              <p className={`text-xs mt-0.5 font-medium ${textLight} ${textDark}`}>{label}</p>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 p-4 flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by creator or campaign…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-400 dark:focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/15" />
          </div>
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
            <FaFilter className="h-3 w-3 text-slate-400 dark:text-slate-500" />
            <select
              value={filterCampaign}
              onChange={(e) => { setFilterCampaign(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}
              className="bg-transparent text-sm text-slate-700 dark:text-slate-300 outline-none min-w-[200px]"
            >
              <option value="all">All Campaigns</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300 outline-none min-w-[140px]">
            <option value="all">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <div className="flex items-center gap-2">
            <select
              value={pagination.limit}
              onChange={(e) => setPagination((p) => ({ ...p, limit: parseInt(e.target.value, 10), page: 1 }))}
              className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300 outline-none"
              title="Rows per page"
            >
              {[10, 20, 50].map((n) => (
                <option key={n} value={n}>{n}/page</option>
              ))}
            </select>
            <button onClick={() => { setPagination((p) => ({ ...p, page: 1 })); fetchApps(); }} className="px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 text-sm font-medium hover:bg-emerald-100 dark:hover:bg-emerald-500/30 transition-colors">
              Refresh
            </button>
          </div>
        </div>

        {/* Applications list */}
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <FaSpinner className="animate-spin text-2xl text-emerald-500" />
          </div>
        ) : applications.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 p-12 text-center">
            <FaFileAlt className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-sm text-slate-700 dark:text-slate-300">No applications found</p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Applications will appear here when creators apply to your campaigns</p>
          </div>
        ) : viewMode === "table" ? (
          <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-white/10">
                <thead className="bg-slate-50 dark:bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Select
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Creator</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Campaign</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Applied</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <input
                          type="checkbox"
                          disabled={app.status !== "PENDING"}
                          checked={selectedApplications.has(app.id)}
                          onChange={() => toggleSelect(app.id, app.status)}
                          className="h-4 w-4 accent-emerald-600 disabled:opacity-50"
                          title={app.status !== "PENDING" ? "Only pending applications can be selected" : "Select"}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{app.partner?.name || "Unknown Creator"}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{app.partner?.email || "—"}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-slate-900 dark:text-white truncate max-w-[520px]">{app.campaign?.title || "—"}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-600 dark:text-slate-300">
                        {app.createdAt ? fmtDate(app.createdAt) : "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        {app.status === "PENDING" ? (
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => handleAction(app.id, "APPROVED")}
                              disabled={actionLoading === app.id}
                              className="px-3 py-1.5 rounded-lg bg-green-100 dark:bg-green-500/15 border border-green-300 dark:border-green-500/25 text-green-700 dark:text-green-300 text-xs font-semibold hover:bg-green-200 dark:hover:bg-green-500/25 disabled:opacity-50 transition-all"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleAction(app.id, "REJECTED")}
                              disabled={actionLoading === app.id}
                              className="px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-500/15 border border-red-300 dark:border-red-500/25 text-red-700 dark:text-red-300 text-xs font-semibold hover:bg-red-200 dark:hover:bg-red-500/25 disabled:opacity-50 transition-all"
                            >
                              Decline
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {applications.map((app) => {
              const isPending = app.status === "PENDING";
              const isSelected = selectedApplications.has(app.id);
              const getAvatarColor = (name?: string | null) => {
                const colors = ['bg-blue-600', 'bg-green-600', 'bg-purple-600', 'bg-pink-600', 'bg-indigo-600', 'bg-red-600', 'bg-yellow-600', 'bg-teal-600', 'bg-orange-600', 'bg-cyan-600'];
                if (!name) return colors[0];
                let hash = 0;
                for (let i = 0; i < name.length; i++) {
                  hash = name.charCodeAt(i) + ((hash << 5) - hash);
                }
                return colors[Math.abs(hash) % colors.length];
              };
              const getInitials = (name?: string | null) => {
                if (!name) return 'P';
                const parts = name.trim().split(' ');
                return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name.charAt(0).toUpperCase();
              };
              return (
                <div key={app.id} className={`rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 p-5 shadow-sm hover:shadow-md transition-all ${isSelected ? 'ring-2 ring-emerald-500 ring-offset-2' : ''}`}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 h-10 w-10">
                        {app.partner?.picture ? (
                          <img
                            className="h-10 w-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                            src={app.partner.picture}
                            alt={app.partner.name || 'Partner'}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                const fallback = document.createElement('div');
                                fallback.className = `h-10 w-10 rounded-full ${getAvatarColor(app.partner?.name)} flex items-center justify-center text-white font-bold text-sm border-2 border-gray-200 dark:border-gray-600`;
                                fallback.textContent = getInitials(app.partner?.name);
                                parent.appendChild(fallback);
                              }
                            }}
                          />
                        ) : (
                          <div className={`h-10 w-10 rounded-full ${getAvatarColor(app.partner?.name)} flex items-center justify-center text-white font-bold text-sm border-2 border-gray-200 dark:border-gray-600`}>
                            {getInitials(app.partner?.name)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{app.partner?.name || "Unknown Creator"}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{app.partner?.email || "—"}</p>
                      </div>
                    </div>
                    {isPending && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(app.id, app.status)}
                        className="h-4 w-4 accent-emerald-600 mt-1"
                      />
                    )}
                  </div>

                  <div className="mb-3">
                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Campaign</p>
                    <p className="text-sm text-slate-900 dark:text-white truncate">{app.campaign?.title || "—"}</p>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs text-slate-400 dark:text-slate-500">Applied</p>
                      <p className="text-xs text-slate-700 dark:text-slate-300">{app.createdAt ? fmtDate(app.createdAt) : "—"}</p>
                    </div>
                    <StatusBadge status={app.status} />
                  </div>

                  {isPending && (
                    <div className="flex gap-2 pt-3 border-t border-slate-200 dark:border-white/8">
                      <button
                        onClick={() => handleAction(app.id, "APPROVED")}
                        disabled={actionLoading === app.id}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-green-100 dark:bg-green-500/15 border border-green-300 dark:border-green-500/25 text-green-700 dark:text-green-300 text-xs font-semibold hover:bg-green-200 dark:hover:bg-green-500/25 disabled:opacity-50 transition-all"
                      >
                        {actionLoading === app.id ? <FaSpinner className="animate-spin h-3 w-3" /> : <FaCheckCircle className="h-3 w-3" />}
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(app.id, "REJECTED")}
                        disabled={actionLoading === app.id}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-100 dark:bg-red-500/15 border border-red-300 dark:border-red-500/25 text-red-700 dark:text-red-300 text-xs font-semibold hover:bg-red-200 dark:hover:bg-red-500/25 disabled:opacity-50 transition-all"
                      >
                        <FaTimesCircle className="h-3 w-3" />
                        Decline
                      </button>
                    </div>
                  )}
                </div>
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

      {/* Bulk approve confirm */}
      {showBulkApproveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" onClick={() => setShowBulkApproveConfirm(false)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-2xl">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Approve selected applications?</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              This will approve <span className="font-semibold">{selectedApplications.size}</span> pending application(s).
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowBulkApproveConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={async () => { setShowBulkApproveConfirm(false); await bulkApprove(); }}
                disabled={selectedApplications.size === 0 || isBulkApproving}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-all"
              >
                {isBulkApproving ? <FaSpinner className="animate-spin h-3.5 w-3.5" /> : <FaCheckCircle className="h-3.5 w-3.5" />}
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk reject confirm */}
      {showBulkRejectConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" onClick={() => setShowBulkRejectConfirm(false)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-red-200 dark:border-red-500/20 bg-white dark:bg-slate-900 p-6 shadow-2xl">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Reject selected applications?</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              This will reject <span className="font-semibold">{selectedApplications.size}</span> pending application(s).
            </p>
            <textarea
              value={bulkRejectReason}
              onChange={(e) => setBulkRejectReason(e.target.value)}
              rows={3}
              placeholder="Optional rejection reason (sent to creator if supported)…"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-red-400 dark:focus:border-red-400/50 focus:ring-2 focus:ring-red-400/15 resize-none mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowBulkRejectConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={async () => { setShowBulkRejectConfirm(false); await bulkReject(); }}
                disabled={selectedApplications.size === 0 || isBulkRejecting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-all"
              >
                {isBulkRejecting ? <FaSpinner className="animate-spin h-3.5 w-3.5" /> : <FaTimesCircle className="h-3.5 w-3.5" />}
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminApplicationsPage;
