// Vendor Challenge Analytics Page
// Real-time analytics, leaderboard, participant submissions with social embeds, prize structure, status management

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/router'
import AdminLayout from '@/components/admin/Layout'
import SocialEmbed from '@/components/admin/SocialEmbeds'
import {
  vendorGetChallenge,
  vendorGetLeaderboard,
  vendorGetSubmissions,
  vendorGetChallengeSocialMetrics,
  adminUpdateChallengeStatus,
  type Challenge,
  type ChallengeStatus,
  type LeaderboardEntry,
  type ChallengeSubmission,
  type SubmissionStatus,
  type ChallengeMetricsDTO,
  type PlatformMetrics,
} from '@/services/challenges'
import { useCurrency } from '@/hooks/useCurrency'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

// Backend stores amounts in USD; base currency for formatPrice is KES
const USD_TO_KES_RATE = 130
import toast from 'react-hot-toast'
import Link from 'next/link'
import {
  FaTrophy,
  FaArrowLeft,
  FaSpinner,
  FaUsers,
  FaFire,
  FaCheckCircle,
  FaClock,
  FaCoins,
  FaChartBar,
  FaEdit,
  FaMedal,
  FaFlag,
  FaRegClock,
  FaCalendarAlt,
  FaBolt,
  FaEye,
  FaShareAlt,
  FaSyncAlt,
  FaExclamationTriangle,
  FaTimesCircle,
  FaHourglass,
  FaLink,
  FaImage,
  FaDownload,
  FaExternalLinkAlt,
  FaFilter,
} from 'react-icons/fa'
import { MdPendingActions } from 'react-icons/md'

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; textColor: string; icon: React.ReactNode }> = {
  DRAFT:          { label: 'Draft',          color: 'bg-gray-100 dark:bg-gray-700',           textColor: 'text-gray-600 dark:text-gray-300',   icon: <FaEdit size={12} /> },
  PENDING_REVIEW: { label: 'Pending Review', color: 'bg-amber-100 dark:bg-amber-900/40',       textColor: 'text-amber-700 dark:text-amber-400', icon: <MdPendingActions size={14} /> },
  SCHEDULED:      { label: 'Scheduled',      color: 'bg-blue-100 dark:bg-blue-900/40',         textColor: 'text-blue-700 dark:text-blue-400',   icon: <FaRegClock size={12} /> },
  ACTIVE:         { label: 'Live 🔥',        color: 'bg-green-100 dark:bg-green-900/40',       textColor: 'text-green-700 dark:text-green-400', icon: <FaFire size={12} /> },
  PAUSED:         { label: 'Paused',         color: 'bg-orange-100 dark:bg-orange-900/40',     textColor: 'text-orange-600 dark:text-orange-400', icon: <FaClock size={12} /> },
  COMPLETED:      { label: 'Completed',      color: 'bg-indigo-100 dark:bg-indigo-900/40',     textColor: 'text-indigo-600 dark:text-indigo-400', icon: <FaCheckCircle size={12} /> },
  REJECTED:       { label: 'Rejected',       color: 'bg-red-100 dark:bg-red-900/40',           textColor: 'text-red-600 dark:text-red-400',     icon: <FaFlag size={12} /> },
}

