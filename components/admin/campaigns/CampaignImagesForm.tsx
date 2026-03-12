// Campaign Images Form Component

import React, { useState } from 'react'
import { FaSpinner, FaUpload, FaTimes, FaChevronDown, FaChevronUp } from 'react-icons/fa'

interface CampaignImagesFormProps {
  thumbnailImage: string | null
  promotionalImages: string[]
  isUploading: boolean
  onThumbnailUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onPromoImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveThumbnail: () => void
  onRemovePromoImage: (index: number) => void
}

const CampaignImagesForm: React.FC<CampaignImagesFormProps> = ({
  thumbnailImage,
  promotionalImages,
  isUploading,
  onThumbnailUpload,
  onPromoImageUpload,
  onRemoveThumbnail,
  onRemovePromoImage,
}) => {
  const [isThumbnailExpanded, setIsThumbnailExpanded] = useState(false)
  const [isPromoExpanded, setIsPromoExpanded] = useState(false)

  return (
    <div className="space-y-4">
      {/* Campaign Thumbnail */}
      <div className="bg-white dark:bg-slate-900/70 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
        <button
          type="button"
          onClick={() => setIsThumbnailExpanded(!isThumbnailExpanded)}
          className="w-full flex items-center justify-between p-4 sm:p-6 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">
              Campaign Thumbnail (Optional)
            </h2>
            {thumbnailImage && (
              <span className="ml-2 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 rounded-full text-xs font-medium">
                Added
              </span>
            )}
          </div>
          {isThumbnailExpanded ? (
            <FaChevronUp className="text-slate-500 dark:text-slate-400 h-4 w-4 sm:h-5 sm:w-5" />
          ) : (
            <FaChevronDown className="text-slate-500 dark:text-slate-400 h-4 w-4 sm:h-5 sm:w-5" />
          )}
        </button>

        {isThumbnailExpanded && (
          <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-3 border-t border-slate-200 dark:border-white/10 pt-4">
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
              This image will be used as the main thumbnail for your campaign in listings.
            </p>

            <div className="border-2 border-dashed border-slate-300 dark:border-white/10 rounded-xl p-4 sm:p-6">
              {!thumbnailImage ? (
                <div className="text-center">
                  <FaUpload className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                    Upload campaign thumbnail (optional)
                  </p>
                  <p className="text-xs text-slate-400 mb-4">PNG, JPG, JPEG, GIF up to 5MB</p>
                  <label className="cursor-pointer">
                    <span className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                      Choose File
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={onThumbnailUpload}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </label>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={thumbnailImage}
                    alt="Campaign Thumbnail"
                    className="w-full h-48 sm:h-64 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={onRemoveThumbnail}
                    className="absolute top-2 right-2 bg-red-600 rounded-full p-2 text-white hover:bg-red-700"
                    title="Remove image"
                  >
                    <FaTimes className="h-4 w-4" />
                  </button>
                </div>
              )}
              {isUploading && (
                <div className="mt-4 flex items-center justify-center">
                  <FaSpinner className="animate-spin h-4 w-4 sm:h-5 sm:w-5 mr-2 text-emerald-500" />
                  <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Uploading...</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Promotional Images */}
      <div className="bg-white dark:bg-slate-900/70 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
        <button
          type="button"
          onClick={() => setIsPromoExpanded(!isPromoExpanded)}
          className="w-full flex items-center justify-between p-4 sm:p-6 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">
              Promotional Images (Optional)
            </h2>
            {promotionalImages.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 rounded-full text-xs font-medium">
                {promotionalImages.length}
              </span>
            )}
          </div>
          {isPromoExpanded ? (
            <FaChevronUp className="text-slate-500 dark:text-slate-400 h-4 w-4 sm:h-5 sm:w-5" />
          ) : (
            <FaChevronDown className="text-slate-500 dark:text-slate-400 h-4 w-4 sm:h-5 sm:w-5" />
          )}
        </button>

        {isPromoExpanded && (
          <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4 border-t border-slate-200 dark:border-white/10 pt-4">
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              These images will be available for affiliates to download and use in their social media posts.
            </p>

            <div className="border-2 border-dashed border-slate-300 dark:border-white/10 rounded-xl p-4 sm:p-6">
              {promotionalImages.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
                  {promotionalImages.map((img, index) => (
                    <div key={index} className="relative">
                      <img
                        src={img}
                        alt={`Promotional ${index + 1}`}
                        className="h-24 sm:h-32 w-full object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => onRemovePromoImage(index)}
                        className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-red-600 rounded-full p-1 text-white hover:bg-red-700"
                        title="Remove image"
                      >
                        <FaTimes className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="text-center">
                <FaUpload className="mx-auto h-6 w-6 sm:h-8 sm:w-8 text-slate-400 mb-2" />
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-2">
                  Upload promotional images for affiliates
                </p>
                <p className="text-xs text-slate-400 mb-3 sm:mb-4">
                  PNG, JPG, JPEG, GIF, WEBP up to 5MB each. You can select multiple files at once.
                </p>
                <label className="cursor-pointer">
                  <span className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                    {promotionalImages.length > 0 ? 'Add More Images' : 'Choose Files'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={onPromoImageUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
                {promotionalImages.length > 0 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    {promotionalImages.length} image{promotionalImages.length > 1 ? 's' : ''} added
                  </p>
                )}
              </div>

              {isUploading && (
                <div className="mt-4 flex items-center justify-center">
                  <FaSpinner className="animate-spin h-4 w-4 sm:h-5 sm:w-5 mr-2 text-emerald-500" />
                  <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Uploading...</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CampaignImagesForm
