// Facebook Post Preview Component

import React from 'react'
import { FaGlobe, FaEllipsisH, FaThumbsUp, FaComment, FaShare, FaExternalLinkAlt } from 'react-icons/fa'

interface FacebookPreviewProps {
  title: string
  description: string
  targetUrl?: string
  thumbnailImage?: string | null
  promotionalImages?: string[]
  objective: string
  businessName?: string
}

const FacebookPreview: React.FC<FacebookPreviewProps> = ({
  title,
  description,
  targetUrl,
  thumbnailImage,
  promotionalImages,
  objective,
  businessName = 'Your Business',
}) => {
  const allImages = [
    ...(thumbnailImage ? [thumbnailImage] : []),
    ...(promotionalImages && promotionalImages.length > 0 ? promotionalImages : [])
  ]
  const displayImage = allImages.length > 0 ? allImages[0] : null
  const hasMultipleImages = allImages.length > 1
  
  const smartUrl = targetUrl || (description ? description.match(/https?:\/\/[^\s]+/)?.[0] : null)
  
  const getDomain = (url?: string | null) => {
    if (!url) return null
    try {
      const urlObj = new URL(url)
      return urlObj.hostname.replace('www.', '')
    } catch {
      return url.replace(/^https?:\/\//, '').split('/')[0]
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg overflow-hidden shadow-lg w-full max-w-[240px] mx-auto">
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-white/10 p-1.5">
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold flex-shrink-0 text-[10px]">
              {businessName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 flex-wrap">
                <span className="font-semibold text-slate-900 dark:text-white text-xs truncate">
                  {businessName}
                </span>
              </div>
            </div>
          </div>
          <button className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex-shrink-0">
            <FaEllipsisH className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800">
        {description ? (
          <div className="p-1.5 pb-1">
            <p className="text-slate-900 dark:text-white text-[10px] whitespace-pre-wrap break-words">
              {description}
            </p>
          </div>
        ) : (
          <div className="p-1.5 pb-1">
            <p className="text-slate-400 dark:text-slate-500 text-[10px] italic">
              Your campaign description will appear here...
            </p>
          </div>
        )}

        {smartUrl && getDomain(smartUrl) && (
          <div className="px-3 pb-2">
            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs">
              <FaExternalLinkAlt className="h-3 w-3" />
              <span>{getDomain(smartUrl)}</span>
            </div>
          </div>
        )}

        {displayImage ? (
          <div className="w-full relative">
            {hasMultipleImages ? (
              <div className="relative">
                <img
                  src={displayImage}
                  alt="Campaign preview"
                  className="w-full h-auto object-cover"
                  style={{ maxHeight: '140px' }}
                />
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1.5 bg-black/50 rounded-full px-2 py-1">
                  {allImages.map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-1.5 h-1.5 rounded-full ${idx === 0 ? 'bg-white' : 'bg-white/50'}`}
                    />
                  ))}
                </div>
                <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                  {allImages.length} photos
                </div>
              </div>
            ) : (
              <img
                src={displayImage}
                alt="Campaign preview"
                className="w-full h-auto object-cover"
                style={{ maxHeight: '180px' }}
              />
            )}
          </div>
        ) : description && (
          <div className="w-full h-48 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
            <div className="text-center p-4">
              <p className="text-xs text-slate-400 dark:text-slate-500">Add an image to enhance your post</p>
            </div>
          </div>
        )}

        {smartUrl && !displayImage && (
          <div className="border-t border-slate-200 dark:border-white/10">
            <div className="p-3">
              <div className="flex gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1 break-words">
                    {title || 'Your Campaign Title'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 whitespace-pre-wrap break-words">
                    {description || 'Campaign description...'}
                  </p>
                  {getDomain(smartUrl) && (
                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                      <FaExternalLinkAlt className="h-3 w-3" />
                      <span>{getDomain(smartUrl)}</span>
                    </div>
                  )}
                </div>
                {thumbnailImage && (
                  <div className="w-24 h-24 flex-shrink-0 rounded overflow-hidden">
                    <img
                      src={thumbnailImage}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="px-1.5 py-1 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-slate-500 dark:text-slate-400 text-[10px]">
          <button className="flex items-center gap-1 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
            <FaThumbsUp className="h-3 w-3" />
            <span>Like</span>
          </button>
          <button className="flex items-center gap-1 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
            <FaComment className="h-3 w-3" />
            <span>Comment</span>
          </button>
          <button className="flex items-center gap-1 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
            <FaShare className="h-3 w-3" />
            <span>Share</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default FacebookPreview