const SUBMISSION_STATUS_CFG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING:  { label: 'Under Review', color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',     icon: <FaHourglass size={10} /> },
  APPROVED: { label: 'Approved ✓',   color: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',   icon: <FaCheckCircle size={10} /> },
  REJECTED: { label: 'Rejected',     color: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',                 icon: <FaTimesCircle size={10} /> },
  FLAGGED:  { label: 'Flagged ⚑',   color: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800', icon: <FaFlag size={10} /> },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function countdown(endDate: string): string {
  const ms = new Date(endDate).getTime() - Date.now()
  if (ms <= 0) return 'Ended'
  const d = Math.floor(ms / 86_400_000)
  const h = Math.floor((ms % 86_400_000) / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  if (d > 0) return `${d}d ${h}h left`
  if (h > 0) return `${h}h ${m}m left`
  return `${m}m left`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
}

function summarizePlatforms(platforms?: string[]): string {
  const list = (platforms || []).map((p) => p.toLowerCase())
  if (list.length === 0 || list.length >= 5) return 'All Platforms'
  const labels = list.map((p) =>
    p === 'x' || p === 'twitter' ? 'Twitter/X' :
    p === 'instagram' ? 'Instagram' :
    p === 'facebook' ? 'Facebook' :
    p === 'tiktok' ? 'TikTok' :
    p === 'youtube' ? 'YouTube' :
    p === 'linkedin' ? 'LinkedIn' : p
  )
  return Array.from(new Set(labels)).join(', ')
}

function ensureHash(tag: string): string {
  const t = tag.trim()
  if (!t) return t
  return t.startsWith('#') ? t : `#${t.replace(/^#+/, '')}`
}

async function downloadImage(imageUrl: string, filename: string) {
  const response = await fetch(imageUrl)
  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename || 'challenge-image.jpg'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

// ─── Leaderboard row ──────────────────────────────────────────────────────────

const LeaderboardRow: React.FC<{ entry: LeaderboardEntry; index: number }> = ({ entry, index }) => {
  const pct = Math.min(100, entry.percentComplete)
  return (
    <div className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
      index < 3
        ? 'bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/10 dark:to-purple-900/10 border border-indigo-100 dark:border-indigo-900/30'
        : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
    }`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
        index === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-sm' :
        index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800 shadow-sm' :
        index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white shadow-sm' :
        'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs'
      }`}>
        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : entry.rank}
      </div>

      <div className="flex items-center gap-2 flex-1 min-w-0">
        {entry.partnerPicture ? (
          <img src={entry.partnerPicture} alt={entry.partnerName} className="w-8 h-8 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-sm" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold border-2 border-white dark:border-gray-700 shadow-sm flex-shrink-0">
            {entry.partnerName?.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{entry.partnerName}</span>
      </div>

      <div className="hidden sm:flex flex-col gap-1 w-32">
        <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${pct >= 100 ? 'bg-green-500' : 'bg-indigo-500'}`} style={{ width: `${pct}%` }} />
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 text-right tabular-nums">
          {entry.metricValue.toLocaleString()} / {entry.goalValue.toLocaleString()}
        </div>
      </div>

      <div className={`text-sm font-bold w-12 text-right tabular-nums ${pct >= 100 ? 'text-green-600' : 'text-gray-900 dark:text-white'}`}>
        {pct}%
      </div>
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

const KpiCard: React.FC<{
  label: string
  value: React.ReactNode
  sub?: string
  icon: React.ReactNode
  color: string
}> = ({ label, value, sub, icon, color }) => (
  <div className={`bg-gradient-to-br ${color} rounded-2xl p-4 sm:p-5 border shadow-sm`}>
    <div className="flex items-start justify-between">
      <div>
        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">{label}</div>
        <div className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">{value}</div>
        {sub && <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{sub}</div>}
      </div>
      <div className="text-2xl opacity-80">{icon}</div>
    </div>
  </div>
)

// ─── Submission card (vendor view) ────────────────────────────────────────────

const VendorSubmissionCard: React.FC<{ sub: ChallengeSubmission }> = ({ sub }) => {
  const cfg = SUBMISSION_STATUS_CFG[sub.status] ?? SUBMISSION_STATUS_CFG['PENDING']
  const [showEmbed, setShowEmbed] = useState(false)

  return (
    <div className={`rounded-2xl border overflow-hidden transition-shadow hover:shadow-md ${
      sub.status === 'APPROVED' ? 'border-green-200 dark:border-green-800' :
      sub.status === 'REJECTED' ? 'border-red-200 dark:border-red-800' :
      sub.status === 'FLAGGED'  ? 'border-orange-200 dark:border-orange-800' :
      'border-gray-200 dark:border-gray-700'
    }`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 ${
        sub.status === 'APPROVED' ? 'bg-green-50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-800' :
        sub.status === 'REJECTED' ? 'bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-800' :
        sub.status === 'FLAGGED'  ? 'bg-orange-50 dark:bg-orange-900/20 border-b border-orange-100 dark:border-orange-800' :
        'bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700'
      }`}>
        {/* Partner info */}
        <div className="flex items-center gap-2.5">
          {sub.partner?.picture ? (
            <img src={sub.partner.picture} alt="" className="w-8 h-8 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-sm" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold border-2 border-white dark:border-gray-700">
              {sub.partner?.name?.[0]?.toUpperCase() ?? '?'}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white leading-none">
              {sub.partner?.name ?? 'Partner'}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {new Date(sub.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.color}`}>
            {cfg.icon} {cfg.label}
          </span>
          {sub.postUrl && (
            <button
              type="button"
              onClick={() => setShowEmbed(v => !v)}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {showEmbed ? 'Hide' : 'View post'}
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="bg-white dark:bg-gray-800 p-4 space-y-3">
        {/* Detected metric */}
        {sub.detectedMetricValue != null && (
          <div className="flex items-center gap-2 text-sm">
            <FaChartBar size={12} className="text-indigo-500 flex-shrink-0" />
            <span className="text-gray-600 dark:text-gray-300">Detected:</span>
            <span className="font-bold text-gray-900 dark:text-white">{sub.detectedMetricValue.toLocaleString()}</span>
          </div>
        )}

        {/* Post URL */}
        {sub.postUrl && !showEmbed && (
          <a
            href={sub.postUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline truncate max-w-full"
          >
            <FaExternalLinkAlt size={10} className="flex-shrink-0" />
            <span className="truncate">{sub.postUrl}</span>
          </a>
        )}

        {/* Embed */}
        {sub.postUrl && showEmbed && (
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
              <FaLink size={9} /> Live post preview
            </p>
            <SocialEmbed url={sub.postUrl} />
          </div>
        )}

        {/* Screenshots */}
        {sub.screenshotUrls && sub.screenshotUrls.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 flex items-center gap-1">
              <FaImage size={9} /> Screenshots ({sub.screenshotUrls.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {sub.screenshotUrls.map((imgUrl, i) => (
                <a key={i} href={imgUrl} target="_blank" rel="noopener noreferrer"
                  className="block rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:opacity-80 transition-opacity">
                  <img src={imgUrl} alt={`Screenshot ${i + 1}`} className="h-20 w-28 object-cover" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Note */}
        {sub.note && (
          <p className="text-sm text-gray-600 dark:text-gray-300 italic border-l-2 border-gray-300 dark:border-gray-600 pl-3">
            "{sub.note}"
          </p>
        )}

        {/* Rejection reason */}
        {sub.status === 'REJECTED' && sub.rejectionReason && (
          <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-0.5">Rejection reason</p>
            <p className="text-sm text-red-600 dark:text-red-300">{sub.rejectionReason}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const VendorChallengeDetailPage: React.FC = () => {
  const router = useRouter()
  const { id } = router.query
  const { formatPrice } = useCurrency()

  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [analytics, setAnalytics] = useState<any>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [submissions, setSubmissions] = useState<ChallengeSubmission[]>([])
  const [submissionTotal, setSubmissionTotal] = useState(0)
  const [submissionPage, setSubmissionPage] = useState(1)
  const [submissionFilter, setSubmissionFilter] = useState<SubmissionStatus | ''>('')
  const [loadingSubmissions, setLoadingSubmissions] = useState(false)

  const [loading, setLoading] = useState(true)
  const [refreshingLb, setRefreshingLb] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('overview')
  const [timer, setTimer] = useState('')

  const lbIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Aggregate social metrics for the overview tab
  const [socialMetrics, setSocialMetrics] = useState<ChallengeMetricsDTO | null>(null)
  const [loadingSocialMetrics, setLoadingSocialMetrics] = useState(false)

  // ── Data loading ──────────────────────────────────────────────────────────────

  const fetchLeaderboard = useCallback(async () => {
    if (!id) return
    try {
      const res = await vendorGetLeaderboard(id as string)
      // Live endpoint returns { entries: LeaderboardEntry[] }
      setLeaderboard(res?.entries || [])
    } catch {
      // silently fail on refresh
    }
  }, [id])

  const fetchSubmissions = useCallback(async (page = 1, filter: SubmissionStatus | '' = '') => {
    if (!id) return
    setLoadingSubmissions(true)
    try {
      const res = await vendorGetSubmissions(id as string, {
        ...(filter ? { status: filter } : {}),
        page,
        limit: 20,
      })
      setSubmissions(res?.submissions || [])
      setSubmissionTotal(res?.total ?? 0)
      setSubmissionPage(page)
    } catch {
      setSubmissions([])
    } finally {
      setLoadingSubmissions(false)
    }
  }, [id])

  const fetchData = useCallback(async () => {
    if (!id) return
    try {
      setLoading(true)
      const [challengeRes, lbRes] = await Promise.allSettled([
        vendorGetChallenge(id as string),
        vendorGetLeaderboard(id as string),
      ])

      if (challengeRes.status === 'fulfilled') {
        const data = challengeRes.value as any
        const challengeData: Challenge = data?.challenge || data
        setChallenge(challengeData)
        setAnalytics(data?.stats || null)

        // Fetch aggregate social metrics for social-type challenges
        const socialTypes = ['LIKES', 'SHARES', 'VIEWS']
        if (socialTypes.includes(challengeData.metricType)) {
          setLoadingSocialMetrics(true)
          vendorGetChallengeSocialMetrics(id as string)
            .then(setSocialMetrics)
            .catch(() => setSocialMetrics(null))
            .finally(() => setLoadingSocialMetrics(false))
        }
      }
      if (lbRes.status === 'fulfilled') {
        // Live endpoint returns { entries: LeaderboardEntry[] }
        setLeaderboard(lbRes.value?.entries || [])
      }
    } catch {
      toast.error('Failed to load challenge data')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (id) fetchData()
  }, [fetchData, id])

  // Load submissions when tab opens
  useEffect(() => {
    if (activeTab === 'submissions' && id) {
      fetchSubmissions(1, submissionFilter)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, id])

  // Countdown
  useEffect(() => {
    if (!challenge) return
    const tick = () => setTimer(countdown(challenge.endDate))
    tick()
    const t = setInterval(tick, 30_000)
    return () => clearInterval(t)
  }, [challenge])

  // Real-time leaderboard refresh every 30s
  useEffect(() => {
    if (!id) return
    lbIntervalRef.current = setInterval(fetchLeaderboard, 30_000)
    return () => {
      if (lbIntervalRef.current) clearInterval(lbIntervalRef.current)
    }
  }, [id, fetchLeaderboard])

  const handleStatusChange = useCallback(async (nextStatus: ChallengeStatus, note?: string) => {
    if (!id || updatingStatus) return
    try {
      setUpdatingStatus(true)
      await adminUpdateChallengeStatus(id as string, nextStatus, note)
      toast.success(`Challenge ${nextStatus === 'PAUSED' ? 'paused' : nextStatus === 'ACTIVE' ? 'resumed' : 'stopped'} successfully`)
      await fetchData()
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to update challenge status')
    } finally {
      setUpdatingStatus(false)
    }
  }, [id, updatingStatus, fetchData])

  const refreshLeaderboard = async () => {
    if (!id) return
    setRefreshingLb(true)
    await fetchLeaderboard()
    setRefreshingLb(false)
    toast.success('Leaderboard refreshed')
  }

  // ── Chart data (must be above early returns — Rules of Hooks) ────────────────

  const PLATFORM_COLORS: Record<string, string> = {
    Instagram: '#E4405F', Facebook: '#1877F2', Youtube: '#FF0000',
    TikTok: '#000000', Twitter: '#1DA1F2', Linkedin: '#0A66C2', Other: '#6B7280',
  }

  const engagementBreakdownData = useMemo(() => {
    if (!socialMetrics?.totals) return []
    const t = socialMetrics.totals
    return [
      { name: 'Reach', value: t.reach ?? t.views ?? 0 },
      { name: 'Likes', value: t.likes ?? 0 },
      { name: 'Comments', value: t.comments ?? 0 },
      { name: 'Shares', value: t.shares ?? 0 },
      { name: 'Impressions', value: t.impressions ?? 0 },
    ].filter((d) => d.value > 0)
  }, [socialMetrics])

  const reachByPlatformPieData = useMemo(() => {
    if (!socialMetrics?.byPlatform) return []
    return socialMetrics.byPlatform
      .filter((p: PlatformMetrics) => (p.reach ?? 0) > 0)
      .map((p: PlatformMetrics) => ({
        name: (p.platform || 'Other').charAt(0).toUpperCase() + (p.platform || 'other').slice(1).toLowerCase(),
        value: p.reach ?? 0,
      }))
  }, [socialMetrics])

  const platformChartData = useMemo(() => {
    if (!socialMetrics?.byPlatform) return []
    return socialMetrics.byPlatform
      .filter((p: PlatformMetrics) => (p.posts ?? 0) > 0 || (p.likes ?? 0) > 0 || (p.reach ?? 0) > 0)
      .map((p: PlatformMetrics) => ({
        platform: (p.platform || 'Other').charAt(0).toUpperCase() + (p.platform || 'other').slice(1).toLowerCase(),
        posts: p.posts ?? 0, reach: p.reach ?? 0,
        likes: p.likes ?? 0, comments: p.comments ?? 0, shares: p.shares ?? 0,
      }))
  }, [socialMetrics])

  // ── Loading / not found ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
          <div className="text-center">
            <FaSpinner className="text-4xl text-indigo-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">Loading challenge analytics…</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!challenge) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
          <div className="text-center">
            <FaExclamationTriangle className="text-4xl text-red-400 mx-auto mb-4" />
            <p className="text-gray-700 dark:text-gray-300 font-semibold mb-4">Challenge not found or access denied</p>
            <Link href="/admin/challenges">
              <button className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700">
                ← Back to Challenges
              </button>
            </Link>
          </div>
        </div>
      </AdminLayout>
    )
  }

  const cfg = STATUS_CONFIG[challenge.status] || STATUS_CONFIG['DRAFT']
  const participants = analytics?.totalParticipants ?? challenge._count?.participations ?? 0
  const submissionCount = analytics?.totalSubmissions ?? challenge._count?.submissions ?? 0
  const goalReached = analytics?.goalReachedCount ?? 0
  const completionRate = participants > 0 ? Math.round((goalReached / participants) * 100) : 0
  const topPrize = challenge.prizes?.[0]
  const isEditable = ['DRAFT', 'PENDING_REVIEW', 'REJECTED', 'SCHEDULED'].includes(challenge.status)

  const tabs = [
    { id: 'overview',     label: 'Overview',     icon: <FaChartBar size={12} /> },
    { id: 'details',      label: 'Details',      icon: <FaEye size={12} /> },
    { id: 'leaderboard',  label: 'Leaderboard',  icon: <FaMedal size={12} /> },
    { id: 'submissions',  label: 'Submissions',  icon: <FaEye size={12} />, badge: submissionCount },
    { id: 'prizes',       label: 'Prizes',       icon: <FaTrophy size={12} /> },
  ]

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

        {/* ── Compact header ── */}
        <div className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur">
          <div className="max-w-6xl mx-auto px-3 sm:px-6 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => router.push('/admin/challenges')}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shrink-0"
              >
                <FaArrowLeft size={14} />
              </button>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 dark:text-white truncate">
                  {challenge.title}
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  <span className="inline-flex items-center gap-1">
                    <FaBolt size={9} className="text-orange-400" />
                    {challenge.metricType}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <FaCalendarAlt size={9} />
                    {formatDate(challenge.startDate)} → {formatDate(challenge.endDate)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold ${cfg.color} ${cfg.textColor}`}>
                {cfg.icon} {cfg.label}
              </span>
              {challenge.status === 'ACTIVE' && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-[11px] text-gray-700 dark:text-gray-200">
                  <FaClock size={9} /> {timer}
                </span>
              )}
              <Link href={`/admin/challenges/${challenge.id}/analytics`}>
                <button
                  type="button"
                  title="Advanced analytics"
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-200/80 dark:hover:bg-indigo-900/60 transition-colors"
                >
                  <FaChartBar size={12} className="inline mr-1" />
                  Analytics
                </button>
              </Link>
              <Link href={`/admin/challenges/${challenge.id}/edit`}>
                <button
                  title={isEditable ? 'Edit challenge' : 'View edit page (some fields/actions may be locked for this status)'}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <FaEdit size={13} />
                </button>
              </Link>
              {(challenge.status === 'ACTIVE' || challenge.status === 'PAUSED') && (
                <button
                  onClick={() => handleStatusChange(challenge.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE')}
                  disabled={updatingStatus}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border disabled:opacity-50 ${
                    challenge.status === 'ACTIVE'
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                      : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
                  }`}
                >
                  {challenge.status === 'ACTIVE' ? 'Pause' : 'Resume'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-5">

          {/* Status banners */}
          {challenge.status === 'PENDING_REVIEW' && (
            <div className="mb-5 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
              <MdPendingActions className="text-amber-600 text-xl mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-semibold text-amber-800 dark:text-amber-300 text-sm">Under Review</div>
                <div className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                  Your challenge is being reviewed. You'll be notified once approved or if changes are needed.
                </div>
              </div>
            </div>
          )}
          {challenge.status === 'DRAFT' && (
            <div className="mb-5 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 flex items-start gap-3">
              <InfoIcon className="text-gray-500 text-lg mt-0.5 flex-shrink-0 w-5 h-5" />
              <div>
                <div className="font-semibold text-gray-700 dark:text-gray-200 text-sm">Draft Mode</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Complete your setup and submit for review to go live.
                </div>
              </div>
            </div>
          )}

          {/* KPI row */}
          <div className="bus-responsive-stat-grid gap-3 sm:gap-4 mb-6">
            <KpiCard
              label="Participants"
              value={participants.toLocaleString()}
              sub="Partners joined"
              icon={<FaUsers className="text-blue-500" />}
              color="from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800"
            />
            <KpiCard
              label="Goal Reached"
              value={`${goalReached}/${participants}`}
              sub={`${completionRate}% hit target`}
              icon={<FaCheckCircle className="text-green-500" />}
              color="from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 border-green-200 dark:border-green-800"
            />
            <KpiCard
              label="Submissions"
              value={submissionCount.toLocaleString()}
              sub="Proof uploads"
              icon={<FaChartBar className="text-purple-500" />}
              color="from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200 dark:border-purple-800"
            />
            <KpiCard
              label="Prize Pool"
              value={formatPrice((challenge.prizeBudget ?? 0) * USD_TO_KES_RATE)}
              sub={topPrize ? `1st: ${formatPrice(topPrize.prizeAmount * USD_TO_KES_RATE)}` : undefined}
              icon={<FaCoins className="text-yellow-500" />}
              color="from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-200 dark:border-yellow-800"
            />
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-1 mb-5 w-full max-w-full bg-white dark:bg-gray-800 rounded-xl p-1 border border-gray-200 dark:border-gray-700">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {tab.icon} {tab.label}
                {tab.badge != null && tab.badge > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── Overview ── */}
          {activeTab === 'overview' && (
            <div className="space-y-4 sm:space-y-5">
          <div className="bus-responsive-two-col gap-4 lg:gap-5">
            <div className="space-y-4">
              {challenge.heroImage && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <FaImage size={14} className="text-indigo-500" />
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">Challenge Image</span>
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          await downloadImage(challenge.heroImage!, `${challenge.title.replace(/\s+/g, '-')}-challenge.jpg`)
                          toast.success('Image downloaded')
                        } catch {
                          toast.error('Failed to download image')
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <FaDownload size={11} /> Download
                    </button>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-3 py-3 sm:px-4 sm:py-4">
                    <img
                      src={challenge.heroImage}
                      alt={challenge.title}
                      className="w-full h-auto max-h-[360px] object-contain rounded-xl"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {/* Fee breakdown */}
                {analytics && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-4 flex items-center gap-2">
                      <FaCoins size={13} className="text-yellow-500" /> Fee Breakdown
                    </h3>
                    <div className="space-y-2.5 text-sm">
                      {[
                        { label: 'Prize Budget',   value: formatPrice((challenge.prizeBudget ?? 0) * USD_TO_KES_RATE) },
                        { label: 'Platform Cut',   value: formatPrice((analytics.platformCut ?? 0) * USD_TO_KES_RATE), muted: true },
                        { label: 'Net Prize Pool', value: formatPrice((analytics.netPrizePool ?? 0) * USD_TO_KES_RATE), bold: true },
                      ].map((row, i) => (
                        <div key={i} className={`flex justify-between ${row.bold ? 'font-bold pt-2 border-t border-gray-100 dark:border-gray-700' : ''}`}>
                          <span className={row.muted ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-300'}>{row.label}</span>
                          <span className={row.bold ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white'}>{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Completion rate */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl border border-indigo-200 dark:border-indigo-800 p-5">
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-3">Completion Rate</h3>
                  <div className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400 mb-2">{completionRate}%</div>
                  <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden mb-2">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {goalReached} of {participants} partners hit the goal
                  </div>
                </div>

                {/* Share */}
                {challenge.status === 'ACTIVE' && (
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(`${window.location.origin}/challenges/${challenge.id}`)
                      toast.success('Challenge link copied!')
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-semibold text-gray-700 dark:text-gray-300"
                  >
                    <FaShareAlt size={13} className="text-indigo-500" /> Copy Challenge Link
                  </button>
                )}
              </div>
            </div>

            {/* ── Aggregate Social Post Metrics ── */}
             {(loadingSocialMetrics || socialMetrics) && (
              <div className="mt-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                    <FaChartBar size={13} className="text-blue-500" /> Social Post Performance
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Aggregate of validated posts from all participants within this challenge window.
                  </p>
                </div>

                {loadingSocialMetrics ? (
                  <div className="flex items-center justify-center py-10">
                    <FaSpinner className="animate-spin text-2xl text-blue-500" />
                  </div>
                ) : socialMetrics?.totals && (socialMetrics.totals.posts > 0 || socialMetrics.totals.likes > 0 || socialMetrics.totals.reach > 0) ? (
                  <div className="p-5 space-y-5">
                    {/* KPI strip */}
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 py-2.5 px-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 text-sm">
                      <span className="text-gray-600 dark:text-gray-400"><span className="font-bold text-gray-900 dark:text-white">{socialMetrics.totals.posts?.toLocaleString() ?? 0}</span> posts</span>
                      {(socialMetrics.totals.reach ?? 0) > 0 && <span className="text-gray-600 dark:text-gray-400"><span className="font-bold text-gray-900 dark:text-white">{socialMetrics.totals.reach.toLocaleString()}</span> reach</span>}
                      <span className="text-gray-600 dark:text-gray-400"><span className="font-bold text-gray-900 dark:text-white">{socialMetrics.totals.likes?.toLocaleString() ?? 0}</span> likes</span>
                      <span className="text-gray-600 dark:text-gray-400"><span className="font-bold text-gray-900 dark:text-white">{socialMetrics.totals.comments?.toLocaleString() ?? 0}</span> comments</span>
                      <span className="text-gray-600 dark:text-gray-400"><span className="font-bold text-gray-900 dark:text-white">{socialMetrics.totals.shares?.toLocaleString() ?? 0}</span> shares</span>
                      {(socialMetrics.totals.engagementRate ?? 0) > 0 && (
                        <span className="text-gray-600 dark:text-gray-400"><span className="font-bold text-indigo-600 dark:text-indigo-400">{socialMetrics.totals.engagementRate}%</span> avg engagement</span>
                      )}
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 gap-5">
                      {engagementBreakdownData.length > 0 && (
                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">Engagement breakdown</h4>
                          <div className="h-60">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={engagementBreakdownData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-600" />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)} />
                                <Tooltip formatter={(value: any) => Number(value).toLocaleString()} contentStyle={{ backgroundColor: '#111827', borderRadius: 8, borderColor: '#374151', color: '#f9fafb', fontSize: 11 }} />
                                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}
                      {reachByPlatformPieData.length > 0 && (
                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">Reach by platform</h4>
                          <div className="h-60">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
                                <Pie data={reachByPlatformPieData} dataKey="value" nameKey="name" cx="40%" cy="50%" innerRadius="45%" outerRadius="70%" paddingAngle={2}>
                                  {reachByPlatformPieData.map((entry: { name: string; value: number }) => (
                                    <Cell key={entry.name} fill={PLATFORM_COLORS[entry.name] ?? '#6B7280'} />
                                  ))}
                                </Pie>
                                <Tooltip formatter={(value: any, name: any) => {
                                  const total = reachByPlatformPieData.reduce((s: number, d: { value: number }) => s + d.value, 0)
                                  const pct = total > 0 ? ((Number(value) / total) * 100).toFixed(1) : '0'
                                  return [`${Number(value ?? 0).toLocaleString()} (${pct}%)`, String(name ?? '')]
                                }} />
                                <Legend layout="vertical" align="right" verticalAlign="middle" formatter={(value) => <span className="text-gray-700 dark:text-gray-300 text-xs">{value}</span>} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}
                    </div>
                    {platformChartData.length > 0 && (
                      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                        <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">Metrics per platform</h4>
                        <div className="h-60">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={platformChartData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }} barCategoryGap="20%" barGap={4}>
                              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-600" />
                              <XAxis dataKey="platform" tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)} />
                              <Tooltip formatter={(value: any) => Number(value).toLocaleString()} contentStyle={{ backgroundColor: '#111827', borderRadius: 8, borderColor: '#374151', color: '#f9fafb', fontSize: 11 }} />
                              <Bar dataKey="reach" name="Reach" fill="#f97316" radius={[4, 4, 0, 0]} />
                              <Bar dataKey="likes" name="Likes" fill="#ec4899" radius={[4, 4, 0, 0]} />
                              <Bar dataKey="comments" name="Comments" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                              <Bar dataKey="shares" name="Shares" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400 p-5">
                    No social post data yet. Metrics populate as participants submit validated posts via their campaigns.
                  </p>
                )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Leaderboard ── */}
          {activeTab === 'details' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 sm:p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <FaEye size={14} className="text-indigo-500" /> About this Challenge
              </h3>
              <h4 className="text-lg font-extrabold text-gray-900 dark:text-white mb-2">
                {challenge.title}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                {challenge.description || 'No description provided.'}
              </p>

              {((challenge.socialPlatforms?.length ?? 0) > 0 || (challenge.hashtags?.length ?? 0) > 0) && (
                <div className="mt-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-4">
                  <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                    Where to Post & Hashtags
                  </h5>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    <span className="text-gray-500 dark:text-gray-400">Content style:</span>{' '}
                    <span className="font-semibold">
                      {(challenge as any).contentStyle === 'AS_BRIEFED' ? 'Post As Briefed' : 'Creator Creativity (Recommended)'}
                    </span>
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="text-gray-500 dark:text-gray-400">Post on:</span>{' '}
                    <span className="font-semibold">{summarizePlatforms(challenge.socialPlatforms)}</span>
                  </p>
                  {challenge.socialPlatforms?.some((p) => ['x', 'twitter'].includes(String(p).toLowerCase())) && (
                    <p className="mt-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-2.5 py-1.5 inline-block">
                      Twitter/X is manual tracking (no official API).
                    </p>
                  )}
                  {(challenge.hashtags?.length ?? 0) > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(challenge.hashtags || []).map((tag) => (
                        <span key={tag} className="text-xs px-2 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                          {ensureHash(tag)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-5 bus-responsive-tile-grid gap-4 pt-5 border-t border-gray-100 dark:border-gray-700">
                {[
                  { label: 'Metric', value: challenge.metricType },
                  { label: 'Goal per Partner', value: challenge.goalValue?.toLocaleString() ?? '—' },
                  { label: 'Start Date', value: formatDate(challenge.startDate) },
                  { label: 'End Date', value: formatDate(challenge.endDate) },
                  { label: 'Type', value: challenge.type?.replace(/_/g, ' ') ?? '—' },
                  { label: 'Status', value: cfg.label },
                ].map((row, i) => (
                  <div key={i}>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">{row.label}</div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{row.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Leaderboard ── */}
          {activeTab === 'leaderboard' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">Live Leaderboard</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Ranked by {challenge.metricType.toLowerCase()} · auto-refreshes every 30s
                  </p>
                </div>
                <button
                  onClick={refreshLeaderboard}
                  disabled={refreshingLb}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors disabled:opacity-50"
                >
                  <FaSyncAlt size={10} className={refreshingLb ? 'animate-spin' : ''} /> Refresh
                </button>
              </div>

              {leaderboard.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <FaTrophy className="text-4xl text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No participants yet</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Leaderboard populates once the challenge goes live</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50 dark:divide-gray-700/50 px-4 py-2">
                  {leaderboard.map((entry, i) => (
                    <LeaderboardRow key={entry.partnerId} entry={entry} index={i} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Submissions ── */}
          {activeTab === 'submissions' && (
            <div className="space-y-4">
              {/* Filter bar */}
              <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                <FaFilter size={11} className="text-gray-400 flex-shrink-0" />
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Filter:</span>
                {(['', 'PENDING', 'APPROVED', 'REJECTED', 'FLAGGED'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => {
                      setSubmissionFilter(f)
                      fetchSubmissions(1, f)
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                      submissionFilter === f
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {f === '' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
                  </button>
                ))}
                <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
                  {submissionTotal} total
                </span>
              </div>

              {/* Grid */}
              {loadingSubmissions ? (
                <div className="flex items-center justify-center py-14">
                  <FaSpinner className="text-2xl text-indigo-600 animate-spin" />
                </div>
              ) : submissions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                  <FaEye className="text-4xl text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No submissions {submissionFilter ? `with status "${submissionFilter}"` : 'yet'}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Partners submit proof of their posts from the challenge page.</p>
                </div>
              ) : (
                <div className="bus-responsive-two-col gap-4">
                  {submissions.map(sub => (
                    <VendorSubmissionCard key={sub.id} sub={sub} />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {submissionTotal > 20 && (
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => fetchSubmissions(submissionPage - 1, submissionFilter)}
                    disabled={submissionPage <= 1 || loadingSubmissions}
                    className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
                  >
                    ← Prev
                  </button>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Page {submissionPage} of {Math.ceil(submissionTotal / 20)}
                  </span>
                  <button
                    onClick={() => fetchSubmissions(submissionPage + 1, submissionFilter)}
                    disabled={submissionPage >= Math.ceil(submissionTotal / 20) || loadingSubmissions}
                    className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Prizes ── */}
          {activeTab === 'prizes' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">Prize Structure</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Winners determined when the challenge completes
                </p>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {(challenge.prizes || []).map((prize, i) => (
                  <div key={prize.id} className="flex items-center gap-4 px-5 py-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 ${
                      i === 0 ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                      i === 1 ? 'bg-gray-100 dark:bg-gray-700' :
                      'bg-amber-100 dark:bg-amber-900/30'
                    }`}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${prize.rank}`}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {prize.description || `Rank #${prize.rank}`}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {prize.structure?.replace(/_/g, ' ')}
                        {prize.winnerId ? ' · Winner assigned ✓' : ''}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-extrabold text-green-600 dark:text-green-400">
                        {formatPrice(prize.prizeAmount * USD_TO_KES_RATE)}
                      </div>
                      {prize.winnerId && (
                        <div className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 justify-end mt-0.5">
                          <FaCheckCircle size={9} /> Assigned
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-5 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Total Prize Pool</span>
                <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">
                  {formatPrice((challenge.prizes || []).reduce((s, p) => s + p.prizeAmount, 0) * USD_TO_KES_RATE)}
                </span>
              </div>
            </div>
          )}

        </div>
     </div>   
    </AdminLayout>
  )
}

// ─── Inline SVG info icon ──────────────────────────────────────────────────────

const InfoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
  </svg>
);

export default VendorChallengeDetailPage
