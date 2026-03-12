// Business Suite – Brand Finance & Analytics Page
// Comprehensive financial management for brands with wallet, transactions, top-up, and analytics

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import toast from 'react-hot-toast'
import AdminLayout from '@/components/admin/Layout'
import {
  getVendorBalance,
  getDashboard,
  getTransactionHistory,
  getDonations,
  createStripeCheckoutSession,
  createPaystackSession,
} from '@/services/vendor'
import { useBrand } from '@/contexts/BrandContext'
import { useCurrency } from '@/hooks/useCurrency'
import {
  FaSpinner,
  FaWallet,
  FaArrowLeft,
  FaArrowUp,
  FaArrowDown,
  FaChartLine,
  FaMoneyBillWave,
  FaExchangeAlt,
  FaHeart,
  FaBriefcase,
  FaUsers,
  FaCheckCircle,
  FaPlus,
  FaCreditCard,
  FaHistory,
  FaChevronLeft,
  FaChevronRight,
  FaBuilding,
} from 'react-icons/fa'

type TabType = 'overview' | 'transactions' | 'donations' | 'topup'

const FinancePage: React.FC = () => {
  const router = useRouter()
  const { selectedBrand } = useBrand()
  const { formatPrice, selectedCurrency: userCurrency, convertUSDToKES } = useCurrency()

  // Core data
  const [balance, setBalance] = useState<number | null>(null)
  const [dashboardStats, setDashboardStats] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [donations, setDonations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [txLoading, setTxLoading] = useState(false)
  const [donLoading, setDonLoading] = useState(false)

  // Tab
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  // Pagination
  const [txPage, setTxPage] = useState(1)
  const [txTotal, setTxTotal] = useState(0)
  const [txTotalPages, setTxTotalPages] = useState(1)
  const [donPage, setDonPage] = useState(1)
  const [donTotal, setDonTotal] = useState(0)
  const [donTotalPages, setDonTotalPages] = useState(1)

  // Top-up form
  const [topUpAmount, setTopUpAmount] = useState('')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'stripe' | 'paystack' | null>(null)
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'KES' | 'NGN'>('USD')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const USD_TO_NGN = 1600
  const USD_TO_KES = 130

  useEffect(() => {
    if (selectedPaymentMethod === 'paystack') {
      setSelectedCurrency(userCurrency === 'KES' ? 'KES' : userCurrency === 'NGN' ? 'NGN' : 'USD')
    }
  }, [userCurrency, selectedPaymentMethod])

  useEffect(() => {
    loadAll()
  }, [selectedBrand])

  useEffect(() => {
    if (activeTab === 'transactions') {
      loadTransactions(txPage)
    }
  }, [activeTab, txPage, selectedBrand])

  useEffect(() => {
    if (activeTab === 'donations') {
      loadDonations(donPage)
    }
  }, [activeTab, donPage, selectedBrand])

  // Refresh balance when returning from payment
  useEffect(() => {
    const handleFocus = () => {
      getVendorBalance()
        .then((d) => setBalance(d.balance))
        .catch(() => {})
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  const loadAll = async () => {
    try {
      setLoading(true)
      const [balData, stats] = await Promise.all([
        getVendorBalance().catch(() => ({ balance: 0 })),
        getDashboard().catch(() => null),
      ])
      setBalance(balData.balance)
      setDashboardStats(stats)
    } catch (e) {
      console.error(e)
      toast.error('Failed to load financial data')
    } finally {
      setLoading(false)
    }
  }

  const loadTransactions = async (page: number) => {
    try {
      setTxLoading(true)
      const data = await getTransactionHistory(page, 15)
      const list = data?.transactions || data?.data || []
      setTransactions(list)
      setTxTotal(data?.pagination?.total || data?.total || list.length)
      setTxTotalPages(data?.pagination?.totalPages || data?.totalPages || 1)
    } catch (e) {
      console.error(e)
      setTransactions([])
      toast.error('Failed to load transactions')
    } finally {
      setTxLoading(false)
    }
  }

  const loadDonations = async (page: number) => {
    try {
      setDonLoading(true)
      const data = await getDonations(page, 15)
      const list = data?.donations || data?.data || []
      setDonations(list)
      setDonTotal(data?.summary?.totalDonations || data?.pagination?.total || list.length)
      setDonTotalPages(data?.pagination?.totalPages || data?.totalPages || 1)
    } catch (e) {
      console.error(e)
      setDonations([])
      toast.error('Failed to load donations')
    } finally {
      setDonLoading(false)
    }
  }

  const handleTopUp = async () => {
    if (!selectedPaymentMethod) {
      toast.error('Select a payment method')
      return
    }
    const amountVal = parseFloat(topUpAmount)
    if (isNaN(amountVal) || amountVal <= 0) {
      toast.error('Enter a valid amount')
      return
    }
    setIsSubmitting(true)
    try {
      // Convert to USD based on input currency
      let amountInUSD = amountVal
      if (selectedCurrency === 'KES') {
        amountInUSD = amountVal / USD_TO_KES
      } else if (selectedCurrency === 'NGN') {
        amountInUSD = amountVal / USD_TO_NGN
      }

      const { getCurrentUser } = await import('@/services/auth')
      const user = getCurrentUser()
      if (!user || !user.id || !user.email) {
        toast.error('Please log in to add funds')
        setIsSubmitting(false)
        return
      }

      if (selectedPaymentMethod === 'stripe') {
        const data = await createStripeCheckoutSession({
          email: user.email,
          amount: amountInUSD,
          campaignTitle: 'Balance Top-Up',
          budget: amountInUSD,
          vendorId: user.id,
          vendorName: user.name || '',
          type: 'balance_top_up',
        })
        if (data?.url) {
          sessionStorage.setItem('pendingTopUp', JSON.stringify({ amount: amountInUSD, paymentMethod: 'stripe', currency: selectedCurrency }))
          window.location.href = data.url
        } else {
          toast.error('Failed to get checkout URL')
          setIsSubmitting(false)
        }
      } else {
        const paymentAmount = selectedCurrency === 'KES' ? amountInUSD * USD_TO_KES : selectedCurrency === 'NGN' ? amountInUSD * USD_TO_NGN : amountInUSD
        const data = await createPaystackSession({
          email: user.email,
          amount: paymentAmount,
          campaignTitle: 'Balance Top-Up',
          budget: amountInUSD,
          vendorId: user.id,
          vendorName: user.name || '',
          currency: selectedCurrency,
          type: 'balance_top_up',
        })
        if (data?.authorization_url) {
          sessionStorage.setItem('pendingTopUp', JSON.stringify({ amount: amountInUSD, paymentMethod: 'paystack', currency: selectedCurrency }))
          window.location.href = data.authorization_url
        } else {
          toast.error('Failed to get checkout URL')
          setIsSubmitting(false)
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create payment session')
      setIsSubmitting(false)
    }
  }

  // ─── Derived stats ────────────────────────────────────────────────────────
  const totalBudget = dashboardStats?.totalBudget || 0
  const totalEarned = dashboardStats?.totalEarned || 0
  const totalCampaigns = dashboardStats?.totalCampaigns || 0
  const activeCampaigns = dashboardStats?.activeCampaigns || 0
  const totalApplications = dashboardStats?.totalApplications || 0
  const spentPercentage = totalBudget > 0 ? Math.min((totalEarned / totalBudget) * 100, 100) : 0
  const remainingBudget = Math.max(0, totalBudget - totalEarned)
  const circumference = 2 * Math.PI * 52

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const txTypeMeta: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    DEPOSIT: { label: 'Deposit', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300', icon: <FaArrowDown className="h-3 w-3" /> },
    DEBIT: { label: 'Payment', color: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300', icon: <FaArrowUp className="h-3 w-3" /> },
    CREDIT: { label: 'Credit', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300', icon: <FaArrowDown className="h-3 w-3" /> },
    REFUND: { label: 'Refund', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300', icon: <FaExchangeAlt className="h-3 w-3" /> },
  }
  const getTxMeta = (type: string) =>
    txTypeMeta[type?.toUpperCase()] ?? {
      label: type || 'Transaction',
      color: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
      icon: <FaExchangeAlt className="h-3 w-3" />,
    }

  const isDebit = (type: string) => ['DEBIT', 'PAYMENT', 'CHARGE'].includes(type?.toUpperCase())

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <FaSpinner className="animate-spin text-3xl text-emerald-600" />
        </div>
      </AdminLayout>
    )
  }

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <FaChartLine className="h-4 w-4" /> },
    { id: 'transactions', label: 'Transactions', icon: <FaHistory className="h-4 w-4" /> },
    { id: 'donations', label: 'Donations', icon: <FaHeart className="h-4 w-4" /> },
    { id: 'topup', label: 'Add Funds', icon: <FaPlus className="h-4 w-4" /> },
  ]

  return (
    <AdminLayout>
      <div className="min-h-screen p-2 sm:p-4 lg:p-6">
        <div className="w-full mx-auto space-y-6 max-w-7xl">
          {/* ── Page Header ── */}
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <FaArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {selectedBrand && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <FaBuilding className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{selectedBrand.name}</span>
                  </div>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Finance & Analytics</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Full financial overview and management</p>
            </div>
          </div>

          {/* ── Hero KPI Banner ── */}
          <div className="bg-gradient-to-br from-emerald-900 via-cyan-900 to-indigo-900 rounded-2xl p-5 sm:p-8 text-white shadow-xl relative overflow-hidden">
            {/* decorative circles */}
            <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full bg-white/5" />
            <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-white/5" />
            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8">
              {/* Balance */}
              <div className="col-span-2 sm:col-span-1">
                <p className="text-emerald-200 text-xs font-medium mb-1 uppercase tracking-wide">Wallet Balance</p>
                <p className="text-2xl sm:text-3xl font-bold">
                  {balance !== null ? formatPrice(convertUSDToKES(balance)) : '—'}
                </p>
                <button
                  onClick={() => setActiveTab('topup')}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-medium transition-colors"
                >
                  <FaPlus className="h-3 w-3" /> Add Funds
                </button>
              </div>
              {/* Budget */}
              <div>
                <p className="text-emerald-200 text-xs font-medium mb-1 uppercase tracking-wide">Campaign Budget</p>
                <p className="text-xl sm:text-2xl font-bold">{formatPrice(convertUSDToKES(totalBudget))}</p>
                <p className="text-emerald-300 text-xs mt-1">{totalCampaigns} campaign{totalCampaigns !== 1 ? 's' : ''}</p>
              </div>
              {/* Paid out */}
              <div>
                <p className="text-emerald-200 text-xs font-medium mb-1 uppercase tracking-wide">Paid to Creators</p>
                <p className="text-xl sm:text-2xl font-bold">{formatPrice(convertUSDToKES(totalEarned))}</p>
                <p className="text-emerald-300 text-xs mt-1">{Math.round(spentPercentage)}% of budget</p>
              </div>
              {/* Remaining */}
              <div>
                <p className="text-emerald-200 text-xs font-medium mb-1 uppercase tracking-wide">Remaining Budget</p>
                <p className="text-xl sm:text-2xl font-bold">{formatPrice(convertUSDToKES(remainingBudget))}</p>
                <p className="text-emerald-300 text-xs mt-1">{activeCampaigns} active</p>
              </div>
            </div>
          </div>

          {/* ── Tabs ── */}
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-1 justify-center ${
                  activeTab === t.id
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t.icon}
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              TAB: OVERVIEW
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Quick stats row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Active Campaigns', value: activeCampaigns, sub: `of ${totalCampaigns} total`, icon: <FaBriefcase className="h-5 w-5" />, color: 'from-blue-500 to-blue-600', bg: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20', border: 'border-blue-200 dark:border-blue-700' },
                  { label: 'Applications', value: totalApplications, sub: 'total received', icon: <FaUsers className="h-5 w-5" />, color: 'from-purple-500 to-purple-600', bg: 'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20', border: 'border-purple-200 dark:border-purple-700' },
                  { label: 'Budget Spent', value: `${Math.round(spentPercentage)}%`, sub: formatPrice(convertUSDToKES(totalEarned)), icon: <FaChartLine className="h-5 w-5" />, color: 'from-orange-500 to-orange-600', bg: 'from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20', border: 'border-orange-200 dark:border-orange-700' },
                  { label: 'Pending Reviews', value: dashboardStats?.pendingReviewsCount || 0, sub: 'awaiting approval', icon: <FaCheckCircle className="h-5 w-5" />, color: 'from-green-500 to-green-600', bg: 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20', border: 'border-green-200 dark:border-green-700' },
                ].map((s) => (
                  <div key={s.label} className={`bg-gradient-to-br ${s.bg} rounded-xl p-4 border ${s.border} shadow-sm`}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400">{s.label}</p>
                      <div className={`bg-gradient-to-br ${s.color} text-white p-2 rounded-lg`}>
                        {s.icon}
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{s.value}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{s.sub}</p>
                  </div>
                ))}
              </div>

              {/* Charts row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Donut chart */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Budget Utilisation</h2>
                  <div className="flex flex-col sm:flex-row items-center gap-8">
                    {/* SVG Donut */}
                    <div className="relative flex-shrink-0" style={{ width: 160, height: 160 }}>
                      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                        {/* track */}
                        <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="14" className="text-slate-100 dark:text-slate-700" />
                        {/* spent */}
                        {spentPercentage > 0 && (
                          <circle
                            cx="60"
                            cy="60"
                            r="52"
                            fill="none"
                            stroke="url(#finSpentGrad)"
                            strokeWidth="14"
                            strokeLinecap="round"
                            strokeDasharray={`${(spentPercentage / 100) * circumference} ${circumference}`}
                          />
                        )}
                        {/* remaining */}
                        {spentPercentage < 100 && totalBudget > 0 && (
                          <circle
                            cx="60"
                            cy="60"
                            r="52"
                            fill="none"
                            stroke="url(#finRemGrad)"
                            strokeWidth="14"
                            strokeLinecap="round"
                            strokeDasharray={`${((100 - spentPercentage) / 100) * circumference} ${circumference}`}
                            strokeDashoffset={`-${(spentPercentage / 100) * circumference}`}
                          />
                        )}
                        <defs>
                          <linearGradient id="finSpentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#6366f1" />
                            <stop offset="100%" stopColor="#8b5cf6" />
                          </linearGradient>
                          <linearGradient id="finRemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#34d399" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-slate-900 dark:text-white">{Math.round(spentPercentage)}%</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">spent</span>
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="flex-1 space-y-3 w-full">
                      {[
                        { label: 'Paid to Creators', value: totalEarned, pct: spentPercentage, gradient: 'from-indigo-500 to-purple-600' },
                        { label: 'Remaining Budget', value: remainingBudget, pct: 100 - spentPercentage, gradient: 'from-emerald-500 to-teal-400' },
                      ].map((item) => (
                        <div key={item.label} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600 dark:text-slate-400 font-medium">{item.label}</span>
                            <span className="font-bold text-slate-900 dark:text-white">{formatPrice(convertUSDToKES(item.value))}</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full bg-gradient-to-r ${item.gradient} rounded-full transition-all duration-700`}
                              style={{ width: `${Math.max(item.pct, 0)}%` }}
                            />
                          </div>
                          <p className="text-xs text-slate-400 dark:text-slate-500">{Math.round(Math.max(item.pct, 0))}%</p>
                        </div>
                      ))}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex justify-between text-sm font-bold">
                        <span className="text-slate-700 dark:text-slate-300">Total Budget</span>
                        <span className="text-slate-900 dark:text-white">{formatPrice(convertUSDToKES(totalBudget))}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Campaign breakdown */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Campaign Budgets</h2>
                    <Link href="/admin/campaigns" className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-medium">
                      View All →
                    </Link>
                  </div>
                  {dashboardStats?.topCampaigns && dashboardStats.topCampaigns.length > 0 ? (
                    <div className="space-y-4">
                      {dashboardStats.topCampaigns.slice(0, 5).map((c: any, i: number) => {
                        const spent = c.totalEarned || 0
                        const budget = c.budget || 1
                        const pct = Math.min((spent / budget) * 100, 100)
                        const colors = ['from-blue-500 to-indigo-500', 'from-purple-500 to-pink-500', 'from-orange-500 to-amber-400', 'from-teal-500 to-cyan-400', 'from-rose-500 to-red-400']
                        return (
                          <div key={c.id || i}>
                            <div className="flex justify-between items-center mb-1 text-sm">
                              <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[60%]">{c.title || `Campaign ${i + 1}`}</span>
                              <span className="text-slate-500 dark:text-slate-400 text-xs">{formatPrice(convertUSDToKES(spent))} / {formatPrice(convertUSDToKES(budget))}</span>
                            </div>
                            <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full bg-gradient-to-r ${colors[i % colors.length]} rounded-full transition-all duration-700`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{Math.round(pct)}% utilised</p>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                      <FaBriefcase className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No campaign data yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Top earning campaigns & creators */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top creators by earnings */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-sm">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Top Earning Creators</h2>
                    <Link href="/admin/partners" className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-medium">
                      View All →
                    </Link>
                  </div>
                  {dashboardStats?.topCreatorPartners && dashboardStats.topCreatorPartners.length > 0 ? (
                    <div className="space-y-3">
                      {dashboardStats.topCreatorPartners.slice(0, 5).map((creator: any, i: number) => (
                        <div key={creator.id || i} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {(creator.name || 'C').charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{creator.name || 'Creator'}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{creator.approvedCampaigns || 0} campaigns</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                              {formatPrice(convertUSDToKES(creator.totalEarned || 0))}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                      <FaUsers className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No creator data yet</p>
                    </div>
                  )}
                </div>

                {/* Financial summary card */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-xl">
                  <h2 className="text-lg font-bold mb-5">Financial Summary</h2>
                  <div className="space-y-4">
                    {[
                      { label: 'Account Balance', value: balance !== null ? formatPrice(convertUSDToKES(balance)) : '—', icon: <FaWallet className="h-4 w-4 text-emerald-400" />, sub: 'available to spend' },
                      { label: 'Total Budget Allocated', value: formatPrice(convertUSDToKES(totalBudget)), icon: <FaBriefcase className="h-4 w-4 text-purple-400" />, sub: `across ${totalCampaigns} campaigns` },
                      { label: 'Total Paid Out', value: formatPrice(convertUSDToKES(totalEarned)), icon: <FaMoneyBillWave className="h-4 w-4 text-green-400" />, sub: 'to creators' },
                      { label: 'Remaining Budget', value: formatPrice(convertUSDToKES(remainingBudget)), icon: <FaChartLine className="h-4 w-4 text-amber-400" />, sub: `${Math.round(100 - spentPercentage)}% unused` },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                          {row.icon}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-slate-400">{row.label}</p>
                          <p className="text-sm font-semibold">{row.value}</p>
                        </div>
                        <p className="text-xs text-slate-500">{row.sub}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 pt-4 border-t border-white/10">
                    <button
                      onClick={() => setActiveTab('topup')}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-sm font-semibold transition-colors"
                    >
                      <FaPlus className="h-4 w-4" /> Add Funds to Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB: TRANSACTIONS
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'transactions' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Transaction History</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{txTotal} total transactions</p>
                  </div>
                  <FaHistory className="h-5 w-5 text-slate-400" />
                </div>

                {/* Table */}
                {txLoading ? (
                  <div className="flex justify-center py-16">
                    <FaSpinner className="animate-spin h-8 w-8 text-emerald-600" />
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 dark:text-slate-500">
                    <FaExchangeAlt className="h-12 w-12 mx-auto mb-4 opacity-40" />
                    <p className="font-medium text-slate-600 dark:text-slate-400">No transactions yet</p>
                    <p className="text-sm mt-1">Add funds to see your transaction history</p>
                  </div>
                ) : (
                  <>
                    {/* Desktop table */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-700/50 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            <th className="px-6 py-3 text-left">Date</th>
                            <th className="px-6 py-3 text-left">Description</th>
                            <th className="px-6 py-3 text-left">Type</th>
                            <th className="px-6 py-3 text-right">Amount</th>
                            <th className="px-6 py-3 text-left">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                          {transactions.map((tx: any, i: number) => {
                            const meta = getTxMeta(tx.type)
                            const debit = isDebit(tx.type)
                            return (
                              <tr key={tx.id || i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400 text-xs">{fmtDate(tx.createdAt || tx.date)}</td>
                                <td className="px-6 py-4">
                                  <p className="font-medium text-slate-900 dark:text-white">{tx.description || tx.note || '—'}</p>
                                  {tx.reference && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Ref: {tx.reference}</p>}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${meta.color}`}>
                                    {meta.icon} {meta.label}
                                  </span>
                                </td>
                                <td className={`px-6 py-4 text-right font-bold whitespace-nowrap ${debit ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                  {debit ? '−' : '+'}{formatPrice(convertUSDToKES(Math.abs(tx.amount || 0)))}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                      tx.status === 'COMPLETED' || tx.status === 'completed' || tx.status === 'SUCCESS'
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                                        : tx.status === 'PENDING' || tx.status === 'pending'
                                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300'
                                        : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                    }`}
                                  >
                                    {tx.status || 'Completed'}
                                  </span>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile cards */}
                    <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-700">
                      {transactions.map((tx: any, i: number) => {
                        const meta = getTxMeta(tx.type)
                        const debit = isDebit(tx.type)
                        return (
                          <div key={tx.id || i} className="p-4 flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${debit ? 'bg-red-100 dark:bg-red-900/30 text-red-600' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'}`}>
                              {debit ? <FaArrowUp className="h-4 w-4" /> : <FaArrowDown className="h-4 w-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-900 dark:text-white text-sm truncate">{tx.description || meta.label}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{fmtDate(tx.createdAt || tx.date)}</p>
                            </div>
                            <p className={`font-bold text-sm ${debit ? 'text-red-600' : 'text-emerald-600'}`}>
                              {debit ? '−' : '+'}{formatPrice(convertUSDToKES(Math.abs(tx.amount || 0)))}
                            </p>
                          </div>
                        )
                      })}
                    </div>

                    {/* Pagination */}
                    {txTotalPages > 1 && (
                      <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-sm">
                        <p className="text-slate-500 dark:text-slate-400">Page {txPage} of {txTotalPages}</p>
                        <div className="flex gap-2">
                          <button onClick={() => setTxPage((p) => p - 1)} disabled={txPage === 1} className="p-2 rounded-lg border border-slate-200 dark:border-slate-600 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                            <FaChevronLeft className="h-3 w-3" />
                          </button>
                          <button onClick={() => setTxPage((p) => p + 1)} disabled={txPage === txTotalPages} className="p-2 rounded-lg border border-slate-200 dark:border-slate-600 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                            <FaChevronRight className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB: DONATIONS
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'donations' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Donations</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{donTotal} donation{donTotal !== 1 ? 's' : ''} received</p>
                  </div>
                  <FaHeart className="h-5 w-5 text-red-400" />
                </div>

                {donLoading ? (
                  <div className="flex justify-center py-16">
                    <FaSpinner className="animate-spin h-8 w-8 text-emerald-600" />
                  </div>
                ) : donations.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 dark:text-slate-500">
                    <FaHeart className="h-12 w-12 mx-auto mb-4 opacity-40" />
                    <p className="font-medium text-slate-600 dark:text-slate-400">No donations yet</p>
                    <p className="text-sm mt-1">Donations will appear here once received</p>
                  </div>
                ) : (
                  <>
                    {/* Summary bar */}
                    <div className="px-6 py-3 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/10 dark:to-pink-900/10 border-b border-red-100 dark:border-red-900/30 flex flex-wrap gap-4">
                      {[
                        { label: 'Total Received', value: formatPrice(convertUSDToKES(donations.reduce((s: number, d: any) => s + (d.amount || 0), 0))) },
                        { label: 'Completed', value: donations.filter((d: any) => d.paymentStatus === 'completed').length },
                        { label: 'Pending', value: donations.filter((d: any) => d.paymentStatus === 'pending').length },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 dark:text-slate-400">{item.label}:</span>
                          <span className="text-sm font-bold text-slate-900 dark:text-white">{item.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Desktop table */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-700/50 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            <th className="px-6 py-3 text-left">Date</th>
                            <th className="px-6 py-3 text-left">Donor</th>
                            <th className="px-6 py-3 text-left">Campaign</th>
                            <th className="px-6 py-3 text-right">Amount</th>
                            <th className="px-6 py-3 text-left">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                          {donations.map((d: any, i: number) => (
                            <tr key={d.id || i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400 text-xs">{fmtDate(d.createdAt)}</td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                    {(d.donorName || 'A').charAt(0).toUpperCase()}
                                  </div>
                                  <span className="font-medium text-slate-900 dark:text-white">{d.donorName || 'Anonymous'}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs max-w-[150px] truncate">
                                {d.campaign?.title || 'General'}
                              </td>
                              <td className="px-6 py-4 text-right font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                                +{formatPrice(convertUSDToKES(d.amount || 0))}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                    d.paymentStatus === 'completed'
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                                      : d.paymentStatus === 'pending'
                                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300'
                                      : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                                  }`}
                                >
                                  {d.paymentStatus}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile cards */}
                    <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-700">
                      {donations.map((d: any, i: number) => (
                        <div key={d.id || i} className="p-4 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-pink-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {(d.donorName || 'A').charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 dark:text-white text-sm">{d.donorName || 'Anonymous'}</p>
                            <p className="text-xs text-slate-500">{d.campaign?.title || 'General'} · {fmtDate(d.createdAt)}</p>
                          </div>
                          <p className="font-bold text-emerald-600 text-sm">+{formatPrice(convertUSDToKES(d.amount || 0))}</p>
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {donTotalPages > 1 && (
                      <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-sm">
                        <p className="text-slate-500 dark:text-slate-400">Page {donPage} of {donTotalPages}</p>
                        <div className="flex gap-2">
                          <button onClick={() => setDonPage((p) => p - 1)} disabled={donPage === 1} className="p-2 rounded-lg border border-slate-200 dark:border-slate-600 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                            <FaChevronLeft className="h-3 w-3" />
                          </button>
                          <button onClick={() => setDonPage((p) => p + 1)} disabled={donPage === donTotalPages} className="p-2 rounded-lg border border-slate-200 dark:border-slate-600 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                            <FaChevronRight className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB: TOP UP
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'topup' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top-up form */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center">
                    <FaCreditCard className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Add Funds</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Top up your account balance</p>
                  </div>
                </div>

                <div className="space-y-5">
                  {/* Amount */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Amount ({selectedCurrency || userCurrency})
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">
                        {selectedCurrency === 'KES' ? 'KSh' : selectedCurrency === 'NGN' ? '₦' : '$'}
                      </span>
                      <input
                        type="number"
                        value={topUpAmount}
                        onChange={(e) => setTopUpAmount(e.target.value)}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-lg font-semibold"
                      />
                    </div>
                    {/* Quick amount buttons */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {(selectedCurrency === 'KES' ? ['500', '1000', '2000', '5000'] : selectedCurrency === 'NGN' ? ['5000', '10000', '20000', '50000'] : ['10', '25', '50', '100']).map((amt) => (
                        <button
                          key={amt}
                          onClick={() => setTopUpAmount(amt)}
                          className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                            topUpAmount === amt
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                              : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500'
                          }`}
                        >
                          {selectedCurrency === 'KES' ? `KSh ${amt}` : selectedCurrency === 'NGN' ? `₦${amt}` : `$${amt}`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Payment method */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Payment Method
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'stripe' as const, name: 'Stripe', sub: 'USD only', icon: '💳' },
                        { id: 'paystack' as const, name: 'Paystack', sub: selectedCurrency || (userCurrency === 'KES' ? 'KES' : userCurrency === 'NGN' ? 'NGN' : 'USD'), icon: '🌍' },
                      ].map((pm) => (
                        <button
                          key={pm.id}
                          type="button"
                          onClick={() => {
                            setSelectedPaymentMethod(pm.id)
                            if (pm.id === 'stripe') setSelectedCurrency('USD')
                            else setSelectedCurrency(userCurrency === 'KES' ? 'KES' : userCurrency === 'NGN' ? 'NGN' : 'USD')
                          }}
                          className={`p-4 border-2 rounded-xl transition-all text-left ${
                            selectedPaymentMethod === pm.id
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-sm'
                              : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                          }`}
                        >
                          <span className="text-2xl block mb-1">{pm.icon}</span>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{pm.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{pm.sub}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Paystack currency selector */}
                  {selectedPaymentMethod === 'paystack' && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Currency</label>
                      <select
                        value={selectedCurrency}
                        onChange={(e) => setSelectedCurrency(e.target.value as 'USD' | 'KES' | 'NGN')}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      >
                        <option value="USD">USD – US Dollar</option>
                        <option value="KES">KES – Kenyan Shilling</option>
                        <option value="NGN">NGN – Nigerian Naira</option>
                      </select>
                    </div>
                  )}

                  <button
                    onClick={handleTopUp}
                    disabled={isSubmitting || !topUpAmount || !selectedPaymentMethod}
                    className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 disabled:from-slate-400 disabled:to-slate-400 disabled:cursor-not-allowed text-white px-6 py-3.5 rounded-xl font-semibold transition-all shadow-sm flex items-center justify-center gap-2 text-sm"
                  >
                    {isSubmitting ? (
                      <>
                        <FaSpinner className="animate-spin h-4 w-4" /> Processing...
                      </>
                    ) : (
                      <>
                        <FaPlus className="h-4 w-4" /> Add {topUpAmount ? `${selectedCurrency === 'KES' ? 'KSh' : selectedCurrency === 'NGN' ? '₦' : '$'}${topUpAmount}` : 'Funds'}
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Info cards */}
              <div className="space-y-4">
                {/* Current balance */}
                <div className="bg-gradient-to-br from-emerald-600 to-cyan-700 rounded-2xl p-6 text-white shadow-xl">
                  <p className="text-emerald-200 text-sm mb-1">Current Account Balance</p>
                  <p className="text-4xl font-bold mb-1">
                    {balance !== null ? formatPrice(convertUSDToKES(balance)) : '—'}
                  </p>
                  <p className="text-emerald-200 text-sm">Available to use across campaigns</p>
                </div>

                {/* How it works */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm p-6">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-4">How it works</h3>
                  <div className="space-y-3">
                    {[
                      { step: '1', text: 'Add funds to your account balance via Stripe or Paystack.' },
                      { step: '2', text: 'When creating a campaign, your balance is automatically applied.' },
                      { step: '3', text: 'Only pay the remaining difference if balance is insufficient.' },
                      { step: '4', text: 'Approved creator work is paid from your campaign budget.' },
                    ].map((s) => (
                      <div key={s.step} className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                          {s.step}
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{s.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Note */}
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>Note:</strong> Balances are stored internally in USD. Display values are converted to your selected currency for convenience.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

export default FinancePage
