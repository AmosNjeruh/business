// Business Suite – Balance Top-Up Success Page
// Dedicated success page for balance top-ups

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import toast from 'react-hot-toast'
import AdminLayout from '@/components/admin/Layout'
import { verifyPaystackPayment, topUpBalance, getVendorBalance } from '@/services/vendor'
import { useCurrency } from '@/hooks/useCurrency'
import { FaSpinner, FaCheckCircle, FaWallet, FaArrowLeft } from 'react-icons/fa'

const BalanceTopUpSuccess: React.FC = () => {
  const router = useRouter()
  const { formatPrice, convertUSDToKES } = useCurrency()
  const [isProcessing, setIsProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [topUpAmount, setTopUpAmount] = useState<number | null>(null)
  const [newBalance, setNewBalance] = useState<number | null>(null)

  useEffect(() => {
    const processTopUp = async () => {
      const { vendorId, type, paymentMethod, reference, session_id } = router.query

      if (!vendorId) return

      // Verify this is a balance top-up
      if (type !== 'balance_top_up') {
        router.push('/admin/finance')
        return
      }

      // Check if we've already processed this payment
      const processedPaymentKey = `processed_balance_topup_${reference || session_id || 'unknown'}`
      const alreadyProcessed = sessionStorage.getItem(processedPaymentKey)
      if (alreadyProcessed) {
        const processedData = JSON.parse(alreadyProcessed)
        setTopUpAmount(processedData.amount)
        setNewBalance(processedData.newBalance)
        setIsProcessing(false)
        return
      }

      // Verify payment
      let paymentTransactionId: string | undefined
      let verifiedPaymentMethod: string | undefined

      if (paymentMethod === 'paystack' && (reference || router.query.reference)) {
        try {
          const verificationResult = await verifyPaystackPayment((reference || router.query.reference) as string)
          paymentTransactionId = verificationResult.reference || (reference || router.query.reference) as string
          verifiedPaymentMethod = 'paystack'
        } catch (error: any) {
          console.error('Paystack verification error:', error)
          setError('Payment verification failed. Please contact support if payment was successful.')
          setIsProcessing(false)
          return
        }
      } else if (paymentMethod === 'stripe' || !paymentMethod) {
        const stripeSessionId = session_id as string | undefined
        if (stripeSessionId) {
          paymentTransactionId = stripeSessionId
          verifiedPaymentMethod = 'stripe'
        }
      }

      try {
        // Get top-up data from sessionStorage
        const topUpDataString = sessionStorage.getItem('pendingTopUp')
        if (!topUpDataString) {
          throw new Error('Top-up data not found')
        }

        const topUpData = JSON.parse(topUpDataString)

        // Call API to top up balance
        await topUpBalance({
          amount: topUpData.amount,
          paymentMethod: verifiedPaymentMethod || topUpData.paymentMethod,
          transactionId: paymentTransactionId,
          sessionId: paymentTransactionId,
        })

        // Fetch updated balance
        const balanceData = await getVendorBalance()
        const updatedBalance = balanceData.balance

        setTopUpAmount(topUpData.amount)
        setNewBalance(updatedBalance)

        // Mark as processed
        sessionStorage.setItem(processedPaymentKey, JSON.stringify({
          amount: topUpData.amount,
          newBalance: updatedBalance,
          processedAt: new Date().toISOString()
        }))

        sessionStorage.removeItem('pendingTopUp')
        toast.success('Balance topped up successfully!')
        setIsProcessing(false)
      } catch (error: any) {
        console.error('Error processing top-up:', error)
        const errorMessage = error.response?.data?.error || error.message || 'Failed to process top-up. Please contact support.'
        setError(errorMessage)
        setIsProcessing(false)
        toast.error(errorMessage)
      }
    }

    if (router.isReady && router.query.vendorId) {
      processTopUp()
    }
  }, [router.isReady, router.query])

  return (
    <AdminLayout>
      <div className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-2 sm:p-4">
        {/* Go Back Button */}
        <Link
          href="/admin/finance"
          className="absolute top-6 left-6 z-10 group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-cyan-500 text-white font-medium rounded-full shadow-lg hover:from-emerald-500 hover:to-cyan-400 transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-50"
        >
          <FaArrowLeft className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform duration-300" />
          <span className="text-sm md:text-base">Back to Finance</span>
        </Link>

        {/* Success Content */}
        <div className="text-center bg-white dark:bg-slate-800 bg-opacity-90 dark:bg-opacity-90 p-8 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 border-emerald-500/20 dark:border-emerald-500/20 max-w-md w-full">
          {isProcessing ? (
            <>
              <h1 className="text-3xl md:text-4xl font-bold text-emerald-600 dark:text-emerald-400 mb-4 tracking-wide">
                Processing Top-Up
              </h1>
              <p className="text-lg md:text-xl text-slate-700 dark:text-slate-300 mb-6">
                Your payment was successful. We're adding funds to your balance...
              </p>
              <div className="flex justify-center">
                <FaSpinner className="animate-spin text-4xl text-emerald-600 dark:text-emerald-500" />
              </div>
            </>
          ) : error ? (
            <>
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-4">
                  <FaWallet className="text-red-600 dark:text-red-400 text-4xl" />
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-red-600 dark:text-red-400 mb-4 tracking-wide">
                Error
              </h1>
              <p className="text-lg md:text-xl text-slate-700 dark:text-slate-300 mb-6">{error}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/admin/finance"
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 rounded-md text-white transition-colors duration-300"
                >
                  Back to Finance
                </Link>
                <button
                  onClick={() => router.reload()}
                  className="px-6 py-3 bg-slate-600 hover:bg-slate-700 dark:bg-slate-500 dark:hover:bg-slate-600 rounded-md text-white transition-colors duration-300"
                >
                  Try Again
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-emerald-100 dark:bg-emerald-900/20 p-4">
                  <FaCheckCircle className="text-emerald-600 dark:text-emerald-500 text-6xl" />
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-emerald-600 dark:text-emerald-400 mb-4 tracking-wide">
                Top-Up Successful!
              </h1>
              <p className="text-lg md:text-xl text-slate-700 dark:text-slate-300 mb-6">
                Your balance has been updated successfully.
              </p>

              {/* Amount Added */}
              {topUpAmount !== null && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 mb-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Amount Added</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatPrice(convertUSDToKES(topUpAmount))}
                  </p>
                </div>
              )}

              {/* New Balance */}
              {newBalance !== null && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 mb-6">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">New Balance</p>
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatPrice(convertUSDToKES(newBalance))}
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/admin/finance"
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 rounded-md text-white transition-colors duration-300 flex items-center justify-center gap-2"
                >
                  <FaWallet />
                  View Balance
                </Link>
                <Link
                  href="/admin/campaigns/create"
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-md text-white transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  Create Campaign
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Subtle Decorative Elements */}
        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-emerald-500/10 dark:from-emerald-500/10 to-transparent pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>
    </AdminLayout>
  )
}

export default BalanceTopUpSuccess
