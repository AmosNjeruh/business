// Vendor Challenge Detail — comprehensive management page
// Mirrors FinalBoss management capabilities: moderation, submissions approval,
// ranked pending queue, duplicate detection, fraud flags, payout tracking, social analytics.

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/router'
import AdminLayout from '@/components/admin/Layout'
import SocialEmbed from '@/components/admin/SocialEmbeds'
import {
  vendorGetChallenge,
  vendorGetDetailedLeaderboard,
  vendorRefreshLeaderboard,
  vendorGetSubmissions,
  vendorReviewSubmission,
  vendorBulkRejectSubmissions,
  vendorGetFraudFlags,
  vendorGetChallengeSocialMetrics,
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
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'

const USD_TO_KES_RATE = 130
import toast from 'react-hot-toast'
import Link from 'next/link'
import {
  FaTrophy, FaArrowLeft, FaSpinner, FaUsers, FaFire, FaCheckCircle,
  FaClock, FaCoins, FaChartBar, FaEdit, FaMedal, FaFlag, FaRegClock,
  FaCalendarAlt, FaBolt, FaEye, FaEyeSlash, FaShareAlt, FaSyncAlt,
  FaExclamationTriangle, FaTimesCircle, FaHourglass, FaImage, FaDownload,
  FaExternalLinkAlt, FaFilter, FaTimes, FaCheck, FaChevronDown, FaChevronUp,
  FaLink, FaArchive,
} from 'react-icons/fa'
import { MdPendingActions } from 'react-icons/md'

// ─── Status configs ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; textColor: string; icon: React.ReactNode }> = {
  DRAFT:          { label: 'Draft',          color: 'bg-gray-100 dark:bg-gray-700',        textColor: 'text-gray-600 dark:text-gray-300',    icon: <FaEdit size={12} /> },
  PENDING_REVIEW: { label: 'Pending Review', color: 'bg-amber-100 dark:bg-amber-900/40',   textColor: 'text-amber-700 dark:text-amber-400',  icon: <MdPendingActions size={14} /> },
  SCHEDULED:      { label: 'Scheduled',      color: 'bg-blue-100 dark:bg-blue-900/40',     textColor: 'text-blue-700 dark:text-blue-400',    icon: <FaRegClock size={12} /> },
  ACTIVE:         { label: 'Live 🔥',        color: 'bg-green-100 dark:bg-green-900/40',   textColor: 'text-green-700 dark:text-green-400',  icon: <FaFire size={12} /> },
  PAUSED:         { label: 'Paused',         color: 'bg-orange-100 dark:bg-orange-900/40', textColor: 'text-orange-600 dark:text-orange-400', icon: <FaClock size={12} /> },
  COMPLETED:      { label: 'Completed',      color: 'bg-indigo-100 dark:bg-indigo-900/40', textColor: 'text-indigo-600 dark:text-indigo-400', icon: <FaCheckCircle size={12} /> },
  ARCHIVED:       { label: 'Archived',       color: 'bg-gray-100 dark:bg-gray-700',        textColor: 'text-gray-400 dark:text-gray-500',    icon: <FaArchive size={12} /> },
  REJECTED:       { label: 'Rejected',       color: 'bg-red-100 dark:bg-red-900/40',       textColor: 'text-red-600 dark:text-red-400',      icon: <FaFlag size={12} /> },
}

