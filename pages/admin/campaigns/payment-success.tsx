// Business admin: campaign payment success — creates campaign after Paystack/Stripe (mirrors vendor flow + challenge admin pattern).

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import AdminLayout from '@/components/admin/Layout'
import {
  verifyPaystackPayment,
  addFundsToCampaign,
  createCampaign,
  uploadCampaignImage,
  uploadAdditionalImages,
  addProductsToCampaign,
} from '@/services/vendor'
import toast from 'react-hot-toast'
import { FaSpinner, FaCheckCircle } from 'react-icons/fa'

const CampaignPaymentSuccess: React.FC = () => {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [campaignId, setCampaignId] = useState<string | null>(null)
  const [campaignTitle, setCampaignTitle] = useState<string>('')

  useEffect(() => {
    const processPayment = async () => {
      const { vendorId, campaignId: queryCampaignId, type, paymentMethod, reference } = router.query
      const paystackRef =
        (reference || router.query.trxref || router.query.reference) as string | undefined

      if (!vendorId) return

      if (campaignId || (queryCampaignId && type !== 'campaign_funds')) {
        if (queryCampaignId && !campaignId) {
          setCampaignId(queryCampaignId as string)
        }
        setIsProcessing(false)
        return
      }

      const processedPaymentKey = `processed_payment_${paystackRef || router.query.session_id || 'unknown'}`
      const alreadyProcessed = sessionStorage.getItem(processedPaymentKey)
      if (alreadyProcessed) {
        const processedData = JSON.parse(alreadyProcessed)
        if (processedData.campaignId) {
          setCampaignId(processedData.campaignId)
          setCampaignTitle(processedData.campaignTitle || '')
          setIsProcessing(false)
          return
        }
      }

      let paymentTransactionId: string | undefined
      let verifiedPaymentMethod: string | undefined

      if (paymentMethod === 'paystack' && paystackRef) {
        try {
          const verificationResult = await verifyPaystackPayment(paystackRef)
          paymentTransactionId = verificationResult.reference || paystackRef
          verifiedPaymentMethod = 'paystack'
        } catch (err: unknown) {
          console.error('Paystack verification error:', err)
          setError('Payment verification failed. Please contact support if payment was successful.')
          setIsProcessing(false)
          return
        }
      } else if (paymentMethod === 'stripe' || !paymentMethod) {
        const stripeSessionId = router.query.session_id as string | undefined
        if (stripeSessionId) {
          paymentTransactionId = stripeSessionId
          verifiedPaymentMethod = 'stripe'
        }
      }

      try {
        if (type === 'balance_top_up') {
          router.push(
            `/admin/finance/success?vendorId=${vendorId}&type=balance_top_up&paymentMethod=${verifiedPaymentMethod || paymentMethod || 'stripe'}${
              paymentTransactionId
                ? `&${paymentMethod === 'paystack' ? 'reference' : 'session_id'}=${paymentTransactionId}`
                : ''
            }`
          )
          return
        } else if (type === 'campaign_funds' && queryCampaignId) {
          const fundDataString = sessionStorage.getItem('pendingFunds')
          if (!fundDataString) {
            throw new Error('Fund data not found')
          }

          const fundData = JSON.parse(fundDataString)

          await addFundsToCampaign({
            campaignId: queryCampaignId as string,
            amount: fundData.amount,
          })
          setCampaignId(queryCampaignId as string)
          sessionStorage.removeItem('pendingFunds')
        } else {
          const campaignDataString = sessionStorage.getItem('pendingCampaign')
          if (!campaignDataString) {
            if (queryCampaignId) {
              setCampaignId(queryCampaignId as string)
              setIsProcessing(false)
              return
            }
            setError(
              'Campaign data not found. If you have already created this campaign, open it from your campaigns list.'
            )
            setIsProcessing(false)
            return
          }

          const campaignData = JSON.parse(campaignDataString)

          setCampaignTitle(campaignData.title || 'Campaign')

          let thumbnailImage: string | null = null
          let promotionalImages: string[] = []

          if (campaignData.hasThumbnailImage || campaignData.hasPromotionalImages) {
            try {
              const dbName = 'campaignImages'
              const db = await new Promise<IDBDatabase>((resolve, reject) => {
                const request = indexedDB.open(dbName, 1)
                request.onsuccess = () => resolve(request.result)
                request.onerror = () => reject(request.error)
                request.onupgradeneeded = (event: any) => {
                  const db = event.target.result
                  if (!db.objectStoreNames.contains('images')) {
                    db.createObjectStore('images', { keyPath: 'id' })
                  }
                }
              })

              const transaction = db.transaction(['images'], 'readonly')
              const store = transaction.objectStore('images')

              if (campaignData.hasThumbnailImage) {
                thumbnailImage = await new Promise<string | null>((resolve) => {
                  const request = store.get('thumbnail')
                  request.onsuccess = () => {
                    resolve(request.result?.data || null)
                  }
                  request.onerror = () => resolve(null)
                })
              }

              if (campaignData.hasPromotionalImages) {
                const count = campaignData.promotionalImagesCount || 0
                const imagePromises: Promise<string | null>[] = []
                for (let i = 0; i < count; i++) {
                  imagePromises.push(
                    new Promise<string | null>((resolve) => {
                      const request = store.get(`promotional_${i}`)
                      request.onsuccess = () => {
                        resolve(request.result?.data || null)
                      }
                      request.onerror = () => resolve(null)
                    })
                  )
                }
                const images = await Promise.all(imagePromises)
                promotionalImages = images.filter((img): img is string => img !== null)
              }

              db.close()
            } catch (dbError) {
              console.warn('Could not retrieve images from IndexedDB:', dbError)
              toast.error('Images could not be retrieved. Re-upload them after campaign creation if needed.')
            }
          }

          const {
            hasThumbnailImage: _h,
            hasPromotionalImages: _p,
            promotionalImagesCount: _c,
            selectedProducts,
            ...campaignPayload
          } = campaignData

          const campaignPayloadWithPayment = {
            ...campaignPayload,
            ...(paymentTransactionId &&
              verifiedPaymentMethod && {
                paymentMethod: verifiedPaymentMethod,
                transactionId: paymentTransactionId,
              }),
          }

          try {
            const createdCampaign = await createCampaign(campaignPayloadWithPayment)
            const createdCampaignId = createdCampaign.id

            if (thumbnailImage) {
              try {
                await uploadCampaignImage(createdCampaignId, thumbnailImage)
              } catch (uploadErr: unknown) {
                console.error('Thumbnail upload error:', uploadErr)
                toast.error('Thumbnail upload failed; campaign was created.')
              }
            }

            if (promotionalImages.length > 0) {
              try {
                await uploadAdditionalImages(createdCampaignId, promotionalImages)
              } catch (uploadErr: unknown) {
                console.error('Promotional images upload error:', uploadErr)
                toast.error('Some images failed to upload; campaign was created.')
              }
            }

            if (selectedProducts && selectedProducts.length > 0) {
              try {
                await addProductsToCampaign(createdCampaignId, selectedProducts)
              } catch (prodErr: unknown) {
                console.error('Product addition error:', prodErr)
                toast.error('Products could not be attached; add them from the campaign page.')
              }
            }

            if (thumbnailImage || promotionalImages.length > 0) {
              try {
                const dbName = 'campaignImages'
                const db = await new Promise<IDBDatabase>((resolve, reject) => {
                  const request = indexedDB.open(dbName, 1)
                  request.onsuccess = () => resolve(request.result)
                  request.onerror = () => reject(request.error)
                })

                const transaction = db.transaction(['images'], 'readwrite')
                const store = transaction.objectStore('images')

                if (thumbnailImage) {
                  store.delete('thumbnail')
                }

                for (let i = 0; i < promotionalImages.length; i++) {
                  store.delete(`promotional_${i}`)
                }

                await new Promise((resolve) => {
                  transaction.oncomplete = () => resolve(undefined)
                  transaction.onerror = () => resolve(undefined)
                })

                db.close()
              } catch (cleanupError) {
                console.warn('Could not clean up IndexedDB:', cleanupError)
              }
            }

            setCampaignId(createdCampaignId)
            setCampaignTitle(campaignData.title || '')

            const dedupeKey = `processed_payment_${paymentTransactionId || paystackRef || router.query.session_id || Date.now()}`
            sessionStorage.setItem(
              dedupeKey,
              JSON.stringify({
                campaignId: createdCampaignId,
                campaignTitle: campaignData.title || '',
                processedAt: new Date().toISOString(),
              })
            )

            sessionStorage.removeItem('pendingCampaign')

            try {
              localStorage.removeItem('business_campaign_draft')
              const request = indexedDB.open('businessCampaignDraftImages', 1)
              request.onsuccess = (event: any) => {
                const db = event.target.result
                if (db.objectStoreNames.contains('images')) {
                  const tx = db.transaction(['images'], 'readwrite')
                  tx.objectStore('images').clear()
                }
              }
            } catch (draftError) {
              console.warn('Could not clear draft:', draftError)
            }
          } catch (err: unknown) {
            const anyErr = err as { response?: { data?: { error?: string } }; message?: string }
            console.error('Campaign creation error:', anyErr.response?.data || anyErr.message)
            const errorMessage =
              anyErr.response?.data?.error || anyErr.message || 'Failed to create campaign'
            setError(errorMessage)
            setIsProcessing(false)
            toast.error(errorMessage)
            return
          }
        }
      } catch (err: unknown) {
        const anyErr = err as { response?: { data?: { error?: string; message?: string } }; message?: string }
        console.error('Error processing payment:', err)
        let errorMessage = 'Failed to process payment. Please contact support.'
        if (anyErr.response?.data?.error) {
          errorMessage = anyErr.response.data.error
        } else if (anyErr.response?.data?.message) {
          errorMessage = anyErr.response.data.message
        } else if (anyErr.message) {
          errorMessage = anyErr.message
        }
        setError(errorMessage)
      } finally {
        setIsProcessing(false)
      }
    }

    if (router.isReady && router.query.vendorId) {
      void processPayment()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.query])

  const handleRedirect = () => {
    if (campaignId) {
      void router.push(`/admin/campaigns/${campaignId}`)
    } else {
      void router.push('/admin/campaigns')
    }
  }

  return (
    <AdminLayout>
      <div className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-2 sm:p-4">
        <button
          type="button"
          onClick={() => void router.push('/admin/campaigns')}
          className="absolute top-6 left-6 z-10 group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-medium rounded-full shadow-lg hover:from-emerald-500 hover:to-teal-400 transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-50"
        >
          <svg
            className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform duration-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm md:text-base">Back to Campaigns</span>
        </button>

        <div className="text-center bg-white dark:bg-gray-800 bg-opacity-90 dark:bg-opacity-90 p-8 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-md w-full">
          {isProcessing ? (
            <>
              <h1 className="text-3xl md:text-4xl font-bold text-emerald-600 dark:text-emerald-400 mb-4 tracking-wide">
                Processing Payment
              </h1>
              <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-6">
                Your payment was successful. We are creating your campaign…
              </p>
              <div className="flex justify-center">
                <FaSpinner className="animate-spin text-4xl text-emerald-600 dark:text-emerald-500" />
              </div>
            </>
          ) : error ? (
            <>
              <h1 className="text-3xl md:text-4xl font-bold text-red-600 dark:text-red-400 mb-4 tracking-wide">
                Error
              </h1>
              <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-6">{error}</p>
              <button
                type="button"
                onClick={() => void router.push('/admin/campaigns/create')}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 rounded-md text-white transition-colors duration-300"
              >
                Try Again
              </button>
            </>
          ) : (
            <>
              <div className="flex justify-center mb-4">
                <FaCheckCircle className="text-green-600 dark:text-green-500 text-6xl" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-green-600 dark:text-green-400 mb-4 tracking-wide">
                Payment Successful!
              </h1>
              <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-6">
                Your campaign has been submitted and is pending approval from our team.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  type="button"
                  onClick={handleRedirect}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 rounded-md text-white transition-colors duration-300"
                >
                  View Campaign
                </button>
              </div>
            </>
          )}
        </div>

        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-emerald-500/10 dark:from-emerald-500/10 to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 dark:bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>
    </AdminLayout>
  )
}

export default CampaignPaymentSuccess
