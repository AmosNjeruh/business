// Campaign Preview Modal Component

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { FaTimes, FaFacebook, FaInstagram, FaTwitter, FaYoutube, FaMagic } from 'react-icons/fa'
import FacebookPreview from './previews/FacebookPreview'
import InstagramPreview from './previews/InstagramPreview'
import XPreview from './previews/XPreview'
import YouTubePreview from './previews/YouTubePreview'

interface CampaignPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description: string
  targetUrl?: string
  thumbnailImage?: string | null
  promotionalImages?: string[]
  videoLink?: string
  objective: string
  businessName?: string
}

const CampaignPreviewModal: React.FC<CampaignPreviewModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  targetUrl,
  thumbnailImage,
  promotionalImages,
  videoLink,
  objective,
  businessName,
}) => {
  const [activeTab, setActiveTab] = useState<'facebook' | 'instagram' | 'x' | 'youtube'>('facebook')
  
  const hasYouTube = videoLink && videoLink.trim() !== ''
  
  const smartTargetUrl = targetUrl || (description ? description.match(/https?:\/\/[^\s]+/)?.[0] : null)
  
  const hasContent = !!(title.trim() || description.trim() || thumbnailImage || (promotionalImages && promotionalImages.length > 0) || videoLink)

  const tabs = [
    { id: 'facebook' as const, label: 'Facebook', icon: FaFacebook, color: 'text-blue-600' },
    { id: 'instagram' as const, label: 'Instagram', icon: FaInstagram, color: 'text-pink-600' },
    { id: 'x' as const, label: 'X', icon: FaTwitter, color: 'text-slate-900 dark:text-white' },
    ...(hasYouTube ? [{ id: 'youtube' as const, label: 'YouTube', icon: FaYoutube, color: 'text-red-600' }] : []),
  ]

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const modalContent = (
    <div
      className="fixed inset-0 overflow-y-auto"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10000,
        isolation: 'isolate',
      }}
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-center justify-center min-h-screen px-2 sm:px-4 lg:px-8 py-2 sm:py-4 lg:py-8 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-slate-500 bg-opacity-75 dark:bg-slate-900 dark:bg-opacity-75"
          style={{ zIndex: 10000 }}
          onClick={onClose}
        ></div>

        <div
          className="relative inline-block w-full max-w-6xl my-2 sm:my-4 lg:my-8 mx-2 sm:mx-4 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-slate-900 shadow-xl rounded-xl sm:rounded-2xl flex flex-col"
          style={{ 
            zIndex: 10001, 
            position: 'relative',
            maxHeight: 'calc(100vh - 1rem)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex-shrink-0 bg-gradient-to-r from-emerald-50 to-cyan-50 dark:from-emerald-500/10 dark:to-cyan-500/10 border-b border-slate-200 dark:border-white/10 px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="p-1 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex-shrink-0">
                  <FaMagic className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                    Live Preview
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                    See how your campaign will look on different platforms
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0"
                aria-label="Close preview"
              >
                <FaTimes className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              </button>
            </div>
          </div>

          <div className="flex-1 p-2 sm:p-3 lg:p-4 bg-gradient-to-br from-slate-50 via-emerald-50/30 to-cyan-50/30 dark:from-slate-900/50 dark:via-emerald-900/10 dark:to-cyan-900/10 overflow-y-auto min-h-0" style={{ maxHeight: 'calc(100vh - 140px)' }}>
            {!hasContent ? (
              <div className="flex flex-col items-center justify-center text-center p-4 sm:p-8 lg:p-12 w-full max-w-md mx-auto">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-emerald-100 to-cyan-100 dark:from-emerald-900/30 dark:to-cyan-900/30 flex items-center justify-center mb-4">
                  <FaMagic className="h-8 w-8 sm:h-10 sm:w-10 text-emerald-500 dark:text-emerald-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  Preview Ready
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 px-4">
                  Fill in your campaign details to see a live preview of how it will appear on social media platforms.
                </p>
              </div>
            ) : (
              <>
                <div className="lg:hidden mb-4">
                  <div className="flex border-b border-slate-200 dark:border-white/10 overflow-x-auto scrollbar-hide">
                    {tabs.map((tab) => {
                      const Icon = tab.icon
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors border-b-2 whitespace-nowrap flex-shrink-0 ${
                            activeTab === tab.id
                              ? 'border-emerald-400 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10'
                              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                          }`}
                        >
                          <Icon className={`h-3.5 w-3.5 ${activeTab === tab.id ? tab.color : ''}`} />
                          <span>{tab.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="lg:hidden flex justify-center">
                  {activeTab === 'facebook' && (
                    <FacebookPreview
                      title={title}
                      description={description}
                      targetUrl={smartTargetUrl || undefined}
                      thumbnailImage={thumbnailImage}
                      promotionalImages={promotionalImages}
                      objective={objective}
                      businessName={businessName}
                    />
                  )}
                  {activeTab === 'instagram' && (
                    <InstagramPreview
                      title={title}
                      description={description}
                      targetUrl={smartTargetUrl || undefined}
                      thumbnailImage={thumbnailImage}
                      promotionalImages={promotionalImages}
                      objective={objective}
                      businessName={businessName}
                    />
                  )}
                  {activeTab === 'x' && (
                    <XPreview
                      title={title}
                      description={description}
                      targetUrl={smartTargetUrl || undefined}
                      thumbnailImage={thumbnailImage}
                      promotionalImages={promotionalImages}
                      objective={objective}
                      businessName={businessName}
                    />
                  )}
                  {activeTab === 'youtube' && hasYouTube && (
                    <YouTubePreview
                      videoLink={videoLink!}
                      title={title}
                      description={description}
                      businessName={businessName}
                    />
                  )}
                </div>

                <div className={`hidden lg:grid ${hasYouTube ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-3 xl:gap-4 max-w-7xl mx-auto`}>
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <FaFacebook className="h-4 w-4 text-blue-600" />
                      <span>Facebook</span>
                    </div>
                    <FacebookPreview
                      title={title}
                      description={description}
                      targetUrl={smartTargetUrl || undefined}
                      thumbnailImage={thumbnailImage}
                      promotionalImages={promotionalImages}
                      objective={objective}
                      businessName={businessName}
                    />
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <FaInstagram className="h-4 w-4 text-pink-600" />
                      <span>Instagram</span>
                    </div>
                    <InstagramPreview
                      title={title}
                      description={description}
                      targetUrl={smartTargetUrl || undefined}
                      thumbnailImage={thumbnailImage}
                      promotionalImages={promotionalImages}
                      objective={objective}
                      businessName={businessName}
                    />
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <FaTwitter className="h-4 w-4 text-slate-900 dark:text-slate-100" />
                      <span>X (Twitter)</span>
                    </div>
                    <XPreview
                      title={title}
                      description={description}
                      targetUrl={smartTargetUrl || undefined}
                      thumbnailImage={thumbnailImage}
                      promotionalImages={promotionalImages}
                      objective={objective}
                      businessName={businessName}
                    />
                  </div>
                  {hasYouTube && (
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <FaYoutube className="h-4 w-4 text-red-600" />
                        <span>YouTube</span>
                      </div>
                      <YouTubePreview
                        videoLink={videoLink!}
                        title={title}
                        description={description}
                        businessName={businessName}
                      />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="flex-shrink-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/10 px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-end gap-2 sm:gap-3">
              <button
                onClick={onClose}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  if (typeof window !== 'undefined' && mounted) {
    return createPortal(modalContent, document.body)
  }

  return null
}

export default CampaignPreviewModal
