// Business Suite – Partner Profile Detail Page
// Route: /admin/partners/[id]
// Comprehensive partner profile view matching frontend quality

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';
import AdminLayout from '@/components/admin/Layout';
import { getPartner, inviteInfluencer, getCampaigns, getFavoritePartners, addPartnerToFavorites, removePartnerFromFavorites, getBookmarkCategories, updateBookmarkCategory } from '@/services/vendor';
import {
  FaArrowLeft,
  FaSpinner,
  FaStar,
  FaUsers,
  FaBullhorn,
  FaEnvelope,
  FaGlobe,
  FaInstagram,
  FaYoutube,
  FaTwitter,
  FaFacebookF,
  FaTiktok,
  FaLinkedinIn,
  FaMapMarkerAlt,
  FaVenusMars,
  FaCalendarAlt,
  FaCheckCircle,
  FaExternalLinkAlt,
  FaChevronDown,
  FaChevronUp,
  FaChartLine,
  FaMoneyBillWave,
  FaCrown,
  FaRocket,
  FaFire,
  FaMedal,
  FaTimes,
  FaBookmark,
  FaFolder,
} from 'react-icons/fa';

function getInitials(name?: string | null) {
  if (!name) return 'P';
  const p = name.trim().split(' ');
  return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : name.charAt(0).toUpperCase();
}

function formatFollowers(count: number | null | undefined): string {
  if (count == null || isNaN(count) || count < 0) return '0';
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

function getSocialIcon(platform: string) {
  switch (platform?.toLowerCase()) {
    case 'facebook':
      return <FaFacebookF className="h-4 w-4 text-blue-600" />;
    case 'instagram':
      return <FaInstagram className="h-4 w-4 text-pink-600" />;
    case 'twitter':
    case 'x':
      return <FaTwitter className="h-4 w-4 text-blue-400" />;
    case 'youtube':
      return <FaYoutube className="h-4 w-4 text-red-600" />;
    case 'tiktok':
      return <FaTiktok className="h-4 w-4 text-black dark:text-white" />;
    case 'linkedin':
      return <FaLinkedinIn className="h-4 w-4 text-blue-700" />;
    default:
      return <FaGlobe className="h-4 w-4 text-gray-600" />;
  }
}

function buildSocialProfileUrl(platform?: string, username?: string | null, url?: string | null) {
  const safePlatform = (platform || '').toLowerCase().trim();
  const rawUrl = (url || '').trim();
  const handle = (username || '').trim().replace(/^@/, '');

  if (rawUrl) {
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) return rawUrl;
    return `https://${rawUrl}`;
  }

  if (!handle) return null;

  switch (safePlatform) {
    case 'instagram':
      return `https://instagram.com/${handle}`;
    case 'twitter':
    case 'x':
      return `https://twitter.com/${handle}`;
    case 'facebook':
      return `https://facebook.com/${handle}`;
    case 'linkedin':
      return `https://www.linkedin.com/in/${handle}`;
    case 'youtube':
      return `https://www.youtube.com/${handle}`;
    case 'tiktok':
      return `https://www.tiktok.com/@${handle}`;
    default:
      return `https://${safePlatform || 'social'}.com/${handle}`;
  }
}

function generalizeLocation(demographics: any): string | null {
  if (!demographics) return null;

  if (demographics.addressComponents && Array.isArray(demographics.addressComponents)) {
    let city = '';
    let country = '';

    demographics.addressComponents.forEach((component: any) => {
      const types = component.types || [];
      if (types.includes('locality') || types.includes('administrative_area_level_2')) {
        city = component.long_name || '';
      }
      if (types.includes('country')) {
        country = component.long_name || '';
      }
    });

    if (city && country) return `${city}, ${country}`;
    if (city) return city;
    if (country) return country;
  }

  const location = demographics.location || demographics.address || '';
  if (!location) return null;

  const cleaned = location.replace(/^[A-Z0-9+]+,\s*/, '').replace(/^-?\d+\.?\d*,\s*-?\d+\.?\d*\s*,?\s*/, '');
  const parts = cleaned.split(',').map((p: string) => p.trim()).filter((p: string) => p);
  if (parts.length >= 2) {
    return `${parts[0]}, ${parts[parts.length - 1]}`;
  }

  return cleaned || null;
}

