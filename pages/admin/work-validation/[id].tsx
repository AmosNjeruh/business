// Business Suite – Work Validation Detail Page
// Route: /admin/work-validation/[id]
// Enhanced focused view for reviewing and approving completed work

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import toast from 'react-hot-toast'
import AdminLayout from '@/components/admin/Layout'
import { getApplication, approveWork, rejectWork, updateApplicationStatus } from '@/services/vendor'
import Image from 'next/image'
import SocialEmbed from '@/components/admin/SocialEmbeds'
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
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
  FaCheck,
  FaBolt,
  FaKeyboard,
  FaExpand,
  FaCompress,
  FaDownload,
  FaCopy,
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
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [pendingStatus, setPendingStatus] = useState<string | null>(null)
  const [isApprovingWork, setIsApprovingWork] = useState(false)
  const [isRejectingWork, setIsRejectingWork] = useState(false)
  const [selectedPostIndex, setSelectedPostIndex] = useState<number | null>(null)
  const [showImageGallery, setShowImageGallery] = useState(false)
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)
  const fetchedIdRef = useRef<string | null>(null)

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Escape to close modals
      if (e.key === 'Escape') {
        setShowConfirmModal(false)
        setShowApproveWorkModal(false)
        setShowRejectModal(false)
        setShowImageGallery(false)
        setShowKeyboardShortcuts(false)
        setSelectedPostIndex(null)
      }
      // Ctrl/Cmd + Enter to approve work
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !showApproveWorkModal && !showRejectModal && !showConfirmModal) {
        const status = getWorkValidationStatus()
        if (status === 'pending' && application?.workCompletedByPartner) {
          e.preventDefault()
          handleApproveWorkClick()
        }
      }
      // Arrow keys for navigation in gallery
      if (showImageGallery && selectedPostIndex !== null) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault()
          handlePreviousPost()
        }
        if (e.key === 'ArrowRight') {
          e.preventDefault()
          handleNextPost()
        }
      }
      // ? for keyboard shortcuts
      if (e.key === '?' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault()
        setShowKeyboardShortcuts(!showKeyboardShortcuts)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [showApproveWorkModal, showRejectModal, showConfirmModal, showImageGallery, selectedPostIndex, application])

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

  const getWorkValidationStatus = (): 'pending' | 'approved' | 'rejected' => {
    if (!application) return 'pending'
    if (application.workApprovedByVendor) return 'approved'
    if (application.workRejectionReason) return 'rejected'
    return 'pending'
  }

  const getWorkValidationStatusForBadge = (): string => {
    const status = getWorkValidationStatus()
    return status.toUpperCase()
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

  const handleRejectWorkClick = () => {
    setShowRejectModal(true)
    setRejectReason('')
  }

  const handleRejectWork = async () => {
    if (!rejectReason || rejectReason.trim().length < 10) {
      toast.error('Please provide a reason of at least 10 characters.')
      return
    }

    try {
      setIsRejectingWork(true)
      setShowRejectModal(false)
      await rejectWork(id as string, rejectReason.trim())
      toast.success('Work rejected and the creator has been notified.')
      setRejectReason('')
      fetchApplication()
    } catch (error: any) {
      console.error('Error rejecting work:', error)
      toast.error(error.response?.data?.error || 'Failed to reject work')
    } finally {
      setIsRejectingWork(false)
    }
  }

  const handlePreviousPost = () => {
    if (selectedPostIndex !== null && application?.posts) {
      const newIndex = selectedPostIndex > 0 ? selectedPostIndex - 1 : application.posts.length - 1
      setSelectedPostIndex(newIndex)
    }
  }

  const handleNextPost = () => {
    if (selectedPostIndex !== null && application?.posts) {
      const newIndex = selectedPostIndex < application.posts.length - 1 ? selectedPostIndex + 1 : 0
      setSelectedPostIndex(newIndex)
    }
  }

  const openImageGallery = (index: number) => {
    setSelectedPostIndex(index)
    setShowImageGallery(true)
  }

  const getSocialIcon = (platform: string) => {
    const platformLower = platform.toLowerCase()
    switch (platformLower) {
      case 'instagram':
        return <FaInstagram className="h-5 w-5 text-pink-600" />
      case 'twitter':
      case 'x':
        return <FaTwitter className="h-5 w-5 text-blue-400" />
      case 'facebook':
        return <FaFacebookF className="h-5 w-5 text-blue-600" />
      case 'linkedin':
        return <FaLinkedinIn className="h-5 w-5 text-blue-700" />
      case 'youtube':
        return <FaYoutube className="h-5 w-5 text-red-600" />
      case 'tiktok':
        return <FaTiktok className="h-5 w-5 text-black dark:text-white" />
      default:
        return <FaGlobe className="h-5 w-5 text-gray-600" />
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

  const formatDateTime = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
        className={`px-3 py-1.5 text-sm font-semibold rounded-full ${
          statusColors[status] || statusColors.PENDING
        }`}
      >
        {status}
      </span>
    )
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const exportPostData = () => {
    if (!application?.posts) return

    const data = application.posts.map((post: any) => ({
      Platform: post.platform,
      Link: post.link || 'N/A',
      Caption: post.caption || 'N/A',
      Likes: post.likes || 0,
      Comments: post.comments || 0,
      Shares: post.shares || 0,
      Reach: post.reach || 0,
      Validated: post.validated ? 'Yes' : 'No',
      Submitted: formatDateTime(post.createdAt),
    }))

    const csvContent = [
      Object.keys(data[0]).join(','),
      ...data.map((row: any) => Object.values(row).map((cell: any) => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `work-submission-${application.partner?.name || 'partner'}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Export started')
  }


  const workStatus = getWorkValidationStatus()
  const selectedPost = selectedPostIndex !== null && application.posts ? application.posts[selectedPostIndex] : null

  return (
    <AdminLayout>
      <div className="min-h-screen p-2 sm:p-4 lg:p-6">
        {isLoading ? (
          <div className="w-full lg:max-w-6xl mx-auto flex justify-center items-center h-64">
            <FaSpinner className="animate-spin text-3xl text-green-600" />
          </div>
        ) : !application ? (
          <div className="w-full lg:max-w-6xl mx-auto text-center text-gray-500 dark:text-gray-400 py-12">
            Application not found
          </div>
        ) : (
        <div className="w-full lg:max-w-6xl mx-auto space-y-4 sm:space-y-6">
          {/* Header with Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={() => router.push('/admin/work-validation')}
                  className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex-shrink-0"
            >
              <FaArrowLeft className="mr-2" />
                  <span className="hidden sm:inline font-medium">Back</span>
                </button>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                    Work Validation Review
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {application.partner?.name || 'Unknown Partner'} • {application.campaign?.title || 'Unknown Campaign'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setShowKeyboardShortcuts(true)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Keyboard Shortcuts (Press ?)"
                >
                  <FaKeyboard className="h-4 w-4" />
            </button>
            {getStatusBadge(getWorkValidationStatusForBadge())}
              </div>
          </div>

            {/* Quick Actions Toolbar */}
            {workStatus === 'pending' && application.workCompletedByPartner && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="flex-1 text-sm text-gray-600 dark:text-gray-400">
                    <strong className="text-gray-900 dark:text-white">Quick Actions:</strong> Press{' '}
                    <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Ctrl+Enter</kbd> to
                    approve
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleApproveWorkClick}
                      disabled={isApprovingWork || isRejectingWork}
                      className="flex-1 sm:flex-none px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {isApprovingWork ? (
                        <>
                          <FaSpinner className="animate-spin h-4 w-4" />
                          Approving...
                        </>
                      ) : (
                        <>
                          <FaBolt className="h-4 w-4" />
                          Quick Approve
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleRejectWorkClick}
                      disabled={isApprovingWork || isRejectingWork}
                      className="flex-1 sm:flex-none px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {isRejectingWork ? (
                        <>
                          <FaSpinner className="animate-spin h-4 w-4" />
                          Rejecting...
                        </>
                      ) : (
                        <>
                          <FaTimesCircle className="h-4 w-4" />
                          Reject
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Partner Profile Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                <div className="flex items-start gap-4 flex-1">
                  {partnerSettings?.profilePicture || application.partner?.picture ? (
                  <div className="flex-shrink-0">
                    <Image
                      src={partnerSettings?.profilePicture || application.partner?.picture}
                      alt={application.partner?.name || 'Partner'}
                      width={80}
                      height={80}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-xl sm:text-2xl border-2 border-gray-200 dark:border-gray-600 flex-shrink-0">
                      {application.partner?.name?.charAt(0) || 'P'}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {application.partner?.name || 'Unknown Partner'}
                  </h2>
                    {partnerSettings?.tagline && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 italic">
                      &quot;{partnerSettings.tagline}&quot;
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

              {/* Contact Info */}
              {(partnerSettings?.contactPhone || partnerSettings?.whatsapp || partnerSettings?.address) && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:border-l sm:border-gray-200 sm:dark:border-gray-700 sm:pl-6">
                  {partnerSettings?.contactPhone && (
                    <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <FaPhone className="mr-3 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
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
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {partnerSettings.whatsapp}
                        </p>
                      </div>
                    </div>
                  )}
                  {partnerSettings?.address && (
                    <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg sm:col-span-3 sm:col-span-1">
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

          {/* Campaign Info */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 sm:p-6 border border-green-200 dark:border-green-800 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-green-100 dark:bg-green-900 p-2 flex-shrink-0">
                  <FaBriefcase className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Campaign</p>
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
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Applied Date</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatDate(application.createdAt)}
                  </p>
                </div>
              </div>
            </div>
            {application.proposal && (
                <div className="sm:border-l sm:border-green-200 sm:dark:border-green-800 sm:pl-6 sm:ml-6">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Proposal</p>
                  <p className="text-sm text-gray-900 dark:text-white leading-relaxed line-clamp-2">
                  {application.proposal}
                </p>
              </div>
            )}
          </div>
                  </div>

          {/* Performance Metrics */}
              {application.postMetrics &&
                (application.postMetrics.totalPosts > 0 ||
                  application.postMetrics.totalLikes > 0 ||
                  application.postMetrics.totalComments > 0) && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Performance Metrics</h3>
                  <button
                    onClick={exportPostData}
                    className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                  >
                    <FaDownload className="h-4 w-4" />
                    Export
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4">
                  <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                          Posts
                        </p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                          {(application.postMetrics.totalPosts ?? 0).toLocaleString()}
                        </p>
                      </div>
                  <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                          <FaHeart className="h-3 w-3" /> Likes
                        </p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                          {(application.postMetrics.totalLikes ?? 0).toLocaleString()}
                        </p>
                      </div>
                  <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                          <FaComment className="h-3 w-3" /> Comments
                        </p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                          {(application.postMetrics.totalComments ?? 0).toLocaleString()}
                        </p>
                      </div>
                  <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                          <FaRetweet className="h-3 w-3" /> Shares
                        </p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                          {(application.postMetrics.totalShares ?? 0).toLocaleString()}
                        </p>
                      </div>
                  <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                          Reach
                        </p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                          {(application.postMetrics.totalReach ?? 0).toLocaleString()}
                        </p>
                      </div>
                  <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                      Engagement Rate
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                      {application.postMetrics.totalReach > 0
                        ? (
                            ((application.postMetrics.totalLikes || 0) +
                              (application.postMetrics.totalComments || 0) +
                              (application.postMetrics.totalShares || 0)) /
                            application.postMetrics.totalReach
                          ).toFixed(2)
                        : '0.00'}
                      %
                    </p>
                  </div>
                    </div>
                  </div>
                )}

              {/* Submitted Posts */}
          {application.posts && Array.isArray(application.posts) && application.posts.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Submitted Posts ({application.posts.length})
                    </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {application.posts.filter((p: any) => p.validated).length} validated
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {application.posts.map((post: any, index: number) => {
                        const formatNumber = (num: number) => {
                          if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
                          if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
                          return num.toString()
                        }

                        const displayUrl = getOriginalUrl(post.link)

                        return (
                          <div
                            key={post.id}
                      className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-600 transition-all"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                          <div className="text-lg">{getSocialIcon(post.platform)}</div>
                          <div>
                                  <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                                    {post.platform}
                                  </span>
                                {post.validated ? (
                              <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-xs font-medium">
                                    Validated
                                  </span>
                                ) : (
                              <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full text-xs font-medium">
                                Pending Validation
                                  </span>
                                )}
                              </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {displayUrl && (
                            <button
                              onClick={() => copyToClipboard(displayUrl)}
                              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                              title="Copy link"
                            >
                              <FaCopy className="h-3 w-3" />
                            </button>
                          )}
                              {displayUrl && (
                                <a
                                  href={displayUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                              className="p-1.5 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 rounded hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                                  title="Open post"
                                >
                                  <FaExternalLinkAlt className="h-4 w-4" />
                                </a>
                              )}
                          <button
                            onClick={() => openImageGallery(index)}
                            className="p-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            title="View full details"
                          >
                            <FaExpand className="h-4 w-4" />
                          </button>
                        </div>
                            </div>

                            {post.caption && (
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-3">
                                {post.caption}
                              </p>
                            )}

                      {/* Social Media Embed */}
                            {displayUrl && (
                        <div className="mb-3">
                          <SocialEmbed url={displayUrl} platform={post.platform} className="w-full" />
                        </div>
                      )}

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
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
                        {post.engagementRate !== null && post.engagementRate !== undefined && (
                                  <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Engagement</p>
                            <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                                      {post.engagementRate.toFixed(1)}%
                                    </p>
                                  </div>
                                )}
                            </div>

                            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Submitted {formatDateTime(post.createdAt)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Partner Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* About Creator */}
            {partnerSettings?.description && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">About This Creator</h3>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
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
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Expertise & Skills</h3>
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

          {/* Social Media Accounts */}
          {partnerSettings?.socialMediaAccounts &&
            Array.isArray(partnerSettings.socialMediaAccounts) &&
            partnerSettings.socialMediaAccounts.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Social Media Reach</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {partnerSettings.socialMediaAccounts.map((account: any, index: number) => {
                    const profileUrl = buildSocialProfileUrl(account.platform, account.username, account.url)

                    return (
                      <div
                        key={index}
                        className="rounded-lg p-4 border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="text-lg">{getSocialIcon(account.platform)}</div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900 dark:text-white capitalize">
                                  {account.platform}
                                </span>
                                {account.verified && (
                                  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full font-medium">
                                    Verified
                                  </span>
                                )}
                              </div>
                              {account.username && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">@{account.username}</p>
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
                )}

              {/* Work Completion Status */}
              {application.status === 'APPROVED' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Work Completion Status</h2>
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
                        Review the partner&apos;s submissions and metrics above. If everything looks good, approve
                        their work to set earnings.
                          </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <button
                            onClick={handleApproveWorkClick}
                            disabled={isApprovingWork || isRejectingWork}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                          >
                            {isApprovingWork ? (
                              <>
                            <FaSpinner className="animate-spin h-4 w-4" />
                                Approving...
                              </>
                            ) : (
                              <>
                            <FaCheckCircle className="h-4 w-4" />
                                Approve Work & Set Earnings
                              </>
                            )}
                          </button>
                          <button
                        onClick={handleRejectWorkClick}
                            disabled={isApprovingWork || isRejectingWork}
                        className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                          >
                            {isRejectingWork ? (
                              <>
                            <FaSpinner className="animate-spin h-4 w-4" />
                                Rejecting...
                              </>
                            ) : (
                              <>
                            <FaTimesCircle className="h-4 w-4" />
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

          {/* Application Status Actions */}
              {application.status === 'PENDING' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => handleStatusChangeClick('APPROVED')}
                    disabled={isUpdating}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {isUpdating ? (
                      <>
                      <FaSpinner className="animate-spin h-4 w-4" />
                        Updating...
                      </>
                    ) : (
                      <>
                      <FaCheckCircle className="h-4 w-4" />
                        Approve Application
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleStatusChangeClick('REJECTED')}
                    disabled={isUpdating}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {isUpdating ? (
                      <>
                      <FaSpinner className="animate-spin h-4 w-4" />
                        Updating...
                      </>
                    ) : (
                      <>
                      <FaTimesCircle className="h-4 w-4" />
                        Reject Application
                      </>
                    )}
                  </button>
              </div>
                </div>
              )}
            </div>
        )}

      {/* Reject Work Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
            onClick={() => {
              setShowRejectModal(false)
              setRejectReason('')
            }}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-red-200 dark:border-red-500/20 bg-white dark:bg-slate-900 p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Reject Work</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Please provide a clear reason for rejecting this work. The partner will be notified.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason (minimum 10 characters)..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            />
            <div className="flex items-center justify-between mt-2 mb-4">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {rejectReason.length}/10 minimum characters
              </span>
              {rejectReason.length > 0 && rejectReason.length < 10 && (
                <span className="text-xs text-red-500">Please provide more details</span>
              )}
          </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectReason('')
                }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/15 bg-gray-50 dark:bg-white/5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectWork}
                disabled={isRejectingWork || rejectReason.trim().length < 10}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isRejectingWork ? (
                  <FaSpinner className="animate-spin h-3.5 w-3.5" />
                ) : (
                  <FaTimesCircle className="h-3.5 w-3.5" />
                )}
                Reject Work
              </button>
        </div>
      </div>
        </div>
      )}

      {/* Approve Work Confirmation Modal */}
      {showApproveWorkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
            onClick={() => setShowApproveWorkModal(false)}
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-green-200 dark:border-green-500/20 bg-white dark:bg-slate-900 p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Approve Work</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
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
                {isApprovingWork ? (
                  <FaSpinner className="animate-spin h-3.5 w-3.5" />
                ) : (
                  <FaCheckCircle className="h-3.5 w-3.5" />
                )}
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
            onClick={() => {
              setShowConfirmModal(false)
              setPendingStatus(null)
            }}
          />
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
                onClick={() => {
                  setShowConfirmModal(false)
                  setPendingStatus(null)
                }}
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
                {isUpdating ? (
                  <FaSpinner className="animate-spin h-3.5 w-3.5" />
                ) : (
                  <FaCheckCircle className="h-3.5 w-3.5" />
                )}
                {pendingStatus === 'APPROVED' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Gallery Modal */}
      {showImageGallery && selectedPost && selectedPostIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90">
          <button
            onClick={() => {
              setShowImageGallery(false)
              setSelectedPostIndex(null)
            }}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-lg transition-colors z-10"
          >
            <FaTimes className="h-6 w-6" />
          </button>
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getSocialIcon(selectedPost.platform)}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white capitalize">
                      {selectedPost.platform}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Post {selectedPostIndex + 1} of {application.posts.length}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {application.posts.length > 1 && (
                    <>
              <button
                        onClick={handlePreviousPost}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Previous (←)"
              >
                        <FaChevronLeft className="h-5 w-5" />
              </button>
              <button
                        onClick={handleNextPost}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Next (→)"
                      >
                        <FaChevronRight className="h-5 w-5" />
              </button>
                    </>
                  )}
            </div>
          </div>

              {selectedPost.caption && (
                <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                    {selectedPost.caption}
                  </p>
        </div>
      )}

              {selectedPost.link && (
                <div className="mb-4">
                  <SocialEmbed 
                    url={getOriginalUrl(selectedPost.link)} 
                    platform={selectedPost.platform}
                    className="w-full" 
                  />
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                {selectedPost.likes > 0 && (
                  <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Likes</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {selectedPost.likes.toLocaleString()}
                    </p>
                  </div>
                )}
                {selectedPost.comments > 0 && (
                  <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Comments</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {selectedPost.comments.toLocaleString()}
                    </p>
                  </div>
                )}
                {selectedPost.shares > 0 && (
                  <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Shares</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {selectedPost.shares.toLocaleString()}
                    </p>
                  </div>
                )}
                {selectedPost.reach > 0 && (
                  <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Reach</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {selectedPost.reach.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      {showKeyboardShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
            onClick={() => setShowKeyboardShortcuts(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Keyboard Shortcuts</h3>
              <button
                onClick={() => setShowKeyboardShortcuts(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Approve Work</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">Ctrl+Enter</kbd>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Close Modal</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">Esc</kbd>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Navigate Gallery</span>
                <div className="flex gap-1">
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">←</kbd>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">→</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Show Shortcuts</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">?</kbd>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default WorkValidationDetailPage
