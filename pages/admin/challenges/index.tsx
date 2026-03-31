// Vendor Challenges Dashboard
// Brand sponsors manage their challenge portfolio — view analytics, status, participants

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import AdminLayout from '@/components/admin/Layout'
import {
  vendorListChallenges,
  type Challenge,
  type ChallengeStatus,
} from '@/services/challenges'
import useCurrency from '@/hooks/useCurrency'
import toast from 'react-hot-toast'
import Link from 'next/link'
import {
  FaTrophy,
  FaPlus,
  FaSearch,
  FaSpinner,
  FaUsers,
  FaFire,
  FaCheckCircle,
  FaClock,
  FaChevronRight,
  FaCoins,
  FaEye,
  FaBolt,
  FaChartBar,
  FaRegClock,
  FaBan,
  FaFlag,
  FaEdit,
} from 'react-icons/fa'
import { MdPendingActions } from 'react-icons/md'

// ─── Types ────────────────────────────────────────────────────────────────────

const TABS: { label: string; value: ChallengeStatus | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Pending Review', value: 'PENDING_REVIEW' },
  { label: 'Scheduled', value: 'SCHEDULED' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Completed', value: 'COMPLETED' },
]

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; dot: string; icon: React.ReactNode }
> = {
  DRAFT: {
    label: 'Draft',
    color: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
    dot: 'bg-gray-400',
    icon: <FaEdit size={11} />,
  },
  PENDING_REVIEW: {
    label: 'Pending Review',
    color: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-400 animate-pulse',
    icon: <MdPendingActions size={13} />,
  },
  SCHEDULED: {
    label: 'Scheduled',
    color: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    dot: 'bg-blue-400',
    icon: <FaRegClock size={11} />,
  },
  ACTIVE: {
    label: 'Live 🔥',
    color: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    dot: 'bg-green-500 animate-pulse',
    icon: <FaFire size={11} />,
  },
  PAUSED: {
    label: 'Paused',
    color: 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    dot: 'bg-orange-400',
    icon: <FaBan size={11} />,
  },
  COMPLETED: {
    label: 'Completed',
    color: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
    dot: 'bg-indigo-400',
    icon: <FaCheckCircle size={11} />,
  },
  REJECTED: {
    label: 'Rejected',
    color: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    dot: 'bg-red-500',
    icon: <FaFlag size={11} />,
  },
}

// ─── Constants ────────────────────────────────────────────────────────────────

const USD_TO_KES_RATE = 130 // Backend stores amounts in USD; base currency for formatPrice is KES

// ─── Countdown helper ─────────────────────────────────────────────────────────

function daysUntil(date: string): number {
  return Math.max(0, Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000))
}

function daysLeft(endDate: string): string {
  const d = Math.max(0, Math.ceil((new Date(endDate).getTime() - Date.now()) / 86_400_000))
  if (d === 0) return 'Ends today'
  return `${d}d left`
}

// ─── Challenge Card ───────────────────────────────────────────────────────────