function getPartnerScore(partner: any) {
  let score = 0;
  const accounts = partner.socialMediaAccounts || [];

  if (accounts.length > 0) score += 20;
  const verifiedCount = accounts.filter((acc: any) => acc.verified)?.length || 0;
  score += verifiedCount * 10;

  const totalFollowers = accounts.reduce((sum: number, acc: any) => sum + (acc.followers || 0), 0) || partner.totalFollowers || 0;
  if (totalFollowers > 100000) score += 25;
  else if (totalFollowers > 50000) score += 20;
  else if (totalFollowers > 10000) score += 15;
  else if (totalFollowers > 1000) score += 10;

  if (partner.skills?.length > 0) score += 10;
  if (partner.niche || (partner.niches && partner.niches.length > 0)) score += 5;
  if (partner.stats?.approvedApplications > 0 || partner.completedCampaigns > 0) score += 15;
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
    case 'crown':
      return <FaCrown className="h-4 w-4 text-yellow-500" />;
    case 'rocket':
      return <FaRocket className="h-4 w-4 text-purple-500" />;
    case 'fire':
      return <FaFire className="h-4 w-4 text-orange-500" />;
    case 'medal':
    default:
      return <FaMedal className="h-4 w-4 text-blue-500" />;
  }
}

function renderStars(rating: number) {
  const rounded = Math.round(rating);
  return Array.from({ length: 5 }).map((_, i) => (
    <FaStar
      key={i}
      className={`h-4 w-4 ${i < rounded ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'}`}
    />
  ));
}

function formatDate(dateString: string | Date) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Calculate overall engagement rate from social media accounts
 * Returns weighted average based on followers, or null if no engagement data available
 */
