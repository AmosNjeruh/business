// Vendor Create Challenge Page
// Single-page with collapsible accordion sections + summary/payment step

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/router'
import AdminLayout from '@/components/admin/Layout'
import AudienceTargetingForm from '@/components/admin/campaigns/AudienceTargetingForm'
import {
  vendorGetChallenge,
  vendorUpdateChallenge,
  type ChallengeMetricType,
  type PrizeStructure,
  type CreateChallengePayload,
  type Challenge,
} from '@/services/challenges'
import { getVendorProfile } from '@/services/vendor'
import { getCurrentUser } from '@/services/auth'
import useCurrency from '@/hooks/useCurrency'
import toast from 'react-hot-toast'
import {
  FaTrophy,
  FaArrowLeft,
  FaSpinner,
  FaPlus,
  FaTrash,
  FaCheckCircle,
  FaBolt,
  FaCalendarAlt,
  FaInfoCircle,
  FaImage,
  FaChevronDown,
  FaChevronUp,
  FaUsers,
  FaChevronRight,
} from 'react-icons/fa'
import { MdAutoGraph, MdEmojiEvents, MdGroup } from 'react-icons/md'

// ─── Constants ────────────────────────────────────────────────────────────────

const METRIC_OPTIONS: { value: ChallengeMetricType; label: string; desc: string; icon: string }[] = [
  { value: 'LIKES',   label: 'Likes',             desc: 'Total likes on partner content during the challenge', icon: '❤️' },
  { value: 'SHARES',  label: 'Shares / Reposts',  desc: 'Shares & reposts across all platforms', icon: '🔄' },
  { value: 'VIEWS',   label: 'Views / Reach',     desc: 'Combined video & post views in the challenge period', icon: '👁️' },
  { value: 'CUSTOM',  label: 'Custom',            desc: 'Metric tracked & updated manually by the platform admin', icon: '📊' },
]

const PRIZE_STRUCTURES: { value: PrizeStructure; label: string; desc: string; icon: string }[] = [
  { value: 'WINNER_TAKES_ALL', label: 'Winner Takes All', desc: 'Top 1 partner gets the entire prize pool', icon: '🥇' },
  { value: 'TIERED',           label: 'Tiered (Top N)',   desc: 'Multiple ranked slots with different prizes', icon: '🏅' },
  { value: 'POOL',             label: 'Pool Split',       desc: 'Equal split among all who hit the goal', icon: '🤝' },
]

const NICHE_OPTIONS = [
  'Health', 'Finance', 'Tech', 'Fashion', 'Food', 'Travel',
  'Sports', 'Education', 'Entertainment', 'Real Estate', 'Beauty', 'Politics',
]

const USD_TO_KES_RATE = 130 // Approximate rate — same as campaigns

// ─── Types ────────────────────────────────────────────────────────────────────

interface PrizeTier {
  rank: number
  prizeAmount: string
  description: string
}

interface FormState {
  title: string
  description: string
  heroImage: string
  metricType: ChallengeMetricType
  goalValue: string
  startDate: string
  endDate: string
  prizeStructure: PrizeStructure
  prizeTiers: PrizeTier[]
  maxParticipants: string
}

