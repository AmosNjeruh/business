// Business Suite – Curated Partners Management
// Route: /admin/partners/curated
// Manage curated partners with categories

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';
import AdminLayout from '@/components/admin/Layout';
import { getFavoritePartners, getBookmarkCategories, updateBookmarkCategory, removePartnerFromFavorites } from '@/services/vendor';
import {
  FaSpinner,
  FaStar,
  FaFacebookF,
  FaInstagram,
  FaTwitter,
  FaYoutube,
  FaTiktok,
  FaGlobe,
  FaUsers,
  FaCrown,
  FaFire,
  FaRocket,
  FaMedal,
  FaBookmark,
  FaFolder,
  FaFolderOpen,
  FaTimes,
  FaEdit,
  FaArrowLeft,
  FaTh,
  FaList,
} from 'react-icons/fa';

function getPartnerScore(partner: any) {
  let score = 0;
  if (partner.socialMediaAccounts?.length > 0) score += 20;
  const verifiedCount = partner.socialMediaAccounts?.filter((acc: any) => acc.verified)?.length || 0;
  score += verifiedCount * 10;
  const totalFollowers = partner.socialMediaAccounts?.reduce((sum: number, acc: any) => sum + (acc.followers || 0), 0) || 0;
  if (totalFollowers > 100000) score += 25;
  else if (totalFollowers > 50000) score += 20;
  else if (totalFollowers > 10000) score += 15;
  else if (totalFollowers > 1000) score += 10;
  if (partner.skills?.length > 0) score += 10;
  if (partner.niche || (partner.niches && partner.niches.length > 0)) score += 5;
  if (partner.stats?.approvedApplications > 0) score += 15;
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
    case 'crown': return <FaCrown className="h-4 w-4 text-yellow-500" />;
    case 'rocket': return <FaRocket className="h-4 w-4 text-purple-500" />;
    case 'fire': return <FaFire className="h-4 w-4 text-orange-500" />;
    case 'medal': return <FaMedal className="h-4 w-4 text-blue-500" />;
    default: return <FaMedal className="h-4 w-4 text-blue-500" />;
  }
}

function getSocialIcon(platform: string) {
  switch (platform?.toLowerCase()) {
    case 'facebook': return <FaFacebookF className="h-4 w-4 text-blue-600" />;
    case 'instagram': return <FaInstagram className="h-4 w-4 text-pink-600" />;
    case 'twitter':
    case 'x': return <FaTwitter className="h-4 w-4 text-blue-400" />;
    case 'youtube': return <FaYoutube className="h-4 w-4 text-red-600" />;
    case 'tiktok': return <FaTiktok className="h-4 w-4 text-black dark:text-white" />;
    default: return <FaGlobe className="h-4 w-4 text-gray-600" />;
  }
}

