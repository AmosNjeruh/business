// Business Suite – Partners Management
// Route: /admin/partners
// Full: browse, search/filter by niche, invite to Trend360, curate for campaigns, view profiles

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import AdminLayout from "@/components/admin/Layout";
import { getPartners, getInfluencers, inviteInfluencer, getCampaigns, getCategories } from "@/services/vendor";
import {
  FaUsers, FaSearch, FaSpinner, FaStar, FaUserPlus, FaBullhorn,
  FaEnvelope, FaTimes, FaGlobe, FaInstagram, FaYoutube, FaCheck,
  FaChevronRight, FaFilter, FaList, FaTh, FaFacebookF, FaTwitter,
  FaTiktok, FaLinkedinIn, FaCrown, FaRocket, FaFire, FaMedal,
} from "react-icons/fa";

function getAvatarColor(name?: string | null) {
  const colors = ["bg-blue-500","bg-green-500","bg-purple-500","bg-pink-500","bg-indigo-500","bg-red-500","bg-teal-500","bg-orange-500"];
  if (!name) return colors[0];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}
function getInitials(name?: string | null) {
  if (!name) return "P";
  const p = name.trim().split(" ");
  return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : name.charAt(0).toUpperCase();
}
function fmtFollowers(n?: number) {
  if (!n) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function getSocialIcon(platform: string) {
  switch (platform?.toLowerCase()) {
    case 'facebook': return <FaFacebookF className="h-3.5 w-3.5" />;
    case 'instagram': return <FaInstagram className="h-3.5 w-3.5" />;
    case 'twitter':
    case 'x': return <FaTwitter className="h-3.5 w-3.5" />;
    case 'youtube': return <FaYoutube className="h-3.5 w-3.5" />;
    case 'tiktok': return <FaTiktok className="h-3.5 w-3.5" />;
    case 'linkedin': return <FaLinkedinIn className="h-3.5 w-3.5" />;
    default: return <FaGlobe className="h-3.5 w-3.5" />;
  }
}

function getPartnerScore(partner: any) {
  let score = 0;
  const accounts = partner.socialMediaAccounts || [];
  
  // Social media presence
  if (accounts.length > 0) score += 20;
  
  // Verified accounts
  const verifiedCount = accounts.filter((acc: any) => acc.verified)?.length || 0;
  score += verifiedCount * 10;
  
  // Total followers
  const totalFollowers = accounts.reduce((sum: number, acc: any) => sum + (acc.followers || 0), 0) || partner.totalFollowers || 0;
  if (totalFollowers > 100000) score += 25;
  else if (totalFollowers > 50000) score += 20;
  else if (totalFollowers > 10000) score += 15;
  else if (totalFollowers > 1000) score += 10;
  
  // Skills and niche
  if (partner.skills?.length > 0) score += 10;
  if (partner.niche || (partner.niches && partner.niches.length > 0)) score += 5;
  
  // Previous work
  if (partner.stats?.approvedApplications > 0 || partner.completedCampaigns > 0) score += 15;
  
  // Reviews
  if (partner.averageRating && partner.averageRating > 4.0) score += 15;
  
  return Math.min(score, 100);
}

function getPartnerTier(score: number) {
  if (score >= 80) return { name: 'Elite', iconName: 'crown', color: 'bg-gradient-to-r from-yellow-400 to-yellow-600' };
  if (score >= 60) return { name: 'Premium', iconName: 'rocket', color: 'bg-gradient-to-r from-purple-400 to-purple-600' };
  if (score >= 40) return { name: 'Rising', iconName: 'fire', color: 'bg-gradient-to-r from-orange-400 to-orange-600' };
  return { name: 'Emerging', iconName: 'medal', color: 'bg-gradient-to-r from-blue-400 to-blue-600' };
}

function renderTierIcon(tier: any) {
  switch (tier.iconName) {
    case 'crown': return <FaCrown className="h-3 w-3" />;
    case 'rocket': return <FaRocket className="h-3 w-3" />;
    case 'fire': return <FaFire className="h-3 w-3" />;
    case 'medal': return <FaMedal className="h-3 w-3" />;
    default: return <FaMedal className="h-3 w-3" />;
  }
}

// ── Bulk Invite Modal ──────────────────────────────────────────────────────────────
function BulkInviteModal({
  onClose,
  campaigns,
}: {
  onClose: () => void;
  campaigns: any[];
}) {
  const [emails, setEmails] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailList = emails.split("\n").map((e) => e.trim()).filter(Boolean);
    if (emailList.length === 0) return;
    setIsSending(true);
    try {
      // Send invites in parallel
      await Promise.all(
        emailList.map((email) =>
          inviteInfluencer({ email, campaignId: campaignId || undefined }).catch((err) => {
            console.error(`Failed to invite ${email}:`, err);
            return null;
          })
        )
      );
      toast.success(`Invitations sent to ${emailList.length} partners`);
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to send some invitations");
    } finally {
      setIsSending(false);
    }
  };

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-400 dark:focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/15";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
          <FaTimes className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/20 flex items-center justify-center">
            <FaUserPlus className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Bulk Invite Partners</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Invite multiple partners at once</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Email addresses (one per line) *
            </label>
            <textarea
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              required
              rows={8}
              placeholder="partner1@example.com&#10;partner2@example.com&#10;partner3@example.com"
              className={`${inputCls} resize-none font-mono text-xs`}
            />
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
              {emails.split("\n").filter((e) => e.trim()).length} email(s)
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Attach to Campaign (optional)</label>
            <select value={campaignId} onChange={(e) => setCampaignId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300 outline-none focus:border-emerald-400 dark:focus:border-emerald-400/50">
              <option value="">No campaign</option>
              {campaigns.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={isSending || !emails.trim()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 font-bold text-sm disabled:opacity-50">
              {isSending ? <FaSpinner className="animate-spin h-3.5 w-3.5" /> : <FaEnvelope className="h-3.5 w-3.5" />}
              {isSending ? "Sending…" : "Send Invitations"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Invite Modal ──────────────────────────────────────────────────────────────
function InviteModal({
  onClose,
  campaigns,
}: {
  onClose: () => void;
  campaigns: any[];
}) {
  const [email, setEmail] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsSending(true);
    try {
      await inviteInfluencer({ email, campaignId: campaignId || undefined });
      toast.success(`Invitation sent to ${email}`);
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to send invite");
    } finally {
      setIsSending(false);
    }
  };

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-400 dark:focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/15";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
          <FaTimes className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/20 flex items-center justify-center">
            <FaUserPlus className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Invite to Trend360</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Send a partner or creator invitation</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email address *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              placeholder="creator@example.com"
              className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Attach to Campaign (optional)</label>
            <select value={campaignId} onChange={(e) => setCampaignId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300 outline-none focus:border-emerald-400 dark:focus:border-emerald-400/50">
              <option value="">No campaign</option>
              {campaigns.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={isSending || !email.trim()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 font-bold text-sm disabled:opacity-50">
              {isSending ? <FaSpinner className="animate-spin h-3.5 w-3.5" /> : <FaEnvelope className="h-3.5 w-3.5" />}
              {isSending ? "Sending…" : "Send Invitation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Curate Modal ──────────────────────────────────────────────────────────────
function CurateModal({
  partner,
  campaigns,
  onClose,
}: {
  partner: any;
  campaigns: any[];
  onClose: () => void;
}) {
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleCurate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign) return;
    setIsSending(true);
    try {
      await inviteInfluencer({ email: partner.email, campaignId: selectedCampaign });
      toast.success(`${partner.name} invited to campaign`);
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to curate partner");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
          <FaTimes className="h-4 w-4" />
        </button>
        <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Curate {partner.name}</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">Invite them to one of your campaigns</p>
        <form onSubmit={handleCurate} className="space-y-4">
          <select value={selectedCampaign} onChange={(e) => setSelectedCampaign(e.target.value)} required
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300 outline-none focus:border-emerald-400 dark:focus:border-emerald-400/50">
            <option value="">Select a campaign…</option>
            {campaigns.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          <div className="flex gap-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={isSending || !selectedCampaign}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 font-bold text-sm disabled:opacity-50">
              {isSending ? <FaSpinner className="animate-spin h-3.5 w-3.5" /> : <FaBullhorn className="h-3.5 w-3.5" />}
              Curate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const AdminPartnersPage: React.FC = () => {
  const router = useRouter();
  const [partners, setPartners] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedNiche, setSelectedNiche] = useState("all");
  const [sortBy, setSortBy] = useState<"followers" | "rating" | "name">("followers");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showBulkInviteModal, setShowBulkInviteModal] = useState(false);
  const [curateTarget, setCurateTarget] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "cards">("cards");
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total?: number;
    totalPages?: number;
  }>({ page: 1, limit: 18 });
  
  // Get all niches from categories
  const allNiches = categories.flatMap((cat) => cat.niches || []).map((n: any) => n.name);
  
  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);
  
  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const data = await getCategories();
        setCategories(data || []);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
        // Fallback to empty array - page will still work
        setCategories([]);
      } finally {
        setIsLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  const fetchPartners = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: any = { page: pagination.page, limit: pagination.limit };
      if (debouncedSearch) params.search = debouncedSearch;
      if (selectedNiche !== "all") params.niche = selectedNiche;
      // Try both endpoints gracefully
      let result: any;
      try {
        result = await getInfluencers(params);
      } catch {
        result = await getPartners(params);
      }
      const list = result?.data || result || [];
      setPartners(list);
      if (result.pagination) {
        setPagination((p) => ({ ...p, ...result.pagination }));
      }
    } catch (err: any) {
      if (err?.response?.status === 401) { router.push("/admin/auth"); return; }
      setPartners([]);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, selectedNiche, pagination.page, pagination.limit, router]);

  useEffect(() => {
    getCampaigns({ limit: 100 }).then((r) => setCampaigns(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    setPagination((p) => ({ ...p, page: 1 }));
  }, [debouncedSearch, selectedNiche]);

  useEffect(() => { fetchPartners(); }, [fetchPartners]);

  // Calculate scores and tiers for partners
  const partnersWithScores = partners.map((partner) => {
    const score = getPartnerScore(partner);
    const tier = getPartnerTier(score);
    return { ...partner, score, tier };
  });

  const sorted = [...partnersWithScores].sort((a, b) => {
    if (sortBy === "followers") {
      const aFollowers = (a.socialMediaAccounts || []).reduce((sum: number, acc: any) => sum + (acc.followers || 0), 0) || a.totalFollowers || 0;
      const bFollowers = (b.socialMediaAccounts || []).reduce((sum: number, acc: any) => sum + (acc.followers || 0), 0) || b.totalFollowers || 0;
      return bFollowers - aFollowers;
    }
    if (sortBy === "rating") return (b.averageRating || 0) - (a.averageRating || 0);
    return (a.name || "").localeCompare(b.name || "");
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Partners</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Discover {partners.length > 0 ? `${partners.length}+ ` : ""}creators and partners — browse, curate, and invite to Trend360
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
            <button onClick={() => setShowBulkInviteModal(true)}
              className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 transition-all whitespace-nowrap">
              <FaUsers className="h-3.5 w-3.5" /> Bulk Invite
            </button>
            <button onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 text-slate-950 font-semibold text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/30 hover:opacity-90 transition-all whitespace-nowrap">
              <FaUserPlus className="h-3.5 w-3.5" /> Invite Partner
            </button>
          </div>
        </div>

        {/* Niche filter chips */}
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setSelectedNiche("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              selectedNiche === "all"
                ? "bg-emerald-100 dark:bg-emerald-500/20 border-emerald-400 dark:border-emerald-500/50 text-emerald-700 dark:text-emerald-300"
                : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}>
            All Niches
          </button>
          {isLoadingCategories ? (
            <div className="flex items-center gap-2 px-3 py-1.5">
              <FaSpinner className="animate-spin h-3 w-3 text-slate-400" />
              <span className="text-xs text-slate-400">Loading niches...</span>
            </div>
          ) : (
            allNiches.map((n) => (
              <button key={n} onClick={() => setSelectedNiche(n)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  selectedNiche === n
                    ? "bg-emerald-100 dark:bg-emerald-500/20 border-emerald-400 dark:border-emerald-500/50 text-emerald-700 dark:text-emerald-300"
                    : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}>
                {n}
              </button>
            ))
          )}
        </div>

        {/* Search + sort bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, niche, or email…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-400 dark:focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/15" />
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
              <FaFilter className="h-3 w-3 text-slate-400 dark:text-slate-500" />
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-sm text-slate-700 dark:text-slate-300 outline-none">
                <option value="followers">Most Followers</option>
                <option value="rating">Highest Rated</option>
                <option value="name">A-Z</option>
              </select>
            </div>
            <button onClick={() => { setPagination((p) => ({ ...p, page: 1 })); }}
              className="px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 text-sm font-medium hover:bg-emerald-100 dark:hover:bg-emerald-500/25 transition-colors">
              Refresh
            </button>
          </div>
        </div>

        {isLoading && partners.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <FaSpinner className="animate-spin text-3xl text-emerald-500" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 p-16 text-center">
            <FaUsers className="h-14 w-14 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-base font-semibold text-slate-900 dark:text-white mb-1">No partners found</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Try a different search or invite someone directly</p>
            <button onClick={() => setShowInviteModal(true)}
              className="bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 font-semibold text-sm px-5 py-2.5 rounded-xl">
              Invite a Creator
            </button>
          </div>
        ) : viewMode === "cards" ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {sorted.map((partner) => (
                <div key={partner.id}
                  className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 p-5 hover:border-emerald-400 dark:hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all group">
                  {/* Avatar + name */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`h-12 w-12 rounded-full flex-shrink-0 overflow-hidden border-2 border-white dark:border-slate-800 shadow-md ${!partner.picture ? getAvatarColor(partner.name) : ""}`}>
                      {partner.picture ? (
                        <img src={partner.picture} alt={partner.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-white font-bold text-sm">
                          {getInitials(partner.name)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors truncate">
                        {partner.name || "Creator"}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{partner.email}</p>
                    </div>
                    {partner.averageRating > 0 && (
                      <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 px-2 py-0.5 rounded-full flex-shrink-0">
                        <FaStar className="h-2.5 w-2.5 text-yellow-500" />
                        <span className="text-[10px] font-semibold text-yellow-700 dark:text-yellow-300">{partner.averageRating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  {/* Tier Badge */}
                  <div className="mb-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium text-white ${partner.tier.color}`}>
                      {renderTierIcon(partner.tier)}
                      <span>{partner.tier.name}</span>
                    </span>
                    <span className="ml-2 text-[10px] text-slate-500 dark:text-slate-400">Score: {partner.score}</span>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="rounded-xl bg-slate-50 dark:bg-white/3 border border-slate-100 dark:border-white/5 p-2 text-center">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {fmtFollowers(
                          (partner.socialMediaAccounts || []).reduce((sum: number, acc: any) => sum + (acc.followers || 0), 0) || partner.totalFollowers || 0
                        )}
                      </p>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">Followers</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 dark:bg-white/3 border border-slate-100 dark:border-white/5 p-2 text-center">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{partner.completedCampaigns || partner.totalCampaigns || partner.stats?.approvedApplications || 0}</p>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">Campaigns</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 dark:bg-white/3 border border-slate-100 dark:border-white/5 p-2 text-center">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {partner.engagementRate ? `${partner.engagementRate.toFixed(1)}%` : "—"}
                      </p>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">Engagement</p>
                    </div>
                  </div>

                  {/* Niche tags */}
                  {((partner.niches && Array.isArray(partner.niches) && partner.niches.length > 0) || partner.niche) && (
                    <div className="mb-4 flex flex-wrap gap-1.5">
                      {Array.isArray(partner.niches) && partner.niches.length > 0
                        ? partner.niches.slice(0, 2).map((n: string, idx: number) => (
                            <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-[10px] font-medium text-indigo-600 dark:text-indigo-400">
                              {n}
                            </span>
                          ))
                        : partner.niche && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-[10px] font-medium text-indigo-600 dark:text-indigo-400">
                              {partner.niche}
                            </span>
                          )}
                    </div>
                  )}

                  {/* Social Media Accounts */}
                  {partner.socialMediaAccounts && Array.isArray(partner.socialMediaAccounts) && partner.socialMediaAccounts.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-2 mb-4 pt-3 border-t border-slate-200 dark:border-white/8">
                      {partner.socialMediaAccounts.slice(0, 4).map((account: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-white/5 px-2 py-1 rounded-lg">
                          {getSocialIcon(account.platform)}
                          <span className="text-[10px] font-medium">{fmtFollowers(account.followers || 0)}</span>
                        </div>
                      ))}
                      {partner.socialMediaAccounts.length > 4 && (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-white/5 px-2 py-1 rounded-lg">
                          +{partner.socialMediaAccounts.length - 4}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mb-4 pt-3 border-t border-slate-200 dark:border-white/8">
                      {partner.instagramHandle && (
                        <a href={`https://instagram.com/${partner.instagramHandle}`} target="_blank" rel="noopener noreferrer"
                          className="text-slate-400 hover:text-pink-500 dark:hover:text-pink-400 transition-colors">
                          <FaInstagram className="h-4 w-4" />
                        </a>
                      )}
                      {partner.youtubeHandle && (
                        <a href={`https://youtube.com/${partner.youtubeHandle}`} target="_blank" rel="noopener noreferrer"
                          className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                          <FaYoutube className="h-4 w-4" />
                        </a>
                      )}
                      {partner.website && (
                        <a href={partner.website} target="_blank" rel="noopener noreferrer"
                          className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                          <FaGlobe className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t border-slate-200 dark:border-white/8">
                    <button
                      onClick={() => setCurateTarget(partner)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-emerald-200 dark:border-emerald-500/25 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all">
                      <FaBullhorn className="h-3 w-3" /> Curate
                    </button>
                    <Link href={`/admin/partners/${partner.id}`} className="flex-1">
                      <button className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-white/10 transition-all">
                        Profile <FaChevronRight className="h-2.5 w-2.5" />
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>

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
          </>
        ) : (
          <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-white/10">
                <thead className="bg-slate-50 dark:bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Partner</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Followers</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Campaigns</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rating</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Niche</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                  {sorted.map((partner) => (
                    <tr key={partner.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-full flex-shrink-0 overflow-hidden border-2 border-white dark:border-slate-800 ${!partner.picture ? getAvatarColor(partner.name) : ""}`}>
                            {partner.picture ? (
                              <img src={partner.picture} alt={partner.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-white font-bold text-sm">
                                {getInitials(partner.name)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{partner.name || "Creator"}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{partner.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900 dark:text-white">{fmtFollowers(partner.totalFollowers)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900 dark:text-white">{partner.completedCampaigns || partner.totalCampaigns || 0}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {partner.averageRating > 0 ? (
                          <div className="flex items-center gap-1">
                            <FaStar className="h-3 w-3 text-yellow-500" />
                            <span className="text-sm text-slate-900 dark:text-white">{partner.averageRating.toFixed(1)}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400 dark:text-slate-500">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {partner.niche ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-[10px] font-medium text-indigo-600 dark:text-indigo-400">
                            {partner.niche}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setCurateTarget(partner)}
                            className="px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-500/25 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all"
                          >
                            Curate
                          </button>
                          <Link href={`/admin/partners/${partner.id}`}>
                            <button className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-white/10 transition-all">
                              View
                            </button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {(pagination.totalPages || 0) > 1 && (
              <div className="bg-slate-50 dark:bg-white/5 px-4 py-3 flex items-center justify-between border-t border-slate-200 dark:border-white/10">
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
                    className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    disabled={!!pagination.totalPages && pagination.page >= (pagination.totalPages || 1)}
                    onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                    className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showInviteModal && (
        <InviteModal campaigns={campaigns} onClose={() => setShowInviteModal(false)} />
      )}

      {showBulkInviteModal && (
        <BulkInviteModal campaigns={campaigns} onClose={() => setShowBulkInviteModal(false)} />
      )}

      {curateTarget && (
        <CurateModal
          partner={curateTarget}
          campaigns={campaigns}
          onClose={() => setCurateTarget(null)}
        />
      )}
    </AdminLayout>
  );
};

export default AdminPartnersPage;