const INITIAL_FORM: FormState = {
  title: '',
  description: '',
  heroImage: '',
  metricType: 'LIKES',
  goalValue: '100',
  startDate: '',
  endDate: '',
  prizeStructure: 'TIERED',
  prizeTiers: [
    { rank: 1, prizeAmount: '', description: '1st place' },
    { rank: 2, prizeAmount: '', description: '2nd place' },
    { rank: 3, prizeAmount: '', description: '3rd place' },
  ],
  maxParticipants: '',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sectionComplete(section: string, form: FormState): boolean {
  switch (section) {
    case 'basics':   return !!(form.title.trim() && form.description.trim())
    case 'goal':     return !!(form.metricType && form.goalValue && form.startDate && form.endDate)
    case 'prizes':   return form.prizeTiers.some((t) => parseFloat(t.prizeAmount) > 0)
    case 'audience': return true
    default:         return false
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const Section: React.FC<{
  id: string
  title: string
  subtitle: string
  icon: React.ReactNode
  open: boolean
  complete: boolean
  onToggle: () => void
  children: React.ReactNode
}> = ({ title, subtitle, icon, open, complete, onToggle, children }) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
    >
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 transition-colors ${
          complete
            ? 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400'
            : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
        }`}>
          {complete ? <FaCheckCircle size={16} /> : icon}
        </div>
        <div>
          <div className="font-bold text-gray-900 dark:text-white text-sm">{title}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {complete && (
          <span className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
            Done
          </span>
        )}
        {open ? <FaChevronUp size={12} className="text-gray-400" /> : <FaChevronDown size={12} className="text-gray-400" />}
      </div>
    </button>
    {open && (
      <div className="px-6 pb-6 pt-2 border-t border-gray-100 dark:border-gray-700">
        {children}
      </div>
    )}
  </div>
)

// ─── Section: Basics ──────────────────────────────────────────────────────────

const BasicsSection: React.FC<{
  form: FormState
  setForm: React.Dispatch<React.SetStateAction<FormState>>
  uploading: boolean
  onImageUpload: (file: File) => void
}> = ({ form, setForm, uploading, onImageUpload }) => {
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
          Challenge Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="e.g., Safaricom Referral Sprint — Win Big"
          maxLength={120}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition placeholder-gray-400"
        />
        <p className="text-xs text-gray-400 mt-1 text-right">{form.title.length}/120</p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Describe what partners need to do, why it's exciting, and any key rules…"
          rows={4}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition placeholder-gray-400 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
          Banner Image <span className="text-xs font-normal text-gray-400 ml-1">(optional · 1200×600px recommended)</span>
        </label>
        <div
          onClick={() => fileRef.current?.click()}
          className={`relative w-full h-36 sm:h-44 rounded-2xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center overflow-hidden transition-all ${
            form.heroImage
              ? 'border-indigo-400 dark:border-indigo-600'
              : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10'
          }`}
        >
          {form.heroImage ? (
            <>
              <img src={form.heroImage} alt="Banner" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <span className="text-white text-sm font-semibold">Change Image</span>
              </div>
            </>
          ) : uploading ? (
            <>
              <FaSpinner className="text-indigo-500 text-2xl animate-spin mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Uploading…</p>
            </>
          ) : (
            <>
              <FaImage className="text-gray-300 dark:text-gray-600 text-3xl mb-2" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Click to upload banner</p>
              <p className="text-xs text-gray-400 mt-0.5">PNG, JPG up to 5MB</p>
            </>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => e.target.files?.[0] && onImageUpload(e.target.files[0])} />
      </div>
    </div>
  )
}

// ─── Section: Goal & Dates ────────────────────────────────────────────────────

const GoalSection: React.FC<{
  form: FormState
  setForm: React.Dispatch<React.SetStateAction<FormState>>
}> = ({ form, setForm }) => {
  const today = new Date().toISOString().split('T')[0]!
  const durationDays = form.startDate && form.endDate
    ? Math.max(0, Math.ceil((new Date(form.endDate).getTime() - new Date(form.startDate).getTime()) / 86_400_000))
    : null

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Performance Metric <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {METRIC_OPTIONS.map((m) => (
            <button key={m.value} type="button"
              onClick={() => setForm((f) => ({ ...f, metricType: m.value }))}
              className={`relative p-3 rounded-xl border-2 text-left transition-all duration-150 ${
                form.metricType === m.value
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 shadow-sm'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:border-indigo-300 dark:hover:border-indigo-700'
              }`}
            >
              <div className="text-xl mb-1.5">{m.icon}</div>
              <div className="font-semibold text-xs text-gray-900 dark:text-white leading-tight">{m.label}</div>
              <div className="text-[11px] text-gray-400 mt-0.5 line-clamp-2 leading-snug">{m.desc}</div>
              {form.metricType === m.value && <FaCheckCircle size={11} className="absolute top-2 right-2 text-indigo-500" />}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xs:grid-cols-3 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Goal Target <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input type="number" min={1} value={form.goalValue}
              onChange={(e) => setForm((f) => ({ ...f, goalValue: e.target.value }))}
              placeholder="100"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium pointer-events-none">
              {METRIC_OPTIONS.find((m) => m.value === form.metricType)?.label}
            </span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            <FaCalendarAlt className="inline mr-1.5 text-indigo-400" size={11} />
            Start Date <span className="text-red-500">*</span>
          </label>
          <input type="date" value={form.startDate} min={today}
            onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            <FaCalendarAlt className="inline mr-1.5 text-indigo-400" size={11} />
            End Date <span className="text-red-500">*</span>
          </label>
          <input type="date" value={form.endDate} min={form.startDate || today}
            onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
          />
        </div>
      </div>

      {durationDays !== null && (
        <div className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 text-sm px-4 py-2 rounded-xl border border-indigo-100 dark:border-indigo-800">
          <FaBolt size={11} />
          <span>Duration: <strong>{durationDays} day{durationDays !== 1 ? 's' : ''}</strong></span>
        </div>
      )}
    </div>
  )
}

// ─── Section: Prizes ─────────────────────────────────────────────────────────

const PrizesSection: React.FC<{
  form: FormState
  setForm: React.Dispatch<React.SetStateAction<FormState>>
  currencySymbol: string
}> = ({ form, setForm, currencySymbol }) => {
  const totalPrize = form.prizeTiers.reduce((s, t) => s + (parseFloat(t.prizeAmount) || 0), 0)

  const addTier = () => setForm((f) => ({
    ...f,
    prizeTiers: [...f.prizeTiers, { rank: f.prizeTiers.length + 1, prizeAmount: '', description: `${f.prizeTiers.length + 1}th place` }],
  }))

  const removeTier = (i: number) => setForm((f) => ({
    ...f,
    prizeTiers: f.prizeTiers.filter((_, idx) => idx !== i).map((t, idx) => ({ ...t, rank: idx + 1 })),
  }))

  const updateTier = (i: number, key: keyof PrizeTier, val: string | number) =>
    setForm((f) => ({ ...f, prizeTiers: f.prizeTiers.map((t, idx) => idx === i ? { ...t, [key]: val } : t) }))

  const displayTiers = form.prizeStructure !== 'TIERED'
    ? [form.prizeTiers[0]].filter(Boolean) as PrizeTier[]
    : form.prizeTiers

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Prize Structure <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 xs:grid-cols-3 sm:grid-cols-3 gap-3">
          {PRIZE_STRUCTURES.map((ps) => (
            <button key={ps.value} type="button"
              onClick={() => setForm((f) => ({ ...f, prizeStructure: ps.value }))}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                form.prizeStructure === ps.value
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:border-indigo-300 dark:hover:border-indigo-700'
              }`}
            >
              <div className="text-xl mb-1.5">{ps.icon}</div>
              <div className="font-semibold text-sm text-gray-900 dark:text-white">{ps.label}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{ps.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Prize Amounts ({currencySymbol})</label>
          {form.prizeStructure === 'TIERED' && form.prizeTiers.length < 10 && (
            <button type="button" onClick={addTier}
              className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-semibold">
              <FaPlus size={10} /> Add rank
            </button>
          )}
        </div>
        <div className="space-y-2">
          {displayTiers.map((tier, idx) => (
            <div key={idx} className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                tier.rank === 1 ? 'bg-yellow-400 text-yellow-900' :
                tier.rank === 2 ? 'bg-gray-300 text-gray-700' :
                tier.rank === 3 ? 'bg-amber-600 text-white' :
                'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
              }`}>
                {tier.rank === 1 ? '🥇' : tier.rank === 2 ? '🥈' : tier.rank === 3 ? '🥉' : `#${tier.rank}`}
              </div>
              <input type="text" value={tier.description}
                onChange={(e) => updateTier(idx, 'description', e.target.value)}
                placeholder="Label"
                className="flex-1 min-w-0 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="relative flex-shrink-0 w-full sm:w-36">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium pointer-events-none">{currencySymbol}</span>
                <input type="number" min={0} value={tier.prizeAmount}
                  onChange={(e) => updateTier(idx, 'prizeAmount', e.target.value)}
                  placeholder="0"
                  className="w-full pl-7 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              {form.prizeStructure === 'TIERED' && form.prizeTiers.length > 1 && (
                <button type="button" onClick={() => removeTier(idx)} className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0 ml-auto sm:ml-0">
                  <FaTrash size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {totalPrize > 0 && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800">
          <div className="flex justify-between font-bold text-sm">
            <span className="text-gray-700 dark:text-gray-300">Total Prize Pool</span>
            <span className="text-indigo-600 dark:text-indigo-400">{currencySymbol}{totalPrize.toLocaleString()}</span>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Platform fees are deducted during payout, not at creation.</p>
        </div>
      )}
    </div>
  )
}

// ─── Summary Card (live preview in form step) ─────────────────────────────────

const SummaryCard: React.FC<{ form: FormState; currencySymbol: string }> = ({ form, currencySymbol }) => {
  const metric = METRIC_OPTIONS.find((m) => m.value === form.metricType)
  const totalPrize = form.prizeTiers.reduce((s, t) => s + (parseFloat(t.prizeAmount) || 0), 0)
  const durationDays = form.startDate && form.endDate
    ? Math.max(0, Math.ceil((new Date(form.endDate).getTime() - new Date(form.startDate).getTime()) / 86_400_000))
    : null

  const pills = [
    metric && { icon: metric.icon, label: `${metric.label} × ${parseInt(form.goalValue || '0').toLocaleString()}` },
    durationDays !== null && { icon: '📅', label: `${durationDays} days` },
    totalPrize > 0 && { icon: '💰', label: `${currencySymbol}${totalPrize.toLocaleString()} pool` },
  ].filter(Boolean) as { icon: string; label: string }[]

  if (pills.length === 0) return null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Challenge Preview</p>
      {form.title && (
        <p className="font-bold text-gray-900 dark:text-white text-base mb-3 leading-snug truncate">{form.title}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {pills.map(({ icon, label }) => (
          <span key={label}
            className="inline-flex items-center gap-1.5 text-xs font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-full border border-indigo-100 dark:border-indigo-800">
            <span>{icon}</span>{label}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Sections config ──────────────────────────────────────────────────────────

const SECTIONS = [
  { id: 'basics',   title: 'Challenge Details',  subtitle: 'Title, description, and banner image', icon: <FaInfoCircle size={16} /> },
  { id: 'goal',     title: 'Goal & Timeline',    subtitle: 'Metric type, target, and dates',        icon: <MdAutoGraph size={18} /> },
  { id: 'prizes',   title: 'Prizes',             subtitle: 'Structure, prize amounts, fee breakdown', icon: <MdEmojiEvents size={18} /> },
]

// ─── Main Page ────────────────────────────────────────────────────────────────

const EditChallengePage: React.FC = () => {
  const router = useRouter()
  const { id } = router.query
  const { selectedCurrency: userCurrency, currencySymbol } = useCurrency()
  const user = getCurrentUser()

  const [form, setForm]       = useState<FormState>(INITIAL_FORM)
  const [open, setOpen]       = useState<Record<string, boolean>>({ basics: true, goal: true, prizes: true })
  const [submitting, setSubmitting]         = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [loading, setLoading] = useState(true)
  const [challengeStatus, setChallengeStatus] = useState<string>('')
  const [audienceTargeting, setAudienceTargeting] = useState<{
    locations?: { lat?: number; lng?: number; radius?: number; address: string; type?: 'text' | 'map' }[]
  } | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    vendorGetChallenge(id as string)
      .then((res: any) => {
        const challengeData: Challenge = res?.challenge || res
        const challengeAny = challengeData as any
        const prizes = (challengeData.prizes || []).slice().sort((a, b) => a.rank - b.rank)
        const prizeStructure = (prizes[0]?.structure || 'TIERED') as PrizeStructure
        const normalizedTiers = (prizeStructure === 'POOL'
          ? [{ rank: 1, prizeAmount: String(prizes[0]?.prizeAmount ?? ''), description: prizes[0]?.description || 'Qualified participants' }]
          : prizes.map((p, idx) => ({
              rank: p.rank > 0 ? p.rank : idx + 1,
              prizeAmount: String(p.prizeAmount ?? ''),
              description: p.description || `${idx + 1}${idx === 0 ? 'st' : idx === 1 ? 'nd' : idx === 2 ? 'rd' : 'th'} place`,
            })))

        setForm({
          title: challengeData.title || '',
          description: challengeData.description || '',
          heroImage: challengeData.heroImage || '',
          metricType: challengeData.metricType || 'LIKES',
          goalValue: String(challengeData.goalValue ?? ''),
          startDate: challengeData.startDate ? new Date(challengeData.startDate).toISOString().split('T')[0] || '' : '',
          endDate: challengeData.endDate ? new Date(challengeData.endDate).toISOString().split('T')[0] || '' : '',
          prizeStructure,
          prizeTiers: normalizedTiers.length > 0 ? normalizedTiers : INITIAL_FORM.prizeTiers,
          maxParticipants: String((res?.fraudConfig?.maxParticipants ?? challengeAny?.fraudConfig?.maxParticipants ?? '') || ''),
        })
        setChallengeStatus(challengeData.status || '')
        setAudienceTargeting((res?.audienceTargeting || challengeAny?.audienceTargeting || null) as any)
      })
      .catch(() => {
        toast.error('Failed to load challenge')
        router.push('/admin/challenges')
      })
      .finally(() => setLoading(false))
  }, [id, router])

  useEffect(() => {
    if (audienceTargeting?.locations && audienceTargeting.locations.length > 0) return

    const profileCountry = (user as any)?.vendorSettings?.country as string | undefined
    if (profileCountry) {
      setAudienceTargeting({
        locations: [{ address: profileCountry, type: 'text' }],
      })
      return
    }

    getVendorProfile()
      .then((settings: any) => {
        const country = (settings?.country as string | undefined) || (settings?.vendorSettings?.country as string | undefined)
        if (country) {
          setAudienceTargeting({
            locations: [{ address: country, type: 'text' }],
          })
        }
      })
      .catch(() => {})
  }, [audienceTargeting?.locations?.length])

  const toggle = useCallback((id: string) => setOpen((o) => ({ ...o, [id]: !o[id] })), [])

  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImage(true)
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const base64 = reader.result as string
        setForm((f) => ({ ...f, heroImage: base64 }))
        setUploadingImage(false)
      }
      reader.onerror = () => {
        toast.error('Image upload failed')
        setUploadingImage(false)
      }
    } catch {
      toast.error('Image upload failed')
      setUploadingImage(false)
    }
  }

  const validate = (): boolean => {
    if (!form.title.trim())       { toast.error('Challenge title is required'); return false }
    if (!form.description.trim()) { toast.error('Description is required');     return false }
    if (!form.goalValue || parseInt(form.goalValue) < 1) { toast.error('Goal value must be at least 1'); return false }
    if (!form.startDate)          { toast.error('Start date is required');       return false }
    if (!form.endDate)            { toast.error('End date is required');         return false }
    if (new Date(form.startDate) >= new Date(form.endDate)) { toast.error('End date must be after start date'); return false }
    const total = form.prizeTiers.reduce((s, t) => s + (parseFloat(t.prizeAmount) || 0), 0)
    if (total <= 0) { toast.error('Total prize pool must be greater than 0'); return false }
    return true
  }

  const buildPayload = (): CreateChallengePayload => {
    const prizes = (
      form.prizeStructure === 'WINNER_TAKES_ALL' ? [form.prizeTiers[0]] :
      form.prizeStructure === 'POOL'             ? [{ ...form.prizeTiers[0], rank: 0 }] :
      form.prizeTiers
    )
      .filter((t) => t && parseFloat(t.prizeAmount) > 0)
      .map((t) => ({
        structure: form.prizeStructure,
        rank: t.rank,
        prizeAmount: parseFloat(t.prizeAmount),
        description: t.description,
      }))

    const totalPrize  = prizes.reduce((s, p) => s + p.prizeAmount, 0)

    return {
      title: form.title,
      description: form.description,
      heroImage: form.heroImage || undefined,
      startDate: form.startDate,
      endDate: form.endDate,
      metricType: form.metricType,
      goalValue: parseInt(form.goalValue),
      prizeBudget: totalPrize,
      prizes,
      audienceTargeting: audienceTargeting ?? undefined,
      fraudConfig: {
        maxParticipants: form.maxParticipants ? parseInt(form.maxParticipants) : undefined,
      },
    }
  }

  const handleSave = async () => {
    if (!validate()) return
    if (!id) return
    const payload = buildPayload()

    const prizeInUSD = userCurrency === 'KES'
      ? parseFloat(((payload.prizeBudget || 0) / USD_TO_KES_RATE).toFixed(2))
      : (payload.prizeBudget || 0)

    setSubmitting(true)
    try {
      const payloadForUpdate: Partial<CreateChallengePayload> = {
        ...payload,
        prizeBudget: prizeInUSD,
        prizes: payload.prizes.map(p => ({
          ...p,
          prizeAmount: userCurrency === 'KES' ? parseFloat((p.prizeAmount / USD_TO_KES_RATE).toFixed(2)) : p.prizeAmount,
        })),
      }
      await vendorUpdateChallenge(id as string, payloadForUpdate)
      toast.success('Challenge updated successfully')
      router.push(`/admin/challenges/${id}`)
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to update challenge')
    } finally {
      setSubmitting(false)
    }
  }

  const allRequiredDone = sectionComplete('basics', form) && sectionComplete('goal', form) && sectionComplete('prizes', form)
  const canEdit = ['DRAFT', 'PENDING_REVIEW', 'REJECTED', 'SCHEDULED'].includes(challengeStatus)

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <FaSpinner className="animate-spin text-2xl text-indigo-500" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-3 sm:p-4 lg:p-6">
        <div className="w-full mx-auto max-w-7xl">
              {/* Page header */}
              <div className="flex items-center gap-4 mb-6">
                <button onClick={() => router.push(`/admin/challenges/${id}`)}
                  className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300 flex-shrink-0">
                  <FaArrowLeft size={14} />
                </button>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">Edit Challenge</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Update challenge details without losing existing setup</p>
                </div>
              </div>

          {!canEdit && (
              <div className="flex items-start gap-2.5 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300 mb-6">
                <FaInfoCircle size={14} className="mt-0.5 flex-shrink-0" />
                <span>
                  This challenge is currently <strong>{challengeStatus || 'locked'}</strong> and cannot be edited.
                </span>
              </div>
          )}

              {/* Two-column layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-4">
                  {SECTIONS.filter((s) => s.id === 'basics' || s.id === 'goal').map((s) => (
                    <Section key={s.id} id={s.id} title={s.title} subtitle={s.subtitle} icon={s.icon}
                      open={!!open[s.id]} complete={sectionComplete(s.id, form)} onToggle={() => toggle(s.id)}>
                      {s.id === 'basics' && <BasicsSection form={form} setForm={setForm} uploading={uploadingImage} onImageUpload={handleImageUpload} />}
                      {s.id === 'goal'   && <GoalSection   form={form} setForm={setForm} />}
                    </Section>
                  ))}
                </div>

                <div className="space-y-4">
                  <Section
                    id="prizes"
                    title="Prizes"
                    subtitle="Structure, prize amounts, fee breakdown"
                    icon={<MdEmojiEvents size={18} />}
                    open={!!open['prizes']}
                    complete={sectionComplete('prizes', form)}
                    onToggle={() => toggle('prizes')}
                  >
                    <PrizesSection form={form} setForm={setForm} currencySymbol={currencySymbol} />
                  </Section>

                  <AudienceTargetingForm
                    audienceTargeting={audienceTargeting}
                    onChange={setAudienceTargeting}
                  />

                  <SummaryCard form={form} currencySymbol={currencySymbol} />

                  <button type="button" onClick={handleSave}
                    disabled={!allRequiredDone || !canEdit || submitting}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 transition-all duration-200 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? <FaSpinner size={13} className="animate-spin" /> : <FaChevronRight size={13} />}
                    {submitting ? 'Saving changes...' : 'Save Changes'}
                  </button>

                  {!allRequiredDone && (
                    <p className="text-center text-xs text-gray-400">
                      Complete <strong>Details</strong>, <strong>Goal</strong>, and <strong>Prizes</strong> sections to save
                    </p>
                  )}
                </div>
              </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default EditChallengePage
