// Vendor Create Challenge Page
// Single-page with collapsible accordion sections + summary/payment step

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import AdminLayout from '@/components/admin/Layout'
import AudienceTargetingForm from '@/components/admin/campaigns/AudienceTargetingForm'
import {
  vendorCreateChallenge,
  vendorAnalyzeChallengeDraft,
  type ChallengeMetricType,
  type PrizeStructure,
  type CreateChallengePayload,
  type ChallengeDraftAnalysisResult,
} from '@/services/challenges'
import { createStripeCheckoutSession, createPaystackSession, getVendorBalance, getVendorProfile } from '@/services/vendor'
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
  FaWallet,
  FaCreditCard,
  FaExchangeAlt,
  FaShieldAlt,
  FaStar,
  FaChevronRight,
  FaMagic,
} from 'react-icons/fa'
import { MdAutoGraph, MdEmojiEvents, MdGroup } from 'react-icons/md'
import { SiStripe } from 'react-icons/si'

// ─── Constants ────────────────────────────────────────────────────────────────

const METRIC_OPTIONS: { value: ChallengeMetricType; label: string; desc: string; icon: string }[] = [
  { value: 'LIKES',   label: 'Likes',             desc: 'Total likes on partner content during the challenge', icon: '❤️' },
  { value: 'SHARES',  label: 'Shares / Reposts',  desc: 'Shares & reposts across all platforms', icon: '🔄' },
  { value: 'VIEWS',   label: 'Views / Reach',     desc: 'Combined video & post views in the challenge period', icon: '👁️' },
  { value: 'CUSTOM',  label: 'Custom',            desc: 'Metric tracked & updated manually by the platform admin', icon: '📊' },
]

type ChallengeSocialPlatformOption = {
  readonly value: string
  readonly label: string
  readonly manual?: boolean
}

const SOCIAL_PLATFORM_OPTIONS: readonly ChallengeSocialPlatformOption[] = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'x', label: 'Twitter/X', manual: true },
  { value: 'linkedin', label: 'LinkedIn' },
]

const PRIZE_STRUCTURES: { value: PrizeStructure; label: string; desc: string; icon: string }[] = [
  { value: 'TIERED',           label: 'Tiered (Top N)',   desc: 'Multiple ranked slots with different prizes', icon: '🏅' },
  { value: 'WINNER_TAKES_ALL', label: 'Winner Takes All', desc: 'Top 1 partner gets the entire prize pool', icon: '🥇' },
  { value: 'POOL',             label: 'Pool Split',       desc: 'Equal split among all who hit the goal', icon: '🤝' },
]

const NICHE_OPTIONS = [
  'Health', 'Finance', 'Tech', 'Fashion', 'Food', 'Travel',
  'Sports', 'Education', 'Entertainment', 'Real Estate', 'Beauty', 'Politics',
]

const USD_TO_KES_RATE = 130 // Approximate rate — same as campaigns

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 'form' | 'summary'
type PayMethod = 'stripe' | 'paystack' | 'balance'

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
  socialPlatforms: string[]
  hashtags: string[]
  contentStyle: 'CREATOR_CREATIVITY' | 'AS_BRIEFED'
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
  socialPlatforms: SOCIAL_PLATFORM_OPTIONS.map((p) => p.value),
  hashtags: [],
  contentStyle: 'CREATOR_CREATIVITY',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sectionComplete(section: string, form: FormState): boolean {
  switch (section) {
    case 'basics':   return !!(form.title.trim() && form.description.trim())
    case 'goal':     return !!(form.metricType && form.goalValue && form.startDate && form.endDate && form.socialPlatforms.length > 0 && form.hashtags.length > 0)
    case 'prizes':   return form.prizeTiers.some((t) => parseFloat(t.prizeAmount) > 0)
    case 'audience': return true
    default:         return false
  }
}

