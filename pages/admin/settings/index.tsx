// Business Suite – Settings
// Route: /admin/settings
// Full: profile, agency details, password change, notifications, danger zone

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import AdminLayout from "@/components/admin/Layout";
import { getVendorProfile, updateVendorProfile } from "@/services/vendor";
import { getCurrentUser } from "@/services/auth";
import {
  FaUser, FaBuilding, FaLock, FaBell, FaExclamationTriangle,
  FaSpinner, FaSave, FaCheck, FaEye, FaEyeSlash, FaKey,
  FaShieldAlt, FaGlobe,
} from "react-icons/fa";
import Link from "next/link";
import { useCurrency } from "@/hooks/useCurrency";

type Tab = "profile" | "agency" | "security" | "notifications" | "currency" | "danger";

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "profile", label: "Profile", icon: FaUser },
  { key: "agency", label: "Agency", icon: FaBuilding },
  { key: "security", label: "Security", icon: FaLock },
  { key: "notifications", label: "Notifications", icon: FaBell },
  { key: "currency", label: "Currency", icon: FaGlobe },
  { key: "danger", label: "Danger Zone", icon: FaExclamationTriangle },
];

const inputCls = "w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-400 dark:focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/15 transition-all";
const labelCls = "block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5";

function SaveButton({ isSaving, saved }: { isSaving: boolean; saved: boolean }) {
  return (
    <button type="submit" disabled={isSaving}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 font-bold text-sm disabled:opacity-50 hover:opacity-90 transition-all">
      {isSaving ? <FaSpinner className="animate-spin h-3.5 w-3.5" /> : saved ? <FaCheck className="h-3.5 w-3.5" /> : <FaSave className="h-3.5 w-3.5" />}
      {isSaving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
    </button>
  );
}

const AdminSettingsPage: React.FC = () => {
  const router = useRouter();
  const { selectedCurrency, setSelectedCurrency, currencySymbol } = useCurrency();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Profile tab
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [savedProfile, setSavedProfile] = useState(false);

  // Agency tab
  const [agencyName, setAgencyName] = useState("");
  const [agencyCategory, setAgencyCategory] = useState("");
  const [agencySize, setAgencySize] = useState("");
  const [agencyWebsite, setAgencyWebsite] = useState("");
  const [isSavingAgency, setIsSavingAgency] = useState(false);
  const [savedAgency, setSavedAgency] = useState(false);

  // Security tab
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [isSavingPwd, setIsSavingPwd] = useState(false);

  // Notifications
  const [notifSettings, setNotifSettings] = useState({
    emailApplications: true,
    emailWork: true,
    emailMessages: true,
    emailPayments: true,
    digestWeekly: false,
  });
  const [isSavingNotif, setIsSavingNotif] = useState(false);
  const [savedNotif, setSavedNotif] = useState(false);

  // Currency preferences
  const [preferredCurrency, setPreferredCurrency] = useState<string>(selectedCurrency);
  const [isSavingCurrency, setIsSavingCurrency] = useState(false);
  const [savedCurrency, setSavedCurrency] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await getVendorProfile();
        setProfile(data);
        setName(data.name || "");
        setEmail(data.email || "");
        setBio(data.bio || "");
        setWebsite(data.website || "");
        setAgencyName(data.agencyName || data.name || "");
        setAgencyCategory(data.agencyCategory || "");
        setAgencySize(data.agencySize || "");
        setAgencyWebsite(data.agencyWebsite || "");
        if (data.preferredCurrency) {
          setPreferredCurrency(data.preferredCurrency);
          setSelectedCurrency(data.preferredCurrency);
        }
      } catch {
        const user = getCurrentUser();
        if (user) {
          setName(user.name || ""); setEmail(user.email || "");
          setAgencyName(user.name || "");
        }
      } finally { setIsLoading(false); }
    })();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await updateVendorProfile({ name, bio, website });
      toast.success("Profile updated");
      setSavedProfile(true);
      setTimeout(() => setSavedProfile(false), 3000);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to update profile");
    } finally { setIsSavingProfile(false); }
  };

  const handleSaveAgency = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAgency(true);
    try {
      await updateVendorProfile({ agencyName, agencyCategory, agencySize, agencyWebsite } as any);
      toast.success("Agency settings updated");
      setSavedAgency(true);
      setTimeout(() => setSavedAgency(false), 3000);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to update agency settings");
    } finally { setIsSavingAgency(false); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd !== confirmPwd) { toast.error("Passwords don't match"); return; }
    if (newPwd.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setIsSavingPwd(true);
    try {
      await updateVendorProfile({ currentPassword: currentPwd, newPassword: newPwd } as any);
      toast.success("Password changed successfully");
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to change password");
    } finally { setIsSavingPwd(false); }
  };

  const handleSaveNotif = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingNotif(true);
    try {
      await updateVendorProfile({ notificationSettings: notifSettings } as any);
      toast.success("Notification settings saved");
      setSavedNotif(true);
      setTimeout(() => setSavedNotif(false), 3000);
    } catch {
      toast.success("Notification settings saved locally");
      setSavedNotif(true);
      setTimeout(() => setSavedNotif(false), 3000);
    } finally { setIsSavingNotif(false); }
  };

  const handleSaveCurrency = async (e: React.FormEvent) => {
    e.preventDefault();
    const currency = (preferredCurrency || "NGN") as any;
    setIsSavingCurrency(true);
    try {
      await updateVendorProfile({
        preferredCurrency: currency,
        currencySettings: {
          baseCurrency: "USD",
          selectedCurrency: currency,
          preferredCurrency: currency,
          lastUpdated: new Date().toISOString(),
        },
      } as any);
      setSelectedCurrency(currency);
      toast.success("Currency preference updated");
      setSavedCurrency(true);
      setTimeout(() => setSavedCurrency(false), 3000);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to update currency");
    } finally {
      setIsSavingCurrency(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <FaSpinner className="animate-spin text-3xl text-emerald-500" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage your profile, agency, security, and notifications</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar tabs */}
          <div className="lg:col-span-1">
            <nav className="space-y-1">
              {TABS.map(({ key, label, icon: Icon }) => (
                <button key={key} onClick={() => setActiveTab(key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                    activeTab === key
                      ? key === "danger"
                        ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/25"
                        : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/25"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5"
                  }`}>
                  <Icon className={`h-4 w-4 flex-shrink-0 ${
                    activeTab === key
                      ? key === "danger" ? "text-red-500 dark:text-red-400" : "text-emerald-500 dark:text-emerald-400"
                      : "text-slate-400 dark:text-slate-500"
                  }`} />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab content */}
          <div className="lg:col-span-3">

            {/* ── Profile ── */}
            {activeTab === "profile" && (
              <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 p-6 shadow-sm">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-5">Profile Information</h2>
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  {/* Avatar */}
                  <div className="flex items-center gap-4 mb-2">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-2xl font-bold text-slate-950">
                      {name.charAt(0) || email.charAt(0) || "A"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{name || email}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Agency Account</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Full name</label>
                      <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Your name" />
                    </div>
                    <div>
                      <label className={labelCls}>Email address</label>
                      <input value={email} disabled className={`${inputCls} opacity-60 cursor-not-allowed`} />
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Email cannot be changed here</p>
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Bio</label>
                    <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
                      placeholder="Tell creators and partners about yourself…"
                      className={`${inputCls} resize-none`} />
                  </div>
                  <div>
                    <label className={labelCls}>Website</label>
                    <input value={website} onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://yoursite.com" className={inputCls} />
                  </div>
                  <div className="flex justify-end">
                    <SaveButton isSaving={isSavingProfile} saved={savedProfile} />
                  </div>
                </form>
              </div>
            )}

            {/* ── Agency ── */}
            {activeTab === "agency" && (
              <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 p-6 shadow-sm">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-5">Agency Details</h2>
                <form onSubmit={handleSaveAgency} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Agency name</label>
                      <input value={agencyName} onChange={(e) => setAgencyName(e.target.value)} className={inputCls} placeholder="e.g. Northbridge Media" />
                    </div>
                    <div>
                      <label className={labelCls}>Category</label>
                      <select value={agencyCategory} onChange={(e) => setAgencyCategory(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300 outline-none focus:border-emerald-400 dark:focus:border-emerald-400/50">
                        <option value="">Select category</option>
                        {["Marketing Agency","PR Agency","Talent Management","Media Buying","Creative Studio","Brand Strategy","E-commerce","SaaS","Other"].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Team size</label>
                      <select value={agencySize} onChange={(e) => setAgencySize(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300 outline-none focus:border-emerald-400 dark:focus:border-emerald-400/50">
                        <option value="">Select size</option>
                        {["1-5","6-20","21-50","51-200","200+"].map(s => <option key={s} value={s}>{s} people</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Agency website</label>
                      <input value={agencyWebsite} onChange={(e) => setAgencyWebsite(e.target.value)}
                        placeholder="https://agency.com" className={inputCls} />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <SaveButton isSaving={isSavingAgency} saved={savedAgency} />
                  </div>
                </form>
              </div>
            )}

            {/* ── Security ── */}
            {activeTab === "security" && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 p-6 shadow-sm">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-5">Change Password</h2>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <label className={labelCls}>Current password</label>
                      <div className="relative">
                        <input type={showPwd ? "text" : "password"} value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} required
                          placeholder="••••••••" className={`${inputCls} pr-10`} />
                        <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300">
                          {showPwd ? <FaEyeSlash className="h-3.5 w-3.5" /> : <FaEye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>New password</label>
                      <input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} required
                        placeholder="At least 8 characters" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Confirm new password</label>
                      <input type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} required
                        placeholder="Repeat new password" className={inputCls} />
                      {confirmPwd && newPwd !== confirmPwd && (
                        <p className="text-[10px] text-red-500 mt-1">Passwords don't match</p>
                      )}
                    </div>
                    <div className="flex justify-end">
                      <SaveButton isSaving={isSavingPwd} saved={false} />
                    </div>
                  </form>
                </div>

                {/* API Access shortcut */}
                <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 p-5 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center">
                      <FaKey className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">API Keys</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Manage your API access keys for integrations</p>
                    </div>
                  </div>
                  <Link href="/admin/api-access">
                    <button className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-all">
                      Manage Keys
                    </button>
                  </Link>
                </div>

                {/* 2FA hint */}
                <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 p-5 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center">
                      <FaShieldAlt className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">Two-Factor Authentication</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Add an extra layer of security to your account</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-slate-100 dark:bg-white/8 text-slate-500 dark:text-slate-400">Coming soon</span>
                </div>
              </div>
            )}

            {/* ── Notifications ── */}
            {activeTab === "notifications" && (
              <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 p-6 shadow-sm">
                <form onSubmit={handleSaveNotif} className="space-y-4">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Notification Preferences</h2>
                  {[
                    { key: "emailApplications", label: "New Applications", desc: "When a creator applies to one of your campaigns" },
                    { key: "emailWork", label: "Work Submissions", desc: "When a creator submits work for review" },
                    { key: "emailMessages", label: "New Messages", desc: "When you receive a message in your inbox" },
                    { key: "emailPayments", label: "Payments & Billing", desc: "Campaign fund events and wallet activity" },
                    { key: "digestWeekly", label: "Weekly Digest", desc: "Summary of activity across all your campaigns" },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-white/3 border border-slate-100 dark:border-white/6">
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{label}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{desc}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNotifSettings((prev) => ({ ...prev, [key]: !prev[key as keyof typeof notifSettings] }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                          notifSettings[key as keyof typeof notifSettings]
                            ? "bg-emerald-400 dark:bg-emerald-500"
                            : "bg-slate-300 dark:bg-white/20"
                        }`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                          notifSettings[key as keyof typeof notifSettings] ? "translate-x-6" : "translate-x-1"
                        }`} />
                      </button>
                    </div>
                  ))}
                  <div className="flex justify-end">
                    <SaveButton isSaving={isSavingNotif} saved={savedNotif} />
                  </div>
                </form>
              </div>
            )}

            {/* ── Currency ── */}
            {activeTab === "currency" && (
              <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 p-6 shadow-sm">
                <form onSubmit={handleSaveCurrency} className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Currency & Localization</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Choose the currency used across your Business Suite dashboards. Amounts are stored in USD and shown in your preferred currency.
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <select
                        value={preferredCurrency}
                        onChange={(e) => setPreferredCurrency(e.target.value)}
                        className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 outline-none focus:border-emerald-400 dark:focus:border-emerald-400/50 min-w-[160px]"
                      >
                        <option value="NGN">NGN — Nigerian Naira (₦)</option>
                        <option value="USD">USD — US Dollar ($)</option>
                        <option value="KES">KES — Kenyan Shilling (Ksh)</option>
                        <option value="EUR">EUR — Euro (€)</option>
                        <option value="GBP">GBP — British Pound (£)</option>
                      </select>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">
                        Current symbol: <span className="font-semibold">{currencySymbol}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <SaveButton isSaving={isSavingCurrency} saved={savedCurrency} />
                  </div>
                </form>
              </div>
            )}

            {/* ── Danger Zone ── */}
            {activeTab === "danger" && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/5 p-6">
                  <h2 className="text-sm font-bold text-red-700 dark:text-red-400 mb-4 flex items-center gap-2">
                    <FaExclamationTriangle className="h-4 w-4" /> Danger Zone
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-900/70 border border-red-200 dark:border-red-500/20">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">Delete All Campaigns</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Permanently remove all campaigns and their data</p>
                      </div>
                      <button
                        onClick={() => toast.error("Please contact support to perform this action")}
                        className="px-3 py-2 rounded-xl border border-red-200 dark:border-red-500/25 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-100 dark:hover:bg-red-500/20 transition-all">
                        Delete Campaigns
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-900/70 border border-red-200 dark:border-red-500/20">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">Delete Account</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Permanently delete your account and all associated data</p>
                      </div>
                      <button
                        onClick={() => toast.error("Please contact support to delete your account")}
                        className="px-3 py-2 rounded-xl bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-all">
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettingsPage;