const ChallengeCard: React.FC<{ challenge: Challenge }> = ({ challenge }) => {
  const { formatPrice } = useCurrency()
  const cfg = STATUS_CONFIG[challenge.status] || STATUS_CONFIG['DRAFT']
  const topPrize = challenge.prizes?.[0]
  const participants = challenge._count?.participations ?? challenge.totalParticipants ?? 0

  return (
    <Link href={`/admin/challenges/${challenge.id}`}>
      <div className="group relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer">
        {/* Hero Image */}
        <div className="relative h-40 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 overflow-hidden">
          {challenge.heroImage ? (
            <img
              src={challenge.heroImage}
              alt={challenge.title}
              className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <FaTrophy className="text-white/30 text-7xl" />
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

          {/* Status badge */}
          <div className="absolute top-3 left-3">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm ${cfg.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
          </div>

          {/* Top prize overlay */}
          {topPrize && (
            <div className="absolute bottom-3 right-3">
              <div className="bg-black/50 backdrop-blur-sm rounded-xl px-3 py-1.5 flex items-center gap-1.5">
                <FaCoins size={11} className="text-yellow-400" />
                <span className="text-white text-sm font-bold">
                  {formatPrice(topPrize.prizeAmount * USD_TO_KES_RATE)}
                </span>
              </div>
            </div>
          )}

          {/* Time remaining for active */}
          {challenge.status === 'ACTIVE' && (
            <div className="absolute bottom-3 left-3">
              <div className="bg-black/50 backdrop-blur-sm rounded-xl px-3 py-1.5 flex items-center gap-1.5">
                <FaClock size={10} className="text-white/80" />
                <span className="text-white text-xs font-medium">{daysLeft(challenge.endDate)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-bold text-gray-900 dark:text-white text-base mb-1 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {challenge.title}
          </h3>

          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
            <span className="flex items-center gap-1">
              <FaBolt size={9} className="text-orange-400" />
              {challenge.metricType}
            </span>
            <span className="flex items-center gap-1">
              <FaUsers size={9} />
              {participants.toLocaleString()} participants
            </span>
          </div>

          {/* Prize budget bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-500 dark:text-gray-400">Prize Pool</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatPrice((challenge.prizeBudget ?? 0) * USD_TO_KES_RATE)}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {challenge.status === 'SCHEDULED'
                ? `Starts in ${daysUntil(challenge.startDate)}d`
                : challenge.status === 'COMPLETED'
                ? 'Challenge ended'
                : challenge.status === 'DRAFT'
                ? 'Awaiting submission'
                : challenge.status === 'PENDING_REVIEW'
                ? 'Under admin review'
                : ''}
            </div>
            <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 text-xs font-semibold group-hover:gap-2 transition-all">
              <FaEye size={11} /> View
              <FaChevronRight size={9} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

const EmptyState: React.FC<{ onCreateClick: () => void }> = ({ onCreateClick }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-yellow-400/20 to-orange-400/20 flex items-center justify-center mb-6 shadow-inner">
      <FaTrophy className="text-5xl text-yellow-500" />
    </div>
    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No challenges yet</h3>
    <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mb-6">
      Create your first brand challenge to engage the partner community with performance-based prizes.
    </p>
    <button
      onClick={onCreateClick}
      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5"
    >
      <FaPlus size={14} /> Create Challenge
    </button>
  </div>
)

// ─── Page ─────────────────────────────────────────────────────────────────────

const VendorChallengesPage: React.FC = () => {
  const router = useRouter()
  const { formatPrice } = useCurrency()

  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<ChallengeStatus | 'ALL'>('ALL')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  // Stats derived
  const totalBudget = challenges.reduce((s, c) => s + (c.prizeBudget ?? 0), 0)
  const activeCount = challenges.filter((c) => c.status === 'ACTIVE').length
  const totalParticipants = challenges.reduce(
    (s, c) => s + (c._count?.participations ?? c.totalParticipants ?? 0),
    0
  )

  const fetchChallenges = useCallback(async () => {
    try {
      setLoading(true)
      const res = await vendorListChallenges({
        status: activeTab === 'ALL' ? undefined : activeTab,
        search: search || undefined,
        limit: 50,
      })
      setChallenges((res as any).data || [])
    } catch (e: any) {
      toast.error('Failed to load challenges')
    } finally {
      setLoading(false)
    }
  }, [activeTab, search])

  useEffect(() => {
    fetchChallenges()
  }, [fetchChallenges])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400)
    return () => clearTimeout(t)
  }, [searchInput])

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 lg:p-8">

        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-200 dark:shadow-orange-900/30">
                <FaTrophy className="text-white text-lg" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                  My Challenges
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Sponsor performance-based challenges for your brand
                </p>
              </div>
            </div>
          </div>

          <Link href="/admin/challenges/create">
            <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 whitespace-nowrap">
              <FaPlus size={13} /> Create Challenge
            </button>
          </Link>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: 'Total Challenges',
              value: challenges.length,
              icon: <FaChartBar className="text-indigo-500" />,
              bg: 'from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20',
              border: 'border-indigo-200 dark:border-indigo-800',
            },
            {
              label: 'Active Now 🔥',
              value: activeCount,
              icon: <FaFire className="text-orange-500" />,
              bg: 'from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20',
              border: 'border-orange-200 dark:border-orange-800',
            },
            {
              label: 'Total Participants',
              value: totalParticipants.toLocaleString(),
              icon: <FaUsers className="text-teal-500" />,
              bg: 'from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20',
              border: 'border-teal-200 dark:border-teal-800',
            },
            {
              label: 'Prize Budget',
              value: formatPrice(totalBudget * USD_TO_KES_RATE),
              icon: <FaCoins className="text-yellow-500" />,
              bg: 'from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20',
              border: 'border-yellow-200 dark:border-yellow-800',
            },
          ].map((stat, i) => (
            <div key={i} className={`bg-gradient-to-br ${stat.bg} rounded-xl p-4 border ${stat.border} shadow-sm`}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400">{stat.label}</div>
                <div className="text-lg">{stat.icon}</div>
              </div>
              <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* ── Filter bar ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search challenges…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
            />
          </div>

          {/* Status tabs */}
          <div className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-1 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                  activeTab === tab.value
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <FaSpinner className="text-3xl text-indigo-600 animate-spin" />
          </div>
        ) : challenges.length === 0 ? (
          <EmptyState onCreateClick={() => router.push('/admin/challenges/create')} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {challenges.map((c) => (
              <ChallengeCard key={c.id} challenge={c} />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default VendorChallengesPage