const SUB_STATUS_CFG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING:  { label: 'Under Review', color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',       icon: <FaHourglass size={10} /> },
  APPROVED: { label: 'Approved ✓',   color: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',       icon: <FaCheckCircle size={10} /> },
  REJECTED: { label: 'Rejected',     color: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',                   icon: <FaTimesCircle size={10} /> },
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
  return t.startsWith('#') ? t : `#${t.replace(/^#+/, '')}`
}

async function downloadImage(imageUrl: string, filename: string) {
  const response = await fetch(imageUrl)
  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url; link.download = filename || 'challenge-image.jpg'
  document.body.appendChild(link); link.click()
  document.body.removeChild(link); window.URL.revokeObjectURL(url)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const KpiCard: React.FC<{
  label: string; value: React.ReactNode; sub?: string; icon: React.ReactNode; color: string
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

// ─── Submission Row Component ─────────────────────────────────────────────────

const SubmissionRow: React.FC<{
  sub: any
  actionId: string | null
  onApprove: (detectedVal?: number) => void
  onReject: () => void
  onViewPost?: () => void
  dupeCount?: number
  dupeExpanded?: boolean
  onToggleDupes?: () => void
  onRejectDuplicates?: () => void
  isDuplicate?: boolean
}> = ({ sub, actionId, onApprove, onReject, onViewPost, dupeCount = 0, dupeExpanded, onToggleDupes, onRejectDuplicates, isDuplicate }) => {
  const [showScreenshots, setShowScreenshots] = useState(false)
  const cfg = SUB_STATUS_CFG[sub.status as string] ?? SUB_STATUS_CFG['PENDING']

  return (
    <div className={`p-4 ${isDuplicate ? 'bg-orange-50/30 dark:bg-orange-900/5' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            {isDuplicate && (
              <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 tracking-wide shrink-0">
                duplicate
              </span>
            )}
            {/* Partner avatar + name */}
            {sub.partner?.picture ? (
              <img src={sub.partner.picture} alt="" className="w-6 h-6 rounded-full object-cover border border-white dark:border-gray-700 shadow-sm shrink-0" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                {sub.partner?.name?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
            <span className="font-semibold text-sm text-gray-900 dark:text-white">{sub.partner?.name || 'Unknown Partner'}</span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.color}`}>
              {cfg.icon} {cfg.label}
            </span>
            {sub.detectedPlatform && (
              <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 tracking-wide">
                {sub.detectedPlatform}
              </span>
            )}
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {new Date(sub.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            {sub.detectedMetricValue != null && sub.detectedMetricValue !== undefined && (
              <span className="text-xs text-green-700 dark:text-green-400 font-semibold">
                Detected: {Number(sub.detectedMetricValue).toLocaleString()}
              </span>
            )}
            {/* Duplicate group controls */}
            {dupeCount > 0 && (
              <>
                <button type="button" onClick={onToggleDupes}
                  className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 hover:bg-orange-200">
                  {dupeExpanded ? <FaChevronUp size={8} /> : <FaChevronDown size={8} />}
                  {dupeCount} duplicate{dupeCount !== 1 ? 's' : ''}
                </button>
                <button type="button" onClick={onRejectDuplicates}
                  title={`Reject all ${dupeCount} duplicate${dupeCount !== 1 ? 's' : ''} — keep this primary`}
                  className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-semibold bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200">
                  <FaTimes size={8} /> Reject dupes
                </button>
              </>
            )}
          </div>

          {/* Post URL */}
          {sub.postUrl && onViewPost && (
            <button type="button" onClick={onViewPost}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mb-2 text-left">
              <FaEye size={10} /> View post
            </button>
          )}
          {sub.postUrl && !onViewPost && (
            <a href={sub.postUrl} target="_blank" rel="noopener noreferrer"
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mb-2">
              <FaExternalLinkAlt size={9} /> {sub.postUrl}
            </a>
          )}

          {sub.note && (
            <p className="text-xs text-gray-500 dark:text-gray-400 italic mb-2 border-l-2 border-gray-300 dark:border-gray-600 pl-2">"{sub.note}"</p>
          )}

          {sub.status === 'REJECTED' && sub.rejectionReason && (
            <div className="mb-2 px-2.5 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30">
              <span className="text-xs font-medium text-red-700 dark:text-red-400">Rejection reason: </span>
              <span className="text-xs text-red-600 dark:text-red-300">{sub.rejectionReason}</span>
            </div>
          )}

          {sub.screenshotUrls?.length > 0 && (
            <div>
              <button onClick={() => setShowScreenshots(v => !v)}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 flex items-center gap-1 mb-2">
                {showScreenshots ? <FaEyeSlash size={10} /> : <FaEye size={10} />}
                {showScreenshots ? 'Hide' : 'Show'} {sub.screenshotUrls.length} screenshot{sub.screenshotUrls.length !== 1 ? 's' : ''}
              </button>
              {showScreenshots && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {sub.screenshotUrls.map((url: string, i: number) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      <img src={url} alt={`proof-${i}`} className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-600 hover:opacity-80 transition-opacity" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        {(sub.status === 'PENDING' || sub.status === 'APPROVED') && (
          <div className="flex gap-2 flex-shrink-0">
            {sub.status === 'PENDING' && (
              <button onClick={() => onApprove()} disabled={actionId === sub.id}
                className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition" title="Approve">
                {actionId === sub.id ? <FaSpinner size={14} className="animate-spin" /> : <FaCheck size={14} />}
              </button>
            )}
            <button onClick={onReject} disabled={actionId === sub.id}
              className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
              title={sub.status === 'APPROVED' ? 'Reject approved submission' : 'Reject'}>
              <FaTimes size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type ActiveTab = 'overview' | 'details' | 'leaderboard' | 'submissions' | 'fraud' | 'prizes'

const VendorChallengeDetailPage: React.FC = () => {
  const router = useRouter()
  const { id } = router.query
  const { formatPrice } = useCurrency()

  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [analytics, setAnalytics] = useState<any>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [submissions, setSubmissions] = useState<ChallengeSubmission[]>([])
  const [submissionTotal, setSubmissionTotal] = useState(0)
  const [pendingTotal, setPendingTotal] = useState(0)
  const [submissionPage, setSubmissionPage] = useState(1)
  const [submissionFilter, setSubmissionFilter] = useState<SubmissionStatus | ''>('')
  const [loadingSubmissions, setLoadingSubmissions] = useState(false)
  const [fraudFlags, setFraudFlags] = useState<any[]>([])
  const [socialMetrics, setSocialMetrics] = useState<ChallengeMetricsDTO | null>(null)
  const [loadingSocialMetrics, setLoadingSocialMetrics] = useState(false)

  const [loading, setLoading] = useState(true)
  const [refreshingLb, setRefreshingLb] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview')
  const [timer, setTimer] = useState('')

  // Leaderboard expand/collapse per entry
  const [expandedLbEntries, setExpandedLbEntries] = useState<Set<string>>(new Set())
  // Duplicate group expand/collapse in submissions tab
  const [expandedDupeGroups, setExpandedDupeGroups] = useState<Set<string>>(new Set())

  // Modals
  const [reviewModal, setReviewModal] = useState<{
    open: boolean; subId: string; detectedVal: string; target: SubmissionStatus | null
  }>({ open: false, subId: '', detectedVal: '', target: null })
  const [rejectReasonModal, setRejectReasonModal] = useState<{
    open: boolean; subIds: string[]; userName: string; duplicateCount: number
  }>({ open: false, subIds: [], userName: 'Partner', duplicateCount: 0 })
  const [embedModal, setEmbedModal] = useState<{
    open: boolean; url: string; userName: string; subtitle?: string; platform?: string
  }>({ open: false, url: '', userName: '' })

  const lbIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Data loading ──────────────────────────────────────────────────────────────

  const fetchLeaderboard = useCallback(async () => {
    if (!id) return
    try {
      const res = await vendorGetDetailedLeaderboard(id as string)
      setLeaderboard(res?.entries || [])
    } catch { /* silently fail on refresh */ }
  }, [id])

  const fetchSubmissions = useCallback(async (page = 1, filter: SubmissionStatus | '' = '') => {
    if (!id) return
    setLoadingSubmissions(true)
    try {
      const res = await vendorGetSubmissions(id as string, {
        ...(filter ? { status: filter } : {}),
        page, limit: 50,
      })
      const subs = res?.submissions || []
      setSubmissions(subs)
      setSubmissionTotal(res?.total ?? 0)
      setSubmissionPage(page)
      if (!filter) setPendingTotal(subs.filter((s: any) => s.status === 'PENDING').length)
    } catch {
      setSubmissions([])
    } finally {
      setLoadingSubmissions(false)
    }
  }, [id])

  const fetchAll = useCallback(async () => {
    if (!id) return
    try {
      setLoading(true)
      const [challengeRes, lbRes, fraudRes] = await Promise.allSettled([
        vendorGetChallenge(id as string),
        vendorGetDetailedLeaderboard(id as string),
        vendorGetFraudFlags(id as string),
      ])

      if (challengeRes.status === 'fulfilled') {
        const data = challengeRes.value as any
        const ch: Challenge = data?.challenge || data
        setChallenge(ch)
        setAnalytics(data?.stats || null)
        const socialTypes = ['LIKES', 'SHARES', 'VIEWS']
        if (socialTypes.includes(ch.metricType)) {
          setLoadingSocialMetrics(true)
          vendorGetChallengeSocialMetrics(id as string)
            .then(setSocialMetrics).catch(() => setSocialMetrics(null))
            .finally(() => setLoadingSocialMetrics(false))
        }
      }
      if (lbRes.status === 'fulfilled') setLeaderboard(lbRes.value?.entries || [])
      if (fraudRes.status === 'fulfilled') setFraudFlags(fraudRes.value || [])
    } catch {
      toast.error('Failed to load challenge data')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { if (id) fetchAll() }, [fetchAll, id])

  // Load submissions when tab opens, or filter changes
  useEffect(() => {
    if (activeTab === 'submissions' && id) fetchSubmissions(1, submissionFilter)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, id])

  // Countdown timer
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
    return () => { if (lbIntervalRef.current) clearInterval(lbIntervalRef.current) }
  }, [id, fetchLeaderboard])

  // ── Duplicate grouping for submissions tab ─────────────────────────────────

  type SubGroup = { key: string; primary: ChallengeSubmission; duplicates: ChallengeSubmission[] }
  const groupedSubmissions = useMemo((): SubGroup[] => {
    // PENDING always individual — requires per-item review decision
    const groups = new Map<string, SubGroup>()
    // Sort: pending first → within group, those with detected metric value ranked highest first
    const sorted = [...submissions].sort((a, b) => {
      if (a.status === 'PENDING' && b.status !== 'PENDING') return -1
      if (b.status === 'PENDING' && a.status !== 'PENDING') return 1
      // Both same status: those with a metric value come before those without
      const aHasMetric = a.detectedMetricValue != null ? 1 : 0
      const bHasMetric = b.detectedMetricValue != null ? 1 : 0
      if (bHasMetric !== aHasMetric) return bHasMetric - aHasMetric
      // Both have metrics: rank by metric value descending
      if (a.detectedMetricValue != null && b.detectedMetricValue != null) {
        return b.detectedMetricValue - a.detectedMetricValue
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
    for (const sub of sorted) {
      if (sub.status === 'PENDING' || !sub.detectedPlatform || !sub.postUrl) {
        groups.set(sub.id, { key: sub.id, primary: sub, duplicates: [] })
        continue
      }
      const groupKey = `${sub.partnerId}::${sub.detectedPlatform}`
      const existing = groups.get(groupKey)
      if (!existing) {
        groups.set(groupKey, { key: groupKey, primary: sub, duplicates: [] })
      } else {
        const existingMetric = existing.primary.detectedMetricValue ?? -1
        const newMetric = sub.detectedMetricValue ?? -1
        if (newMetric > existingMetric) {
          existing.duplicates.unshift(existing.primary)
          existing.primary = sub
        } else {
          existing.duplicates.push(sub)
        }
      }
    }
    return Array.from(groups.values())
  }, [submissions])

  const toggleDupeGroup = (key: string) =>
    setExpandedDupeGroups(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n })

  const toggleLbExpand = (partnerId: string) =>
    setExpandedLbEntries(prev => { const n = new Set(prev); n.has(partnerId) ? n.delete(partnerId) : n.add(partnerId); return n })

  // ── Review handlers ────────────────────────────────────────────────────────

  const handleReviewSubmission = async (
    subIdOrIds: string | string[],
    status: SubmissionStatus,
    detectedValue?: number,
    reason?: string,
  ) => {
    const ids = Array.isArray(subIdOrIds) ? subIdOrIds : [subIdOrIds]
    setActionId(ids[0])
    try {
      if (ids.length > 1 && status === 'REJECTED') {
        await vendorBulkRejectSubmissions({ submissionIds: ids, rejectionReason: reason! })
      } else {
        await vendorReviewSubmission(ids[0], { status, detectedMetricValue: detectedValue, rejectionReason: reason })
      }
      toast.success(ids.length > 1
        ? `${ids.length} duplicate submissions rejected`
        : `Submission ${status.toLowerCase()}`)
      // Refresh submissions + leaderboard together
      const [subData, lbData] = await Promise.allSettled([
        vendorGetSubmissions(id as string, {
          ...(submissionFilter ? { status: submissionFilter } : {}),
          page: submissionPage, limit: 50,
        }),
        vendorGetDetailedLeaderboard(id as string),
      ])
      if (subData.status === 'fulfilled') {
        const subs = subData.value?.submissions || []
        setSubmissions(subs)
        setSubmissionTotal(subData.value?.total ?? 0)
        if (!submissionFilter) setPendingTotal(subs.filter((s: any) => s.status === 'PENDING').length)
      }
      if (lbData.status === 'fulfilled') setLeaderboard(lbData.value?.entries || [])
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Review failed')
    } finally {
      setActionId(null)
    }
  }

  const handleRefreshLeaderboard = async () => {
    if (!id) return
    setRefreshingLb(true)
    try {
      await vendorRefreshLeaderboard(id as string)
      await fetchLeaderboard()
      toast.success('Leaderboard refreshed')
    } catch { toast.error('Failed to refresh leaderboard') }
    finally { setRefreshingLb(false) }
  }

  // ── Chart data ────────────────────────────────────────────────────────────

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

  // ── Loading / not-found ───────────────────────────────────────────────────

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
          <div className="text-center">
            <FaSpinner className="text-4xl text-indigo-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">Loading challenge…</p>
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

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'overview',     label: 'Overview',     icon: <FaChartBar size={12} /> },
    { id: 'details',      label: 'Details',      icon: <FaEye size={12} /> },
    { id: 'leaderboard',  label: 'Leaderboard',  icon: <FaMedal size={12} /> },
    { id: 'submissions',  label: 'Submissions',  icon: <FaEye size={12} />, badge: pendingTotal || submissionCount },
    { id: 'fraud',        label: 'Fraud',        icon: <FaFlag size={12} />, badge: fraudFlags.length },
    { id: 'prizes',       label: 'Prizes',       icon: <FaTrophy size={12} /> },
  ]

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

        {/* ── Compact header ── */}
        <div className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur">
          <div className="max-w-6xl mx-auto px-3 sm:px-6 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={() => router.push('/admin/challenges')}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shrink-0">
                <FaArrowLeft size={14} />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 dark:text-white truncate">
                    {challenge.title}
                  </h1>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${cfg.color} ${cfg.textColor}`}>
                    {cfg.icon} {cfg.label}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  <span className="inline-flex items-center gap-1"><FaBolt size={9} className="text-orange-400" />{challenge.metricType}</span>
                  <span className="inline-flex items-center gap-1"><FaCalendarAlt size={9} />{formatDate(challenge.startDate)} → {formatDate(challenge.endDate)}</span>
                  {challenge.status === 'ACTIVE' && timer && (
                    <span className="inline-flex items-center gap-1"><FaClock size={9} />{timer}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
              {pendingTotal > 0 && (
                <button onClick={() => { setActiveTab('submissions'); setSubmissionFilter('PENDING') }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-200/80 transition-colors animate-pulse">
                  <MdPendingActions size={12} /> {pendingTotal} pending
                </button>
              )}
              <Link href={`/admin/challenges/${challenge.id}/analytics`}>
                <button type="button" className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-200/80 transition-colors">
                  <FaChartBar size={12} className="inline mr-1" />Analytics
                </button>
              </Link>
              <Link href={`/admin/challenges/${challenge.id}/edit`}>
                <button title={isEditable ? 'Edit challenge' : 'View edit page'}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <FaEdit size={13} />
                </button>
              </Link>
              {(challenge.status === 'ACTIVE' || challenge.status === 'PAUSED') && (
                <button
                  onClick={() => {
                    const next = challenge.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
                    if (!actionId) {
                      setActionId('status')
                      // Use vendorUpdateChallengeStatus via router (already wired in existing service)
                      import('@/services/challenges').then(({ vendorUpdateChallengeStatus }) =>
                        vendorUpdateChallengeStatus(challenge.id, next as 'ACTIVE' | 'PAUSED')
                          .then(() => { toast.success(`Challenge ${next === 'PAUSED' ? 'paused' : 'resumed'}`); fetchAll() })
                          .catch((e: any) => toast.error(e?.response?.data?.error || 'Status update failed'))
                          .finally(() => setActionId(null))
                      )
                    }
                  }}
                  disabled={!!actionId}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border disabled:opacity-50 transition-colors ${
                    challenge.status === 'ACTIVE'
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                      : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
                  }`}
                >
                  {actionId === 'status' ? <FaSpinner size={10} className="animate-spin inline" /> : null}
                  {' '}{challenge.status === 'ACTIVE' ? 'Pause' : 'Resume'}
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
                <div className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">Your challenge is being reviewed. You'll be notified once approved or if changes are needed.</div>
              </div>
            </div>
          )}
          {challenge.status === 'REJECTED' && (
            <div className="mb-5 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-3">
              <FaFlag className="text-red-600 text-lg mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-semibold text-red-800 dark:text-red-300 text-sm">Challenge Rejected</div>
                <div className="text-xs text-red-700 dark:text-red-400 mt-0.5">Please edit and resubmit your challenge for review.</div>
              </div>
            </div>
          )}

          {/* KPI row */}
          <div className="bus-responsive-stat-grid gap-3 sm:gap-4 mb-6">
            <KpiCard label="Participants" value={participants.toLocaleString()} sub="Partners joined"
              icon={<FaUsers className="text-blue-500" />} color="from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800" />
            <KpiCard label="Goal Reached" value={`${goalReached}/${participants}`} sub={`${completionRate}% hit target`}
              icon={<FaCheckCircle className="text-green-500" />} color="from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 border-green-200 dark:border-green-800" />
            <KpiCard
              label="Submissions"
              value={submissionCount.toLocaleString()}
              sub={pendingTotal > 0 ? `${pendingTotal} pending review` : 'Proof uploads'}
              icon={<FaChartBar className="text-purple-500" />}
              color="from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200 dark:border-purple-800"
            />
            <KpiCard label="Prize Pool" value={formatPrice((challenge.prizeBudget ?? 0) * USD_TO_KES_RATE)}
              sub={topPrize ? `1st: ${formatPrice(topPrize.prizeAmount * USD_TO_KES_RATE)}` : undefined}
              icon={<FaCoins className="text-yellow-500" />} color="from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-200 dark:border-yellow-800" />
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-1 mb-5 w-full bg-white dark:bg-gray-800 rounded-xl p-1 border border-gray-200 dark:border-gray-700">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}>
                {tab.icon} {tab.label}
                {tab.badge != null && tab.badge > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    activeTab === tab.id
                      ? 'bg-white/20 text-white'
                      : tab.id === 'submissions' && pendingTotal > 0
                        ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 animate-pulse'
                        : tab.id === 'fraud' && fraudFlags.length > 0
                          ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400'
                          : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                  }`}>
                    {tab.id === 'submissions' && pendingTotal > 0 ? `${pendingTotal} pending` : tab.badge}
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
                        <button onClick={async () => {
                          try { await downloadImage(challenge.heroImage!, `${challenge.title.replace(/\s+/g, '-')}-challenge.jpg`); toast.success('Image downloaded') }
                          catch { toast.error('Failed to download image') }
                        }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                          <FaDownload size={11} /> Download
                        </button>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-3 py-3">
                        <img src={challenge.heroImage} alt={challenge.title} className="w-full h-auto max-h-[360px] object-contain rounded-xl" />
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {analytics && (
                      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-4 flex items-center gap-2">
                          <FaCoins size={13} className="text-yellow-500" /> Fee Breakdown
                        </h3>
                        <div className="space-y-2.5 text-sm">
                          {[
                            { label: 'Prize Budget', value: formatPrice((challenge.prizeBudget ?? 0) * USD_TO_KES_RATE) },
                            { label: 'Platform Cut', value: formatPrice((analytics.platformCut ?? 0) * USD_TO_KES_RATE), muted: true },
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

                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl border border-indigo-200 dark:border-indigo-800 p-5">
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-3">Completion Rate</h3>
                      <div className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400 mb-2">{completionRate}%</div>
                      <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden mb-2">
                        <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700" style={{ width: `${completionRate}%` }} />
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{goalReached} of {participants} partners hit the goal</div>
                    </div>

                    {challenge.status === 'ACTIVE' && (
                      <button onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/challenges/${challenge.id}`); toast.success('Challenge link copied!') }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-semibold text-gray-700 dark:text-gray-300">
                        <FaShareAlt size={13} className="text-indigo-500" /> Copy Challenge Link
                      </button>
                    )}
                  </div>
                </div>

                {/* Social post metrics */}
                {(loadingSocialMetrics || socialMetrics) && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                        <FaChartBar size={13} className="text-blue-500" /> Social Post Performance
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Aggregate of validated posts from all participants.</p>
                    </div>
                    {loadingSocialMetrics ? (
                      <div className="flex items-center justify-center py-10"><FaSpinner className="animate-spin text-2xl text-blue-500" /></div>
                    ) : socialMetrics?.totals && (socialMetrics.totals.posts > 0 || socialMetrics.totals.likes > 0 || socialMetrics.totals.reach > 0) ? (
                      <div className="p-5 space-y-5">
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
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 dark:text-gray-400 p-5">No social post data yet.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Details ── */}
          {activeTab === 'details' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 sm:p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <FaEye size={14} className="text-indigo-500" /> About this Challenge
              </h3>
              <h4 className="text-lg font-extrabold text-gray-900 dark:text-white mb-2">{challenge.title}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">{challenge.description || 'No description provided.'}</p>
              {((challenge.socialPlatforms?.length ?? 0) > 0 || (challenge.hashtags?.length ?? 0) > 0) && (
                <div className="mt-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-4">
                  <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Where to Post & Hashtags</h5>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    <span className="text-gray-500 dark:text-gray-400">Content style:</span>{' '}
                    <span className="font-semibold">{(challenge as any).contentStyle === 'AS_BRIEFED' ? 'Post As Briefed' : 'Creator Creativity (Recommended)'}</span>
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="text-gray-500 dark:text-gray-400">Post on:</span>{' '}
                    <span className="font-semibold">{summarizePlatforms(challenge.socialPlatforms)}</span>
                  </p>
                  {challenge.socialPlatforms?.some((p) => ['x', 'twitter'].includes(String(p).toLowerCase())) && (
                    <p className="mt-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-2.5 py-1.5 inline-block">Twitter/X is manual tracking (no official API).</p>
                  )}
                  {(challenge.hashtags?.length ?? 0) > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(challenge.hashtags || []).map((tag) => (
                        <span key={tag} className="text-xs px-2 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">{ensureHash(tag)}</span>
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
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex-wrap gap-3">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">Live Leaderboard & Rankings</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Ranked by {challenge.metricType.toLowerCase()} · auto-refreshes every 30s · expand to review per-participant posts
                  </p>
                </div>
                <button onClick={handleRefreshLeaderboard} disabled={refreshingLb}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors disabled:opacity-50">
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
                <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {leaderboard.map((entry, index) => {
                    const approvedSubs = (entry as any).approvedSubmissions ?? []
                    const isExpanded = expandedLbEntries.has(entry.partnerId)
                    const approvedCount = approvedSubs.length
                    const primarySubId = (entry as any).submissionId ?? null
                    const allDupeIds = approvedSubs.flatMap((sub: any) => (sub.allIds ?? []).filter((did: string) => did !== sub.id))
                    const totalDupeCount = allDupeIds.length
                    const entryBusy = !!(actionId && approvedSubs.some((sub: any) => (sub.allIds ?? [sub.id]).includes(actionId)))

                    return (
                      <div key={`${entry.partnerId}-${index}`}>
                        {/* Collapsed row */}
                        <div className="p-4 flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            entry.rank === 1 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' :
                            entry.rank === 2 ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-200' :
                            entry.rank === 3 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' :
                            'bg-gray-50 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : (entry.rank || index + 1)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{entry.partnerName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {(entry.metricValue || 0).toLocaleString()} / {(entry.goalValue || 0).toLocaleString()}
                              <span className="ml-1 text-gray-400">({entry.percentComplete || 0}%)</span>
                            </p>
                          </div>

                          {/* Progress bar */}
                          <div className="hidden sm:flex flex-col gap-1 w-24 shrink-0">
                            <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                              <div className={`h-full rounded-full ${entry.percentComplete >= 100 ? 'bg-green-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min(100, entry.percentComplete)}%` }} />
                            </div>
                          </div>

                          {approvedCount > 0 && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                              {approvedCount} post{approvedCount !== 1 ? 's' : ''}
                            </span>
                          )}

                          {totalDupeCount > 0 && (
                            <button type="button" disabled={entryBusy}
                              title={`Reject all ${totalDupeCount} duplicate posts — keeps top post per platform`}
                              onClick={() => setRejectReasonModal({ open: true, subIds: allDupeIds, userName: entry.partnerName || 'Partner', duplicateCount: totalDupeCount })}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 hover:bg-red-100 disabled:opacity-50 shrink-0 whitespace-nowrap">
                              {entryBusy ? <FaSpinner size={10} className="animate-spin" /> : <FaTimes size={10} />}
                              Clear {totalDupeCount} dupe{totalDupeCount !== 1 ? 's' : ''}
                            </button>
                          )}

                          {entry.postUrl && (
                            <button type="button"
                              onClick={() => setEmbedModal({ open: true, url: entry.postUrl as string, userName: entry.partnerName || 'Partner', subtitle: challenge?.title })}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 shrink-0">
                              <FaEye size={10} /> View
                            </button>
                          )}

                          {primarySubId && approvedCount === 1 && (
                            <button type="button" title="Reject this submission" disabled={actionId === primarySubId}
                              onClick={() => {
                                const sub = approvedSubs[0]
                                setRejectReasonModal({ open: true, subIds: sub?.allIds ?? [primarySubId], userName: entry.partnerName || 'Partner', duplicateCount: (sub?.allIds?.length ?? 1) - 1 })
                              }}
                              className="inline-flex items-center justify-center p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 border border-red-200 dark:border-red-900/40 shrink-0">
                              {actionId === primarySubId ? <FaSpinner size={12} className="animate-spin" /> : <FaTimes size={12} />}
                            </button>
                          )}

                          {approvedCount > 0 && (
                            <button type="button" onClick={() => toggleLbExpand(entry.partnerId)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 shrink-0">
                              {isExpanded ? <FaChevronUp size={11} /> : <FaChevronDown size={11} />}
                            </button>
                          )}
                        </div>

                        {/* Expanded approved submissions */}
                        {isExpanded && approvedCount > 0 && (
                          <div className="border-t border-gray-100 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800/40">
                            <div className="px-4 py-2 flex items-center justify-between gap-3">
                              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                Approved posts — {entry.partnerName}
                              </span>
                              {totalDupeCount > 0 && (
                                <button type="button" disabled={entryBusy}
                                  onClick={() => setRejectReasonModal({ open: true, subIds: allDupeIds, userName: entry.partnerName || 'Partner', duplicateCount: totalDupeCount })}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 hover:bg-red-100 disabled:opacity-50 whitespace-nowrap shrink-0">
                                  <FaTimes size={10} /> Clear all {totalDupeCount} duplicates
                                </button>
                              )}
                            </div>
                            <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                              {approvedSubs.map((sub: any, subIdx: number) => {
                                const dupeIds = (sub.allIds ?? [sub.id]).filter((did: string) => did !== sub.id)
                                const dupeCount = dupeIds.length
                                const urlBusy = !!(actionId && (sub.allIds ?? [sub.id]).includes(actionId))
                                return (
                                  <div key={sub.id} className="flex items-center gap-3 px-4 py-3">
                                    <span className="text-xs text-gray-400 w-5 shrink-0">{subIdx + 1}.</span>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 tracking-wide shrink-0">
                                          {(sub as any).platform ?? 'unknown'}
                                        </span>
                                        <a href={sub.postUrl ?? '#'} target="_blank" rel="noopener noreferrer"
                                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 truncate">
                                          <FaLink size={9} className="shrink-0" /><span className="truncate">{sub.postUrl}</span>
                                        </a>
                                      </div>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        {sub.detectedMetricValue != null && sub.detectedMetricValue !== undefined ? (
                                          <span className="text-xs font-medium text-green-700 dark:text-green-400">{challenge.metricType}: {sub.detectedMetricValue.toLocaleString()}</span>
                                        ) : (
                                          <span className="text-xs text-gray-400 italic">No metric detected</span>
                                        )}
                                        <span className="text-xs text-gray-400">{new Date(sub.createdAt).toLocaleDateString()}</span>
                                        {subIdx === 0 && <span className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 px-1.5 py-0.5 rounded font-medium">primary</span>}
                                        {dupeCount > 0 && <span className="text-xs bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 px-1.5 py-0.5 rounded font-medium">+{dupeCount} duplicate{dupeCount !== 1 ? 's' : ''}</span>}
                                      </div>
                                    </div>
                                    {sub.postUrl && (
                                      <button type="button"
                                        onClick={() => setEmbedModal({ open: true, url: sub.postUrl!, userName: entry.partnerName || 'Partner', subtitle: `Post ${subIdx + 1} of ${approvedCount} — ${challenge?.title}`, platform: (sub as any).platform })}
                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 shrink-0">
                                        <FaEye size={10} /> View
                                      </button>
                                    )}
                                    {dupeCount > 0 && (
                                      <button type="button" disabled={urlBusy}
                                        onClick={() => setRejectReasonModal({ open: true, subIds: dupeIds, userName: entry.partnerName || 'Partner', duplicateCount: dupeCount })}
                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-900/40 hover:bg-orange-100 disabled:opacity-50 shrink-0 whitespace-nowrap">
                                        {urlBusy ? <FaSpinner size={10} className="animate-spin" /> : <FaTimes size={10} />}
                                        Reject {dupeCount} dupe{dupeCount !== 1 ? 's' : ''}
                                      </button>
                                    )}
                                    <button type="button" title="Reject this submission" disabled={urlBusy}
                                      onClick={() => setRejectReasonModal({ open: true, subIds: [sub.id], userName: entry.partnerName || 'Partner', duplicateCount: 0 })}
                                      className="inline-flex items-center justify-center p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 border border-red-200 dark:border-red-900/40 shrink-0">
                                      {urlBusy ? <FaSpinner size={12} className="animate-spin" /> : <FaTimes size={12} />}
                                    </button>
                                  </div>
                                )
                              })}
                            </div>
                            {approvedCount > 1 && (
                              <p className="px-4 pb-3 pt-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/10 border-t border-amber-100 dark:border-amber-900/20">
                                <strong>{approvedCount} unique posts</strong> approved. Rejecting the primary recalculates rank from remaining posts.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Submissions ── */}
          {activeTab === 'submissions' && (
            <div className="space-y-4">
              {/* Filter + sort bar */}
              <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                <FaFilter size={11} className="text-gray-400 flex-shrink-0" />
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Filter:</span>
                {(['', 'PENDING', 'APPROVED', 'REJECTED', 'FLAGGED'] as const).map(f => (
                  <button key={f}
                    onClick={() => { setSubmissionFilter(f); fetchSubmissions(1, f) }}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                      submissionFilter === f
                        ? f === 'PENDING' ? 'bg-amber-500 text-white' : 'bg-indigo-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}>
                    {f === '' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
                    {f === 'PENDING' && pendingTotal > 0 && (
                      <span className={`ml-1 ${submissionFilter === 'PENDING' ? 'text-white/80' : 'text-amber-600'}`}>({pendingTotal})</span>
                    )}
                  </button>
                ))}
                <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">{submissionTotal} total</span>
              </div>

              {/* Pending-first note */}
              {!submissionFilter && pendingTotal > 0 && (
                <div className="px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300">
                  <MdPendingActions size={14} />
                  <span><strong>{pendingTotal} pending</strong> submissions sorted to the top — review them to update the leaderboard.</span>
                </div>
              )}

              {loadingSubmissions ? (
                <div className="flex items-center justify-center py-14"><FaSpinner className="text-2xl text-indigo-600 animate-spin" /></div>
              ) : submissions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                  <FaEye className="text-4xl text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No submissions {submissionFilter ? `with status "${submissionFilter}"` : 'yet'}</p>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden divide-y divide-gray-50 dark:divide-gray-700">
                  {groupedSubmissions.map(({ key, primary: sub, duplicates }) => {
                    const hasDupes = duplicates.length > 0
                    const isExpanded = expandedDupeGroups.has(key)
                    const dupeIds = duplicates.map((d: ChallengeSubmission) => d.id)
                    return (
                      <div key={key} className={hasDupes ? 'border-l-4 border-orange-300 dark:border-orange-700' : ''}>
                        <SubmissionRow
                          sub={sub} actionId={actionId}
                          dupeCount={duplicates.length} dupeExpanded={isExpanded}
                          onToggleDupes={hasDupes ? () => toggleDupeGroup(key) : undefined}
                          onRejectDuplicates={hasDupes ? () => setRejectReasonModal({ open: true, subIds: dupeIds, userName: sub.partner?.name || 'Partner', duplicateCount: duplicates.length }) : undefined}
                          onApprove={() => setReviewModal({ open: true, subId: sub.id, detectedVal: '', target: 'APPROVED' })}
                          onReject={() => setRejectReasonModal({ open: true, subIds: [sub.id], userName: sub.partner?.name || 'Partner', duplicateCount: 0 })}
                          onViewPost={sub.postUrl ? () => setEmbedModal({ open: true, url: sub.postUrl!, userName: sub.partner?.name || 'Partner', subtitle: challenge?.title, platform: sub.detectedPlatform ?? undefined }) : undefined}
                        />
                        {hasDupes && isExpanded && (
                          <div className="bg-orange-50/40 dark:bg-orange-900/10 border-t border-dashed border-orange-200 dark:border-orange-800">
                            {duplicates.map((dup: ChallengeSubmission, di: number) => (
                              <div key={dup.id} className={`pl-4 ${di > 0 ? 'border-t border-orange-100 dark:border-orange-900/30' : ''}`}>
                                <SubmissionRow
                                  sub={dup} actionId={actionId} isDuplicate
                                  onApprove={() => setReviewModal({ open: true, subId: dup.id, detectedVal: '', target: 'APPROVED' })}
                                  onReject={() => setRejectReasonModal({ open: true, subIds: [dup.id], userName: dup.partner?.name || 'Partner', duplicateCount: 0 })}
                                  onViewPost={dup.postUrl ? () => setEmbedModal({ open: true, url: dup.postUrl!, userName: dup.partner?.name || 'Partner', subtitle: challenge?.title, platform: dup.detectedPlatform ?? undefined }) : undefined}
                                />
                              </div>
                            ))}
                            <div className="px-4 pb-3">
                              <button onClick={() => setRejectReasonModal({ open: true, subIds: dupeIds, userName: sub.partner?.name || 'Partner', duplicateCount: duplicates.length })}
                                className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1">
                                <FaTimes size={9} /> Reject all {duplicates.length} duplicate{duplicates.length !== 1 ? 's' : ''}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Pagination */}
              {submissionTotal > 50 && (
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button onClick={() => fetchSubmissions(submissionPage - 1, submissionFilter)} disabled={submissionPage <= 1 || loadingSubmissions}
                    className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors">← Prev</button>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Page {submissionPage} of {Math.ceil(submissionTotal / 50)}</span>
                  <button onClick={() => fetchSubmissions(submissionPage + 1, submissionFilter)} disabled={submissionPage >= Math.ceil(submissionTotal / 50) || loadingSubmissions}
                    className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors">Next →</button>
                </div>
              )}
            </div>
          )}

          {/* ── Fraud ── */}
          {activeTab === 'fraud' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                <FaFlag size={14} className="text-red-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Fraud-Flagged Participations</h3>
                {fraudFlags.length > 0 && (
                  <span className="ml-auto text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-full font-medium">
                    {fraudFlags.length} flag{fraudFlags.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              {fraudFlags.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">
                  <FaExclamationTriangle size={24} className="mx-auto mb-2 opacity-30" />
                  <p>No flags detected — challenge looks clean ✓</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50 dark:divide-gray-700">
                  {fraudFlags.map((flag: any) => (
                    <div key={flag.id} className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        {flag.partner?.picture ? (
                          <img src={flag.partner.picture} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {flag.partner?.name?.[0]?.toUpperCase() ?? '?'}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900 dark:text-white">{flag.partner?.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{flag.partner?.email}</p>
                        </div>
                        <span className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-full font-medium shrink-0">FLAGGED</span>
                      </div>
                      {flag.flagReason && <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-1.5 border border-red-100 dark:border-red-900/30">{flag.flagReason}</p>}
                      <p className="text-xs text-gray-400 mt-1.5">{flag.flaggedAt ? new Date(flag.flaggedAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Unknown date'}</p>
                      {flag.metricLogs?.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Recent metric logs:</p>
                          <div className="space-y-1">
                            {flag.metricLogs.slice(0, 5).map((log: any, i: number) => (
                              <div key={i} className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                <span className="font-medium text-gray-700 dark:text-gray-300">{log.newValue?.toLocaleString()}</span>
                                <span className="text-gray-400">←</span>
                                <span>{log.oldValue?.toLocaleString()}</span>
                                <span className="text-gray-400">·</span>
                                <span>{new Date(log.createdAt).toLocaleDateString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}


          {/* ── Prizes ── */}
          {activeTab === 'prizes' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">Prize Structure</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Winners determined when the challenge completes</p>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {(challenge.prizes || []).map((prize, i) => (
                  <div key={prize.id} className="flex items-center gap-4 px-5 py-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 ${
                      i === 0 ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                      i === 1 ? 'bg-gray-100 dark:bg-gray-700' : 'bg-amber-100 dark:bg-amber-900/30'
                    }`}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${prize.rank}`}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">{prize.description || `Rank #${prize.rank}`}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{prize.structure?.replace(/_/g, ' ')}{prize.winnerId ? ' · Winner assigned ✓' : ''}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-extrabold text-green-600 dark:text-green-400">{formatPrice(prize.prizeAmount * USD_TO_KES_RATE)}</div>
                      {prize.winnerId && <div className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 justify-end mt-0.5"><FaCheckCircle size={9} /> Assigned</div>}
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

      {/* ── Social Post Embed Modal ─────────────────────────────────────────── */}
      {embedModal.open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEmbedModal({ open: false, url: '', userName: '' })} />
          <div className="relative w-full max-w-2xl max-h-[90vh] rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3 flex-shrink-0">
              <div className="min-w-0">
                <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{embedModal.userName}</p>
                {embedModal.subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{embedModal.subtitle}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a href={embedModal.url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  <FaExternalLinkAlt size={10} /> Open
                </a>
                <button onClick={() => setEmbedModal({ open: false, url: '', userName: '' })}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <FaTimes size={16} />
                </button>
              </div>
            </div>
            {/* Embed */}
            <div className="flex-1 overflow-y-auto p-4">
              <SocialEmbed url={embedModal.url} platform={embedModal.platform} className="w-full" />
            </div>
          </div>
        </div>
      )}

      {/* ── Approve Submission Modal ───────────────────────────────────────── */}
      {reviewModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-3">✅ Approve Submission</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Detected metric value <span className="text-gray-400 font-normal">(optional — leave blank to auto-fetch)</span>
              </label>
              <input type="number" value={reviewModal.detectedVal}
                onChange={(e) => setReviewModal(r => ({ ...r, detectedVal: e.target.value }))}
                placeholder="e.g. 12500"
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setReviewModal(r => ({ ...r, open: false }))}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                Cancel
              </button>
              <button onClick={() => {
                handleReviewSubmission(reviewModal.subId, 'APPROVED', reviewModal.detectedVal ? parseInt(reviewModal.detectedVal) : undefined)
                setReviewModal(r => ({ ...r, open: false }))
              }}
                className="flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-semibold bg-green-600 hover:bg-green-700">
                Confirm Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reject / Bulk-reject Reason Modal ────────────────────────────────── */}
      {rejectReasonModal.open && (
        <RejectReasonModal
          userName={
            rejectReasonModal.duplicateCount > 0
              ? `${rejectReasonModal.userName} (rejects this post + ${rejectReasonModal.duplicateCount} duplicate${rejectReasonModal.duplicateCount !== 1 ? 's' : ''})`
              : rejectReasonModal.userName
          }
          onCancel={() => setRejectReasonModal({ open: false, subIds: [], userName: 'Partner', duplicateCount: 0 })}
          onConfirm={async (reason) => {
            await handleReviewSubmission(rejectReasonModal.subIds, 'REJECTED', undefined, reason)
            setRejectReasonModal({ open: false, subIds: [], userName: 'Partner', duplicateCount: 0 })
          }}
        />
      )}

    </AdminLayout>
  )
}

// ─── Reject Reason Modal ──────────────────────────────────────────────────────

const RejectReasonModal: React.FC<{
  userName: string
  onCancel: () => void
  onConfirm: (reason: string) => Promise<void>
}> = ({ userName, onCancel, onConfirm }) => {
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md">
        <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1">❌ Reject Submission</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Rejecting submission for <span className="font-semibold text-gray-900 dark:text-white">{userName}</span>
        </p>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for rejection (min. 10 characters)…"
          rows={4}
          className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4 resize-none"
        />
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
            Cancel
          </button>
          <button
            disabled={reason.trim().length < 10 || submitting}
            onClick={async () => {
              setSubmitting(true)
              try { await onConfirm(reason.trim()) }
              finally { setSubmitting(false) }
            }}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting && <FaSpinner size={12} className="animate-spin" />}
            Confirm Reject
          </button>
        </div>
        {reason.trim().length > 0 && reason.trim().length < 10 && (
          <p className="text-xs text-red-500 mt-2 text-center">At least 10 characters required</p>
        )}
      </div>
    </div>
  )
}

export default VendorChallengeDetailPage
