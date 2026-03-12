// Budget and Payment Form Component

import React from 'react'
import { FaTimes } from 'react-icons/fa'
import { useCurrency } from '@/hooks/useCurrency'

interface FollowerTier {
  minFollowers: number
  maxFollowers: number | null
  amount: string
}

interface BudgetPaymentFormProps {
  formData: {
    budget?: string
    paymentStructure: string
    paymentAmount: string
    paymentPerInfluencer: string
    paymentType: 'fixed' | 'tiered'
    followerTiers: FollowerTier[]
  }
  campaignBudget?: number
  errors: Record<string, string>
  calculatedMaxInfluencers: string | number
  vendorBalance?: number | null
  useBalance?: boolean
  onUseBalanceChange?: (use: boolean) => void
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
  onTierChange: (index: number, field: keyof FollowerTier, value: string | number | null) => void
  onAddTier: () => void
  onRemoveTier: (index: number) => void
}

const BudgetPaymentForm: React.FC<BudgetPaymentFormProps> = ({
  formData,
  campaignBudget,
  errors,
  calculatedMaxInfluencers,
  vendorBalance,
  useBalance = true,
  onUseBalanceChange,
  onChange,
  onTierChange,
  onAddTier,
  onRemoveTier,
}) => {
  const { formatPrice, selectedCurrency: userCurrency, convertUSDToKES } = useCurrency()
  const currencySymbol = userCurrency === 'KES' ? 'KES' : 'USD'
  
  const budgetInUSD = formData.budget 
    ? (userCurrency === 'KES' ? parseFloat(formData.budget) / 130 : parseFloat(formData.budget))
    : 0
  
  const balanceCoverage = vendorBalance !== null && vendorBalance !== undefined && budgetInUSD > 0
    ? Math.min((vendorBalance / budgetInUSD) * 100, 100)
    : 0
  const remainingNeeded = vendorBalance !== null && vendorBalance !== undefined && budgetInUSD > 0
    ? Math.max(0, budgetInUSD - vendorBalance)
    : budgetInUSD
  
  return (
    <div className="bg-white dark:bg-slate-900/70 rounded-xl p-6 border border-slate-200 dark:border-white/10 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Campaign Budget & Payment</h2>

      <div className="space-y-4">
        {/* Balance Display */}
        {formData.budget !== undefined && campaignBudget === undefined && vendorBalance !== null && (
          <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 dark:from-emerald-500/10 dark:to-cyan-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Account Balance:</span>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {vendorBalance !== null && vendorBalance !== undefined ? formatPrice(convertUSDToKES(vendorBalance)) : 'Loading...'}
                </span>
              </div>
              {onUseBalanceChange && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useBalance}
                    onChange={(e) => onUseBalanceChange(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                  />
                  <span className="text-xs text-slate-700 dark:text-slate-300">Use balance</span>
                </label>
              )}
            </div>
            {useBalance && formData.budget && budgetInUSD > 0 && (
              <div className="mt-3 space-y-2">
                {vendorBalance! >= budgetInUSD ? (
                  <div className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                    ✓ Your balance covers the full campaign budget. No payment required.
                  </div>
                ) : vendorBalance! > 0 ? (
                  <>
                    <div className="text-xs text-slate-700 dark:text-slate-300">
                      Your balance will cover {formatPrice(convertUSDToKES(vendorBalance!))} ({balanceCoverage.toFixed(1)}%)
                    </div>
                    <div className="text-xs text-slate-700 dark:text-slate-300">
                      Remaining to pay: <span className="font-semibold">{formatPrice(convertUSDToKES(remainingNeeded))}</span>
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-slate-700 dark:text-slate-300">
                    No balance available. Full payment required.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Budget Input */}
        {formData.budget !== undefined && campaignBudget === undefined && (
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Campaign Budget ({currencySymbol}) *
            </label>
            <input
              type="number"
              name="budget"
              value={formData.budget}
              onChange={onChange}
              min="10"
              step="0.01"
              className={`w-full px-3 py-2.5 rounded-xl border bg-white dark:bg-white/5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-400 dark:focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/15 ${
                errors.budget ? 'border-red-500 dark:border-red-500/50' : 'border-slate-200 dark:border-white/10'
              }`}
              placeholder="0.00"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              This is the total amount you're willing to spend on this campaign. Minimum budget is {formatPrice(10)}.
            </p>
            {errors.budget && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.budget}</p>
            )}
          </div>
        )}

        {/* Payment Type Selection (for INFLUENCER) */}
        {formData.budget !== undefined && campaignBudget === undefined && formData.paymentStructure === 'INFLUENCER' && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">Payment Type *</label>
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  id="fixed-payment"
                  name="paymentType"
                  type="radio"
                  value="fixed"
                  checked={formData.paymentType === 'fixed'}
                  onChange={onChange}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-600"
                />
                <label htmlFor="fixed-payment" className="ml-2 block text-xs text-slate-700 dark:text-slate-300">
                  Fixed amount per influencer
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="tiered-payment"
                  name="paymentType"
                  type="radio"
                  value="tiered"
                  checked={formData.paymentType === 'tiered'}
                  onChange={onChange}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-600"
                />
                <label htmlFor="tiered-payment" className="ml-2 block text-xs text-slate-700 dark:text-slate-300">
                  Tiered payment based on follower count
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Payment Per Influencer - Fixed */}
        {formData.budget !== undefined && campaignBudget === undefined && formData.paymentStructure === 'INFLUENCER' && formData.paymentType === 'fixed' && (
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Payment Per Influencer ({currencySymbol}) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              name="paymentPerInfluencer"
              value={formData.paymentPerInfluencer}
              onChange={onChange}
              className={`w-full px-3 py-2.5 rounded-xl border bg-white dark:bg-white/5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-400 dark:focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/15 ${
                errors.paymentPerInfluencer ? 'border-red-500 dark:border-red-500/50' : 'border-slate-200 dark:border-white/10'
              }`}
              placeholder="0.00"
            />
            {errors.paymentPerInfluencer && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.paymentPerInfluencer}</p>
            )}
          </div>
        )}

        {/* Payment Amount - CPC/CPA */}
        {formData.budget !== undefined && campaignBudget === undefined && ['CPC', 'CPA'].includes(formData.paymentStructure) && (
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Amount per {formData.paymentStructure === 'CPC' ? 'click' : 'action'} ({currencySymbol}) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              name="paymentAmount"
              value={formData.paymentAmount}
              onChange={onChange}
              className={`w-full px-3 py-2.5 rounded-xl border bg-white dark:bg-white/5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-400 dark:focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/15 ${
                errors.paymentAmount ? 'border-red-500 dark:border-red-500/50' : 'border-slate-200 dark:border-white/10'
              }`}
              placeholder="0.00"
            />
            {errors.paymentAmount && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.paymentAmount}</p>
            )}
          </div>
        )}

        {/* Follower Tiers - Tiered */}
        {formData.budget !== undefined && campaignBudget === undefined && formData.paymentStructure === 'INFLUENCER' && formData.paymentType === 'tiered' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Follower Count Tiers *</label>
              <button type="button" onClick={onAddTier} className="text-xs px-2 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                Add Tier
              </button>
            </div>
            {errors.followerTiers && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400 mb-2">{errors.followerTiers}</p>
            )}
            <div className="space-y-3 bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/10">
              {formData.followerTiers.map((tier, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-12 sm:col-span-4">
                    <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Min Followers</label>
                    <input
                      type="number"
                      min="0"
                      value={tier.minFollowers}
                      onChange={(e) => onTierChange(index, 'minFollowers', parseInt(e.target.value) || 0)}
                      className={`w-full px-2 py-1.5 text-xs border rounded-xl ${
                        errors[`tier_${index}_min`] ? 'border-red-500' : 'border-slate-200 dark:border-white/10'
                      } bg-white dark:bg-white/5 text-slate-900 dark:text-white`}
                    />
                  </div>
                  <div className="col-span-12 sm:col-span-4">
                    <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Max Followers</label>
                    <input
                      type="number"
                      min={tier.minFollowers}
                      value={tier.maxFollowers || ''}
                      onChange={(e) => onTierChange(index, 'maxFollowers', e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="Unlimited"
                      className="w-full px-2 py-1.5 text-xs border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="col-span-12 sm:col-span-3">
                    <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Payment ({currencySymbol})</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={tier.amount}
                      onChange={(e) => onTierChange(index, 'amount', e.target.value)}
                      className={`w-full px-2 py-1.5 text-xs border rounded-xl ${
                        errors[`tier_${index}_amount`] ? 'border-red-500' : 'border-slate-200 dark:border-white/10'
                      } bg-white dark:bg-white/5 text-slate-900 dark:text-white`}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="col-span-12 sm:col-span-1 flex justify-center">
                    {formData.followerTiers.length > 1 && (
                      <button type="button" onClick={() => onRemoveTier(index)} className="text-red-500 hover:text-red-700 mt-5 sm:mt-0" title="Remove tier">
                        <FaTimes className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Max Influencers Display */}
        {formData.budget !== undefined && campaignBudget === undefined && formData.paymentPerInfluencer && calculatedMaxInfluencers && (
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/5 p-4">
            <p className="text-xs text-emerald-600 dark:text-emerald-300 font-medium mb-1">Estimated capacity</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{calculatedMaxInfluencers}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">max creators can be paid within this budget</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default BudgetPaymentForm
