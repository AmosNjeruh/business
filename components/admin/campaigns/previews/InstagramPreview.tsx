// Instagram Post Preview Component

import React from 'react'
import { FaHeart, FaComment, FaPaperPlane, FaBookmark, FaEllipsisH } from 'react-icons/fa'

interface InstagramPreviewProps {
  title: string
  description: string
  targetUrl?: string
  thumbnailImage?: string | null
  promotionalImages?: string[]
  objective: string
  businessName?: string
}

const InstagramPreview: React.FC<InstagramPreviewProps> = ({
  title,
  description,
  targetUrl,
  thumbnailImage,
  promotionalImages,
  objective,
  businessName = 'yourbusiness',
}) => {
  const allImages = [
    ...(thumbnailImage ? [thumbnailImage] : []),
    ...(promotionalImages && promotionalImages.length > 0 ? promotionalImages : [])
  ]
  const displayImage = allImages.length > 0 ? allImages[0] : null
  const hasMultipleImages = allImages.length > 1
  
  const smartUrl = targetUrl || (description ? description.match(/https?:\/\/[^\s]+/)?.[0] : null)
  const showLinkInBio = (objective === 'TRAFFIC' || objective === 'LEADS') || !!smartUrl

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg overflow-hidden shadow-lg w-full max-w-[240px] mx-auto border border-slate-200 dark:border-white/10">
      <div className="flex items-center justify-between p-1.5 border-b border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 p-0.5 flex-shrink-0">
            <div className="w-full h-full rounded-full bg-white dark:bg-slate-800 flex items-center justify-center">
              <span className="text-[10px] font-bold text-slate-900 dark:text-white">
                {businessName.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <span className="font-semibold text-slate-900 dark:text-white text-xs truncate">
            {businessName}
          </span>
          {showLinkInBio && (
            <span className="px-1 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium rounded flex-shrink-0">
              Link in bio
            </span>
          )}
        </div>
        <button className="text-slate-900 dark:text-white flex-shrink-0">
          <FaEllipsisH className="h-4 w-4" />
        </button>
      </div>

      {displayImage ? (
        <div className="w-full aspect-[3/2] bg-slate-100 dark:bg-slate-800 relative">
          <img
            src={displayImage}
            alt="Campaign preview"
            className="w-full h-full object-cover"
          />
          {hasMultipleImages && (
            <>
              <div className="absolute top-1.5 right-1.5 flex gap-0.5">
                {allImages.map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-1 h-1 rounded-full ${idx === 0 ? 'bg-white' : 'bg-white/50'}`}
                  />
                ))}
              </div>
              <div className="absolute top-1.5 left-1.5 bg-black/50 text-white text-[9px] px-1 py-0.5 rounded flex items-center gap-0.5">
                <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
                <span>{allImages.length}</span>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="w-full aspect-[3/2] bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-900 flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600">
          <div className="text-center p-1.5">
            <p className="text-[9px] text-slate-400 dark:text-slate-500">Add an image to see preview</p>
          </div>
        </div>
      )}

      <div className="p-1.5">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <FaHeart className="h-3.5 w-3.5 text-slate-900 dark:text-white" />
            <FaComment className="h-3.5 w-3.5 text-slate-900 dark:text-white" />
            <FaPaperPlane className="h-3.5 w-3.5 text-slate-900 dark:text-white" />
          </div>
          <FaBookmark className="h-3.5 w-3.5 text-slate-900 dark:text-white" />
        </div>

        {description && (
          <div className="mb-1">
            <p className="text-[10px] text-slate-900 dark:text-white">
              <span className="font-semibold">{businessName}</span> {description}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default InstagramPreview
