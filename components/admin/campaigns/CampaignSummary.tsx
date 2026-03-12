// Campaign Summary Component

import React from 'react'
import { FaCalendar, FaDollarSign, FaLink, FaImage, FaVideo, FaTag, FaGlobe, FaLock, FaMapMarkerAlt } from 'react-icons/fa'
import { useCurrency } from '@/hooks/useCurrency'

interface CampaignSummaryProps {
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
}

const CampaignSummary: React.FC<CampaignSummaryProps> = ({
  formData,
  thumbnailImage,
  promotionalImages,
  selectedProducts,
  isPublic = true,
  audienceTargeting,
}) => {
  const { formatPrice, selectedCurrency: userCurrency } = useCurrency()
  const USD_TO_KES_RATE = 130
  
  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    if (isNaN(num)) return formatPrice(0)
    const amountInKES = userCurrency === 'KES' ? num : num * USD_TO_KES_RATE
    return formatPrice(amountInKES)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatObjective = (objective: string) => {
    const objectiveMap: Record<string, string> = {
      'BRAND_AWARENESS': 'Brand Awareness',
      'TRAFFIC': 'Get More Website Visitors',
      'LEADS': 'Get More Leads',
      'SALES': 'Drive Sales',
      'POLITICAL': 'Political Campaign',
    }
    return objectiveMap[objective] || objective
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-emerald-50 to-cyan-50 dark:from-emerald-500/10 dark:to-cyan-500/10 p-6 rounded-xl border border-emerald-200 dark:border-emerald-500/20">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Campaign Summary</h2>
        <p className="text-slate-600 dark:text-slate-300 text-sm">
          Please review your campaign details before proceeding
        </p>
      </div>

      {/* Campaign Details */}
      <div className="bg-white dark:bg-slate-900/70 rounded-xl p-6 border border-slate-200 dark:border-white/10">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
          <FaTag className="mr-2 text-emerald-500" />
          Campaign Details
        </h3>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Title</p>
            <p className="text-slate-900 dark:text-white font-medium">{formData.title}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Description</p>
            <p className="text-slate-900 dark:text-white text-sm">{formData.description}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Objective</p>
            <p className="text-slate-900 dark:text-white">{formatObjective(formData.objective)}</p>
          </div>
        </div>
      </div>

      {/* Budget & Payment */}
      <div className="bg-white dark:bg-slate-900/70 rounded-xl p-6 border border-slate-200 dark:border-white/10">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
          <FaDollarSign className="mr-2 text-emerald-500" />
          Budget & Payment Structure
        </h3>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Total Budget</p>
            <p className="text-slate-900 dark:text-white font-bold text-xl">
              {formatCurrency(formData.budget)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Payment Structure</p>
            <p className="text-slate-900 dark:text-white">{formData.paymentStructure}</p>
          </div>
          {formData.paymentStructure === 'INFLUENCER' && (
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Payment Type</p>
              <p className="text-slate-900 dark:text-white">
                {formData.paymentType === 'fixed' ? 'Fixed Rate' : 'Tiered Rate'}
              </p>
              {formData.paymentType === 'fixed' && formData.paymentPerInfluencer && (
                <div className="mt-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Per Influencer</p>
                  <p className="text-slate-900 dark:text-white">
                    {formatCurrency(formData.paymentPerInfluencer)}
                  </p>
                </div>
              )}
              {formData.paymentType === 'tiered' && formData.followerTiers && (
                <div className="mt-2 space-y-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Follower Tiers</p>
                  {formData.followerTiers
                    .filter((tier) => tier.amount)
                    .map((tier, index) => (
                      <div key={index} className="bg-slate-50 dark:bg-white/5 p-2 rounded-lg">
                        <p className="text-xs text-slate-900 dark:text-white">
                          {tier.minFollowers.toLocaleString()} -{' '}
                          {tier.maxFollowers ? tier.maxFollowers.toLocaleString() : '∞'} followers:{' '}
                          {formatCurrency(tier.amount)}
                        </p>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
          {formData.paymentStructure !== 'INFLUENCER' && 
           formData.paymentStructure !== 'COMMISSION_PER_SALE' && 
           formData.paymentAmount && (
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Payment Amount</p>
              <p className="text-slate-900 dark:text-white">{formatCurrency(formData.paymentAmount)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Products for Commission Per Sale */}
      {formData.paymentStructure === 'COMMISSION_PER_SALE' && selectedProducts && selectedProducts.length > 0 && (
        <div className="bg-white dark:bg-slate-900/70 rounded-xl p-6 border border-slate-200 dark:border-white/10">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
            <FaTag className="mr-2 text-emerald-500" />
            Selected Products ({selectedProducts.length})
          </h3>
          <div className="space-y-3">
            {selectedProducts.map((product, index) => (
              <div key={index} className="bg-slate-50 dark:bg-white/5 p-3 rounded-lg">
                <p className="text-xs text-slate-900 dark:text-white font-medium">
                  Product {index + 1}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  Commission: {product.commissionType === 'PERCENTAGE' 
                    ? `${product.commissionRate || 0}%`
                    : formatPrice(product.commissionAmount || 0)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schedule */}
      <div className="bg-white dark:bg-slate-900/70 rounded-xl p-6 border border-slate-200 dark:border-white/10">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
          <FaCalendar className="mr-2 text-emerald-500" />
          Campaign Schedule
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Start Date</p>
            <p className="text-slate-900 dark:text-white">{formatDate(formData.startDate)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">End Date</p>
            <p className="text-slate-900 dark:text-white">{formatDate(formData.endDate)}</p>
          </div>
        </div>
      </div>

      {/* Campaign Visibility */}
      <div className="bg-white dark:bg-slate-900/70 rounded-xl p-6 border border-slate-200 dark:border-white/10">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
          {isPublic ? (
            <FaGlobe className="mr-2 text-emerald-500" />
          ) : (
            <FaLock className="mr-2 text-emerald-500" />
          )}
          Campaign Visibility
        </h3>
        <div className="flex items-center gap-2">
          {isPublic ? (
            <>
              <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 rounded-full text-xs font-medium">
                Public Campaign
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-400">
                Visible to all partners in the marketplace
              </span>
            </>
          ) : (
            <>
              <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-full text-xs font-medium">
                Private Campaign
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-400">
                Only visible to invited partners
              </span>
            </>
          )}
        </div>
      </div>

      {/* Audience Targeting */}
      {audienceTargeting?.locations && audienceTargeting.locations.length > 0 && (
        <div className="bg-white dark:bg-slate-900/70 rounded-xl p-6 border border-slate-200 dark:border-white/10">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
            <FaMapMarkerAlt className="mr-2 text-emerald-500" />
            Target Locations ({audienceTargeting.locations.length})
          </h3>
          <div className="space-y-2">
            {audienceTargeting.locations.map((location: any, index: number) => (
              <div
                key={index}
                className="p-3 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10"
              >
                <div className="flex items-center gap-2 mb-1">
                  <FaMapMarkerAlt className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-medium text-slate-900 dark:text-white">
                    {typeof location === 'string' ? location : location.address}
                  </span>
                </div>
                {typeof location === 'object' && location.radius && (
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 ml-6">
                    Radius: {location.radius} km
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Target URL */}
      {formData.targetUrl && (
        <div className="bg-white dark:bg-slate-900/70 rounded-xl p-6 border border-slate-200 dark:border-white/10">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
            <FaLink className="mr-2 text-emerald-500" />
            Target URL
          </h3>
          <a
            href={formData.targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-600 dark:text-emerald-400 hover:underline break-all text-sm"
          >
            {formData.targetUrl}
          </a>
        </div>
      )}

      {/* Requirements */}
      {formData.requirements && formData.requirements.filter((r) => r.trim()).length > 0 && (
        <div className="bg-white dark:bg-slate-900/70 rounded-xl p-6 border border-slate-200 dark:border-white/10">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Requirements
          </h3>
          <ul className="list-disc list-inside space-y-2">
            {formData.requirements
              .filter((r) => r.trim())
              .map((req, index) => (
                <li key={index} className="text-slate-900 dark:text-white text-sm">
                  {req}
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* Media */}
      <div className="bg-white dark:bg-slate-900/70 rounded-xl p-6 border border-slate-200 dark:border-white/10">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
          <FaImage className="mr-2 text-emerald-500" />
          Media
        </h3>
        <div className="space-y-4">
          {thumbnailImage && (
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Thumbnail Image</p>
              <img
                src={thumbnailImage}
                alt="Campaign Thumbnail"
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>
          )}
          {promotionalImages.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                Promotional Images ({promotionalImages.length})
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {promotionalImages.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt={`Promotional ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                ))}
              </div>
            </div>
          )}
          {formData.videoLink && (
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 flex items-center">
                <FaVideo className="mr-2" />
                Video Link
              </p>
              <a
                href={formData.videoLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 dark:text-emerald-400 hover:underline break-all text-sm"
              >
                {formData.videoLink}
              </a>
            </div>
          )}
          {!thumbnailImage && promotionalImages.length === 0 && !formData.videoLink && (
            <p className="text-slate-500 dark:text-slate-400 text-xs">No media uploaded</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default CampaignSummary
