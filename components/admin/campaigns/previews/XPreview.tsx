// X (Twitter) Post Preview Component

import React from 'react'
import { FaHeart, FaRetweet, FaReply, FaShare, FaEllipsisH, FaExternalLinkAlt } from 'react-icons/fa'

interface XPreviewProps {
  title: string
  description: string
  targetUrl?: string
  thumbnailImage?: string | null
  promotionalImages?: string[]
  objective: string
  businessName?: string
}

const XPreview: React.FC<XPreviewProps> = ({
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
    <div className="bg-white dark:bg-slate-900 rounded-lg overflow-hidden shadow-lg w-full max-w-[240px] mx-auto border border-slate-200 dark:border-white/10">
      <div className="p-1.5 border-b border-slate-200 dark:border-white/10">
        <div className="flex items-start gap-2">
          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold flex-shrink-0 text-[10px]">
            {businessName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
              <span className="font-bold text-slate-900 dark:text-white text-xs">
                {businessName}
              </span>
              <span className="text-slate-500 dark:text-slate-400 text-[10px]">
                @{businessName.toLowerCase().replace(/\s+/g, '')}
              </span>
              <span className="text-slate-500 dark:text-slate-400">·</span>
              <span className="text-slate-500 dark:text-slate-400 text-[10px]">
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
            <div className="flex items-center justify-end">
              <button className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                <FaEllipsisH className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-1.5">
        {description ? (
          <p className="text-slate-900 dark:text-white text-[10px] mb-1.5 whitespace-pre-wrap break-words">
            {description}
          </p>
        ) : (
          <p className="text-slate-400 dark:text-slate-500 text-[10px] mb-1.5 italic whitespace-pre-wrap break-words">
            Your campaign description will appear here...
          </p>
        )}

        {smartUrl && !displayImage && (
          <div className="border border-slate-200 dark:border-white/10 rounded-lg overflow-hidden mb-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            {thumbnailImage && (
              <div className="w-full h-48 bg-slate-100 dark:bg-slate-800">
                <img
                  src={thumbnailImage}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="p-2">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white mb-1 line-clamp-1">
                {title || 'Your Campaign Title'}
              </h3>
              {getDomain(smartUrl) && (
                <div className="flex items-center gap-1 text-[9px] text-slate-500 dark:text-slate-400">
                  <FaExternalLinkAlt className="h-2.5 w-2.5" />
                  <span>{getDomain(smartUrl)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {displayImage && (
          <div className="rounded-lg overflow-hidden mb-3 border border-slate-200 dark:border-white/10">
            <img
              src={displayImage}
              alt="Campaign preview"
              className="w-full h-auto object-cover"
              style={{ maxHeight: '140px' }}
            />
          </div>
        )}

        <div className="flex items-center justify-between pt-1.5 border-t border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400">
          <button className="flex items-center gap-1 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
            <FaReply className="h-3 w-3" />
          </button>
          <button className="flex items-center gap-1 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
            <FaRetweet className="h-3 w-3" />
          </button>
          <button className="flex items-center gap-1 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
            <FaHeart className="h-3 w-3" />
          </button>
          <button className="flex items-center gap-1 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
            <FaShare className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default XPreview
