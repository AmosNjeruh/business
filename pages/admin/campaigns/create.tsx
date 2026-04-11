// Business Suite – Create Campaign (Comprehensive)
// Route: /admin/campaigns/create
// Comprehensive campaign creation with all features from vendor frontend

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import toast from 'react-hot-toast'
import AdminLayout from '@/components/admin/Layout'
import { createCampaign, uploadCampaignImage, uploadAdditionalImages, addProductsToCampaign, getVendorBalance, createStripeCheckoutSession, createPaystackSession } from '@/services/vendor'
import { getVendorProfile } from '@/services/vendor'
import { getCurrentUser } from '@/services/auth'
import { useBrand } from '@/contexts/BrandContext'
import { FaSpinner, FaEye, FaArrowLeft } from 'react-icons/fa'
import GoalSelectionStep from '@/components/admin/campaigns/GoalSelectionStep'
import CampaignDetailsForm from '@/components/admin/campaigns/CampaignDetailsForm'
import BudgetPaymentForm from '@/components/admin/campaigns/BudgetPaymentForm'
import CampaignScheduleForm from '@/components/admin/campaigns/CampaignScheduleForm'
import RequirementsForm from '@/components/admin/campaigns/RequirementsForm'
import CampaignImagesForm from '@/components/admin/campaigns/CampaignImagesForm'
import VideoLinkForm from '@/components/admin/campaigns/VideoLinkForm'
import CampaignVisibilityForm from '@/components/admin/campaigns/CampaignVisibilityForm'
import AudienceTargetingForm from '@/components/admin/campaigns/AudienceTargetingForm'
import ProductSelector from '@/components/admin/campaigns/ProductSelector'
import CampaignSummaryPage from '@/components/admin/campaigns/CampaignSummaryPage'
import CampaignPreviewModal from '@/components/admin/campaigns/CampaignPreviewModal'
import useCurrency from '@/hooks/useCurrency'
import type { SupportedCurrency } from '@/contexts/CurrencyProvider'

const CAMPAIGN_SOCIAL_PLATFORM_OPTIONS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'x', label: 'Twitter/X', manual: true },
  { value: 'linkedin', label: 'LinkedIn' },
] as const

interface FollowerTier {
  minFollowers: number
  maxFollowers: number | null
  amount: string
}