const ensureHashPrefix = (raw: string): string => {
  const trimmed = raw.trim().replace(/\s+/g, '')
  if (!trimmed) return ''
  const withoutHashes = trimmed.replace(/^#+/, '')
  return withoutHashes ? `#${withoutHashes.toLowerCase()}` : ''
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
  const [showIndividualPlatforms, setShowIndividualPlatforms] = useState(false)
  const [hashtagInput, setHashtagInput] = useState('')
  const today = new Date().toISOString().split('T')[0]!
  const durationDays = form.startDate && form.endDate
    ? Math.max(0, Math.ceil((new Date(form.endDate).getTime() - new Date(form.startDate).getTime()) / 86_400_000))
    : null
  const allPlatformsSelected = SOCIAL_PLATFORM_OPTIONS.every((p) => form.socialPlatforms.includes(p.value))

  const togglePlatform = (platform: string) => {
    const selected = form.socialPlatforms.includes(platform)
    setForm((f) => ({
      ...f,
      socialPlatforms: selected
        ? f.socialPlatforms.filter((p) => p !== platform)
        : [...f.socialPlatforms, platform],
    }))
  }

  const addHashtag = () => {
    const normalized = ensureHashPrefix(hashtagInput)
    if (!normalized) return
    if (form.hashtags.includes(normalized)) {
      setHashtagInput('')
      return
    }
    setForm((f) => ({ ...f, hashtags: [...f.hashtags, normalized] }))
    setHashtagInput('')
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Performance Metric <span className="text-red-500">*</span>
        </label>
        <div className="bus-responsive-two-col gap-2">
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

      <div className="bus-responsive-tile-grid gap-3">
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

      <div className="space-y-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/50 p-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Content Direction
          </label>
          <div className="bus-responsive-two-col gap-2">
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, contentStyle: 'CREATOR_CREATIVITY' }))}
              className={`text-left p-3 rounded-lg border ${
                form.contentStyle === 'CREATOR_CREATIVITY'
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/40'
              }`}
            >
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Creator Creativity</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Recommended for better conversion due to authenticity.</p>
            </button>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, contentStyle: 'AS_BRIEFED' }))}
              className={`text-left p-3 rounded-lg border ${
                form.contentStyle === 'AS_BRIEFED'
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/40'
              }`}
            >
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Post As Briefed</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Creators should follow your exact messaging.</p>
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Allowed Platforms <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onClick={() =>
              setForm((f) => ({
                ...f,
                socialPlatforms: allPlatformsSelected ? [] : SOCIAL_PLATFORM_OPTIONS.map((p) => p.value),
              }))
            }
            className={`w-full text-left px-3 py-3 rounded-lg border-2 transition-all ${
              allPlatformsSelected
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/40 hover:border-indigo-300'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">All Platforms</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
                Recommended
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Includes Instagram, Facebook, TikTok, YouTube, Twitter/X, and LinkedIn</p>
          </button>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {allPlatformsSelected ? 'Using all platforms (recommended)' : `Selected ${form.socialPlatforms.length} platform(s)`}
            </p>
            <button
              type="button"
              onClick={() => setShowIndividualPlatforms((v) => !v)}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
            >
              {showIndividualPlatforms ? 'Hide individual selection' : 'Choose individual platforms'}
            </button>
          </div>
          {showIndividualPlatforms && (
            <div className="bus-responsive-two-col gap-2 mt-2">
              {SOCIAL_PLATFORM_OPTIONS.map((platform) => {
                const selected = form.socialPlatforms.includes(platform.value)
                return (
                  <button
                    key={platform.value}
                    type="button"
                    onClick={() => togglePlatform(platform.value)}
                    className={`text-left px-3 py-2.5 rounded-lg border transition-all ${
                      selected
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                        : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/40 text-gray-700 dark:text-gray-300 hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{platform.label}</span>
                      {platform.manual ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                          Manual tracking
                        </span>
                      ) : null}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Required Hashtags <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={hashtagInput}
              onChange={(e) => setHashtagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addHashtag()
                }
              }}
              placeholder="#brandchallenge"
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button type="button" onClick={addHashtag} className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold">
              Add
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Tip: if you forget `#`, we add it automatically.</p>
          {form.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {form.hashtags.map((tag) => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => setForm((f) => ({ ...f, hashtags: f.hashtags.filter((t) => t !== tag) }))}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                >
                  {tag} <span aria-hidden>×</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
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
        <div className="bus-responsive-tile-grid gap-3">
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
              {ps.value === 'TIERED' && (
                <span className="inline-flex w-fit max-w-full mt-1 text-[10px] px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
                  Recommended
                </span>
              )}
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

// ─── Highlights / Payment Summary Page ───────────────────────────────────────

interface PaymentSummaryProps {
  form: FormState
  vendorBalance: number | null
  userCurrency: string
  currencySymbol: string
  onBack: () => void
  onPay: (method: PayMethod, currency: 'USD' | 'KES') => Promise<void>
  paying: boolean
}

const PaymentSummaryPage: React.FC<PaymentSummaryProps> = ({
  form, vendorBalance, userCurrency, currencySymbol, onBack, onPay, paying,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PayMethod | null>(null)
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'KES'>('USD')

  // Budget entered in user's preferred currency; convert to USD for Stripe/balance checks (same as campaigns)
  const totalPrize    = form.prizeTiers.reduce((s, t) => s + (parseFloat(t.prizeAmount) || 0), 0)
  const totalInUSD    = userCurrency === 'KES' ? parseFloat((totalPrize / USD_TO_KES_RATE).toFixed(2)) : totalPrize

  const balanceCoversAll = vendorBalance !== null && vendorBalance >= totalInUSD

  const metric = METRIC_OPTIONS.find((m) => m.value === form.metricType)
  const durationDays = form.startDate && form.endDate
    ? Math.max(0, Math.ceil((new Date(form.endDate).getTime() - new Date(form.startDate).getTime()) / 86_400_000))
    : 0

  const canProceed = selectedMethod !== null

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back + header */}
      <div className="flex items-center gap-4">
        <button onClick={onBack}
          className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300 flex-shrink-0">
          <FaArrowLeft size={14} />
        </button>
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">Review & Pay</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Confirm your challenge details and complete payment to submit for review</p>
        </div>
      </div>

      <div className="flex flex-col gap-6 @xl/bus-main:flex-row @xl/bus-main:items-start @xl/bus-main:gap-8">
        {/* Left — challenge summary */}
        <div className="min-w-0 flex-1 space-y-5 @xl/bus-main:min-w-0 @xl/bus-main:flex-[3]">
          {/* Hero banner */}
          {form.heroImage && (
            <div className="relative w-full h-40 rounded-2xl overflow-hidden">
              <img src={form.heroImage} alt="Challenge banner" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent" />
              <div className="absolute bottom-3 left-4">
                <h3 className="text-white font-bold text-lg leading-tight">{form.title}</h3>
              </div>
            </div>
          )}

          {/* Title (if no banner) */}
          {!form.heroImage && (
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-2">
                <FaTrophy className="text-yellow-300" size={20} />
                <span className="text-white/80 text-sm font-medium uppercase tracking-wide">Challenge</span>
              </div>
              <h3 className="text-white font-bold text-xl leading-tight">{form.title}</h3>
              <p className="text-white/70 text-sm mt-2 line-clamp-2">{form.description}</p>
            </div>
          )}

          {/* Key details */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
            <h4 className="font-bold text-gray-900 dark:text-white text-sm">Challenge Overview</h4>
            <div className="bus-responsive-two-col gap-4">
              {[
                { label: 'Metric', value: `${metric?.icon} ${metric?.label}` },
                { label: 'Goal', value: parseInt(form.goalValue || '0').toLocaleString() },
                { label: 'Start', value: form.startDate ? new Date(form.startDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' },
                { label: 'End', value: form.endDate ? new Date(form.endDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' },
                { label: 'Duration', value: `${durationDays} days` },
                { label: 'Prize Structure', value: PRIZE_STRUCTURES.find(p => p.value === form.prizeStructure)?.label || form.prizeStructure },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Prize tiers */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
            <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-3">Prize Distribution</h4>
            <div className="space-y-2">
              {form.prizeTiers
                .filter(t => parseFloat(t.prizeAmount) > 0)
                .slice(0, form.prizeStructure === 'TIERED' ? undefined : 1)
                .map((tier) => (
                  <div key={tier.rank} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-base">
                        {tier.rank === 1 ? '🥇' : tier.rank === 2 ? '🥈' : tier.rank === 3 ? '🥉' : `#${tier.rank}`}
                      </span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{tier.description}</span>
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white">{currencySymbol}{parseFloat(tier.prizeAmount).toLocaleString()}</span>
                  </div>
                ))}
            </div>
          </div>

        </div>

        {/* Right — payment */}
        <div className="w-full min-w-0 space-y-5 @xl/bus-main:w-auto @xl/bus-main:max-w-md @xl/bus-main:flex-[2] @xl/bus-main:flex-shrink-0">
          {/* Fee breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 sticky top-4">
            <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-4">Payment Summary</h4>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Prize Pool</span>
                <span className="font-semibold text-gray-900 dark:text-white">{currencySymbol}{totalPrize.toLocaleString()}</span>
              </div>
              <div className="h-px bg-gray-200 dark:bg-gray-700 my-2" />
              <div className="flex justify-between font-bold text-base">
                <span className="text-gray-900 dark:text-white">Total</span>
                <div className="text-right">
                  <div className="text-indigo-600 dark:text-indigo-400">{currencySymbol}{totalPrize.toLocaleString()}</div>
                  <div className="text-xs text-gray-400 font-normal">${totalInUSD.toLocaleString()}</div>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Platform fees are deducted at payout time, not now.</p>

            {/* Wallet balance */}
            {vendorBalance !== null && (
              <div className={`rounded-xl p-3 mb-4 border ${
                balanceCoversAll
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-700'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FaWallet className={balanceCoversAll ? 'text-green-600' : 'text-gray-400'} size={14} />
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Wallet Balance</span>
                  </div>
                  <span className={`text-sm font-bold ${balanceCoversAll ? 'text-green-700 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                    ${vendorBalance.toFixed(2)} USD
                  </span>
                </div>
                {balanceCoversAll && (
                  <p className="text-xs text-green-700 dark:text-green-400 mt-1">✓ Your balance covers the full amount</p>
                )}
              </div>
            )}

            {/* Payment method picker */}
            <div className="space-y-2 mb-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Payment Method</p>

              {/* Balance (if covers all) */}
              {balanceCoversAll && (
                <button type="button" onClick={() => setSelectedMethod('balance')}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                    selectedMethod === 'balance'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-green-300 dark:hover:border-green-700'
                  }`}
                >
                  <FaWallet className="text-green-500" size={18} />
                  <div className="text-left flex-1">
                    <div className="font-semibold text-sm text-gray-900 dark:text-white">Use Wallet Balance</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">No card required — instant</div>
                  </div>
                  {selectedMethod === 'balance' && <FaCheckCircle className="text-green-500" size={16} />}
                </button>
              )}

              {/* Paystack */}
              <button type="button" onClick={() => { setSelectedMethod('paystack'); setSelectedCurrency('KES') }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                  selectedMethod === 'paystack'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-700'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <FaCreditCard className="text-white" size={16} />
                </div>
                <div className="text-left flex-1">
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">Paystack</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Card · Bank Transfer · USSD — KES / USD</div>
                </div>
                {selectedMethod === 'paystack' && <FaCheckCircle className="text-blue-500" size={16} />}
              </button>

              {/* Stripe */}
              <button type="button" onClick={() => { setSelectedMethod('stripe'); setSelectedCurrency('USD') }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                  selectedMethod === 'stripe'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-purple-300 dark:hover:border-purple-700'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center flex-shrink-0">
                  <SiStripe className="text-white" size={16} />
                </div>
                <div className="text-left flex-1">
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">Stripe</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">International card — USD</div>
                </div>
                {selectedMethod === 'stripe' && <FaCheckCircle className="text-purple-500" size={16} />}
              </button>
            </div>

            {/* Amount to pay */}
            {selectedMethod && (
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-3 mb-4 border border-indigo-100 dark:border-indigo-800 text-sm">
                <div className="flex justify-between font-bold">
                  <span className="text-gray-700 dark:text-gray-300">You pay</span>
                  <span className="text-indigo-700 dark:text-indigo-300">
                    {selectedMethod === 'balance' && `$${totalInUSD.toFixed(2)} (from balance)`}
                    {selectedMethod === 'paystack' && `${selectedCurrency === 'KES' ? `KSh ${(totalInUSD * USD_TO_KES_RATE).toLocaleString()}` : `$${totalInUSD.toFixed(2)}`}`}
                    {selectedMethod === 'stripe' && `$${totalInUSD.toFixed(2)} USD`}
                  </span>
                </div>
              </div>
            )}

            {/* Pay button */}
            <button
              type="button"
              disabled={!canProceed || paying}
              onClick={() => selectedMethod && onPay(selectedMethod, selectedCurrency)}
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 transition-all"
            >
              {paying ? (
                <><FaSpinner size={14} className="animate-spin" /> Processing…</>
              ) : selectedMethod === 'balance' ? (
                <><FaCheckCircle size={14} /> Confirm & Submit for Review</>
              ) : (
                <><FaShieldAlt size={14} /> Proceed to Payment</>
              )}
            </button>

            {!canProceed && !paying && (
              <p className="text-center text-xs text-gray-400 mt-2">Select a payment method above</p>
            )}

            {/* Trust badges */}
            <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <FaShieldAlt size={10} /> Secure payment
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <FaStar size={10} /> Admin review
              </div>
            </div>
          </div>
        </div>
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

const CreateChallengePage: React.FC = () => {
  const router = useRouter()
  const { selectedCurrency: userCurrency, currencySymbol, userCountry } = useCurrency()
  const user = getCurrentUser()

  const [step, setStep]       = useState<Step>('form')
  const [form, setForm]       = useState<FormState>(INITIAL_FORM)
  const [open, setOpen]       = useState<Record<string, boolean>>({ basics: true, goal: true, prizes: true })
  const [submitting, setSubmitting]         = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [vendorBalance, setVendorBalance]   = useState<number | null>(null)
  const [audienceTargeting, setAudienceTargeting] = useState<{
    locations?: { lat?: number; lng?: number; radius?: number; address: string; type?: 'text' | 'map' }[]
  } | null>(null)
  const [aiReview, setAiReview] = useState<ChallengeDraftAnalysisResult | null>(null)
  const [draftCheckLoading, setDraftCheckLoading] = useState(false)
  const [assistantBackgroundBusy, setAssistantBackgroundBusy] = useState(false)
  const draftAnalyzeBusyRef = useRef(false)
  const lastSilentAnalyzeOkAt = useRef(0)

  useEffect(() => {
    // Load vendor balance
    getVendorBalance().then(r => setVendorBalance(r.balance)).catch(() => {})
  }, [])

  const resolveVendorCountry = useCallback(async (): Promise<string | undefined> => {
    const localCountry =
      ((user as any)?.vendorSettings?.country as string | undefined) ||
      ((user as any)?.country as string | undefined)
    if (localCountry) return localCountry

    try {
      const settings: any = await getVendorProfile()
      return (
        (settings?.country as string | undefined) ||
        (settings?.vendorSettings?.country as string | undefined) ||
        (settings?.data?.country as string | undefined) ||
        (settings?.data?.vendorSettings?.country as string | undefined)
      )
    } catch {
      return undefined
    }
  }, [user])

  const ensureAudienceLocationPreselected = useCallback(async (): Promise<boolean> => {
    if (audienceTargeting?.locations && audienceTargeting.locations.length > 0) return true

    const country = (await resolveVendorCountry()) || (userCountry as string | null) || undefined
    if (!country) return false

    setAudienceTargeting({
      locations: [{ address: country, type: 'text' }],
    })
    return true
  }, [audienceTargeting?.locations, resolveVendorCountry, userCountry])

  useEffect(() => {
    void ensureAudienceLocationPreselected()
  }, [ensureAudienceLocationPreselected])

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
    if (!form.socialPlatforms.length) { toast.error('Select at least one social platform'); return false }
    if (!form.hashtags.length) { toast.error('Add at least one hashtag'); return false }
    const total = form.prizeTiers.reduce((s, t) => s + (parseFloat(t.prizeAmount) || 0), 0)
    if (total <= 0) { toast.error('Total prize pool must be greater than 0'); return false }
    return true
  }

  const handleReviewAndPay = async () => {
    if (!validate()) return
    await ensureAudienceLocationPreselected()
    setStep('summary')
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
      socialPlatforms: form.socialPlatforms,
      hashtags: form.hashtags.map(ensureHashPrefix).filter(Boolean),
      contentStyle: form.contentStyle,
    }
  }

  const buildDraftForAnalysis = useCallback(
    () => ({
      ...buildPayload(),
      localCurrency: userCurrency,
    }),
    [buildPayload, userCurrency]
  )

  const draftAnalyzeFingerprint = useMemo(
    () => JSON.stringify(buildDraftForAnalysis()),
    [buildDraftForAnalysis]
  )

  const runDraftCheck = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = !!opts?.silent
      const hasMinimum =
        form.title.trim().length > 1 ||
        form.description.trim().length > 20 ||
        form.prizeTiers.some((tier) => (parseFloat(tier.prizeAmount) || 0) > 0)
      if (!hasMinimum) {
        if (!silent) toast.error('Add a title, stronger description, or prize before analysis.')
        return
      }
      if (draftAnalyzeBusyRef.current && silent) return
      if (draftAnalyzeBusyRef.current && !silent) {
        toast.error('Analysis is still running')
        return
      }
      draftAnalyzeBusyRef.current = true
      if (silent) setAssistantBackgroundBusy(true)
      else setDraftCheckLoading(true)
      try {
        const result = await vendorAnalyzeChallengeDraft(buildDraftForAnalysis())
        setAiReview(result)
        if (silent) lastSilentAnalyzeOkAt.current = Date.now()
      } catch (e: any) {
        if (!silent) toast.error(e?.response?.data?.error || 'Could not analyze challenge draft.')
      } finally {
        draftAnalyzeBusyRef.current = false
        if (silent) setAssistantBackgroundBusy(false)
        else setDraftCheckLoading(false)
      }
    },
    [buildDraftForAnalysis, form.description, form.prizeTiers, form.title]
  )

  useEffect(() => {
    if (step !== 'form') return
    const hasMinimum =
      form.title.trim().length > 1 ||
      form.description.trim().length > 20 ||
      form.prizeTiers.some((tier) => (parseFloat(tier.prizeAmount) || 0) > 0)
    if (!hasMinimum) return
    const t = window.setTimeout(() => {
      if (Date.now() - lastSilentAnalyzeOkAt.current < 50_000) return
      if (draftAnalyzeBusyRef.current) return
      void runDraftCheck({ silent: true })
    }, 3200)
    return () => window.clearTimeout(t)
  }, [draftAnalyzeFingerprint, form.description, form.prizeTiers, form.title, runDraftCheck, step])

  const handlePay = async (method: PayMethod, currency: 'USD' | 'KES') => {
    if (!user?.id || !user?.email) { toast.error('Please log in'); return }
    await ensureAudienceLocationPreselected()

    const payload = buildPayload()

    // Prize amounts are entered in user's preferred currency; convert to USD for backend (same as campaigns)
    const prizeInUserCurrency = payload.prizeBudget || 0
    const prizeInUSD = userCurrency === 'KES'
      ? parseFloat((prizeInUserCurrency / USD_TO_KES_RATE).toFixed(2))
      : prizeInUserCurrency

    // Balance check
    let remainingPaymentNeeded = prizeInUSD
    if (method === 'balance' || vendorBalance !== null) {
      if (vendorBalance !== null && vendorBalance >= prizeInUSD) {
        remainingPaymentNeeded = 0
      } else if (vendorBalance !== null && vendorBalance > 0) {
        remainingPaymentNeeded = prizeInUSD - vendorBalance
      }
    }

    setSubmitting(true)

    try {
      if (method === 'balance' && remainingPaymentNeeded === 0) {
        // Create challenge directly using wallet balance
        const challenge = await vendorCreateChallenge({
          ...payload,
          prizeBudget: prizeInUSD, // store in USD
          prizes: payload.prizes.map(p => ({
            ...p,
            prizeAmount: userCurrency === 'KES' ? parseFloat((p.prizeAmount / USD_TO_KES_RATE).toFixed(2)) : p.prizeAmount,
          })),
          useBalance: true,
          paymentMethod: 'balance',
        } as any)
        toast.success('Challenge submitted for review! 🎉')
        router.push(`/admin/challenges/payment-success?challengeId=${challenge.id}&type=challenge_creation&paymentMethod=balance&vendorId=${user.id}`)
        return
      }

      // Store payload (with USD-converted amounts) for post-payment creation
      const payloadForStorage = {
        ...payload,
        prizeBudget: prizeInUSD,
        prizes: payload.prizes.map(p => ({
          ...p,
          prizeAmount: userCurrency === 'KES' ? parseFloat((p.prizeAmount / USD_TO_KES_RATE).toFixed(2)) : p.prizeAmount,
        })),
        useBalance: vendorBalance !== null && vendorBalance > 0,
      }
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('pendingChallenge', JSON.stringify(payloadForStorage))
      }

      const paymentAmount = remainingPaymentNeeded > 0 ? remainingPaymentNeeded : prizeInUSD

      if (method === 'stripe') {
        // Stripe always charges in USD
        const data = await createStripeCheckoutSession({
          email: user.email,
          amount: paymentAmount,
          campaignTitle: payload.title,
          budget: prizeInUSD,
          vendorId: user.id,
          vendorName: user.name || '',
          type: 'challenge_creation',
        })
        if (data?.url) {
          window.location.href = data.url
        } else {
          toast.error('Failed to get Stripe checkout URL')
          setSubmitting(false)
        }
      } else if (method === 'paystack') {
        // Paystack supports KES or USD — convert remaining amount to selected currency
        const paymentAmountInSelectedCurrency = currency === 'KES'
          ? paymentAmount * USD_TO_KES_RATE
          : paymentAmount
        const data = await createPaystackSession({
          email: user.email,
          amount: paymentAmountInSelectedCurrency,
          campaignTitle: payload.title,
          budget: prizeInUSD,
          vendorId: user.id,
          vendorName: user.name || '',
          currency,
          type: 'challenge_creation',
        })
        if (data?.authorization_url) {
          window.location.href = data.authorization_url
        } else {
          toast.error('Failed to get Paystack checkout URL')
          setSubmitting(false)
        }
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Payment initiation failed')
      setSubmitting(false)
    }
  }

  const allRequiredDone = sectionComplete('basics', form) && sectionComplete('goal', form) && sectionComplete('prizes', form)
  const draftAnalysisActive = draftCheckLoading || assistantBackgroundBusy

  return (
    <AdminLayout>
      <div className="p-3 sm:p-4 lg:p-6">
        <div className="w-full mx-auto max-w-7xl">

          {step === 'form' && (
            <>
              {/* Page header */}
              <div className="flex items-center gap-4 mb-6">
                <button onClick={() => router.push('/admin/challenges')}
                  className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300 flex-shrink-0">
                  <FaArrowLeft size={14} />
                </button>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">Create Challenge</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Sponsor a performance-based challenge for your brand</p>
                </div>
              </div>

              {/* Notice */}
              <div className="flex items-start gap-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-4 py-3 border border-amber-200 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-400 mb-6">
                <FaInfoCircle size={14} className="mt-0.5 flex-shrink-0" />
                <span>
                  Challenges require payment before review. Fill in all sections, then click{' '}
                  <strong>Review & Pay</strong> to proceed.
                </span>
              </div>
              {aiReview && (
                <div className="mb-6 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/80 dark:bg-indigo-900/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300 mb-1">
                    Draft quality score
                  </p>
                  <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{aiReview.overall.score}/100</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    {aiReview.headline || 'AI analysis refreshed from your current challenge draft.'}
                  </p>
                </div>
              )}

              {/* Two-column layout */}
              <div className="bus-responsive-two-col gap-4 sm:gap-6">
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

                  <div className="rounded-xl border overflow-hidden bg-gradient-to-br from-indigo-50/90 via-white to-violet-50/50 dark:from-indigo-950/35 dark:via-slate-800 dark:to-violet-950/25 border-indigo-100 dark:border-indigo-900/60">
                    <div className="p-4 flex items-start justify-between gap-3">
                      <div className="flex gap-3 min-w-0">
                        <div className="shrink-0 w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-300">
                          <FaMagic size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">Challenge AI analysis</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                            Auto-checks while you type, or run it now.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => void runDraftCheck()}
                        disabled={draftAnalysisActive}
                        className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed min-w-[8.5rem]"
                      >
                        {draftAnalysisActive ? <FaSpinner className="animate-spin" size={12} /> : <FaBolt size={12} />}
                        {draftAnalysisActive ? 'Analyzing…' : 'Analyze draft'}
                      </button>
                    </div>
                  </div>

                  <button type="button" onClick={handleReviewAndPay}
                    disabled={!allRequiredDone}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 transition-all duration-200 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaChevronRight size={13} /> Review & Pay
                  </button>

                  {!allRequiredDone && (
                    <p className="text-center text-xs text-gray-400">
                      Complete <strong>Details</strong>, <strong>Goal</strong>, and <strong>Prizes</strong> sections to proceed
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {step === 'summary' && (
            <PaymentSummaryPage
              form={form}
              vendorBalance={vendorBalance}
              userCurrency={userCurrency}
              currencySymbol={currencySymbol}
              onBack={() => setStep('form')}
              onPay={handlePay}
              paying={submitting}
            />
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

export default CreateChallengePage
