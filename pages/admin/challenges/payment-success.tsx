// Vendor Challenge Payment Success Page
// Creates the challenge after successful payment and redirects to the challenge detail page.

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import AdminLayout from '@/components/admin/Layout'
import { vendorCreateChallenge } from '@/services/challenges'
import { verifyPaystackPayment } from '@/services/vendor'
import toast from 'react-hot-toast'
import {
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTrophy,
  FaArrowRight,
} from 'react-icons/fa'
import Link from 'next/link'

const ChallengePaymentSuccess: React.FC = () => {
  const router = useRouter()

  const [isProcessing, setIsProcessing] = useState(true)
  const [error, setError]               = useState<string | null>(null)
  const [challengeId, setChallengeId]   = useState<string | null>(null)
  const [challengeTitle, setChallengeTitle] = useState('')

  useEffect(() => {
    const processPayment = async () => {
      const { vendorId, type, paymentMethod, reference, session_id, challengeId: queryChallengeId } = router.query

      if (!vendorId) return

      // Already processed (balance path sends challengeId directly)
      if (queryChallengeId) {
        setChallengeId(queryChallengeId as string)
        setIsProcessing(false)
        return
      }

      // Dedup guard
      const dedupKey = `processed_challenge_payment_${reference || session_id || 'unknown'}`
      const already  = typeof window !== 'undefined' ? sessionStorage.getItem(dedupKey) : null
      if (already) {
        const saved = JSON.parse(already)
        if (saved.challengeId) {
          setChallengeId(saved.challengeId)
          setChallengeTitle(saved.challengeTitle || '')
          setIsProcessing(false)
          return
        }
      }

      // Verify payment if via Paystack
      let paymentTransactionId: string | undefined
      let verifiedMethod: string | undefined

      if (paymentMethod === 'paystack' && reference) {
        try {
          const result = await verifyPaystackPayment(reference as string)
          paymentTransactionId = result.reference || (reference as string)
          verifiedMethod = 'paystack'
        } catch {
          setError('Paystack payment verification failed. Contact support if payment was deducted.')
          setIsProcessing(false)
          return
        }
      } else if (paymentMethod === 'stripe' && session_id) {
        paymentTransactionId = session_id as string
        verifiedMethod = 'stripe'
      }

      // Retrieve challenge data from sessionStorage
      const challengeDataStr = typeof window !== 'undefined' ? sessionStorage.getItem('pendingChallenge') : null
      if (!challengeDataStr) {
        setError('Challenge data not found. If payment was successful, contact support.')
        setIsProcessing(false)
        return
      }

      try {
        const challengeData = JSON.parse(challengeDataStr)

        const challenge = await vendorCreateChallenge({
          ...challengeData,
          ...(paymentTransactionId && verifiedMethod && {
            paymentMethod: verifiedMethod,
            transactionId: paymentTransactionId,
          }),
          useBalance: paymentMethod === 'balance',
        } as any)

        setChallengeId(challenge.id)
        setChallengeTitle(challenge.title || '')

        // Dedup save
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(dedupKey, JSON.stringify({
            challengeId: challenge.id,
            challengeTitle: challenge.title || '',
            processedAt: new Date().toISOString(),
          }))
          sessionStorage.removeItem('pendingChallenge')
        }
      } catch (err: any) {
        const msg = err?.response?.data?.error || err?.message || 'Failed to create challenge after payment'
        setError(msg)
        toast.error(msg)
      } finally {
        setIsProcessing(false)
      }
    }

    if (router.isReady && router.query.vendorId) {
      processPayment()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.query])

  return (
    <AdminLayout>
      <div className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">

        {/* Decorative */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 dark:bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">

            {isProcessing && (
              <div className="p-10 text-center">
                <div className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center mx-auto mb-6">
                  <FaSpinner className="animate-spin text-indigo-600 dark:text-indigo-400" size={32} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Processing Payment</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Creating your challenge and submitting for review...
                </p>
              </div>
            )}

            {!isProcessing && error && (
              <div className="p-10 text-center">
                <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center mx-auto mb-6">
                  <FaExclamationTriangle className="text-red-500" size={32} />
                </div>
                <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">Something went wrong</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{error}</p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => router.push('/admin/challenges/create')}
                    className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors"
                  >
                    Back to Create
                  </button>
                  <button
                    onClick={() => router.push('/admin/challenges')}
                    className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-colors"
                  >
                    My Challenges
                  </button>
                </div>
              </div>
            )}

            {!isProcessing && !error && challengeId && (
              <>
                {/* Success gradient bar */}
                <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

                <div className="p-8 text-center">
                  <div className="relative inline-block mb-6">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50">
                      <FaTrophy className="text-yellow-300" size={32} />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800">
                      <FaCheckCircle className="text-white" size={12} />
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Challenge Submitted! 🎉
                  </h2>
                  {challengeTitle && (
                    <p className="text-indigo-600 dark:text-indigo-400 font-semibold text-base mb-2 line-clamp-2">
                      {challengeTitle}
                    </p>
                  )}
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                    Your challenge is now <strong>pending review</strong>. Once approved,
                    it will go live on the scheduled start date.
                  </p>

                  {/* What happens next */}
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-4 mb-6 text-left border border-indigo-100 dark:border-indigo-800">
                    <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wide mb-3">What happens next</p>
                    <div className="space-y-2.5">
                      {[
                        { icon: '🔍', text: 'Our team reviews your challenge (usually within 24h)' },
                        { icon: '✅', text: 'Once approved, partners can discover and join' },
                        { icon: '🏆', text: 'Winners are determined when the challenge ends' },
                        { icon: '💸', text: 'Prizes are paid out via M-Pesa / PayPal' },
                      ].map(({ icon, text }) => (
                        <div key={text} className="flex items-start gap-2.5 text-sm">
                          <span className="flex-shrink-0">{icon}</span>
                          <span className="text-gray-600 dark:text-gray-400">{text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link href={`/admin/challenges/${challengeId}`}
                      className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all text-sm shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30">
                      <FaTrophy size={13} /> View Challenge <FaArrowRight size={11} />
                    </Link>
                    <Link href="/admin/challenges"
                      className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-colors text-sm">
                      My Challenges
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default ChallengePaymentSuccess
