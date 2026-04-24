// Business Suite – Partners Management
// Route: /admin/partners
// Full: browse, search/filter by niche, invite to Trend360, curate for campaigns, view profiles

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import AdminLayout from "@/components/admin/Layout";
import {
  BUSINESS_COPILOT_FILTER_EVENT,
  type CopilotPartnersFilterDetail,
} from "@/lib/businessAssistantNavigate";
import { getPartners, getInfluencers, inviteInfluencer, getCampaigns, getCategories, getFavoritePartners, addPartnerToFavorites, removePartnerFromFavorites, getBookmarkCategories, updateBookmarkCategory } from "@/services/vendor";
import {
  FaUsers, FaSearch, FaSpinner, FaStar, FaUserPlus, FaBullhorn,
  FaEnvelope, FaTimes, FaGlobe, FaInstagram, FaYoutube, FaCheck,
  FaChevronRight, FaFilter, FaList, FaTh, FaFacebookF, FaTwitter,
  FaTiktok, FaLinkedinIn, FaCrown, FaRocket, FaFire, FaMedal, FaBookmark,
  FaFolder, FaFolderOpen, FaEdit,
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

/**
 * Calculate overall engagement rate from social media accounts
 * Returns weighted average based on followers, or null if no engagement data available
 */
function getOverallEngagementRate(partner: any): number | null {
  const accounts = partner.socialMediaAccounts || [];
  if (!accounts || accounts.length === 0) return null;

  // Filter accounts that have engagementRate data
  const accountsWithEngagement = accounts.filter(
    (acc: any) => acc.engagementRate != null && typeof acc.engagementRate === 'number' && !isNaN(acc.engagementRate)
  );

  if (accountsWithEngagement.length === 0) return null;

  // Calculate weighted average based on followers
  let totalWeightedEngagement = 0;
  let totalFollowers = 0;

  accountsWithEngagement.forEach((acc: any) => {
    const followers = acc.followers || 0;
    const engagementRate = acc.engagementRate || 0;
    totalWeightedEngagement += engagementRate * followers;
    totalFollowers += followers;
  });

  if (totalFollowers === 0) return null;

  return totalWeightedEngagement / totalFollowers;
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

function getPartnerTotalFollowers(partner: any): number {
  const accounts = Array.isArray(partner?.socialMediaAccounts) ? partner.socialMediaAccounts : [];
  const fromAccounts = accounts.reduce((sum: number, acc: any) => sum + (acc?.followers || 0), 0);
  if (fromAccounts > 0) return fromAccounts;
  return Number(partner?.totalFollowers || 0);
}

function getPartnerCampaignCount(partner: any): number {
  return Number(
    partner?.completedCampaigns ||
      partner?.totalCampaigns ||
      partner?.stats?.approvedApplications ||
      0
  );
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-2xl">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-2xl">
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

// Helper function to extract country only for location filtering.
function extractCountryFromDemographicInfo(demographicInfo: any): string | null {
  if (!demographicInfo) return null;

  // Match FinalBoss users logic first: use explicit country field only.
  const explicitCountry = demographicInfo.country;
  if (typeof explicitCountry === 'string' && explicitCountry.trim()) {
    return explicitCountry.trim();
  }
  
  // If we have address components, use country directly.
  if (demographicInfo.addressComponents && Array.isArray(demographicInfo.addressComponents)) {
    let country = '';
    
    demographicInfo.addressComponents.forEach((component: any) => {
      const types = component.types || [];
      if (types.includes('country')) {
        country = component.long_name || '';
      }
    });
    
    if (country) return country;
  }
  
  // Do not infer from free-text location/address to avoid state/county noise.
  return null;
}

const AdminPartnersPage: React.FC = () => {
  const router = useRouter();
  const [partners, setPartners] = useState<any[]>([]);
  const [allPartners, setAllPartners] = useState<any[]>([]); // Store all fetched partners for client-side filtering
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  // Filter states
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [nicheFilter, setNicheFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [minFollowersFilter, setMinFollowersFilter] = useState<string>("");
  const [maxFollowersFilter, setMaxFollowersFilter] = useState<string>("");
  const [engagementFilter, setEngagementFilter] = useState<string>("all");
  
  const [sortBy, setSortBy] = useState<"followers" | "rating" | "name" | "relevance">("relevance");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showBulkInviteModal, setShowBulkInviteModal] = useState(false);
  const [curateTarget, setCurateTarget] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "cards">("cards");
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  const [availablePlatforms, setAvailablePlatforms] = useState<string[]>([]);
  const [showCuratedOnly, setShowCuratedOnly] = useState(false);
  const [curatedPartners, setCuratedPartners] = useState<Set<string>>(new Set());
  const [bookmarkCategories, setBookmarkCategories] = useState<any[]>([]);
  const [selectedBookmarkCategory, setSelectedBookmarkCategory] = useState<string>("all");
  const [editingCurate, setEditingCurate] = useState<{ partnerId: string; category: string | null } | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total?: number;
    totalPages?: number;
  }>({ page: 1, limit: 18 });
  
  // Get available niches for selected category
  const availableNiches = categoryFilter !== "all" 
    ? categories.find(cat => cat.name === categoryFilter)?.niches || []
    : [];
  
  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  /** AI copilot: apply filters immediately when the navigate tool fires. */
  useEffect(() => {
    const onCopilot = (ev: Event) => {
      const e = ev as CustomEvent<CopilotPartnersFilterDetail>;
      if (e.detail?.page !== "partners") return;
      if (e.detail.search) {
        const t = e.detail.search.trim();
        setSearch(t);
        setDebouncedSearch(t);
      }
      if (e.detail.category) setCategoryFilter(e.detail.category);
      if (e.detail.niche) setNicheFilter(e.detail.niche);
      if (e.detail.minFollowers) {
        const n = parseInt(e.detail.minFollowers, 10);
        if (!Number.isNaN(n) && n >= 0) setMinFollowersFilter(String(n));
      }
      if (e.detail.maxFollowers) {
        const n = parseInt(e.detail.maxFollowers, 10);
        if (!Number.isNaN(n) && n >= 0) setMaxFollowersFilter(String(n));
      }
      if (e.detail.platform) {
        const p = e.detail.platform.trim().toLowerCase();
        setPlatformFilter(p === "x" ? "twitter" : p);
      }
      if (e.detail.engagement) {
        const eng = e.detail.engagement.trim().toLowerCase();
        if (["all", "high", "medium", "low"].includes(eng)) {
          setEngagementFilter(eng);
        }
      }
      setPagination((p) => ({ ...p, page: 1 }));
    };
    window.addEventListener(
      BUSINESS_COPILOT_FILTER_EVENT,
      onCopilot as EventListener
    );
    return () =>
      window.removeEventListener(
        BUSINESS_COPILOT_FILTER_EVENT,
        onCopilot as EventListener
      );
  }, []);

  /** Deep links & copilot navigation: search, taxonomy, followers, platform, engagement — then strip from URL. */
  useEffect(() => {
    if (!router.isReady || router.pathname !== "/admin/partners") return;
    const q = router.query;
    const pick = (v: string | string[] | undefined): string => {
      if (typeof v === "string") return v.trim();
      if (Array.isArray(v) && v[0]) return String(v[0]).trim();
      return "";
    };
    const searchVal = pick(q.search) || pick(q.q);
    const nicheVal = pick(q.niche);
    const catVal = pick(q.category);
    const minFVal = pick(q.minFollowers);
    const maxFVal = pick(q.maxFollowers);
    const platformVal = pick(q.platform);
    const engagementVal = pick(q.engagement);
    if (
      !searchVal &&
      !nicheVal &&
      !catVal &&
      !minFVal &&
      !maxFVal &&
      !platformVal &&
      !engagementVal
    ) {
      return;
    }

    if (searchVal) {
      setSearch(searchVal);
      setDebouncedSearch(searchVal);
    }
    if (catVal) setCategoryFilter(catVal);
    if (nicheVal) setNicheFilter(nicheVal);
    if (minFVal) {
      const n = parseInt(minFVal, 10);
      if (!Number.isNaN(n) && n >= 0) setMinFollowersFilter(String(n));
    }
    if (maxFVal) {
      const n = parseInt(maxFVal, 10);
      if (!Number.isNaN(n) && n >= 0) setMaxFollowersFilter(String(n));
    }
    if (platformVal) {
      const p = platformVal.toLowerCase();
      setPlatformFilter(p === "x" ? "twitter" : p);
    }
    if (engagementVal) {
      const eng = engagementVal.toLowerCase();
      if (["all", "high", "medium", "low"].includes(eng)) {
        setEngagementFilter(eng);
      }
    }
    setPagination((p) => ({ ...p, page: 1 }));

    const nextQuery = { ...q };
    delete nextQuery.search;
    delete nextQuery.q;
    delete nextQuery.niche;
    delete nextQuery.category;
    delete nextQuery.minFollowers;
    delete nextQuery.maxFollowers;
    delete nextQuery.platform;
    delete nextQuery.engagement;

    void router.replace(
      { pathname: "/admin/partners", query: nextQuery },
      undefined,
      { shallow: true }
    );
  }, [
    router.isReady,
    router.pathname,
    router.replace,
    router.query.search,
    router.query.q,
    router.query.niche,
    router.query.category,
    router.query.minFollowers,
    router.query.maxFollowers,
    router.query.platform,
    router.query.engagement,
  ]);
  
  // Reset niche filter when category changes
  useEffect(() => {
    if (categoryFilter === "all") {
      setNicheFilter("all");
    }
  }, [categoryFilter]);
  
  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const data = await getCategories();
        setCategories(data || []);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
        setCategories([]);
      } finally {
        setIsLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // Load curated partners and bookmark categories
  useEffect(() => {
    const loadCuratedData = async () => {
      try {
        const [favoritesData, categoriesData] = await Promise.all([
          getFavoritePartners({ limit: 10000 }).catch(() => ({ data: [] })),
          getBookmarkCategories().catch(() => ({ categories: [], uncategorizedCount: 0 })),
        ]);
        
        const favoriteIds = new Set<string>((favoritesData.data || []).map((p: any) => p.id));
        setCuratedPartners(favoriteIds);
        setBookmarkCategories(categoriesData.categories || []);
      } catch (err) {
        console.error("Failed to load curated data:", err);
      }
    };
    loadCuratedData();
  }, []);

  const fetchPartners = useCallback(async () => {
    try {
      setIsLoading(true);
      // Fetch large dataset for client-side filtering
      const params: any = { page: 1, limit: 10000 };
      
      if (debouncedSearch) params.search = debouncedSearch;
      
      // Use category filter instead of niche for backend
      if (categoryFilter !== "all") {
        params.category = categoryFilter;
      }
      
      // If niche is selected, use it
      if (nicheFilter !== "all") {
        params.niche = nicheFilter;
      }
      
      // Backend follower filtering
      if (minFollowersFilter) {
        const parsed = parseInt(minFollowersFilter, 10);
        if (!Number.isNaN(parsed) && parsed >= 0) {
          params.minFollowers = parsed;
        }
      }
      if (maxFollowersFilter) {
        const parsed = parseInt(maxFollowersFilter, 10);
        if (!Number.isNaN(parsed) && parsed >= 0) {
          params.maxFollowers = parsed;
        }
      }
      
      // Try both endpoints gracefully
      let result: any;
      
      if (showCuratedOnly) {
        // Fetch curated partners
        const curatedParams: any = { page: 1, limit: 10000 };
        if (selectedBookmarkCategory !== "all") {
          curatedParams.category = selectedBookmarkCategory === "uncategorized" ? "uncategorized" : selectedBookmarkCategory;
        }
        result = await getFavoritePartners(curatedParams);
      } else {
        // Fetch regular partners
        try {
          result = await getInfluencers(params);
        } catch {
          result = await getPartners(params);
        }
      }
      
      let partnersData = result?.data || result || [];
      
      // When showing curated only, the API already returns only curated partners
      // No need to filter again
      
      setAllPartners(partnersData);
      
      // Extract available locations and platforms
      const locations = new Set<string>();
      const platforms = new Set<string>();
      
      partnersData.forEach((partner: any) => {
        const loc = extractCountryFromDemographicInfo(partner.demographicInfo);
        if (loc) locations.add(loc);
        
        if (Array.isArray(partner.socialMediaAccounts)) {
          partner.socialMediaAccounts.forEach((acc: any) => {
            if (acc?.platform) {
              platforms.add((acc.platform as string).toLowerCase());
            }
          });
        }
      });
      
      setAvailableLocations(Array.from(locations).sort());
      setAvailablePlatforms(Array.from(platforms).sort());
      
      // Apply client-side filters
      let filtered = partnersData;
      
      // Location filter
      if (locationFilter !== "all") {
        filtered = filtered.filter((partner: any) => {
          const loc = extractCountryFromDemographicInfo(partner.demographicInfo);
          return loc === locationFilter;
        });
      }
      
      // Platform filter
      if (platformFilter !== "all") {
        filtered = filtered.filter((partner: any) => {
          const accounts = partner.socialMediaAccounts || [];
          return accounts.some((acc: any) => 
            (acc?.platform as string)?.toLowerCase() === platformFilter.toLowerCase()
          );
        });
      }
      
      // Client-side follower filtering (additional to backend)
      if (minFollowersFilter || maxFollowersFilter) {
        filtered = filtered.filter((partner: any) => {
          const accounts = partner.socialMediaAccounts || [];
          const totalFollowers = accounts.reduce(
            (sum: number, acc: any) => sum + (acc?.followers || 0),
            0
          );
          
          if (minFollowersFilter) {
            const minParsed = parseInt(minFollowersFilter, 10);
            if (!Number.isNaN(minParsed) && totalFollowers < minParsed) {
              return false;
            }
          }
          if (maxFollowersFilter) {
            const maxParsed = parseInt(maxFollowersFilter, 10);
            if (!Number.isNaN(maxParsed) && totalFollowers > maxParsed) {
              return false;
            }
          }
          return true;
        });
      }
      
      // Engagement filter
      if (engagementFilter !== "all") {
        filtered = filtered.filter((partner: any) => {
          const engagementRate = getOverallEngagementRate(partner);
          if (engagementRate === null) return false;
          
          const threshold = engagementFilter === "high" ? 5 : engagementFilter === "medium" ? 2 : 0;
          return engagementRate >= threshold;
        });
      }
      
      // Niche filter (client-side by name)
      if (nicheFilter !== "all") {
        filtered = filtered.filter((partner: any) => {
          const partnerNiches: string[] = Array.isArray(partner.niches) ? partner.niches : [];
          return partnerNiches.includes(nicheFilter);
        });
      }
      
      // Calculate scores and tiers, and mark curated status
      const processed = filtered.map((partner: any) => {
        const score = getPartnerScore(partner);
        const tier = getPartnerTier(score);
        const isCurated = curatedPartners.has(partner.id);
        return { ...partner, score, tier, isCurated };
      });

      // Sort
      const sorted = [...processed].sort((a, b) => {
        if (sortBy === "relevance") {
          return b.score - a.score;
        }
    if (sortBy === "followers") {
      const aFollowers = (a.socialMediaAccounts || []).reduce((sum: number, acc: any) => sum + (acc.followers || 0), 0) || a.totalFollowers || 0;
      const bFollowers = (b.socialMediaAccounts || []).reduce((sum: number, acc: any) => sum + (acc.followers || 0), 0) || b.totalFollowers || 0;
      return bFollowers - aFollowers;
    }
    if (sortBy === "rating") return (b.averageRating || 0) - (a.averageRating || 0);
    return (a.name || "").localeCompare(b.name || "");
  });
      
      setPartners(sorted);
      
      // Update pagination
      const total = sorted.length;
      const totalPages = Math.max(1, Math.ceil(total / pagination.limit));
      const clampedPage = Math.min(pagination.page, totalPages);
      setPagination((p) => ({
        ...p,
        page: clampedPage,
        total,
        totalPages,
      }));
    } catch (err: any) {
      if (err?.response?.status === 401) { router.push("/admin/auth"); return; }
      setPartners([]);
      setAllPartners([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    debouncedSearch,
    categoryFilter,
    nicheFilter,
    locationFilter,
    platformFilter,
    minFollowersFilter,
    maxFollowersFilter,
    engagementFilter,
    sortBy,
    showCuratedOnly,
    selectedBookmarkCategory,
    curatedPartners,
    router,
  ]);

  useEffect(() => {
    getCampaigns({ limit: 100 }).then((r) => setCampaigns(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    setPagination((p) => ({ ...p, page: 1 }));
  }, [
    debouncedSearch,
    categoryFilter,
    nicheFilter,
    locationFilter,
    platformFilter,
    minFollowersFilter,
    maxFollowersFilter,
    engagementFilter,
    showCuratedOnly,
    selectedBookmarkCategory,
  ]);

  useEffect(() => { fetchPartners(); }, [fetchPartners]);

  // Curate handlers
  const handleCurate = async (partnerId: string, category?: string) => {
    try {
      await addPartnerToFavorites(partnerId, category);
      setCuratedPartners(prev => new Set(prev).add(partnerId));
      toast.success("Partner curated successfully");
      
      // Reload bookmark categories
      const categoriesData = await getBookmarkCategories().catch(() => ({ categories: [] }));
      setBookmarkCategories(categoriesData.categories || []);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to curate partner");
    }
  };

  const handleUncurate = async (partnerId: string) => {
    try {
      await removePartnerFromFavorites(partnerId);
      setCuratedPartners(prev => {
        const newSet = new Set(prev);
        newSet.delete(partnerId);
        return newSet;
      });
      toast.success("Partner removed from curated");
      
      // Reload bookmark categories
      const categoriesData = await getBookmarkCategories().catch(() => ({ categories: [] }));
      setBookmarkCategories(categoriesData.categories || []);
      
      if (showCuratedOnly) {
        fetchPartners();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to remove curated partner");
    }
  };

  const handleUpdateCurateCategory = async (partnerId: string, category: string | null) => {
    try {
      await updateBookmarkCategory(partnerId, category || undefined);
      toast.success("Curate category updated");
      
      // Reload bookmark categories
      const categoriesData = await getBookmarkCategories().catch(() => ({ categories: [] }));
      setBookmarkCategories(categoriesData.categories || []);
      
      // Reload partners if showing curated
      if (showCuratedOnly) {
        fetchPartners();
      }
      
      setEditingCurate(null);
      setNewCategoryName("");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to update category");
    }
  };

  // Client-side pagination
  const startIndex = (pagination.page - 1) * pagination.limit;
  const endIndex = Math.min(startIndex + pagination.limit, partners.length);
  const paginatedPartners = partners.slice(startIndex, endIndex);

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
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-white/8 rounded-xl p-1">
              <button
                onClick={() => setViewMode("table")}
                className={`px-2 sm:px-3 py-2 rounded-lg border text-xs sm:text-sm flex items-center gap-1 transition-colors ${
                  viewMode === "table"
                    ? "bg-emerald-500 text-white border-emerald-500"
                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10"
                }`}
                title="Table view"
              >
                <FaList className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                <span className="hidden sm:inline">Table</span>
              </button>
              <button
                onClick={() => setViewMode("cards")}
                className={`px-2 sm:px-3 py-2 rounded-lg border text-xs sm:text-sm flex items-center gap-1 transition-colors ${
                  viewMode === "cards"
                    ? "bg-emerald-500 text-white border-emerald-500"
                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10"
                }`}
                title="Card view"
              >
                <FaTh className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                <span className="hidden sm:inline">Cards</span>
              </button>
            </div>
            <button onClick={() => setShowBulkInviteModal(true)}
              className="flex items-center gap-1.5 sm:gap-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 transition-all whitespace-nowrap">
              <FaUsers className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="hidden sm:inline">Bulk Invite</span>
              <span className="sm:hidden">Bulk</span>
            </button>
            <button onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 text-slate-950 font-semibold text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl shadow-lg shadow-emerald-500/30 hover:opacity-90 transition-all whitespace-nowrap">
              <FaUserPlus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="hidden sm:inline">Invite Partner</span>
              <span className="sm:hidden">Invite</span>
            </button>
            <Link href="/admin/partners/curated"
              className="flex items-center gap-1.5 sm:gap-2 bg-purple-100 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-purple-700 dark:text-purple-300 font-semibold text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl hover:bg-purple-200 dark:hover:bg-purple-500/20 transition-all whitespace-nowrap">
              <FaBookmark className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="hidden sm:inline">Curated Partners</span>
              <span className="sm:hidden">Curated</span>
              {curatedPartners.size > 0 && (
                <span className="ml-0.5 sm:ml-1 px-1.5 sm:px-2 py-0.5 bg-purple-600 text-white rounded-full text-[10px] sm:text-xs font-bold">
                  {curatedPartners.size}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 p-4 sm:p-6 shadow-sm">
          {/* Search and Quick Filters */}
          <div className="flex flex-wrap gap-3 sm:gap-4 mb-4 sm:mb-6 items-end">
            <div className="relative min-w-0 w-full sm:flex-1 sm:min-w-[min(100%,18rem)]">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                placeholder="Search by name, niche, or email…"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-400 dark:focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/15"
              />
            </div>

            {/* Location Filter */}
            <div className="min-w-0 flex-1 basis-[10rem] sm:max-w-[14rem]">
              <select
                value={locationFilter}
                onChange={(e) => {
                  setLocationFilter(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm text-slate-700 dark:text-slate-300 outline-none focus:border-emerald-400 dark:focus:border-emerald-400/50"
              >
                <option value="all">All Countries</option>
                {availableLocations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="min-w-0 flex-1 basis-[10rem] sm:max-w-[14rem]">
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm text-slate-700 dark:text-slate-300 outline-none focus:border-emerald-400 dark:focus:border-emerald-400/50"
              >
                <option value="relevance">Sort by Relevance</option>
                <option value="followers">Sort by Followers</option>
                <option value="rating">Sort by Rating</option>
                <option value="name">Sort A-Z</option>
              </select>
            </div>
          </div>

          {/* Category Filters */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Filter by Categories</h3>
          {isLoadingCategories ? (
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <FaSpinner className="animate-spin h-4 w-4" />
                  <span className="text-sm">Loading categories...</span>
            </div>
          ) : (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setCategoryFilter("all");
                      setNicheFilter("all");
                      setPagination((p) => ({ ...p, page: 1 }));
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                      categoryFilter === "all"
                        ? "bg-emerald-500 text-white shadow-md"
                        : "bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
                    }`}
                  >
                    All Categories
              </button>
                  {categories.map(category => (
                    <button
                      key={category.id || category.name}
                      onClick={() => {
                        setCategoryFilter(category.name);
                        setNicheFilter("all");
                        setPagination((p) => ({ ...p, page: 1 }));
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                        categoryFilter === category.name
                          ? "bg-emerald-500 text-white shadow-md"
                          : "bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
          )}
        </div>

            {/* Niche Filter - Only show when a category is selected */}
            {categoryFilter !== "all" && availableNiches.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                  Filter by Niche ({categoryFilter})
                </h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setNicheFilter("all");
                      setPagination((p) => ({ ...p, page: 1 }));
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                      nicheFilter === "all"
                        ? "bg-purple-500 text-white shadow-md"
                        : "bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
                    }`}
                  >
                    All Niches
                  </button>
                  {availableNiches.map((niche: any) => (
                    <button
                      key={niche.id || niche.name}
                      onClick={() => {
                        setNicheFilter(niche.name);
                        setPagination((p) => ({ ...p, page: 1 }));
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                        nicheFilter === niche.name
                          ? "bg-purple-500 text-white shadow-md"
                          : "bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
                      }`}
                    >
                      {niche.name}
                    </button>
                  ))}
          </div>
              </div>
            )}

            {/* Audience Filters */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                Audience Filters
              </h3>
              <div className="flex flex-wrap gap-3">
                {/* Social platform */}
                <select
                  value={platformFilter}
                  onChange={(e) => {
                    setPlatformFilter(e.target.value);
                    setPagination((p) => ({ ...p, page: 1 }));
                  }}
                  className="px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300 text-sm"
                >
                  <option value="all">All Platforms</option>
                  <option value="instagram">Instagram</option>
                  <option value="tiktok">TikTok</option>
                  <option value="youtube">YouTube</option>
                  <option value="facebook">Facebook</option>
                  <option value="twitter">Twitter / X</option>
                  {availablePlatforms
                    .filter(p => !["instagram", "tiktok", "youtube", "facebook", "twitter", "x"].includes(p.toLowerCase()))
                    .map((p) => (
                      <option key={p} value={p}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </option>
                    ))}
              </select>

                {/* Min followers */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">Min followers</span>
                  <input
                    type="number"
                    value={minFollowersFilter}
                    onChange={(e) => {
                      setMinFollowersFilter(e.target.value);
                      setPagination((p) => ({ ...p, page: 1 }));
                    }}
                    placeholder="e.g. 10000"
                    className="w-full sm:w-28 px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-xs"
                  />
            </div>

                {/* Max followers */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">Max followers</span>
                  <input
                    type="number"
                    value={maxFollowersFilter}
                    onChange={(e) => {
                      setMaxFollowersFilter(e.target.value);
                      setPagination((p) => ({ ...p, page: 1 }));
                    }}
                    placeholder="e.g. 100000"
                    className="w-full sm:w-28 px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-xs"
                  />
                </div>

                {/* Engagement filter */}
                <select
                  value={engagementFilter}
                  onChange={(e) => {
                    setEngagementFilter(e.target.value);
                    setPagination((p) => ({ ...p, page: 1 }));
                  }}
                  className="px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300 text-sm"
                >
                  <option value="all">All Engagement</option>
                  <option value="high">High (5%+)</option>
                  <option value="medium">Medium (2-5%)</option>
                  <option value="low">Low (&lt;2%)</option>
                </select>
              </div>
            </div>

            {/* Curated Filter Toggle */}
            <div className="mt-4">
              <button
                onClick={() => {
                  setShowCuratedOnly(!showCuratedOnly);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                  showCuratedOnly
                    ? "bg-purple-500 text-white shadow-md"
                    : "bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
                }`}
              >
                <FaBookmark className={`h-4 w-4 ${showCuratedOnly ? "fill-current" : ""}`} />
                <span>Show Curated Only</span>
                {curatedPartners.size > 0 && (
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                    showCuratedOnly ? "bg-white text-purple-600" : "bg-purple-600 text-white"
                  }`}>
                    {curatedPartners.size}
                  </span>
                )}
              </button>
            </div>

            {/* Bookmark Category Filter - Only show when curated is active */}
            {showCuratedOnly && bookmarkCategories.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Filter by Curate Category</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setSelectedBookmarkCategory("all");
                      setPagination((p) => ({ ...p, page: 1 }));
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                      selectedBookmarkCategory === "all"
                        ? "bg-purple-500 text-white shadow-md"
                        : "bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
                    }`}
                  >
                    All Categories
                  </button>
                  <button
                    onClick={() => {
                      setSelectedBookmarkCategory("uncategorized");
                      setPagination((p) => ({ ...p, page: 1 }));
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                      selectedBookmarkCategory === "uncategorized"
                        ? "bg-slate-600 text-white shadow-md"
                        : "bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
                    }`}
                  >
                    Uncategorized
                  </button>
                  {bookmarkCategories.map((cat: any) => (
                    <button
                      key={cat.name}
                      onClick={() => {
                        setSelectedBookmarkCategory(cat.name);
                        setPagination((p) => ({ ...p, page: 1 }));
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                        selectedBookmarkCategory === cat.name
                          ? "bg-purple-500 text-white shadow-md"
                          : "bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
                      }`}
                    >
                      {cat.name} ({cat.count})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          <div>
            <span className="font-medium text-slate-900 dark:text-white">
              {partners.length} partner{partners.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        {isLoading && partners.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <FaSpinner className="animate-spin text-3xl text-emerald-500" />
          </div>
        ) : partners.length === 0 ? (
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
            <div className="bus-responsive-card-grid gap-4 sm:gap-5">
              {paginatedPartners.map((partner) => (
                <div key={partner.id}
                  className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 p-4 sm:p-5 hover:border-emerald-400 dark:hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all group">
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
                  {(() => {
                    const engagementRate = getOverallEngagementRate(partner);
                    const hasEngagement = engagementRate !== null;
                    
                    return (
                      <div className="bus-responsive-stat-grid gap-2 mb-4">
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
                        {hasEngagement && (
                    <div className="rounded-xl bg-slate-50 dark:bg-white/3 border border-slate-100 dark:border-white/5 p-2 text-center">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                              {engagementRate.toFixed(1)}%
                      </p>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">Engagement</p>
                    </div>
                        )}
                  </div>
                    );
                  })()}

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
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-200 dark:border-white/8">
                    <button
                      onClick={() => setCurateTarget(partner)}
                      className="flex-1 min-w-[100px] flex items-center justify-center gap-1.5 py-2 rounded-xl border border-emerald-200 dark:border-emerald-500/25 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all">
                      <FaBullhorn className="h-3 w-3" /> <span className="hidden sm:inline">Curate</span>
                    </button>
                    {curatedPartners.has(partner.id) ? (
                      <button
                        onClick={() => {
                          setEditingCurate({ partnerId: partner.id, category: (partner as any).bookmarkCategory || null });
                        }}
                        className="flex items-center justify-center gap-1.5 px-2 sm:px-3 py-2 rounded-xl border border-purple-200 dark:border-purple-500/25 bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 text-xs font-semibold hover:bg-purple-100 dark:hover:bg-purple-500/20 transition-all"
                        title="Manage curated"
                      >
                        <FaBookmark className="h-3 w-3 fill-current" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleCurate(partner.id)}
                        className="flex items-center justify-center gap-1.5 px-2 sm:px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
                        title="Add to curated"
                      >
                        <FaBookmark className="h-3 w-3" />
                      </button>
                    )}
                    <Link href={`/admin/partners/${partner.id}`} className="flex-1 min-w-[100px]">
                      <button className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-white/10 transition-all">
                        <span className="hidden sm:inline">Profile</span>
                        <span className="sm:hidden">View</span>
                        <FaChevronRight className="h-2.5 w-2.5" />
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {(pagination.totalPages || 0) > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 p-3 sm:p-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
                  Page <span className="font-semibold text-slate-900 dark:text-white">{pagination.page}</span> of{" "}
                  <span className="font-semibold text-slate-900 dark:text-white">{pagination.totalPages}</span>
                  {typeof pagination.total === "number" && (
                    <>
                      {" "}· <span className="font-semibold text-slate-900 dark:text-white">{pagination.total}</span> total
                    </>
                  )}
                </p>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
                    className="flex-1 sm:flex-none px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    disabled={!!pagination.totalPages && pagination.page >= (pagination.totalPages || 1)}
                    onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                    className="flex-1 sm:flex-none px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300 disabled:opacity-50"
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
                  {paginatedPartners.map((partner) => (
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
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                        {fmtFollowers(getPartnerTotalFollowers(partner))}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                        {getPartnerCampaignCount(partner)}
                      </td>
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
              <div className="bg-slate-50 dark:bg-white/5 px-3 sm:px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 dark:border-white/10">
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
                  Page <span className="font-semibold text-slate-900 dark:text-white">{pagination.page}</span> of{" "}
                  <span className="font-semibold text-slate-900 dark:text-white">{pagination.totalPages}</span>
                  {typeof pagination.total === "number" && (
                    <>
                      {" "}· <span className="font-semibold text-slate-900 dark:text-white">{pagination.total}</span> total
                    </>
                  )}
                </p>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
                    className="flex-1 sm:flex-none px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    disabled={!!pagination.totalPages && pagination.page >= (pagination.totalPages || 1)}
                    onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                    className="flex-1 sm:flex-none px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-50"
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

      {/* Edit Curate Category Modal */}
      {editingCurate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-6 max-w-md w-full shadow-xl border border-slate-200 dark:border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Manage Curated Partner
              </h3>
              <button
                onClick={() => {
                  setEditingCurate(null);
                  setNewCategoryName("");
                }}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <FaTimes className="h-4 w-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Category
                </label>
                <select
                  value={editingCurate.category || ""}
                  onChange={(e) => setEditingCurate({ ...editingCurate, category: e.target.value || null })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white"
                >
                  <option value="">No Category (Uncategorized)</option>
                  {bookmarkCategories.map((cat: any) => (
                    <option key={cat.name} value={cat.name}>
                      {cat.name} ({cat.count})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Or create new category
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Category name"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => {
                    const categoryToUse = newCategoryName.trim() || editingCurate.category || undefined;
                    handleUpdateCurateCategory(editingCurate.partnerId, categoryToUse || null);
                  }}
                  className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => handleUncurate(editingCurate.partnerId)}
                  className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                >
                  Remove
                </button>
                <button
                  onClick={() => {
                    setEditingCurate(null);
                    setNewCategoryName("");
                  }}
                  className="px-4 py-2 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminPartnersPage;
