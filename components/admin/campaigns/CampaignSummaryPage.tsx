// Campaign Summary Page Component

import React from 'react'
import { FaSpinner, FaEye } from 'react-icons/fa'
import CampaignSummary from './CampaignSummary'
import PaymentMethodSelector from './PaymentMethodSelector'
import PreviewCard from './PreviewCard'
import { useCurrency } from '@/hooks/useCurrency'

interface CampaignSummaryPageProps {
  formData: {
    title: string
    description: string
    objective: string
    budget: string
    paymentStructure: string
    paymentAmount?: string
    paymentPerInfluencer?: string
    paymentType?: 'fixed' | 'tiered'
    followerTiers?: Array<{
      minFollowers: number
      maxFollowers: number | null
      amount: string
    }>
    targetUrl?: string
    startDate: string
    endDate: string
    requirements: string[]
    videoLink?: string
  }
  thumbnailImage: string | null
  promotionalImages: string[]
  selectedProducts?: Array<{
    productId: string
    commissionRate?: number
    commissionAmount?: number
    commissionType?: 'PERCENTAGE' | 'FIXED'
  }>
  isPublic?: boolean
  audienceTargeting?: {
    locations?: Array<{
      lat?: number
      lng?: number
      radius?: number
      address: string
      type?: 'text' | 'map'
    }>
  } | null
  selectedPaymentMethod: 'stripe' | 'paystack' | null
  selectedCurrency: 'USD' | 'KES' | 'NGN'
  onSelectPaymentMethod: (method: 'stripe' | 'paystack' | null) => void
  onSelectCurrency: (currency: 'USD' | 'KES' | 'NGN') => void
  onBackToEdit: () => void
  onPayment: () => void
  onShowPreview: () => void
  isSubmitting: boolean
  budget: number
  vendorBalance?: number | null
  useBalance?: boolean
  remainingPaymentNeeded?: number
}

const CampaignSummaryPage: React.FC<CampaignSummaryPageProps> = ({
  formData,
  thumbnailImage,
  promotionalImages,
  selectedProducts,
  isPublic,
  audienceTargeting,
  selectedPaymentMethod,
  selectedCurrency,
  onSelectPaymentMethod,
  onSelectCurrency,
  onBackToEdit,
  onPayment,
  onShowPreview,
  isSubmitting,
  budget,
  vendorBalance,
  useBalance = true,
  remainingPaymentNeeded,
}) => {
  const { formatPrice, selectedCurrency: userCurrency, convertUSDToKES } = useCurrency()
  const USD_TO_KES_RATE = 130

  const budgetInUSD = userCurrency === 'KES' ? budget / USD_TO_KES_RATE : budget
  const amountToPayInUSD = useBalance && remainingPaymentNeeded !== undefined && remainingPaymentNeeded >= 0
    ? remainingPaymentNeeded
    : budgetInUSD

  const balanceCoversFull = useBalance && vendorBalance !== null && vendorBalance !== undefined && vendorBalance >= budgetInUSD

  const getPaymentButtonText = () => {
    if (balanceCoversFull) {
      return 'Publish Campaign'
    }

    if (selectedPaymentMethod === 'paystack' && selectedCurrency === 'KES') {
      const displayAmountKES = amountToPayInUSD * USD_TO_KES_RATE
      return `Pay KES ${displayAmountKES.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    } else if (selectedPaymentMethod === 'paystack' && selectedCurrency === 'USD') {
      return `Pay $${amountToPayInUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    } else {
      const budgetInKES = amountToPayInUSD * USD_TO_KES_RATE
      return `Pay ${formatPrice(budgetInKES)}`
    }
  }

  return (
    <>
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white mb-4 sm:mb-6">
        Review & Payment
      </h1>
      <div className="space-y-6">
        <CampaignSummary
          formData={formData}
          thumbnailImage={thumbnailImage}
          promotionalImages={promotionalImages}
          selectedProducts={selectedProducts}
          isPublic={isPublic}
          audienceTargeting={audienceTargeting}
        />

        {/* Preview Section */}
        <div className="bg-white dark:bg-slate-900/70 rounded-xl border border-slate-200 dark:border-white/10 shadow-lg overflow-hidden">
          <div className="p-4 sm:p-6 bg-gradient-to-r from-emerald-50 to-cyan-50 dark:from-emerald-500/10 dark:to-cyan-500/10 border-b border-slate-200 dark:border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-1">
                  Campaign Preview
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  See how your campaign will appear on social media platforms
                </p>
              </div>
              <button
                type="button"
                onClick={onShowPreview}
                className="flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 hover:opacity-90 rounded-lg transition-all shadow-md hover:shadow-lg"
              >
                <FaEye className="h-4 w-4" />
                <span>View Full Preview</span>
              </button>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <PreviewCard
                platform="facebook"
                title={formData.title}
                description={formData.description}
                thumbnailImage={thumbnailImage}
                onClick={onShowPreview}
              />
              <PreviewCard
                platform="instagram"
                title={formData.title}
                description={formData.description}
                thumbnailImage={thumbnailImage}
                onClick={onShowPreview}
              />
              <PreviewCard
                platform="x"
                title={formData.title}
                description={formData.description}
                thumbnailImage={thumbnailImage}
                onClick={onShowPreview}
              />
              {formData.videoLink && (
                <PreviewCard
                  platform="youtube"
                  title={formData.title}
                  description={formData.description}
                  thumbnailImage={thumbnailImage}
                  onClick={onShowPreview}
                />
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 text-center">
              Click any preview card to view in full screen
            </p>
          </div>
        </div>

        {/* Balance Info */}
        {vendorBalance !== null && useBalance && (
          <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 dark:from-emerald-500/10 dark:to-cyan-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Account Balance:</span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {vendorBalance !== null && vendorBalance !== undefined ? formatPrice(convertUSDToKES(vendorBalance)) : 'Loading...'}
              </span>
            </div>
            {balanceCoversFull ? (
              <div className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                ✓ Your balance covers the full campaign budget. No payment required. Click "Publish Campaign" to proceed.
              </div>
            ) : vendorBalance !== null && vendorBalance !== undefined && vendorBalance > 0 && remainingPaymentNeeded !== undefined ? (
              <div className="text-xs text-slate-700 dark:text-slate-300">
                Balance will cover {formatPrice(convertUSDToKES(vendorBalance))}. 
                Remaining to pay: <span className="font-semibold">{formatPrice(convertUSDToKES(remainingPaymentNeeded))}</span>
              </div>
            ) : null}
          </div>
        )}

        {/* Only show payment method selector if balance doesn't cover full amount */}
        {!balanceCoversFull && (
          <PaymentMethodSelector
            selectedMethod={selectedPaymentMethod}
            onSelectMethod={onSelectPaymentMethod}
            selectedCurrency={selectedCurrency}
            onSelectCurrency={onSelectCurrency}
            amountInUSD={amountToPayInUSD}
          />
        )}

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onBackToEdit}
            className="flex-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-bold py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl transition-colors text-xs sm:text-sm"
          >
            Back to Edit
          </button>
          <button
            type="button"
            onClick={onPayment}
            disabled={isSubmitting || (!balanceCoversFull && !selectedPaymentMethod)}
            className="flex-1 bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-bold py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl transition-all flex items-center justify-center text-xs sm:text-sm shadow-lg shadow-emerald-500/30"
          >
            {isSubmitting ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Processing...
              </>
            ) : (
              getPaymentButtonText()
            )}
          </button>
        </div>
      </div>
    </>
  )
}

export default CampaignSummaryPage
