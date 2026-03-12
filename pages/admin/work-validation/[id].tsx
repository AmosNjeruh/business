// Business Suite – Work Validation Detail Page
// Route: /admin/work-validation/[id]
// Focused view for reviewing and approving completed work on a single application

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import toast from 'react-hot-toast'
import AdminLayout from '@/components/admin/Layout'
import { getApplication, approveWork, rejectWork, updateApplicationStatus } from '@/services/vendor'
import {
  FaSpinner,
  FaArrowLeft,
  FaCheckCircle,
  FaTimesCircle,
  FaUser,
  FaBriefcase,
  FaCalendarAlt,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaInstagram,
  FaTwitter,
  FaFacebookF,
  FaLinkedinIn,
  FaYoutube,
  FaTiktok,
  FaGlobe,
  FaExternalLinkAlt,
  FaUsers,
  FaStar,
  FaChartLine,
  FaVenusMars,
  FaCrown,
  FaRocket,
  FaFire,
  FaMedal,
  FaHeart,
  FaComment,
  FaRetweet,
  FaEye,
} from 'react-icons/fa'

const WorkValidationDetailPage: React.FC = () => {
  const router = useRouter()
  const { id } = router.query
  const [application, setApplication] = useState<any>(null)
  const [partnerSettings, setPartnerSettings] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showApproveWorkModal, setShowApproveWorkModal] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<string | null>(null)
  const [isApprovingWork, setIsApprovingWork] = useState(false)
  const [isRejectingWork, setIsRejectingWork] = useState(false)
  const fetchedIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (id && typeof id === 'string') {
      if (fetchedIdRef.current === id && application && partnerSettings) {
        return
      }
      fetchedIdRef.current = id
      fetchApplication()
    }
  }, [id])

  const fetchApplication = async () => {
    try {
      setIsLoading(true)
      const app = await getApplication(id as string)
      setApplication(app)

      if (app.partnerSettings) {
        setPartnerSettings(app.partnerSettings)
      }
    } catch (error: any) {
      console.error('Error fetching application:', error)
      toast.error(error.response?.data?.error || 'Failed to load application')
      router.push('/admin/work-validation')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChangeClick = (newStatus: string) => {
    setPendingStatus(newStatus)
    setShowConfirmModal(true)
  }

  const handleStatusChange = async () => {
    if (!pendingStatus || pendingStatus === 'PENDING') return

    try {
      setIsUpdating(true)
      setShowConfirmModal(false)
      await updateApplicationStatus(id as string, pendingStatus as 'APPROVED' | 'REJECTED')
      toast.success(`Application ${pendingStatus.toLowerCase()} successfully`)
      fetchApplication()
    } catch (error: any) {
      console.error('Error updating status:', error)
      toast.error(error.response?.data?.error || 'Failed to update status')
    } finally {
      setIsUpdating(false)
      setPendingStatus(null)
    }
  }

  const handleApproveWorkClick = () => {
    setShowApproveWorkModal(true)
  }

  const handleApproveWork = async () => {
    try {
      setIsApprovingWork(true)
      setShowApproveWorkModal(false)
      await approveWork(id as string)
      toast.success('Work approved successfully! Earnings have been set.')
      fetchApplication()
    } catch (error: any) {
      console.error('Error approving work:', error)
      toast.error(error.response?.data?.error || 'Failed to approve work')
    } finally {
      setIsApprovingWork(false)
    }
  }

  const handleRejectWork = async () => {
    if (!id) return
    const reason = window.prompt(
      'Enter a clear reason for rejecting this work (at least 10 characters):',
    )
    if (reason == null) return
    if (!reason || reason.trim().length < 10) {
      toast.error('Please provide a reason of at least 10 characters.')
      return
    }

    try {
      setIsRejectingWork(true)
      await rejectWork(id as string, reason.trim())
      toast.success('Work rejected and the creator has been notified.')
      fetchApplication()
    } catch (error: any) {
      console.error('Error rejecting work:', error)
      toast.error(error.response?.data?.error || 'Failed to reject work')
    } finally {
      setIsRejectingWork(false)
    }
  }

  const getSocialIcon = (platform: string) => {
    const platformLower = platform.toLowerCase()
    switch (platformLower) {
      case 'instagram':
        return <FaInstagram />
      case 'twitter':
      case 'x':
        return <FaTwitter />
      case 'facebook':
        return <FaFacebookF />
      case 'linkedin':
        return <FaLinkedinIn />
      case 'youtube':
        return <FaYoutube />
      case 'tiktok':
        return <FaTiktok />
      default:
        return <FaGlobe />
    }
  }

  const buildSocialProfileUrl = (platform?: string, username?: string | null, url?: string | null) => {
    const safePlatform = (platform || '').toLowerCase().trim()
    const rawUrl = (url || '').trim()
    const handle = (username || '').trim().replace(/^@/, '')

    if (rawUrl) {
      if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
        return rawUrl
      }
      return `https://${rawUrl}`
    }

    if (!handle) return null

    switch (safePlatform) {
      case 'instagram':
        return `https://instagram.com/${handle}`
      case 'twitter':
      case 'x':
        return `https://twitter.com/${handle}`
      case 'facebook':
        return `https://facebook.com/${handle}`
      case 'linkedin':
        return `https://www.linkedin.com/in/${handle}`
      case 'youtube':
        return `https://www.youtube.com/${handle}`
      case 'tiktok':
        return `https://www.tiktok.com/@${handle}`
      default:
        return `https://${safePlatform || 'social'}.com/${handle}`
    }
  }

  const formatFollowerCount = (count: number | null | undefined): string => {
    if (!count) return 'N/A'
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count.toString()
  }

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getPartnerScore = (partner: any) => {
    let score = 0

    if (partner.socialMediaAccounts?.length > 0) score += 20

    const verifiedCount = partner.socialMediaAccounts?.filter((acc: any) => acc.verified)?.length || 0
    score += verifiedCount * 10

    const totalFollowers =
      partner.socialMediaAccounts?.reduce((sum: number, acc: any) => sum + (acc.followers || 0), 0) || 0
    if (totalFollowers > 100000) score += 25
    else if (totalFollowers > 50000) score += 20
    else if (totalFollowers > 10000) score += 15
    else if (totalFollowers > 1000) score += 10

    if (partner.skills?.length > 0) score += 10
    if (partner.niche) score += 5

    return Math.min(score, 100)
  }

  const getPartnerTier = (score: number) => {
    if (score >= 80)
      return { name: 'Elite', iconName: 'crown', color: 'bg-gradient-to-r from-yellow-400 to-yellow-600' }
    if (score >= 60)
      return { name: 'Premium', iconName: 'rocket', color: 'bg-gradient-to-r from-purple-400 to-purple-600' }
    if (score >= 40)
      return { name: 'Rising', iconName: 'fire', color: 'bg-gradient-to-r from-orange-400 to-orange-600' }
    return { name: 'Emerging', iconName: 'medal', color: 'bg-gradient-to-r from-blue-400 to-blue-600' }
  }

  const renderTierIcon = (tier: any) => {
    switch (tier.iconName) {
      case 'crown':
        return <FaCrown className="h-4 w-4 text-yellow-500" />
      case 'rocket':
        return <FaRocket className="h-4 w-4 text-purple-500" />
      case 'fire':
        return <FaFire className="h-4 w-4 text-orange-500" />
      case 'medal':
      default:
        return <FaMedal className="h-4 w-4 text-blue-500" />
    }
  }

  const getOriginalUrl = (link: string | null | undefined): string => {
    if (!link) return ''

    try {
      const urlObj = new URL(link)
      const param =
        urlObj.searchParams.get('url') ||
        urlObj.searchParams.get('target') ||
        urlObj.searchParams.get('redirect')
      if (param) {
        try {
          return decodeURIComponent(param)
        } catch {
          return param
        }
      }
      return link
    } catch {
      const match = link.match(/[?&](url|target|redirect)=([^&]+)/i)
      if (match?.[2]) {
        try {
          return decodeURIComponent(match[2])
        } catch {
          return match[2]
        }
      }
      return link
    }
  }

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    }

    return (
      <span
        className={`px-3 py-1 text-sm font-semibold rounded-full ${
          statusColors[status] || statusColors.PENDING
        }`}
      >
        {status}
      </span>
    )
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <FaSpinner className="animate-spin text-3xl text-green-600" />
        </div>
      </AdminLayout>
    )
  }

  if (!application) {
    return (
      <AdminLayout>
        <div className="p-4 sm:p-6">
          <div className="max-w-4xl mx-auto text-center text-gray-500 dark:text-gray-400">
            Application not found
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="min-h-screen p-2 sm:p-4 lg:p-6">
        <div className="w-full lg:max-w-5xl mx-auto space-y-4 sm:space-y-6">
          {/* Back Button & Status */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/admin/work-validation')}
              className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <FaArrowLeft className="mr-2" />
              <span className="font-medium">Back to Work Validation</span>
            </button>
            {getStatusBadge(application.status)}
          </div>

          {/* Creator Profile Header */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="space-y-6">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex items-start gap-4 flex-1">
                  {partnerSettings?.profilePicture || application.partner?.picture ? (
                    <img
                      src={partnerSettings?.profilePicture || application.partner?.picture}
                      alt={application.partner?.name}
                      className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-2xl border-2 border-gray-200 dark:border-gray-600 flex-shrink-0">
                      {application.partner?.name?.charAt(0) || 'P'}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                      {application.partner?.name || 'Unknown Partner'}
                    </h1>

                    {partnerSettings?.tagline && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-3 italic">
                        "{partnerSettings.tagline}"
                      </p>
                    )}

                    {(() => {
                      const partner = {
                        ...partnerSettings,
                        socialMediaAccounts: partnerSettings?.socialMediaAccounts || [],
                      }
                      const score = getPartnerScore(partner)
                      const tier = getPartnerTier(score)
                      return (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {partnerSettings?.niche && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                              {partnerSettings.niche}
                            </span>
                          )}
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${tier.color}`}
                          >
                            {renderTierIcon(tier)}
                            <span className="ml-1">{tier.name} Creator</span>
                          </span>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              </div>

              {(partnerSettings?.contactPhone || partnerSettings?.whatsapp || partnerSettings?.address) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  {partnerSettings?.contactPhone && (
                    <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <FaPhone className="mr-3 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {partnerSettings.contactPhone}
                        </p>
                      </div>
                    </div>
                  )}
                  {partnerSettings?.whatsapp && (
                    <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <FaPhone className="mr-3 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 dark:text-gray-400">WhatsApp</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {partnerSettings.whatsapp}
                        </p>
                      </div>
                    </div>
                  )}
                  {partnerSettings?.address && (
                    <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg sm:col-span-2 lg:col-span-1">
                      <FaMapMarkerAlt className="mr-3 text-red-600 dark:text-red-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Address</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {partnerSettings.address}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Campaign Application Info */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Application & Campaign
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-green-100 dark:bg-green-900 p-2 flex-shrink-0">
                  <FaBriefcase className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Campaign</p>
                  <Link
                    href={`/admin/campaigns/${application.campaign.id}`}
                    className="text-sm font-medium text-green-600 dark:text-green-400 hover:underline"
                  >
                    {application.campaign?.title || 'Unknown Campaign'}
                  </Link>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-green-100 dark:bg-green-900 p-2 flex-shrink-0">
                  <FaCalendarAlt className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Applied Date</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatDate(application.createdAt)}
                  </p>
                </div>
              </div>
            </div>
            {application.proposal && (
              <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Proposal</p>
                <p className="text-sm text-gray-900 dark:text-white leading-relaxed">
                  {application.proposal}
                </p>
              </div>
            )}
          </div>

          {/* Main Content Container */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="space-y-6">
              {/* About This Creator */}
              {partnerSettings?.description && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    About This Creator
                  </h2>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                      {partnerSettings.description}
                    </p>
                  </div>
                </div>
              )}

              {/* Skills */}
              {partnerSettings?.skills &&
                Array.isArray(partnerSettings.skills) &&
                partnerSettings.skills.length > 0 && (
                  <div>
                    <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
                      Expertise & Skills
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {partnerSettings.skills.map((skill: string, index: number) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-full bg-gradient-to-r from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 text-green-800 dark:text-green-200 border border-green-300 dark:border-green-700"
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
          {partnerSettings?.socialMediaAccounts &&
            Array.isArray(partnerSettings.socialMediaAccounts) &&
            partnerSettings.socialMediaAccounts.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  Audience & Reach
                </h2>

                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                      Social Media Reach
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {partnerSettings.socialMediaAccounts.map((account: any, index: number) => {
                        const profileUrl = buildSocialProfileUrl(
                          account.platform,
                          account.username,
                          account.url,
                        )

                        return (
                          <div
                            key={index}
                            className="rounded-lg p-4 border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="text-lg">{getSocialIcon(account.platform)}</div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-900 dark:text-white capitalize block">
                                      {account.platform}
                                    </span>
                                    {account.verified && (
                                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full font-medium">
                                        Verified
                                      </span>
                                    )}
                                  </div>
                                  {account.username && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      @{account.username}
                                    </p>
                                  )}
                                </div>
                              </div>
                              {profileUrl && (
                                <a
                                  href={profileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                                >
                                  <FaExternalLinkAlt className="h-4 w-4" />
                                </a>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Followers</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">
                                  {formatFollowerCount(account.followers || 0)}
                                </p>
                              </div>
                              {account.following !== undefined && (
                                <div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Following</p>
                                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                                    {formatFollowerCount(account.following)}
                                  </p>
                                </div>
                              )}
                              {account.posts !== undefined && (
                                <div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Posts</p>
                                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                                    {formatFollowerCount(account.posts)}
                                  </p>
                                </div>
                              )}
                              {typeof account.engagementRate === 'number' &&
                                !Number.isNaN(account.engagementRate) && (
                                  <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Engagement</p>
                                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                      {account.engagementRate.toFixed(2)}%
                                    </p>
                                  </div>
                                )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* Performance Metrics & Work Status */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="space-y-6">
              {/* Total engagement from submitted posts */}
              {application.postMetrics &&
                (application.postMetrics.totalPosts > 0 ||
                  application.postMetrics.totalLikes > 0 ||
                  application.postMetrics.totalComments > 0) && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Total engagement
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Aggregated from all submitted posts for this application.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                          Posts
                        </p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                          {(application.postMetrics.totalPosts ?? 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                          <FaHeart className="h-3 w-3" /> Likes
                        </p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                          {(application.postMetrics.totalLikes ?? 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                          <FaComment className="h-3 w-3" /> Comments
                        </p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                          {(application.postMetrics.totalComments ?? 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                          <FaRetweet className="h-3 w-3" /> Shares
                        </p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                          {(application.postMetrics.totalShares ?? 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                          Reach
                        </p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                          {(application.postMetrics.totalReach ?? 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              {/* Submitted Posts */}
              {application.posts &&
                Array.isArray(application.posts) &&
                application.posts.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Submitted Posts ({application.posts.length})
                    </h3>
                    <div className="space-y-4">
                      {application.posts.map((post: any) => {
                        const getPlatformIcon = (platform: string) => {
                          switch (platform?.toLowerCase()) {
                            case 'facebook':
                              return <FaFacebookF className="h-4 w-4 text-blue-600" />
                            case 'instagram':
                              return <FaInstagram className="h-4 w-4 text-pink-600" />
                            case 'twitter':
                            case 'x':
                              return <FaTwitter className="h-4 w-4 text-blue-400" />
                            case 'youtube':
                              return <FaYoutube className="h-4 w-4 text-red-600" />
                            case 'tiktok':
                              return <FaTiktok className="h-4 w-4 text-black dark:text-white" />
                            case 'linkedin':
                              return <FaLinkedinIn className="h-4 w-4 text-blue-700" />
                            default:
                              return <FaGlobe className="h-4 w-4 text-gray-600" />
                          }
                        }

                        const formatNumber = (num: number) => {
                          if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
                          if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
                          return num.toString()
                        }

                        const displayUrl = getOriginalUrl(post.link)

                        return (
                          <div
                            key={post.id}
                            className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-600 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  {getPlatformIcon(post.platform)}
                                  <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                                    {post.platform}
                                  </span>
                                </div>
                                {post.validated ? (
                                  <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-xs font-medium">
                                    Validated
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full text-xs font-medium">
                                    Not Validated
                                  </span>
                                )}
                              </div>
                              {displayUrl && (
                                <a
                                  href={displayUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                                  title="Open post"
                                >
                                  <FaExternalLinkAlt className="h-4 w-4" />
                                </a>
                              )}
                            </div>

                            {post.caption && (
                              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-2">
                                {post.caption}
                              </p>
                            )}

                            {displayUrl && (
                              <a
                                href={displayUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-green-600 dark:text-green-400 hover:underline mb-3 block truncate"
                                title={displayUrl}
                              >
                                {displayUrl}
                              </a>
                            )}

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                              {post.likes > 0 && (
                                <div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Likes</p>
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {formatNumber(post.likes)}
                                  </p>
                                </div>
                              )}
                              {post.comments > 0 && (
                                <div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Comments</p>
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {formatNumber(post.comments)}
                                  </p>
                                </div>
                              )}
                              {post.shares > 0 && (
                                <div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Shares</p>
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {formatNumber(post.shares)}
                                  </p>
                                </div>
                              )}
                              {post.reach > 0 && (
                                <div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Reach</p>
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {formatNumber(post.reach)}
                                  </p>
                                </div>
                              )}
                              {post.impressions > 0 && (
                                <div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Impressions</p>
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {formatNumber(post.impressions)}
                                  </p>
                                </div>
                              )}
                              {post.engagementRate !== null &&
                                post.engagementRate !== undefined && (
                                  <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Engagement</p>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                      {post.engagementRate.toFixed(1)}%
                                    </p>
                                  </div>
                                )}
                            </div>

                            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                              Submitted{' '}
                              {new Date(post.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

              {/* Work Completion Status */}
              {application.status === 'APPROVED' && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Work Completion Status
                  </h2>
                  {!application.workCompletedByPartner &&
                    !application.workApprovedByVendor &&
                    !application.workRejectionReason && (
                      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <p className="text-sm text-yellow-800 dark:text-yellow-300">
                          <strong>⏳ Waiting for Partner</strong>
                          <br />
                          The partner has not marked their work as complete yet.
                        </p>
                      </div>
                    )}
                  {application.workCompletedByPartner &&
                    application.workRejectionReason &&
                    !application.workApprovedByVendor && (
                      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <p className="text-sm text-red-800 dark:text-red-300 mb-2">
                          <strong>✗ Work Rejected</strong>
                          {application.workCompletedAt && (
                            <span className="block mt-1 text-xs">
                              Partner marked work complete on {formatDate(application.workCompletedAt)}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                          Reason: <span className="font-medium">{application.workRejectionReason}</span>
                        </p>
                      </div>
                    )}
                  {application.workCompletedByPartner &&
                    !application.workApprovedByVendor &&
                    !application.workRejectionReason && (
                      <div className="space-y-4">
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <p className="text-sm text-green-800 dark:text-green-300 mb-2">
                            <strong>✓ Work Completed by Partner</strong>
                            {application.workCompletedAt && (
                              <span className="block mt-1 text-xs">
                                Completed on {formatDate(application.workCompletedAt)}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-green-700 dark:text-green-400 mt-2">
                            Review the partner&apos;s submissions and metrics above. If everything looks
                            good, approve their work to set earnings.
                          </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <button
                            onClick={handleApproveWorkClick}
                            disabled={isApprovingWork || isRejectingWork}
                            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
                          >
                            {isApprovingWork ? (
                              <>
                                <FaSpinner className="animate-spin mr-2" />
                                Approving...
                              </>
                            ) : (
                              <>
                                <FaCheckCircle className="mr-2" />
                                Approve Work & Set Earnings
                              </>
                            )}
                          </button>
                          <button
                            onClick={handleRejectWork}
                            disabled={isApprovingWork || isRejectingWork}
                            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
                          >
                            {isRejectingWork ? (
                              <>
                                <FaSpinner className="animate-spin mr-2" />
                                Rejecting...
                              </>
                            ) : (
                              <>
                                <FaTimesCircle className="mr-2" />
                                Reject Work
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  {application.workApprovedByVendor && (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-sm text-green-800 dark:text-green-300">
                        <strong>✓ Work Approved</strong>
                        {application.workApprovedAt && (
                          <span className="block mt-1 text-xs">
                            Approved on {formatDate(application.workApprovedAt)}
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              {application.status === 'PENDING' && (
                <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleStatusChangeClick('APPROVED')}
                    disabled={isUpdating}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
                  >
                    {isUpdating ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <FaCheckCircle className="mr-2" />
                        Approve Application
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleStatusChangeClick('REJECTED')}
                    disabled={isUpdating}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
                  >
                    {isUpdating ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <FaTimesCircle className="mr-2" />
                        Reject Application
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" onClick={() => { setShowConfirmModal(false); setPendingStatus(null); }} />
          <div className="relative w-full max-w-sm rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-2xl">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
              {pendingStatus === 'APPROVED' ? 'Approve Application' : 'Reject Application'}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              {pendingStatus === 'APPROVED'
                ? 'Are you sure you want to approve this application? The partner will be notified and can start working on the campaign.'
                : 'Are you sure you want to reject this application? This action cannot be undone.'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowConfirmModal(false); setPendingStatus(null); }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/15 bg-gray-50 dark:bg-white/5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusChange}
                disabled={isUpdating}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition-all ${
                  pendingStatus === 'APPROVED'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {isUpdating ? <FaSpinner className="animate-spin h-3.5 w-3.5" /> : <FaCheckCircle className="h-3.5 w-3.5" />}
                {pendingStatus === 'APPROVED' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Work Confirmation Modal */}
      {showApproveWorkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" onClick={() => setShowApproveWorkModal(false)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-green-200 dark:border-green-500/20 bg-white dark:bg-slate-900 p-6 shadow-2xl">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Approve Work</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Are you sure you want to approve this work? Earnings will be set and the partner will be notified.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowApproveWorkModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/15 bg-gray-50 dark:bg-white/5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveWork}
                disabled={isApprovingWork}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-all"
              >
                {isApprovingWork ? <FaSpinner className="animate-spin h-3.5 w-3.5" /> : <FaCheckCircle className="h-3.5 w-3.5" />}
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default WorkValidationDetailPage