function getEngagementRate(partner: any): number | null {
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

export default function PartnerProfilePage() {
  const router = useRouter();
  const { id } = router.query;
  const [partner, setPartner] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [showCurate, setShowCurate] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [isCurating, setIsCurating] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isCurated, setIsCurated] = useState(false);
  const [curateCategory, setCurateCategory] = useState<string | null>(null);
  const [bookmarkCategories, setBookmarkCategories] = useState<any[]>([]);
  const [showCurateCategoryModal, setShowCurateCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isTogglingCurate, setIsTogglingCurate] = useState(false);

  useEffect(() => {
    if (!id || typeof id !== 'string') return;
    (async () => {
      try {
        setIsLoading(true);
        const [p, c, favoritesData, categoriesData] = await Promise.all([
          getPartner(id),
          getCampaigns({ limit: 100 }),
          getFavoritePartners({ limit: 10000 }).catch(() => ({ data: [] })),
          getBookmarkCategories().catch(() => ({ categories: [] })),
        ]);
        setPartner(p);
        setCampaigns(c.data || []);
        setBookmarkCategories(categoriesData.categories || []);
        
        // Check if partner is curated
        const favorite = (favoritesData.data || []).find((fav: any) => fav.id === id);
        if (favorite) {
          setIsCurated(true);
          setCurateCategory(favorite.bookmarkCategory || null);
        }
      } catch (err: any) {
        toast.error('Failed to load partner profile');
        router.push('/admin/partners');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id, router]);

  const handleCurate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign || !partner) return;
    setIsCurating(true);
    try {
      await inviteInfluencer({ email: partner.email, campaignId: selectedCampaign });
      toast.success(`${partner.name} invited to campaign`);
      setShowCurate(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to curate');
    } finally {
      setIsCurating(false);
    }
  };

  const handleToggleCurate = async (category?: string) => {
    if (!partner || !id || typeof id !== 'string') return;
    
    setIsTogglingCurate(true);
    try {
      if (isCurated) {
        await removePartnerFromFavorites(id);
        setIsCurated(false);
        setCurateCategory(null);
        toast.success('Partner removed from curated');
      } else {
        await addPartnerToFavorites(id, category);
        setIsCurated(true);
        setCurateCategory(category || null);
        toast.success('Partner added to curated');
      }
      
      // Reload bookmark categories
      const categoriesData = await getBookmarkCategories().catch(() => ({ categories: [] }));
      setBookmarkCategories(categoriesData.categories || []);
      
      setShowCurateCategoryModal(false);
      setNewCategoryName('');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to update curated status');
    } finally {
      setIsTogglingCurate(false);
    }
  };

  const handleUpdateCurateCategory = async (category?: string) => {
    if (!partner || !id || typeof id !== 'string') return;
    
    setIsTogglingCurate(true);
    try {
      const categoryToUse = newCategoryName.trim() || category || undefined;
      await updateBookmarkCategory(id, categoryToUse);
      setCurateCategory(categoryToUse || null);
      toast.success('Curate category updated');
      
      // Reload bookmark categories
      const categoriesData = await getBookmarkCategories().catch(() => ({ categories: [] }));
      setBookmarkCategories(categoriesData.categories || []);
      
      setShowCurateCategoryModal(false);
      setNewCategoryName('');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to update category');
    } finally {
      setIsTogglingCurate(false);
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

  if (!partner) return null;

  const score = getPartnerScore(partner);
  const tier = getPartnerTier(score);
  const stats = partner.stats || {
    totalApplications: 0,
    approvedApplications: 0,
    totalClicks: 0,
    totalConversions: 0,
    totalEarned: 0,
  };

  const totalFollowers = (partner.socialMediaAccounts || []).reduce(
    (sum: number, acc: any) => sum + (acc.followers || 0),
    0
  ) || partner.totalFollowers || 0;

  return (
    <AdminLayout>
      <div className="min-h-screen p-2 sm:p-4 lg:p-6">
        <div className="w-full lg:max-w-5xl mx-auto space-y-4 sm:space-y-6">
          {/* Back Button */}
          <button
            onClick={() => router.push('/admin/partners')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-2"
          >
            <FaArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Back to Partners</span>
          </button>

          {/* Header */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Profile Section */}
              <div className="flex items-start gap-4 flex-1">
                {partner.picture || partner.avatar ? (
                  <img
                    src={partner.picture || partner.avatar}
                    alt={partner.name || 'Partner'}
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-bold text-2xl border-2 border-gray-200 dark:border-gray-600">
                    {getInitials(partner.name)}
                  </div>
                )}

                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                        {partner.name || 'Unknown Partner'}
                      </h1>

                      {partner.averageRating > 0 && (
                        <div className="mt-2 flex items-center gap-3">
                          <div className="flex items-center">{renderStars(partner.averageRating)}</div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {partner.averageRating.toFixed(1)} {partner.totalReviews > 0 && `• ${partner.totalReviews} review${partner.totalReviews !== 1 ? 's' : ''}`}
                          </p>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 mt-3">
                        {partner.niche && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                            {partner.niche}
                          </span>
                        )}
                        {Array.isArray(partner.niches) &&
                          partner.niches.length > 0 &&
                          partner.niches.map((n: string, idx: number) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                            >
                              {n}
                            </span>
                          ))}
                        {(() => {
                          const engagementRate = getEngagementRate(partner);
                          return engagementRate !== null ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                              {engagementRate.toFixed(1)}% Engagement
                            </span>
                          ) : null;
                        })()}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${tier.color}`}>
                          {renderTierIcon(tier)}
                          <span className="ml-1">{tier.name} Creator</span>
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setShowCurate(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
                      >
                        <FaBullhorn className="h-4 w-4 mr-2" />
                        Curate for Campaign
                      </button>
                      <button
                        onClick={() => {
                          if (isCurated) {
                            setShowCurateCategoryModal(true);
                          } else {
                            setShowCurateCategoryModal(true);
                          }
                        }}
                        disabled={isTogglingCurate}
                        className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-lg transition-colors ${
                          isCurated
                            ? 'bg-purple-600 text-white hover:bg-purple-700 border-purple-600'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <FaBookmark className={`h-4 w-4 mr-2 ${isCurated ? 'fill-current' : ''}`} />
                        {isTogglingCurate ? 'Loading...' : isCurated ? (curateCategory ? `Curated (${curateCategory})` : 'Curated') : 'Add to Curated'}
                      </button>
                    </div>
                  </div>

                  {partner.tagline && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-3 italic">"{partner.tagline}"</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Key Performance Metrics */}
          <div className="bus-responsive-stat-grid gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center">
                <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-3 mr-4">
                  <FaUsers className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Success Rate</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {stats.totalApplications > 0 ? Math.round((stats.approvedApplications / stats.totalApplications) * 100) : 0}%
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center">
                <div className="rounded-full bg-green-100 dark:bg-green-900 p-3 mr-4">
                  <FaChartLine className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Avg Rating</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {partner.averageRating ? partner.averageRating.toFixed(1) : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center">
                <div className="rounded-full bg-purple-100 dark:bg-purple-900 p-3 mr-4">
                  <FaUsers className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Followers</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{formatFollowers(totalFollowers)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Business Value Proposition */}
          <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 dark:from-emerald-900/20 dark:to-cyan-900/20 rounded-xl p-6 border border-emerald-200 dark:border-emerald-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Why Work With This Creator?</h2>

            <div className="bus-responsive-card-grid gap-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-green-100 dark:bg-green-900 p-2 flex-shrink-0">
                  <FaCheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Proven Performance</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {stats.approvedApplications > 0
                      ? `${Math.round((stats.approvedApplications / stats.totalApplications) * 100)}% success rate on campaigns`
                      : 'New creator with high potential'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-2 flex-shrink-0">
                  <FaUsers className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Audience Match</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {(() => {
                      const location = generalizeLocation(partner.demographicInfo);
                      return location ? `Strong presence in ${location}` : 'Global reach with diverse audience';
                    })()}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-full bg-purple-100 dark:bg-purple-900 p-2 flex-shrink-0">
                  <FaStar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Quality Content</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {partner.averageRating && partner.averageRating >= 4.0
                      ? `${partner.averageRating.toFixed(1)} star average rating`
                      : 'Highly rated creator in their niche'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* About This Creator */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">About This Creator</h2>

            <div className="space-y-6">
              {partner.description || partner.bio ? (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  <div className="relative">
                    <p
                      className={`text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed ${
                        !showFullDescription && (partner.description || partner.bio || '').length > 300 ? 'line-clamp-4' : ''
                      }`}
                    >
                      {partner.description || partner.bio}
                    </p>

                    {(partner.description || partner.bio || '').length > 300 && (
                      <button
                        onClick={() => setShowFullDescription(!showFullDescription)}
                        className="inline-flex items-center mt-4 text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-medium transition-colors"
                      >
                        {showFullDescription ? (
                          <>
                            Show Less
                            <FaChevronUp className="h-3 w-3 ml-1" />
                          </>
                        ) : (
                          <>
                            Read More
                            <FaChevronDown className="h-3 w-3 ml-1" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700 border-dashed">
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center">No description provided yet.</p>
                </div>
              )}

              {Array.isArray(partner.skills) && partner.skills.length > 0 && (
                <div>
                  <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Expertise & Skills</h3>
                  <div className="flex flex-wrap gap-3">
                    {partner.skills.map((skill: string, idx: number) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-full bg-gradient-to-r from-emerald-100 to-emerald-200 dark:from-emerald-900 dark:to-emerald-800 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Audience & Reach */}
          <div className="bus-responsive-card-grid gap-6">
            {/* Audience Demographics */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Audience & Reach</h2>

                <div className="space-y-8">
                  {/* Social Media Reach Donut Chart */}
                  {partner.socialMediaAccounts && partner.socialMediaAccounts.length > 0 && (() => {
                    const colors = ['#8B5CF6', '#64748B', '#F59E0B', '#EF4444', '#10B981', '#3B82F6'];
                    const isSingleAccount = partner.socialMediaAccounts.length === 1;

                    return (
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-6 text-center">
                          Social Media Spread
                        </h3>
                        <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                          <div className="relative" style={{ width: '200px', height: '200px' }}>
                            <svg viewBox="0 0 200 200" className="transform -rotate-90 w-full h-full">
                              {isSingleAccount ? (
                                <circle cx="100" cy="100" r="65" fill="none" stroke={colors[0]} strokeWidth="30" className="transition-all" />
                              ) : (
                                partner.socialMediaAccounts.map((account: any, index: number) => {
                                  const percentage = (account.followers || 0) / totalFollowers;
                                  const startAngle = partner.socialMediaAccounts.slice(0, index).reduce((sum: number, acc: any) => {
                                    return sum + ((acc.followers || 0) / totalFollowers) * 360;
                                  }, 0);
                                  const angle = percentage * 360;
                                  const startRad = (startAngle - 90) * (Math.PI / 180);
                                  const endRad = (startAngle + angle - 90) * (Math.PI / 180);
                                  const largeArcFlag = angle > 180 ? 1 : 0;
                                  const x1 = 100 + 80 * Math.cos(startRad);
                                  const y1 = 100 + 80 * Math.sin(startRad);
                                  const x2 = 100 + 80 * Math.cos(endRad);
                                  const y2 = 100 + 80 * Math.sin(endRad);
                                  const innerX1 = 100 + 50 * Math.cos(startRad);
                                  const innerY1 = 100 + 50 * Math.sin(startRad);
                                  const innerX2 = 100 + 50 * Math.cos(endRad);
                                  const innerY2 = 100 + 50 * Math.sin(endRad);

                                  return (
                                    <path
                                      key={index}
                                      d={`M ${x1} ${y1} A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2} L ${innerX2} ${innerY2} A 50 50 0 ${largeArcFlag} 0 ${innerX1} ${innerY1} Z`}
                                      fill={colors[index % colors.length]}
                                      className="transition-all hover:opacity-80"
                                    />
                                  );
                                })
                              )}
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <div className="text-3xl font-bold text-gray-900 dark:text-white">{formatFollowers(totalFollowers)}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">Followers</div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {partner.socialMediaAccounts.map((account: any, index: number) => (
                              <div key={index} className="flex items-center gap-3">
                                <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: colors[index % colors.length] }} />
                                <div className="flex items-center gap-2 min-w-0">
                                  {getSocialIcon(account.platform)}
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">{account.platform}</span>
                                  <span className="text-sm text-gray-500 dark:text-gray-400">{formatFollowers(account.followers || 0)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Audience Demographics */}
                  {partner.demographicInfo && (
                    <div>
                      <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-3">Audience Demographics</h3>
                      <div className="bus-responsive-card-grid gap-4">
                        {partner.demographicInfo.age && (
                          <div className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <FaCalendarAlt className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Age Range</p>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{partner.demographicInfo.age}</p>
                            </div>
                          </div>
                        )}

                        {partner.demographicInfo.gender && (
                          <div className="flex items-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                            <FaVenusMars className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-3 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Gender</p>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize truncate">{partner.demographicInfo.gender}</p>
                            </div>
                          </div>
                        )}

                        {generalizeLocation(partner.demographicInfo) && (
                          <div className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <FaMapMarkerAlt className="h-5 w-5 text-green-600 dark:text-green-400 mr-3 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs text-green-600 dark:text-green-400 font-medium">Location</p>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{generalizeLocation(partner.demographicInfo)}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Social Media Accounts */}
                  {partner.socialMediaAccounts && Array.isArray(partner.socialMediaAccounts) && partner.socialMediaAccounts.length > 0 && (
                    <div>
                      <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Social Media Presence</h3>
                      <div className="bus-responsive-card-grid gap-4">
                        {partner.socialMediaAccounts.map((account: any, index: number) => {
                          const profileUrl = buildSocialProfileUrl(account.platform, account.username, account.url);

                          return (
                            <div
                              key={index}
                              className="flex flex-col p-4 rounded-lg border bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-start gap-3 w-full mb-3">
                                <div className="flex-shrink-0">{getSocialIcon(account.platform)}</div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 min-w-0 mb-1">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                      {account.username || `${account.platform} Profile`}
                                    </p>
                                    {account.verified && <FaCheckCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />}
                                  </div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize mb-2">{account.platform}</p>
                                </div>
                                {profileUrl && (
                                  <a
                                    href={profileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-shrink-0 p-2 text-gray-400 hover:text-emerald-500 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                                    title="Visit profile"
                                  >
                                    <FaExternalLinkAlt className="h-4 w-4" />
                                  </a>
                                )}
                              </div>

                              <div className="bus-responsive-two-col gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                                <div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Followers</p>
                                  <p className="text-sm font-bold text-gray-900 dark:text-white">{formatFollowers(account.followers || 0)}</p>
                                </div>
                                {account.following != null && (
                                  <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Following</p>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{formatFollowers(account.following)}</p>
                                  </div>
                                )}
                                {account.posts != null && (
                                  <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Posts</p>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{formatFollowers(account.posts)}</p>
                                  </div>
                                )}
                                {account.engagementRate != null && (
                                  <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Engagement</p>
                                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{(account.engagementRate || 0).toFixed(2)}%</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {!partner.demographicInfo && !partner.socialMediaAccounts && (
                    <div className="text-center py-8">
                      <FaUsers className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">No audience or social media information available yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="space-y-6">
              {/* Brand Fit Score */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Brand Fit</h3>

                {(() => {
                  const brandFitLabel = score >= 80 ? 'Excellent' : score >= 60 ? 'Very Good' : score >= 40 ? 'Good' : 'Fair';
                  const brandFitColor =
                    score >= 80
                      ? 'text-green-600 dark:text-green-400'
                      : score >= 60
                      ? 'text-blue-600 dark:text-blue-400'
                      : score >= 40
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-gray-600 dark:text-gray-400';
                  const barColor =
                    score >= 80
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                      : score >= 60
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                      : score >= 40
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                      : 'bg-gradient-to-r from-gray-400 to-gray-500';

                  return (
                    <>
                      <div className="flex items-end justify-between mb-4">
                        <span className={`text-3xl font-bold ${brandFitColor}`}>{brandFitLabel}</span>
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">{score}%</span>
                      </div>

                      <div className="relative w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className={`absolute inset-y-0 left-0 ${barColor} rounded-full transition-all duration-1000 ease-out`} style={{ width: `${score}%` }} />
                      </div>

                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                        <span>0</span>
                        <span>25</span>
                        <span>50</span>
                        <span>75</span>
                        <span>100</span>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Quick Stats</h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Response Time</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{partner.responseTime || '< 24h'}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Languages</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{partner.languages?.join(', ') || 'English'}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Timezone</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{partner.timezone || 'UTC+0'}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Member Since</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(partner.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Campaigns */}
          {Array.isArray(partner.recentCampaigns) && partner.recentCampaigns.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Campaign Performance</h2>
              <div className="bus-responsive-two-col gap-4">
                {partner.recentCampaigns.map((c: any) => (
                  <div
                    key={c.id}
                    className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{c.title}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formatDate(c.startDate)} – {formatDate(c.endDate)}
                        </p>
                      </div>
                    </div>

                    <div className="bus-responsive-two-col gap-3">
                      <div className="text-center">
                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{c.conversions || 0}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Conversions</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">{c.earned || 0}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Earned</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Curate modal */}
      {showCurate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" onClick={() => setShowCurate(false)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-2xl">
            <button
              onClick={() => setShowCurate(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            >
              <FaTimes className="h-4 w-4" />
            </button>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Curate {partner.name}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">Select a campaign to invite them to</p>
            <form onSubmit={handleCurate} className="space-y-4">
              <select
                value={selectedCampaign}
                onChange={(e) => setSelectedCampaign(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300 outline-none focus:border-emerald-400 dark:focus:border-emerald-400/50"
              >
                <option value="">Select a campaign…</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCurate(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCurating || !selectedCampaign}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 font-bold text-sm disabled:opacity-50"
                >
                  {isCurating ? <FaSpinner className="animate-spin h-3.5 w-3.5" /> : <FaBullhorn className="h-3.5 w-3.5" />}
                  Curate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Curate Category Modal */}
      {showCurateCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" onClick={() => {
            setShowCurateCategoryModal(false);
            setNewCategoryName('');
          }} />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-2xl">
            <button
              onClick={() => {
                setShowCurateCategoryModal(false);
                setNewCategoryName('');
              }}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            >
              <FaTimes className="h-4 w-4" />
            </button>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              {isCurated ? 'Update Curate Category' : 'Add to Curated'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              {isCurated ? 'Update the category for this curated partner' : 'Add this partner to your curated list'}
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Category (optional)
                </label>
                <select
                  value={curateCategory || ''}
                  onChange={(e) => setCurateCategory(e.target.value || null)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300 outline-none focus:border-emerald-400 dark:focus:border-emerald-400/50"
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
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Or create new category
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Category name"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => {
                    if (isCurated) {
                      const categoryToUse = newCategoryName.trim() || curateCategory || undefined;
                      handleUpdateCurateCategory(categoryToUse);
                    } else {
                      const categoryToUse = newCategoryName.trim() || curateCategory || undefined;
                      handleToggleCurate(categoryToUse);
                    }
                  }}
                  disabled={isTogglingCurate}
                  className="flex-1 px-4 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50"
                >
                  {isTogglingCurate ? <FaSpinner className="animate-spin h-4 w-4 mx-auto" /> : isCurated ? 'Update' : 'Add'}
                </button>
                {isCurated && (
                  <button
                    onClick={() => handleToggleCurate()}
                    disabled={isTogglingCurate}
                    className="px-4 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    Remove
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowCurateCategoryModal(false);
                    setNewCategoryName('');
                  }}
                  className="px-4 py-2.5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
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
}
