// Payment Method Selector Component

import React from 'react'
import { FaCreditCard, FaMoneyBillWave } from 'react-icons/fa'
import { useCurrency } from '@/hooks/useCurrency'

interface PaymentMethodSelectorProps {
  selectedMethod: 'stripe' | 'paystack' | null
  onSelectMethod: (method: 'stripe' | 'paystack') => void
  selectedCurrency?: 'USD' | 'KES' | 'NGN'
  onSelectCurrency?: (currency: 'USD' | 'KES' | 'NGN') => void
  amountInUSD: number
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onSelectMethod,
  selectedCurrency = 'USD',
  onSelectCurrency,
  amountInUSD,
}) => {
  const { formatPrice } = useCurrency()
  const USD_TO_KES_RATE = 130
  const USD_TO_NGN_RATE = 1600
  const amountInKES = amountInUSD * USD_TO_KES_RATE
  const amountInNGN = amountInUSD * USD_TO_NGN_RATE

  const formatPaymentCurrency = (targetCurrency: string) => {
    if (targetCurrency === 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amountInUSD)
    }
    if (targetCurrency === 'KES') {
      return new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES',
      }).format(amountInKES)
    }
    if (targetCurrency === 'NGN') {
      return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
      }).format(amountInNGN)
    }
    return formatPrice(amountInKES)
  }

  return (
    <div className="bg-white dark:bg-slate-900/70 rounded-xl p-6 border border-slate-200 dark:border-white/10">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
        Select Payment Method
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
        Choose your preferred payment method to complete the campaign creation
      </p>

      <div className="bus-responsive-two-col gap-4">
        {/* Stripe Option */}
        <button
          type="button"
          onClick={() => onSelectMethod('stripe')}
          className={`p-6 rounded-xl border-2 transition-all ${
            selectedMethod === 'stripe'
              ? 'border-emerald-400 dark:border-emerald-400/60 bg-emerald-50 dark:bg-emerald-400/10'
              : 'border-slate-200 dark:border-white/10 hover:border-emerald-300 dark:hover:border-emerald-500/30'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <FaCreditCard className="h-6 w-6 text-emerald-500 mr-3" />
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Stripe</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Credit/Debit Cards</p>
              </div>
            </div>
            {selectedMethod === 'stripe' && (
              <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Pay securely with Visa, Mastercard, American Express, and more
          </p>
        </button>

        {/* Paystack Option */}
        <button
          type="button"
          onClick={() => onSelectMethod('paystack')}
          className={`p-6 rounded-xl border-2 transition-all ${
            selectedMethod === 'paystack'
              ? 'border-emerald-400 dark:border-emerald-400/60 bg-emerald-50 dark:bg-emerald-400/10'
              : 'border-slate-200 dark:border-white/10 hover:border-emerald-300 dark:hover:border-emerald-500/30'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <FaMoneyBillWave className="h-6 w-6 text-emerald-500 mr-3" />
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Paystack</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Cards & Bank Transfer</p>
              </div>
            </div>
            {selectedMethod === 'paystack' && (
              <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Pay with cards, bank transfer, or mobile money (Kenya & Global)
          </p>
        </button>
      </div>

      {/* Currency Selection for Paystack */}
      {selectedMethod === 'paystack' && onSelectCurrency && (
        <div className="mt-6 p-4 bg-slate-50 dark:bg-white/5 rounded-xl">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-3">
            Select Currency
          </label>
          <div className="bus-responsive-stat-grid gap-3">
            {(['USD', 'KES', 'NGN'] as const).map((currency) => (
              <button
                key={currency}
                type="button"
                onClick={() => onSelectCurrency(currency)}
                className={`px-4 py-2 rounded-xl border-2 transition-all ${
                  selectedCurrency === currency
                    ? 'border-emerald-400 dark:border-emerald-400/60 bg-emerald-50 dark:bg-emerald-400/10 text-emerald-700 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-white/10 hover:border-emerald-300 dark:hover:border-emerald-500/30 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="font-semibold text-sm">{currency}</div>
                <div className="text-[10px] mt-1">
                  {currency === 'KES' && 'Kenyan Shilling'}
                  {currency === 'USD' && 'US Dollar'}
                  {currency === 'NGN' && 'Nigerian Naira'}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Payment Amount Display */}
      {selectedMethod && (
        <div className="mt-6 p-4 bg-slate-50 dark:bg-white/5 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600 dark:text-slate-300">Total Amount:</span>
            <div className="text-right">
              {selectedMethod === 'paystack' ? (
                <>
                  <div className="text-xl font-bold text-slate-900 dark:text-white">
                    {formatPaymentCurrency(selectedCurrency)}
                  </div>
                  {selectedCurrency !== 'USD' && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      (= {formatPaymentCurrency('USD')})
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="text-xl font-bold text-slate-900 dark:text-white">
                    {formatPrice(amountInKES)}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    (= {formatPaymentCurrency('USD')})
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PaymentMethodSelector