function formatFollowers(count: number) {
  if (!count) return '0';
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

const CuratedPartnersPage: React.FC = () => {
  const router = useRouter();
  const [partners, setPartners] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [bookmarkCategories, setBookmarkCategories] = useState<any[]>([]);
  const [selectedBookmarkCategory, setSelectedBookmarkCategory] = useState<string>('all');
  const [uncategorizedCount, setUncategorizedCount] = useState(0);
  const [editingCurate, setEditingCurate] = useState<{ partnerId: string; category: string | null } | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [deletingCurate, setDeletingCurate] = useState<string | null>(null);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    loadBookmarkCategories();
    fetchCurated();
  }, [pagination.page, selectedBookmarkCategory]);

  const loadBookmarkCategories = async () => {
    try {
      const data = await getBookmarkCategories();
      setBookmarkCategories(data.categories || []);
      setUncategorizedCount(data.uncategorizedCount || 0);
    } catch (error) {
      console.error('Failed to load bookmark categories:', error);
    }
  };

  const fetchCurated = async () => {
    try {
      setIsLoading(true);
      const params: any = { page: pagination.page, limit: pagination.limit };
      if (selectedBookmarkCategory !== 'all') {
        params.category = selectedBookmarkCategory === 'uncategorized' ? 'uncategorized' : selectedBookmarkCategory;
      }
      
      const result = await getFavoritePartners(params);
      const partnersData = result.data || [];

      // Calculate scores
      const processedPartners = partnersData.map((partner: any) => ({
        ...partner,
        score: getPartnerScore(partner),
        tier: getPartnerTier(getPartnerScore(partner))
      }));

      setPartners(processedPartners);
      setPagination(result.pagination || { page: 1, limit: 50, total: partnersData.length, totalPages: 1 });
    } catch (error: any) {
      console.error('Failed to load curated partners:', error);
      setPartners([]);
      toast.error('Failed to load curated partners');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCurateCategory = async (partnerId: string, category: string | null) => {
    try {
      await updateBookmarkCategory(partnerId, category || undefined);
      toast.success('Curate category updated');
      await loadBookmarkCategories();
      await fetchCurated();
      setEditingCurate(null);
      setNewCategoryName('');
    } catch (error: any) {
      console.error('Failed to update curate:', error);
      toast.error(error.response?.data?.error || 'Failed to update curate');
    }
  };

  const handleRemoveCurate = (partnerId: string) => {
    setDeletingCurate(partnerId);
  };

  const confirmRemoveCurate = async () => {
    if (!deletingCurate) return;
    
    try {
      await removePartnerFromFavorites(deletingCurate);
      toast.success('Partner removed from curated');
      await loadBookmarkCategories();
      await fetchCurated();
      setDeletingCurate(null);
    } catch (error: any) {
      console.error('Failed to remove curate:', error);
      toast.error(error.response?.data?.error || 'Failed to remove curate');
      setDeletingCurate(null);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <FaSpinner className="animate-spin text-4xl text-emerald-500" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen p-2 sm:p-4 lg:p-6">
        <div className="w-full mx-auto space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin/partners')}
                className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <FaArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-3">
                  Curated Partners
                </h1>
                <p className="text-lg text-slate-600 dark:text-slate-400">
                  Organize and manage your curated partners
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 border rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
                  viewMode === 'grid'
                    ? 'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600'
                    : 'border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
                title="Grid View"
              >
                <FaTh className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 border rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
                  viewMode === 'list'
                    ? 'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600'
                    : 'border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
                title="List View"
              >
                <FaList className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Category Filter */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-white/8 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Organize by Category
              </h3>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  setSelectedBookmarkCategory('all');
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                  selectedBookmarkCategory === 'all'
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'
                }`}
              >
                <FaFolderOpen className="h-3 w-3" />
                All Categories
              </button>
              {uncategorizedCount > 0 && (
                <button
                  onClick={() => {
                    setSelectedBookmarkCategory('uncategorized');
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                    selectedBookmarkCategory === 'uncategorized'
                      ? 'bg-slate-600 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'
                  }`}
                >
                  <FaFolder className="h-3 w-3" />
                  Uncategorized ({uncategorizedCount})
                </button>
              )}
              {bookmarkCategories.map((cat: any) => (
                <button
                  key={cat.name}
                  onClick={() => {
                    setSelectedBookmarkCategory(cat.name);
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                    selectedBookmarkCategory === cat.name
                      ? 'bg-purple-500 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'
                  }`}
                >
                  <FaFolder className="h-3 w-3" />
                  {cat.name} ({cat.count})
                </button>
              ))}
            </div>
          </div>

          {/* Partners Grid/List */}
          {partners.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/8">
              <FaBookmark className="h-20 w-20 text-slate-400 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                No curated partners yet
              </h3>
              <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6">
                Start curating partners to organize them into categories
              </p>
              <Link
                href="/admin/partners"
                className="inline-flex items-center px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
              >
                <FaArrowLeft className="h-4 w-4 mr-2" />
                Discover Partners
              </Link>
            </div>
          ) : (
            <>
              {viewMode === 'grid' ? (
                <div className="bus-responsive-card-grid gap-4 sm:gap-5">
                  {partners.map((partner) => {
                    const topPlatform = partner.socialMediaAccounts?.length > 0 
                      ? partner.socialMediaAccounts.reduce((max: any, acc: any) => (acc.followers || 0) > (max.followers || 0) ? acc : max, partner.socialMediaAccounts[0])
                      : null;
                    
                    return (
                      <div key={partner.id} className="relative">
                        <div className="absolute top-2 right-2 z-10 flex gap-1">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setEditingCurate({ partnerId: partner.id, category: partner.bookmarkCategory || null });
                            }}
                            className="p-1.5 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors shadow-md opacity-90 hover:opacity-100"
                            title="Edit category"
                          >
                            <FaEdit className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleRemoveCurate(partner.id);
                            }}
                            className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors shadow-md opacity-90 hover:opacity-100"
                            title="Remove from curated"
                          >
                            <FaTimes className="h-3 w-3" />
                          </button>
                        </div>
                        <Link
                          href={`/admin/partners/${partner.id}`}
                          className="block bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/8 hover:shadow-md transition-shadow cursor-pointer rounded-xl overflow-hidden"
                        >
                          <div className="p-4">
                            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2 line-clamp-1">
                              {partner.name || 'Unknown Partner'}
                            </h3>

                            {partner.averageRating > 0 && (
                              <div className="flex items-center gap-1 mb-2">
                                <FaStar className="h-4 w-4 text-yellow-400 fill-current" />
                                <span className="text-sm text-slate-700 dark:text-slate-300">
                                  {(partner.averageRating || 0).toFixed(1)}
                                </span>
                                {partner.totalReviews > 0 && (
                                  <span className="text-sm text-slate-500 dark:text-slate-500">
                                    ({partner.totalReviews})
                                  </span>
                                )}
                              </div>
                            )}

                            {(Array.isArray(partner.niches) && partner.niches.length > 0) || partner.niche ? (
                              <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-2 line-clamp-1">
                                {Array.isArray(partner.niches) && partner.niches.length > 0 
                                  ? partner.niches.join(', ')
                                  : partner.niche || ''}
                              </p>
                            ) : null}

                            {partner.description && (
                              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                                {partner.description}
                              </p>
                            )}

                            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
                              {topPlatform && (
                                <div className="flex items-center gap-1.5">
                                  {getSocialIcon(topPlatform.platform)}
                                  <span className="text-sm text-slate-900 dark:text-white font-medium">
                                    {formatFollowers(topPlatform.followers || 0)}
                                  </span>
                                </div>
                              )}
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                Score: {partner.score}
                              </span>
                            </div>
                          </div>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-4">
                  {partners.map((partner) => (
                    <div
                      key={partner.id}
                      className="relative bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/8 shadow-sm hover:shadow-xl transition-all duration-300"
                    >
                      <div className="absolute top-4 right-4 z-10 flex gap-2">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setEditingCurate({ partnerId: partner.id, category: partner.bookmarkCategory || null });
                          }}
                          className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors shadow-md"
                          title="Edit category"
                        >
                          <FaEdit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleRemoveCurate(partner.id);
                          }}
                          className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-md"
                          title="Remove from curated"
                        >
                          <FaTimes className="h-4 w-4" />
                        </button>
                      </div>
                      <Link
                        href={`/admin/partners/${partner.id}`}
                        className="block p-4 sm:p-6 cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-500"
                      >
                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                          <div className="flex-shrink-0">
                            {partner.picture || partner.avatar ? (
                              <img
                                className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover border-2 border-slate-200 dark:border-slate-600 shadow-sm"
                                src={partner.picture || partner.avatar}
                                alt={partner.name || 'Partner'}
                              />
                            ) : (
                              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center text-white font-bold text-xl sm:text-2xl shadow-sm">
                                {(partner.name || 'P').charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start gap-3 mb-2">
                                  <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">
                                    {partner.name || 'Unknown Partner'}
                                  </h3>
                                  <div className={`px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 text-white ${partner.tier.color}`}>
                                    {renderTierIcon(partner.tier)}
                                    <span>{partner.tier.name}</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 flex-wrap mb-2">
                                  {Array.isArray(partner.niches) && partner.niches.length > 0 && (
                                    partner.niches.map((niche: string, idx: number) => (
                                      <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                                        {niche}
                                      </span>
                                    ))
                                  )}
                                </div>

                                {partner.description && (
                                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                                    {partner.description}
                                  </p>
                                )}
                              </div>

                              <div className="flex-shrink-0 text-center">
                                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-sm">
                                  {partner.score}
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Score</p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-3 border-t border-slate-200 dark:border-slate-700">
                              {partner.averageRating > 0 && (
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <FaStar
                                        key={i}
                                        className={`h-4 w-4 ${
                                          i < Math.round(partner.averageRating || 0)
                                            ? 'text-yellow-400 fill-current'
                                            : 'text-slate-300 dark:text-slate-600'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                                    {(partner.averageRating || 0).toFixed(1)}
                                  </span>
                                </div>
                              )}

                              {partner.socialMediaAccounts?.length > 0 && (
                                <div className="flex items-center gap-2 flex-wrap">
                                  {partner.socialMediaAccounts.slice(0, 4).map((account: any, idx: number) => (
                                    <div key={idx} className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-white/5 px-2 py-1 rounded-lg">
                                      {getSocialIcon(account.platform)}
                                      <span className="text-xs font-medium">{formatFollowers(account.followers || 0)}</span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {partner.stats?.approvedApplications > 0 && (
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                                    <FaUsers className="h-4 w-4" />
                                    <span className="text-sm font-medium">{partner.stats.approvedApplications} campaigns</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                      {partner.bookmarkCategory && (
                        <div className="px-6 pb-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-purple-800 dark:text-purple-200">
                            <FaFolder className="h-3 w-3 mr-1" />
                            {partner.bookmarkCategory}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/8 shadow-sm p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="text-sm text-slate-600 dark:text-slate-400 text-center sm:text-left">
                      Showing <span className="font-medium text-slate-900 dark:text-white">
                        {((pagination.page - 1) * pagination.limit) + 1}
                      </span> to <span className="font-medium text-slate-900 dark:text-white">
                        {Math.min(pagination.page * pagination.limit, pagination.total)}
                      </span> of <span className="font-medium text-slate-900 dark:text-white">
                        {pagination.total}
                      </span> curated partners
                    </div>

                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                        disabled={pagination.page === 1}
                        className="px-4 py-2 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
                      >
                        ← Previous
                      </button>

                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium text-slate-900 dark:text-white px-3 py-2 bg-slate-100 dark:bg-white/5 rounded-xl">
                          {pagination.page}
                        </span>
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          of {pagination.totalPages}
                        </span>
                      </div>

                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        disabled={pagination.page === pagination.totalPages}
                        className="px-4 py-2 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Edit Curate Category Modal */}
          {editingCurate && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-md w-full shadow-xl border border-slate-200 dark:border-white/10">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                  Edit Curate Category
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Category
                    </label>
                    <select
                      value={editingCurate.category || ''}
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
                      onClick={() => {
                        setEditingCurate(null);
                        setNewCategoryName('');
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

          {/* Delete Curate Confirmation Modal */}
          {deletingCurate && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-md w-full shadow-xl border border-slate-200 dark:border-white/10">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                  Remove from Curated
                </h3>
                
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  Are you sure you want to remove this partner from curated? This action cannot be undone.
                </p>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={confirmRemoveCurate}
                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                  >
                    Remove
                  </button>
                  <button
                    onClick={() => setDeletingCurate(null)}
                    className="px-4 py-2 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default CuratedPartnersPage;
