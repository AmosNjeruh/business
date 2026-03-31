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

interface FollowerTier {
  minFollowers: number
  maxFollowers: number | null
  amount: string
}

const CreateCampaignPage: React.FC = () => {
  const router = useRouter()
  const { selectedBrand } = useBrand()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [thumbnailImage, setThumbnailImage] = useState<string | null>(null)
  const [promotionalImages, setPromotionalImages] = useState<string[]>([])
  const [showSummary, setShowSummary] = useState(false)
  const [currentStep, setCurrentStep] = useState<'goal' | 'create' | 'summary'>('goal')
  const [showPreview, setShowPreview] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'stripe' | 'paystack' | null>(null)
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'KES' | 'NGN'>('USD')
  const USD_TO_NGN = 1600
  const USD_TO_KES = 130
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
          if (draft.formData) setFormData(draft.formData)
          if (draft.isPublic !== undefined) setIsPublic(draft.isPublic)
          if (draft.requireConnectedSocialMedia !== undefined) setRequireConnectedSocialMedia(draft.requireConnectedSocialMedia)
          if (draft.audienceTargeting) setAudienceTargeting(draft.audienceTargeting)
          if (draft.selectedProducts) setSelectedProducts(draft.selectedProducts)
          if (draft.selectedPaymentMethod) setSelectedPaymentMethod(draft.selectedPaymentMethod)
          if (draft.selectedCurrency) setSelectedCurrency(draft.selectedCurrency)
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

  // Default audience location to vendor country (if no draft locations already set)
  useEffect(() => {
    if (!draftLoaded) return
    if (audienceTargeting?.locations && audienceTargeting.locations.length > 0) return

    const localCountry = (getCurrentUser() as any)?.vendorSettings?.country as string | undefined
    if (localCountry) {
      setAudienceTargeting({ locations: [{ address: localCountry, type: 'text' }] })
      return
    }

    getVendorProfile()
      .then((settings: any) => {
        const country = (settings?.country as string | undefined) || (settings?.vendorSettings?.country as string | undefined)
        if (country) {
          setAudienceTargeting({ locations: [{ address: country, type: 'text' }] })
        }
      })
      .catch(() => {})
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
      const minPaymentInNGN = MIN_PAYMENT_USD * USD_TO_NGN
      if (formData.paymentType === 'fixed') {
        if (!formData.paymentPerInfluencer || parseFloat(formData.paymentPerInfluencer) <= 0) {
          newErrors.paymentPerInfluencer = 'Valid payment per influencer is required'
        } else if (parseFloat(formData.paymentPerInfluencer) < minPaymentInNGN) {
          newErrors.paymentPerInfluencer = `Minimum payment per influencer is ₦${minPaymentInNGN.toFixed(2)} ($${MIN_PAYMENT_USD.toFixed(2)} USD)`
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
          } else if (parseFloat(tier.amount) < minPaymentInNGN) {
            newErrors[`tier_${index}_amount`] = `Minimum payment for this tier is ₦${minPaymentInNGN.toFixed(2)} ($${MIN_PAYMENT_USD.toFixed(2)} USD)`
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

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) {
      toast.error('Please fix the errors in the form')
      return
    }
    setShowSummary(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePayment = async () => {
    const budgetInNGN = parseFloat(formData.budget)
    if (isNaN(budgetInNGN) || budgetInNGN <= 0) {
      toast.error('Please enter a valid budget amount')
      return
    }

    const budgetInUSD = budgetInNGN / USD_TO_NGN
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
        isPublic: isPublic,
        requireConnectedSocialMedia,
        audienceTargeting: audienceTargeting,
        useBalance: true,
        ...(formData.paymentStructure && { paymentStructure: formData.paymentStructure }),
      }

      if (formData.paymentStructure === 'INFLUENCER') {
        if (formData.paymentType === 'fixed') {
          campaignData.paymentType = 'FIXED'
          const paymentPerInfluencerInUSD = parseFloat(formData.paymentPerInfluencer) / USD_TO_NGN
          campaignData.paymentPerInfluencer = paymentPerInfluencerInUSD
          campaignData.maxInfluencers = Math.max(1, Math.floor(budgetInUSD / paymentPerInfluencerInUSD))
        } else if (formData.paymentType === 'tiered') {
          campaignData.paymentType = 'TIERED'
          campaignData.followerTiers = formData.followerTiers
            .filter((tier) => tier.amount && parseFloat(tier.amount) > 0)
            .map((tier) => ({
              minFollowers: Number(tier.minFollowers),
              maxFollowers: tier.maxFollowers ? Number(tier.maxFollowers) : null,
              amount: parseFloat(tier.amount) / USD_TO_NGN,
            }))
        }
      } else if (formData.paymentStructure && formData.paymentStructure !== 'COMMISSION_PER_SALE') {
        campaignData.paymentAmount = parseFloat(formData.paymentAmount) / USD_TO_NGN
      }

      if (formData.paymentStructure === 'COMMISSION_PER_SALE' && selectedProducts.length > 0) {
        campaignData.selectedProducts = selectedProducts
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
          if (selectedProducts.length > 0) {
            await addProductsToCampaign(createdCampaign.id, selectedProducts)
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
        isPublic: isPublic,
        requireConnectedSocialMedia: requireConnectedSocialMedia,
        audienceTargeting: audienceTargeting,
        useBalance: useBalance && vendorBalance !== null && vendorBalance > 0,
        ...(formData.paymentStructure && { paymentStructure: formData.paymentStructure }),
      }

      if (formData.paymentStructure === 'INFLUENCER') {
        if (formData.paymentType === 'fixed') {
          campaignData.paymentType = 'FIXED'
          const paymentPerInfluencerInUSD = parseFloat(formData.paymentPerInfluencer) / USD_TO_NGN
          campaignData.paymentPerInfluencer = paymentPerInfluencerInUSD
          campaignData.maxInfluencers = Math.max(1, Math.floor(budgetInUSD / paymentPerInfluencerInUSD))
        } else if (formData.paymentType === 'tiered') {
          campaignData.paymentType = 'TIERED'
          campaignData.followerTiers = formData.followerTiers
            .filter((tier) => tier.amount && parseFloat(tier.amount) > 0)
            .map((tier) => ({
              minFollowers: Number(tier.minFollowers),
              maxFollowers: tier.maxFollowers ? Number(tier.maxFollowers) : null,
              amount: parseFloat(tier.amount) / USD_TO_NGN,
            }))
        }
      } else if (formData.paymentStructure && formData.paymentStructure !== 'COMMISSION_PER_SALE') {
        campaignData.paymentAmount = parseFloat(formData.paymentAmount) / USD_TO_NGN
      }

      if (formData.paymentStructure === 'COMMISSION_PER_SALE' && selectedProducts.length > 0) {
        campaignData.selectedProducts = selectedProducts
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
        const paymentAmountInSelectedCurrency = selectedCurrency === 'NGN'
          ? remainingPaymentNeeded * USD_TO_NGN
          : selectedCurrency === 'KES'
          ? remainingPaymentNeeded * USD_TO_KES
          : remainingPaymentNeeded
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
                const budgetInUSD = parseFloat(formData.budget) / USD_TO_NGN
                if (vendorBalance >= budgetInUSD) return 0
                if (vendorBalance > 0) return budgetInUSD - vendorBalance
                return budgetInUSD
              })()}
            />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
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