const CreateCampaignPage: React.FC = () => {
  const router = useRouter()
  const { selectedBrand } = useBrand()
  const {
    userCountry,
    userAmountToUSD,
    convertFromUSD,
    formatUserAmount,
    convertUSDToPaystackCurrency,
    setSelectedCurrency: setPreferredDisplayCurrency,
  } = useCurrency()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [thumbnailImage, setThumbnailImage] = useState<string | null>(null)
  const [promotionalImages, setPromotionalImages] = useState<string[]>([])
  const [showSummary, setShowSummary] = useState(false)
  const [currentStep, setCurrentStep] = useState<'goal' | 'create' | 'summary'>('goal')
  const [showPreview, setShowPreview] = useState(false)
  const [showIndividualPlatforms, setShowIndividualPlatforms] = useState(false)
  const [hashtagInput, setHashtagInput] = useState('')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'stripe' | 'paystack' | null>(null)
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'KES'>('USD')
  const [isPublic, setIsPublic] = useState(true)
  const [requireConnectedSocialMedia, setRequireConnectedSocialMedia] = useState(false)
  const [vendorBalance, setVendorBalance] = useState<number | null>(null)
  const [useBalance, setUseBalance] = useState(true)
  const [audienceTargeting, setAudienceTargeting] = useState<{
    locations?: Array<{
      lat?: number
      lng?: number
      radius?: number
      address: string
      type?: 'text' | 'map'
    }>
  } | null>(null)
  const [formData, setFormData] = useState<{
    title: string
    description: string
    objective: 'BRAND_AWARENESS' | 'TRAFFIC' | 'LEADS' | 'SALES' | 'POLITICAL'
    budget: string
    paymentStructure: string
    paymentAmount: string
    paymentPerInfluencer: string
    paymentType: 'fixed' | 'tiered'
    followerTiers: FollowerTier[]
    maxInfluencers: string
    targetUrl: string
    startDate: string
    endDate: string
    requirements: string[]
    videoLink: string
    socialPlatforms: string[]
    hashtags: string[]
    contentStyle: 'CREATOR_CREATIVITY' | 'AS_BRIEFED'
  }>({
    title: '',
    description: '',
    objective: 'BRAND_AWARENESS',
    budget: '',
    paymentStructure: 'INFLUENCER',
    paymentAmount: '',
    paymentPerInfluencer: '',
    paymentType: 'fixed',
    followerTiers: [
      { minFollowers: 1000, maxFollowers: 10000, amount: '' },
      { minFollowers: 10001, maxFollowers: 50000, amount: '' },
      { minFollowers: 50001, maxFollowers: 100000, amount: '' },
      { minFollowers: 100001, maxFollowers: null, amount: '' },
    ],
    maxInfluencers: '',
    targetUrl: '',
    startDate: '',
    endDate: '',
    requirements: [''],
    videoLink: '',
    socialPlatforms: CAMPAIGN_SOCIAL_PLATFORM_OPTIONS.map((p) => p.value),
    hashtags: [],
    contentStyle: 'CREATOR_CREATIVITY',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [selectedProducts, setSelectedProducts] = useState<Array<{
    productId: string
    commissionRate?: number
    commissionAmount?: number
    commissionType?: 'PERCENTAGE' | 'FIXED'
  }>>([])
  const [draftLoaded, setDraftLoaded] = useState(false)

  const DRAFT_STORAGE_KEY = 'business_campaign_draft'
  const DRAFT_IMAGES_DB = 'businessCampaignDraftImages'

  // Load draft from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY)
        if (savedDraft) {
          const draft = JSON.parse(savedDraft)
          if (draft.formData) {
            setFormData((prev) => ({
              ...prev,
              ...draft.formData,
              requirements: Array.isArray(draft.formData.requirements) ? draft.formData.requirements : prev.requirements,
              socialPlatforms: Array.isArray(draft.formData.socialPlatforms) ? draft.formData.socialPlatforms : prev.socialPlatforms,
              hashtags: Array.isArray(draft.formData.hashtags) ? draft.formData.hashtags : prev.hashtags,
            }))
          }
          if (draft.isPublic !== undefined) setIsPublic(draft.isPublic)
          if (draft.requireConnectedSocialMedia !== undefined) setRequireConnectedSocialMedia(draft.requireConnectedSocialMedia)
          if (draft.audienceTargeting) setAudienceTargeting(draft.audienceTargeting)
          if (draft.selectedProducts) setSelectedProducts(draft.selectedProducts)
          if (draft.selectedPaymentMethod) setSelectedPaymentMethod(draft.selectedPaymentMethod)
          if (draft.selectedCurrency === 'KES' || draft.selectedCurrency === 'USD') {
            setSelectedCurrency(draft.selectedCurrency)
          } else if (draft.selectedCurrency === 'NGN') {
            setSelectedCurrency('USD')
          }
          if (draft.showSummary) setShowSummary(draft.showSummary)
          if (draft.currentStep) setCurrentStep(draft.currentStep)
          else if (draft.formData?.objective) setCurrentStep('create')

          // Load images from IndexedDB
          const loadImagesFromDB = async () => {
            try {
              const request = indexedDB.open(DRAFT_IMAGES_DB, 1)
              request.onupgradeneeded = (event: any) => {
                const db = event.target.result
                if (!db.objectStoreNames.contains('images')) {
                  db.createObjectStore('images', { keyPath: 'id' })
                }
              }
              request.onsuccess = (event: any) => {
                const db = event.target.result
                if (db.objectStoreNames.contains('images')) {
                  const transaction = db.transaction(['images'], 'readonly')
                  const store = transaction.objectStore('images')
                  const thumbnailRequest = store.get('thumbnail')
                  thumbnailRequest.onsuccess = () => {
                    if (thumbnailRequest.result?.data) {
                      setThumbnailImage(thumbnailRequest.result.data)
                    }
                  }
                  const promoRequest = store.getAll()
                  promoRequest.onsuccess = () => {
                    const promoImages: string[] = []
                    promoRequest.result.forEach((item: any) => {
                      if (item.id.startsWith('promotional_') && item.data) {
                        promoImages.push(item.data)
                      }
                    })
                    if (promoImages.length > 0) {
                      setPromotionalImages(promoImages)
                    }
                  }
                }
              }
            } catch (error) {
              console.warn('Could not load images from IndexedDB:', error)
            }
          }
          loadImagesFromDB()
        }
        setDraftLoaded(true)
      } catch (error) {
        console.error('Error loading draft:', error)
        setDraftLoaded(true)
      }
    } else {
      setDraftLoaded(true)
    }
  }, [])

  // Align display currency with vendor profile (same source as vendor frontend settings)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data: any = await getVendorProfile()
        if (cancelled || !data?.preferredCurrency) return
        const c = String(data.preferredCurrency).toUpperCase()
        const allowed: SupportedCurrency[] = ['USD', 'NGN', 'KES', 'EUR', 'GBP']
        if (allowed.includes(c as SupportedCurrency)) {
          setPreferredDisplayCurrency(c as SupportedCurrency)
        }
      } catch {
        // ignore — localStorage default remains
      }
    })()
    return () => {
      cancelled = true
    }
  }, [setPreferredDisplayCurrency])

  // Fetch vendor balance
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const balanceData = await getVendorBalance()
        setVendorBalance(balanceData.balance)
      } catch (error) {
        console.error('Error fetching vendor balance:', error)
        setVendorBalance(0)
      }
    }
    fetchBalance()
  }, [])

  const resolveVendorCountry = async (): Promise<string | undefined> => {
    const currentUser = getCurrentUser() as any
    const localCountry =
      (currentUser?.vendorSettings?.country as string | undefined) ||
      (currentUser?.country as string | undefined)
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
  }

  const ensureAudienceLocationPreselected = async (): Promise<boolean> => {
    if (!draftLoaded) return false
    if (audienceTargeting?.locations && audienceTargeting.locations.length > 0) return true

    const country = (await resolveVendorCountry()) || (userCountry as string | null) || undefined
    if (!country) return false

    setAudienceTargeting({ locations: [{ address: country, type: 'text' }] })
    return true
  }

  // Default audience location to vendor country (if no draft locations already set)
  useEffect(() => {
    void ensureAudienceLocationPreselected()
  }, [draftLoaded, audienceTargeting?.locations?.length])

  // Auto-save draft
  useEffect(() => {
    const saveDraft = () => {
      if (typeof window !== 'undefined') {
        try {
          const draft = {
            formData,
            isPublic,
            requireConnectedSocialMedia,
            audienceTargeting,
            selectedProducts,
            selectedPaymentMethod,
            selectedCurrency,
            showSummary,
            currentStep,
            savedAt: new Date().toISOString(),
          }
          localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft))

          // Save images to IndexedDB
          if (thumbnailImage || promotionalImages.length > 0) {
            try {
              const request = indexedDB.open(DRAFT_IMAGES_DB, 1)
              request.onupgradeneeded = (event: any) => {
                const db = event.target.result
                if (!db.objectStoreNames.contains('images')) {
                  db.createObjectStore('images', { keyPath: 'id' })
                }
              }
              request.onsuccess = (event: any) => {
                const db = event.target.result
                if (db.objectStoreNames.contains('images')) {
                  const transaction = db.transaction(['images'], 'readwrite')
                  const store = transaction.objectStore('images')
                  if (thumbnailImage) {
                    store.put({ id: 'thumbnail', data: thumbnailImage })
                  } else {
                    store.delete('thumbnail')
                  }
                  const clearRequest = store.openCursor()
                  clearRequest.onsuccess = (e: any) => {
                    const cursor = e.target.result
                    if (cursor) {
                      if (cursor.key.toString().startsWith('promotional_')) {
                        cursor.delete()
                      }
                      cursor.continue()
                    } else {
                      promotionalImages.forEach((img, index) => {
                        store.put({ id: `promotional_${index}`, data: img })
                      })
                    }
                  }
                }
              }
            } catch (dbError) {
              console.warn('Could not save images to IndexedDB:', dbError)
            }
          }
        } catch (error) {
          console.error('Error saving draft:', error)
        }
      }
    }
    const timeoutId = setTimeout(saveDraft, 1000)
    return () => clearTimeout(timeoutId)
  }, [formData, isPublic, requireConnectedSocialMedia, audienceTargeting, selectedProducts, selectedPaymentMethod, selectedCurrency, showSummary, currentStep, thumbnailImage, promotionalImages])

  const clearDraft = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY)
        const request = indexedDB.open(DRAFT_IMAGES_DB, 1)
        request.onsuccess = (event: any) => {
          const db = event.target.result
          if (db.objectStoreNames.contains('images')) {
            const transaction = db.transaction(['images'], 'readwrite')
            const store = transaction.objectStore('images')
            store.clear()
          }
        }
      } catch (error) {
        console.error('Error clearing draft:', error)
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' })
    }
  }

  const handleRequirementChange = (index: number, value: string) => {
    const updatedRequirements = [...formData.requirements]
    updatedRequirements[index] = value
    setFormData({ ...formData, requirements: updatedRequirements })
  }

  const addRequirement = () => {
    setFormData({ ...formData, requirements: [...formData.requirements, ''] })
  }

  const removeRequirement = (index: number) => {
    if (formData.requirements.length > 1) {
      const updatedRequirements = formData.requirements.filter((_, i) => i !== index)
      setFormData({ ...formData, requirements: updatedRequirements })
    }
  }

  const handleTierChange = (index: number, field: keyof FollowerTier, value: string | number | null) => {
    const updatedTiers = [...formData.followerTiers]
    updatedTiers[index] = { ...updatedTiers[index], [field]: value }
    setFormData({ ...formData, followerTiers: updatedTiers })
  }

  const addTier = () => {
    const highestMax = Math.max(
      ...formData.followerTiers.map((tier) => (tier.maxFollowers ? tier.maxFollowers : 0)).filter((val) => val > 0)
    )
    const newTier: FollowerTier = {
      minFollowers: highestMax + 1,
      maxFollowers: highestMax + 50000,
      amount: '',
    }
    setFormData({ ...formData, followerTiers: [...formData.followerTiers, newTier] })
  }

  const removeTier = (index: number) => {
    if (formData.followerTiers.length > 1) {
      const updatedTiers = formData.followerTiers.filter((_, i) => i !== index)
      setFormData({ ...formData, followerTiers: updatedTiers })
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isPromoImage = false) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const validImageTypes = [
      'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp',
      'image/bmp', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon',
      'image/tiff', 'image/avif', 'image/heic', 'image/heif', 'image/jp2', 'image/jpx', 'image/j2k'
    ]

    if (isPromoImage && files.length > 1) {
      const validFiles: File[] = []
      const invalidFiles: string[] = []
      Array.from(files).forEach((file) => {
        if (!validImageTypes.includes(file.type)) {
          invalidFiles.push(file.name)
        } else if (file.size > 5 * 1024 * 1024) {
          invalidFiles.push(`${file.name} (too large)`)
        } else {
          validFiles.push(file)
        }
      })
      if (invalidFiles.length > 0) {
        toast.error(`Some files were skipped: ${invalidFiles.slice(0, 3).join(', ')}${invalidFiles.length > 3 ? '...' : ''}`)
      }
      if (validFiles.length === 0) {
        e.target.value = ''
        return
      }
      try {
        setIsUploadingImage(true)
        const base64Promises = validFiles.map((file) => {
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onloadend = () => {
              const base64String = reader.result as string
              if (base64String) resolve(base64String)
              else reject(new Error(`Failed to read ${file.name}`))
            }
            reader.onerror = () => reject(new Error(`Failed to read ${file.name}`))
            reader.readAsDataURL(file)
          })
        })
        const base64Images = await Promise.all(base64Promises)
        setPromotionalImages((prev) => [...prev, ...base64Images])
        toast.success(`${validFiles.length} promotional image${validFiles.length > 1 ? 's' : ''} added successfully`)
        setIsUploadingImage(false)
      } catch (error) {
        console.error('Bulk image upload error:', error)
        toast.error('Failed to process some images. Please try again.')
        setIsUploadingImage(false)
      } finally {
        e.target.value = ''
      }
      return
    }

    const file = files[0]
    if (!validImageTypes.includes(file.type)) {
      toast.error('Please upload a valid image file')
      e.target.value = ''
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      e.target.value = ''
      return
    }

    try {
      setIsUploadingImage(true)
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        if (!base64String) {
          toast.error('Failed to read image file')
          setIsUploadingImage(false)
          return
        }
        if (isPromoImage) {
          setPromotionalImages((prev) => [...prev, base64String])
          toast.success('Promotional image added successfully')
        } else {
          setThumbnailImage(base64String)
          toast.success('Thumbnail image added successfully')
        }
        setIsUploadingImage(false)
        e.target.value = ''
      }
      reader.onerror = () => {
        toast.error('Failed to read image file')
        setIsUploadingImage(false)
        e.target.value = ''
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Image upload error:', error)
      toast.error('Failed to process image. Please try again.')
      setIsUploadingImage(false)
      e.target.value = ''
    }
  }

  const removeImage = (index?: number, isPromoImage = false) => {
    if (isPromoImage && index !== undefined) {
      const updatedImages = promotionalImages.filter((_, i) => i !== index)
      setPromotionalImages(updatedImages)
    } else {
      setThumbnailImage(null)
    }
  }

  const isValidUrl = (string: string): boolean => {
    try {
      new URL(string)
      return true
    } catch {
      return false
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.title.trim()) newErrors.title = 'Title is required'
    if (!formData.description.trim()) newErrors.description = 'Description is required'
    if (!formData.objective) newErrors.objective = 'Objective is required'
    if (!formData.budget || parseFloat(formData.budget) <= 0) newErrors.budget = 'Valid budget is required'

    if (formData.paymentStructure === 'INFLUENCER') {
      const MIN_PAYMENT_USD = 0.5
      const minPaymentInUserCurrency = convertFromUSD(MIN_PAYMENT_USD)
      if (formData.paymentType === 'fixed') {
        if (!formData.paymentPerInfluencer || parseFloat(formData.paymentPerInfluencer) <= 0) {
          newErrors.paymentPerInfluencer = 'Valid payment per influencer is required'
        } else if (parseFloat(formData.paymentPerInfluencer) < minPaymentInUserCurrency) {
          newErrors.paymentPerInfluencer = `Minimum payment per influencer is ${formatUserAmount(minPaymentInUserCurrency)} ($${MIN_PAYMENT_USD.toFixed(2)} USD)`
        }
        if (formData.budget && formData.paymentPerInfluencer && parseFloat(formData.budget) < parseFloat(formData.paymentPerInfluencer)) {
          newErrors.budget = 'Budget must be sufficient for at least one influencer'
        }
      } else if (formData.paymentType === 'tiered') {
        let tierErrors = false
        formData.followerTiers.forEach((tier, index) => {
          if (!tier.amount || parseFloat(tier.amount) <= 0) {
            newErrors[`tier_${index}_amount`] = 'Please enter a valid amount for this tier'
            tierErrors = true
          } else if (parseFloat(tier.amount) < minPaymentInUserCurrency) {
            newErrors[`tier_${index}_amount`] = `Minimum payment for this tier is ${formatUserAmount(minPaymentInUserCurrency)} ($${MIN_PAYMENT_USD.toFixed(2)} USD)`
            tierErrors = true
          }
          if (!tier.minFollowers) {
            newErrors[`tier_${index}_min`] = 'Minimum followers required'
            tierErrors = true
          }
        })
        if (tierErrors) {
          newErrors.followerTiers = 'Please complete all payment tiers with valid amounts'
        }
      }
    } else if (formData.paymentStructure && formData.paymentStructure !== 'INFLUENCER' && formData.paymentStructure !== 'COMMISSION_PER_SALE') {
      if (!formData.paymentAmount || parseFloat(formData.paymentAmount) <= 0) {
        newErrors.paymentAmount = 'Valid payment amount is required'
      }
    }

    if (formData.paymentStructure === 'COMMISSION_PER_SALE') {
      if (selectedProducts.length === 0) {
        newErrors.products = 'At least one product is required for commission campaigns'
      }
    }

    if (formData.objective === 'TRAFFIC') {
      if (!formData.targetUrl || !formData.targetUrl.trim()) {
        newErrors.targetUrl = 'Target URL is required for traffic campaigns'
      } else if (!isValidUrl(formData.targetUrl.trim())) {
        newErrors.targetUrl = 'Please enter a valid URL'
      }
    } else if (formData.targetUrl && formData.targetUrl.trim() && !isValidUrl(formData.targetUrl.trim())) {
      newErrors.targetUrl = 'Please enter a valid URL'
    }

    if (!formData.startDate) newErrors.startDate = 'Start date is required'
    if (!formData.endDate) newErrors.endDate = 'End date is required'
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate)
      const end = new Date(formData.endDate)
      if (end <= start) {
        newErrors.endDate = 'End date must be after start date'
      }
    }

    if (formData.videoLink && !isValidUrl(formData.videoLink)) {
      newErrors.videoLink = 'Please enter a valid URL'
    }
    if (!formData.socialPlatforms?.length) newErrors.socialPlatforms = 'Select at least one social platform'
    if (!formData.hashtags?.length) newErrors.hashtags = 'Add at least one hashtag'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const ensureHashPrefix = (raw: string) => {
    const trimmed = raw.trim().replace(/\s+/g, '')
    if (!trimmed) return ''
    const withoutHashes = trimmed.replace(/^#+/, '')
    return withoutHashes ? `#${withoutHashes.toLowerCase()}` : ''
  }

  const toggleSocialPlatform = (platform: string) => {
    const selected = (formData.socialPlatforms || []).includes(platform)
    setFormData({
      ...formData,
      socialPlatforms: selected
        ? (formData.socialPlatforms || []).filter((p) => p !== platform)
        : [...(formData.socialPlatforms || []), platform],
    })
  }

  const addHashtag = () => {
    const normalized = ensureHashPrefix(hashtagInput)
    if (!normalized) return
    if ((formData.hashtags || []).includes(normalized)) {
      setHashtagInput('')
      return
    }
    setFormData({ ...formData, hashtags: [...(formData.hashtags || []), normalized] })
    setHashtagInput('')
  }

  const allPlatformsSelected = CAMPAIGN_SOCIAL_PLATFORM_OPTIONS.every((p) =>
    (formData.socialPlatforms || []).includes(p.value)
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) {
      toast.error('Please fix the errors in the form')
      return
    }
    await ensureAudienceLocationPreselected()
    setShowSummary(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePayment = async () => {
    await ensureAudienceLocationPreselected()

    const budgetInUserCurrency = parseFloat(formData.budget)
    if (isNaN(budgetInUserCurrency) || budgetInUserCurrency <= 0) {
      toast.error('Please enter a valid budget amount')
      return
    }

    const budgetInUSD = userAmountToUSD(budgetInUserCurrency)

    const apiSelectedProducts = selectedProducts.map((p) => ({
      ...p,
      commissionAmount:
        p.commissionType === 'FIXED' &&
        p.commissionAmount != null &&
        Number.isFinite(p.commissionAmount)
          ? userAmountToUSD(p.commissionAmount)
          : p.commissionAmount,
    }))

    let remainingPaymentNeeded = budgetInUSD
    if (useBalance && vendorBalance !== null) {
      if (vendorBalance >= budgetInUSD) {
        remainingPaymentNeeded = 0
      } else if (vendorBalance > 0) {
        remainingPaymentNeeded = budgetInUSD - vendorBalance
      }
    }

    if (remainingPaymentNeeded === 0 && useBalance) {
      const backendObjective = formData.objective === 'POLITICAL' ? 'BRAND_AWARENESS' : formData.objective
      const campaignData: any = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        objective: backendObjective,
        budget: budgetInUSD,
        remainingBudget: budgetInUSD,
        targetUrl: formData.targetUrl?.trim() || null,
        startDate: formData.startDate,
        endDate: formData.endDate,
        requirements: formData.requirements.filter((r) => r.trim() !== ''),
        videoLink: formData.videoLink?.trim() || null,
        socialPlatforms: formData.socialPlatforms || [],
        hashtags: (formData.hashtags || []).map(ensureHashPrefix).filter(Boolean),
        contentStyle: formData.contentStyle,
        isPublic: isPublic,
        requireConnectedSocialMedia,
        audienceTargeting: audienceTargeting,
        useBalance: true,
        ...(formData.paymentStructure && { paymentStructure: formData.paymentStructure }),
      }

      if (formData.paymentStructure === 'INFLUENCER') {
        if (formData.paymentType === 'fixed') {
          campaignData.paymentType = 'FIXED'
          const paymentPerInfluencerInUSD = userAmountToUSD(parseFloat(formData.paymentPerInfluencer) || 0)
          campaignData.paymentPerInfluencer = paymentPerInfluencerInUSD
          campaignData.maxInfluencers = Math.max(1, Math.floor(budgetInUSD / paymentPerInfluencerInUSD))
        } else if (formData.paymentType === 'tiered') {
          campaignData.paymentType = 'TIERED'
          campaignData.followerTiers = formData.followerTiers
            .filter((tier) => tier.amount && parseFloat(tier.amount) > 0)
            .map((tier) => ({
              minFollowers: Number(tier.minFollowers),
              maxFollowers: tier.maxFollowers ? Number(tier.maxFollowers) : null,
              amount: userAmountToUSD(parseFloat(tier.amount) || 0),
            }))
        }
      } else if (formData.paymentStructure && formData.paymentStructure !== 'COMMISSION_PER_SALE') {
        campaignData.paymentAmount = userAmountToUSD(parseFloat(formData.paymentAmount) || 0)
      }

      if (formData.paymentStructure === 'COMMISSION_PER_SALE' && apiSelectedProducts.length > 0) {
        campaignData.selectedProducts = apiSelectedProducts
      }

      setIsSubmitting(true)
      try {
        const createdCampaign = await createCampaign(campaignData)
        if (createdCampaign.id) {
          if (thumbnailImage) {
            await uploadCampaignImage(createdCampaign.id, thumbnailImage)
          }
          if (promotionalImages.length > 0) {
            await uploadAdditionalImages(createdCampaign.id, promotionalImages)
          }
          if (apiSelectedProducts.length > 0) {
            await addProductsToCampaign(createdCampaign.id, apiSelectedProducts)
          }
        }
        try {
          const updatedBalance = await getVendorBalance()
          setVendorBalance(updatedBalance.balance)
        } catch (error) {
          console.error('Error refreshing balance:', error)
        }
        clearDraft()
        toast.success('Campaign created successfully using your balance!')
        router.push(`/admin/campaigns`)
        setIsSubmitting(false)
        return
      } catch (error: any) {
        console.error('Error creating campaign:', error)
        toast.error(error?.response?.data?.error || error?.message || 'Failed to create campaign')
        setIsSubmitting(false)
        return
      }
    }

    if (remainingPaymentNeeded > 0 && !selectedPaymentMethod) {
      toast.error('Please select a payment method')
      return
    }

    setIsSubmitting(true)
    try {
      const backendObjective = formData.objective === 'POLITICAL' ? 'BRAND_AWARENESS' : formData.objective
      const campaignData: any = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        objective: backendObjective,
        budget: budgetInUSD,
        remainingBudget: budgetInUSD,
        targetUrl: formData.targetUrl?.trim() || null,
        startDate: formData.startDate,
        endDate: formData.endDate,
        requirements: formData.requirements.filter((r) => r.trim() !== ''),
        videoLink: formData.videoLink?.trim() || null,
        socialPlatforms: formData.socialPlatforms || [],
        hashtags: (formData.hashtags || []).map(ensureHashPrefix).filter(Boolean),
        contentStyle: formData.contentStyle,
        isPublic: isPublic,
        requireConnectedSocialMedia: requireConnectedSocialMedia,
        audienceTargeting: audienceTargeting,
        useBalance: useBalance && vendorBalance !== null && vendorBalance > 0,
        ...(formData.paymentStructure && { paymentStructure: formData.paymentStructure }),
      }

      if (formData.paymentStructure === 'INFLUENCER') {
        if (formData.paymentType === 'fixed') {
          campaignData.paymentType = 'FIXED'
          const paymentPerInfluencerInUSD = userAmountToUSD(parseFloat(formData.paymentPerInfluencer) || 0)
          campaignData.paymentPerInfluencer = paymentPerInfluencerInUSD
          campaignData.maxInfluencers = Math.max(1, Math.floor(budgetInUSD / paymentPerInfluencerInUSD))
        } else if (formData.paymentType === 'tiered') {
          campaignData.paymentType = 'TIERED'
          campaignData.followerTiers = formData.followerTiers
            .filter((tier) => tier.amount && parseFloat(tier.amount) > 0)
            .map((tier) => ({
              minFollowers: Number(tier.minFollowers),
              maxFollowers: tier.maxFollowers ? Number(tier.maxFollowers) : null,
              amount: userAmountToUSD(parseFloat(tier.amount) || 0),
            }))
        }
      } else if (formData.paymentStructure && formData.paymentStructure !== 'COMMISSION_PER_SALE') {
        campaignData.paymentAmount = userAmountToUSD(parseFloat(formData.paymentAmount) || 0)
      }

      if (formData.paymentStructure === 'COMMISSION_PER_SALE' && apiSelectedProducts.length > 0) {
        campaignData.selectedProducts = apiSelectedProducts
      }

      if (typeof window !== 'undefined') {
        try {
          const campaignDataWithoutImages = {
            ...campaignData,
            hasThumbnailImage: !!thumbnailImage,
            hasPromotionalImages: promotionalImages.length > 0,
            promotionalImagesCount: promotionalImages.length,
          }
          sessionStorage.setItem('pendingCampaign', JSON.stringify(campaignDataWithoutImages))

          // Same IndexedDB name as vendor payment-success flow so images load after Paystack/Stripe return
          if (thumbnailImage || promotionalImages.length > 0) {
            try {
              const dbName = 'campaignImages'
              const request = indexedDB.open(dbName, 1)
              request.onerror = () => {
                console.warn('IndexedDB not available; images may need re-upload after payment')
              }
              request.onupgradeneeded = (event: any) => {
                const db = event.target.result
                if (!db.objectStoreNames.contains('images')) {
                  db.createObjectStore('images', { keyPath: 'id' })
                }
              }
              request.onsuccess = (event: any) => {
                const db = event.target.result
                if (!db.objectStoreNames.contains('images')) return
                const transaction = db.transaction(['images'], 'readwrite')
                const store = transaction.objectStore('images')
                if (thumbnailImage) {
                  store.put({ id: 'thumbnail', data: thumbnailImage })
                }
                promotionalImages.forEach((img, index) => {
                  store.put({ id: `promotional_${index}`, data: img })
                })
              }
            } catch (dbError) {
              console.warn('Could not store images in IndexedDB:', dbError)
            }
          }
        } catch (storageError: any) {
          console.error('Storage error:', storageError)
        }
      }

      const paymentAmount = remainingPaymentNeeded > 0 ? remainingPaymentNeeded : budgetInUSD
      const user = await import('@/services/auth').then(m => m.getCurrentUser())

      if (selectedPaymentMethod === 'stripe') {
        const data = await createStripeCheckoutSession({
          email: user.email!,
          amount: paymentAmount,
          campaignTitle: formData.title,
          budget: budgetInUSD,
          vendorId: user.id!,
          vendorName: user.name || '',
          type: 'campaign_creation',
        })
        if (data.url) {
          window.location.href = data.url
        } else {
          toast.error('Failed to get checkout URL. Please try again.')
          setIsSubmitting(false)
        }
      } else if (selectedPaymentMethod === 'paystack') {
        const paymentAmountInSelectedCurrency = convertUSDToPaystackCurrency(
          remainingPaymentNeeded,
          selectedCurrency
        )
        const data = await createPaystackSession({
          email: user.email!,
          amount: paymentAmountInSelectedCurrency,
          campaignTitle: formData.title,
          budget: budgetInUSD,
          vendorId: user.id!,
          vendorName: user.name || '',
          currency: selectedCurrency,
          type: 'campaign_creation',
        })
        if (data.authorization_url) {
          window.location.href = data.authorization_url
        } else {
          toast.error('Failed to get checkout URL. Please try again.')
          setIsSubmitting(false)
        }
      }
    } catch (error: any) {
      console.error('Error creating campaign:', error)
      toast.error(error?.response?.data?.error || error?.message || 'Failed to create campaign')
      setIsSubmitting(false)
    }
  }

  const calculatedMaxInfluencers =
    formData.paymentStructure === 'INFLUENCER' &&
    formData.paymentType === 'fixed' &&
    formData.paymentPerInfluencer &&
    formData.budget
      ? Math.max(1, Math.floor(parseFloat(formData.budget) / parseFloat(formData.paymentPerInfluencer)))
      : ''

  const handleGoalSelect = (objective: 'BRAND_AWARENESS' | 'TRAFFIC' | 'LEADS' | 'SALES' | 'POLITICAL') => {
    setFormData({ ...formData, objective })
    setCurrentStep('create')
  }

  const businessName = selectedBrand?.name || 'Your Business'

  if (!draftLoaded) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <FaSpinner className="animate-spin text-3xl text-emerald-600" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-3 sm:p-4 lg:p-6">
        <div className="w-full mx-auto max-w-7xl">
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Link href="/admin/campaigns" className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                    <FaArrowLeft className="h-3 w-3" /> Campaigns
                  </Link>
                  <span className="text-slate-400 dark:text-slate-500">/</span>
                  <span className="text-xs text-slate-600 dark:text-slate-400">Create Campaign</span>
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-2">
                  Create New Campaign
                </h1>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                  Build your campaign and see it come to life in real-time
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowPreview(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 rounded-lg transition-all shadow-md hover:shadow-lg"
                >
                  <FaEye className="h-4 w-4" />
                  <span className="hidden sm:inline">Preview</span>
                </button>
                {currentStep !== 'goal' && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep('goal')}
                    className="px-4 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                  >
                    Change Goal
                  </button>
                )}
              </div>
            </div>
            {currentStep !== 'goal' && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-50 to-cyan-50 dark:from-emerald-900/20 dark:to-cyan-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                  Goal:
                </span>
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {formData.objective === 'BRAND_AWARENESS' && 'Brand Awareness'}
                  {formData.objective === 'TRAFFIC' && 'Get More Website Visitors'}
                  {formData.objective === 'LEADS' && 'Get More Leads'}
                  {formData.objective === 'SALES' && 'Drive Sales'}
                  {formData.objective === 'POLITICAL' && 'Political Campaign'}
                </span>
              </div>
            )}
          </div>

          {currentStep === 'goal' ? (
            <GoalSelectionStep onSelectGoal={handleGoalSelect} />
          ) : showSummary ? (
            <CampaignSummaryPage
              formData={formData}
              thumbnailImage={thumbnailImage}
              promotionalImages={promotionalImages}
              selectedProducts={selectedProducts}
              isPublic={isPublic}
              audienceTargeting={audienceTargeting}
              selectedPaymentMethod={selectedPaymentMethod}
              selectedCurrency={selectedCurrency}
              onSelectPaymentMethod={setSelectedPaymentMethod}
              onSelectCurrency={setSelectedCurrency}
              onBackToEdit={() => {
                setShowSummary(false)
                setCurrentStep('create')
              }}
              onPayment={handlePayment}
              onShowPreview={() => setShowPreview(true)}
              isSubmitting={isSubmitting}
              budget={parseFloat(formData.budget) || 0}
              vendorBalance={vendorBalance}
              useBalance={useBalance}
              remainingPaymentNeeded={(() => {
                if (!useBalance || vendorBalance === null) return undefined
                const budgetInUSD = userAmountToUSD(parseFloat(formData.budget) || 0)
                if (vendorBalance >= budgetInUSD) return 0
                if (vendorBalance > 0) return budgetInUSD - vendorBalance
                return budgetInUSD
              })()}
            />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="bus-responsive-two-col gap-4 sm:gap-6">
                <div className="space-y-4 sm:space-y-6">
                  <CampaignDetailsForm
                    formData={{
                      title: formData.title,
                      description: formData.description,
                      targetUrl: formData.targetUrl,
                    }}
                    objective={formData.objective}
                    errors={errors}
                    onChange={handleChange}
                  />

                  <BudgetPaymentForm
                    formData={{
                      budget: formData.budget,
                      paymentStructure: formData.paymentStructure,
                      paymentAmount: formData.paymentAmount,
                      paymentPerInfluencer: formData.paymentPerInfluencer,
                      paymentType: formData.paymentType,
                      followerTiers: formData.followerTiers,
                    }}
                    errors={errors}
                    calculatedMaxInfluencers={calculatedMaxInfluencers}
                    vendorBalance={vendorBalance}
                    useBalance={useBalance}
                    onUseBalanceChange={setUseBalance}
                    onChange={handleChange}
                    onTierChange={handleTierChange}
                    onAddTier={addTier}
                    onRemoveTier={removeTier}
                  />

                  {formData.paymentStructure === 'COMMISSION_PER_SALE' && (
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-white/10 shadow-sm">
                      <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                        Select Products
                      </h2>
                      <ProductSelector
                        selectedProducts={selectedProducts}
                        onProductsChange={setSelectedProducts}
                        errors={errors}
                      />
                    </div>
                  )}

                  <CampaignScheduleForm
                    formData={{
                      startDate: formData.startDate,
                      endDate: formData.endDate,
                    }}
                    errors={errors}
                    onChange={handleChange}
                  />

                  <CampaignVisibilityForm
                    isPublic={isPublic}
                    onChange={setIsPublic}
                    requireConnectedSocialMedia={requireConnectedSocialMedia}
                    onRequireConnectedSocialChange={setRequireConnectedSocialMedia}
                  />

                  <RequirementsForm
                    requirements={formData.requirements}
                    onChange={handleRequirementChange}
                    onAdd={addRequirement}
                    onRemove={removeRequirement}
                  />
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Social Platforms & Hashtags</h2>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Allowed Platforms <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, socialPlatforms: allPlatformsSelected ? [] : CAMPAIGN_SOCIAL_PLATFORM_OPTIONS.map((p) => p.value) })}
                        className={`w-full text-left px-3 py-3 rounded-lg border-2 transition-all ${
                          allPlatformsSelected
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                            : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-700/40 hover:border-emerald-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">All Platforms</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
                            Recommended
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Includes Instagram, Facebook, TikTok, YouTube, Twitter/X, and LinkedIn
                        </p>
                      </button>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {allPlatformsSelected ? 'Using all platforms (recommended)' : `Selected ${(formData.socialPlatforms || []).length} platform(s)`}
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowIndividualPlatforms((v) => !v)}
                          className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700"
                        >
                          {showIndividualPlatforms ? 'Hide individual selection' : 'Choose individual platforms'}
                        </button>
                      </div>
                      {showIndividualPlatforms && (
                        <div className="bus-responsive-two-col gap-2 mt-2">
                          {CAMPAIGN_SOCIAL_PLATFORM_OPTIONS.map((platform) => {
                            const selected = (formData.socialPlatforms || []).includes(platform.value)
                            return (
                              <button
                                key={platform.value}
                                type="button"
                                onClick={() => toggleSocialPlatform(platform.value)}
                                className={`text-left px-3 py-2.5 rounded-lg border transition-all ${
                                  selected
                                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                                    : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-700/40 text-slate-700 dark:text-slate-300 hover:border-emerald-300'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">{platform.label}</span>
                                  {'manual' in platform && platform.manual ? (
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
                      {errors.socialPlatforms && <p className="mt-1 text-xs text-red-500">{errors.socialPlatforms}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Content Direction
                      </label>
                      <div className="bus-responsive-two-col gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, contentStyle: 'CREATOR_CREATIVITY' })}
                          className={`text-left p-3 rounded-lg border ${
                            formData.contentStyle === 'CREATOR_CREATIVITY'
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                              : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-700/40'
                          }`}
                        >
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">Creator Creativity</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Recommended for better authenticity and conversion.</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, contentStyle: 'AS_BRIEFED' })}
                          className={`text-left p-3 rounded-lg border ${
                            formData.contentStyle === 'AS_BRIEFED'
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                              : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-700/40'
                          }`}
                        >
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">Post As Briefed</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Creators should follow your exact campaign messaging.</p>
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
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
                          placeholder="#brandcampaign"
                          className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <button type="button" onClick={addHashtag} className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold">
                          Add
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Tip: if you forget `#`, we add it automatically.</p>
                      {(formData.hashtags || []).length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {(formData.hashtags || []).map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => setFormData({ ...formData, hashtags: (formData.hashtags || []).filter((t) => t !== tag) })}
                              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                            >
                              {tag} <span aria-hidden>×</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {errors.hashtags && <p className="mt-1 text-xs text-red-500">{errors.hashtags}</p>}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 sm:space-y-6">
                  <CampaignImagesForm
                    thumbnailImage={thumbnailImage}
                    promotionalImages={promotionalImages}
                    isUploading={isUploadingImage}
                    onThumbnailUpload={(e) => handleImageUpload(e, false)}
                    onPromoImageUpload={(e) => handleImageUpload(e, true)}
                    onRemoveThumbnail={() => removeImage()}
                    onRemovePromoImage={(index) => removeImage(index, true)}
                  />

                  <VideoLinkForm
                    videoLink={formData.videoLink}
                    errors={errors}
                    onChange={handleChange}
                  />

                  <AudienceTargetingForm
                    audienceTargeting={audienceTargeting}
                    onChange={setAudienceTargeting}
                  />
                </div>
              </div>

              <div className="mt-6 sm:mt-8 space-y-4">
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 text-center">
                  * Required fields. Images and videos are optional.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => setShowPreview(true)}
                    className="flex-1 sm:flex-none sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <FaEye className="h-4 w-4" />
                    Preview Campaign
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-bold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg transition-colors flex items-center justify-center text-sm sm:text-base touch-manipulation"
                  >
                    {isSubmitting ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      'Continue to Payment'
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}

          <CampaignPreviewModal
            isOpen={showPreview}
            onClose={() => setShowPreview(false)}
            title={formData.title}
            description={formData.description}
            targetUrl={formData.targetUrl}
            thumbnailImage={thumbnailImage}
            promotionalImages={promotionalImages}
            videoLink={formData.videoLink}
            objective={formData.objective}
            businessName={businessName}
          />
        </div>
      </div>
    </AdminLayout>
  )
}

export default CreateCampaignPage
