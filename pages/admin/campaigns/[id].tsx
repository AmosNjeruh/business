// Business Suite – Campaign Detail
// Route: /admin/campaigns/[id]

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import toast from "react-hot-toast";
import AdminLayout from "@/components/admin/Layout";
import PostPreviewModal from "@/components/admin/PostPreviewModal";
import { getCampaign, getApplications, updateApplicationStatus, getWorkSubmissions, updateWorkSubmission } from "@/services/vendor";
import { useCurrency } from "@/hooks/useCurrency";
import {
  FaArrowLeft, FaSpinner, FaMoneyBillWave, FaCalendarAlt, FaUsers,
  FaCheckCircle, FaTimesCircle, FaClock, FaExclamationTriangle,
  FaBullhorn, FaFileAlt, FaChevronRight, FaEye, FaEdit,
} from "react-icons/fa";
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function daysLeft(endDate: string) {
  const end = new Date(endDate); end.setHours(23, 59, 59, 999);
  return Math.ceil((end.getTime() - Date.now()) / 86400000);
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE: "bg-green-500/15 text-green-300 border-green-500/20",
    PENDING: "bg-yellow-500/15 text-yellow-300 border-yellow-500/20",
    COMPLETED: "bg-blue-500/15 text-blue-300 border-blue-500/20",
    PAUSED: "bg-slate-500/15 text-slate-300 border-slate-500/20",
    APPROVED: "bg-green-500/15 text-green-300 border-green-500/20",
    REJECTED: "bg-red-500/15 text-red-300 border-red-500/20",
  };
  return <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${map[status] || map.PENDING}`}>{status}</span>;
}

type TabKey = "overview" | "applications" | "work" | "partners";

export default function CampaignDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { formatFromUSD } = useCurrency();
  const [campaign, setCampaign] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [workSubmissions, setWorkSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [previewSub, setPreviewSub] = useState<any>(null);

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
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: action } : a))
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

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

  const pending = applications.filter((a) => a.status === "PENDING");
  const approved = applications.filter((a) => a.status === "APPROVED");
  const rejected = applications.filter((a) => a.status === "REJECTED");

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
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{campaign.title}</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl">{campaign.description}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Link href={`/admin/campaigns/${id}/edit`}>
                <button className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/5 text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/10 transition-all">
                  <FaEdit className="h-3 w-3 inline mr-1.5" />
                  Edit Campaign
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard icon={FaMoneyBillWave} label="Total Budget" val={formatFromUSD(campaign.budget || 0)} color="green" />
          <KPICard icon={FaMoneyBillWave} label="Remaining" val={formatFromUSD(campaign.remainingBudget ?? campaign.budget ?? 0)} color="emerald" />
          <KPICard icon={FaUsers} label="Applications" val={applications.length} color="blue" />
          <KPICard icon={FaCheckCircle} label="Approved" val={approved.length} color="purple" />
        </div>

        {/* Budget bar */}
        <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Budget utilisation</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">{spentPct}% spent</span>
          </div>
          <div className="h-3 rounded-full bg-slate-200 dark:bg-white/8 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all"
              style={{ width: `${spentPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Spent: {formatFromUSD(spent)}</span>
            <span>Remaining: {formatFromUSD(campaign.remainingBudget ?? campaign.budget ?? 0)}</span>
          </div>
        </div>

        {/* Campaign details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Objective", val: campaign.objective?.replace("_", " ") },
            { label: "Start date", val: campaign.startDate ? fmtDate(campaign.startDate) : "—" },
            { label: "End date", val: campaign.endDate ? fmtDate(campaign.endDate) : "—" },
            { label: "Payment structure", val: campaign.paymentStructure || "—" },
            { label: "Pay per post", val: campaign.paymentPerInfluencer ? formatFromUSD(campaign.paymentPerInfluencer) : "—" },
            { label: "Visibility", val: campaign.isPublic ? "Public" : "Private" },
          ].map(({ label, val }) => (
            <div key={label} className="rounded-xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-white/3 p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{label}</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{val || "—"}</p>
            </div>
          ))}
        </div>

        {/* Tabs – Applications */}
        <div>
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-900/80 rounded-xl p-1 border border-slate-200 dark:border-white/8 w-fit mb-5">
            {(["overview", "applications", "work", "partners"] as TabKey[]).map((t) => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
                  activeTab === t
                    ? "bg-gradient-to-r from-emerald-400 to-cyan-400 dark:from-emerald-500/30 dark:to-cyan-500/20 text-slate-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}>
                {t === "work" ? "Work" : t}{" "}
                {t === "applications" ? `(${applications.length})` : ""}
                {t === "work" ? `(${workSubmissions.length})` : ""}
              </button>
            ))}
          </div>

          {activeTab === "overview" && (
            <div className="space-y-4">
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
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Pending", val: pending.length, color: "yellow" },
                  { label: "Approved", val: approved.length, color: "green" },
                  { label: "Rejected", val: rejected.length, color: "red" },
                ].map(({ label, val, color }) => (
                  <div key={label} className={`rounded-xl border p-4 text-center
                    ${color === "yellow" ? "border-yellow-200 dark:border-yellow-500/20 bg-yellow-50 dark:bg-yellow-500/5" : ""}
                    ${color === "green" ? "border-green-200 dark:border-green-500/20 bg-green-50 dark:bg-green-500/5" : ""}
                    ${color === "red" ? "border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/5" : ""}
                  `}>
                    <p className={`text-2xl font-bold text-slate-900 dark:text-white`}>{val}</p>
                    <p className={`text-xs mt-0.5 ${color === "yellow" ? "text-yellow-600 dark:text-yellow-400" : color === "green" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

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

        {previewSub && (
          <PostPreviewModal
            submission={{ ...previewSub, campaign }}
            onClose={() => setPreviewSub(null)}
            onApprove={["PENDING","PENDING_REVIEW"].includes(previewSub.status) ? () => handleWorkAction(previewSub.id, "APPROVED") : undefined}
            onReject={["PENDING","PENDING_REVIEW"].includes(previewSub.status) ? () => handleWorkAction(previewSub.id, "REJECTED") : undefined}
            actionLoading={actionLoading === previewSub.id}
          />
        )}
      </div>
    </AdminLayout>
  );
}

function KPICard({ icon: Icon, label, val, color }: { icon: React.ElementType; label: string; val: any; color: string }) {
  const c: Record<string, string> = {
    green: "border-green-200 dark:border-green-500/20 bg-green-50 dark:bg-green-500/5 text-green-600 dark:text-green-400",
    emerald: "border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400",
    blue: "border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/5 text-blue-600 dark:text-blue-400",
    purple: "border-purple-200 dark:border-purple-500/20 bg-purple-50 dark:bg-purple-500/5 text-purple-600 dark:text-purple-400",
  };
  return (
    <div className={`rounded-2xl border p-4 ${c[color]}`}>
      <p className="text-xs font-medium mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{val}</p>
      <Icon className={`h-4 w-4 mt-1`} />
    </div>
  );
}
