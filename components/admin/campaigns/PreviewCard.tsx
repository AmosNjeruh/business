// Preview Card Component

import React from 'react'
import { FaFacebook, FaInstagram, FaTwitter, FaYoutube } from 'react-icons/fa'

interface PreviewCardProps {
  platform: 'facebook' | 'instagram' | 'x' | 'youtube'
  title: string
  description: string
  thumbnailImage?: string | null
  onClick: () => void
}

const PreviewCard: React.FC<PreviewCardProps> = ({
  platform,
  title,
  description,
  thumbnailImage,
  onClick,
}) => {
  const icons = {
    facebook: FaFacebook,
    instagram: FaInstagram,
    x: FaTwitter,
    youtube: FaYoutube,
  }

  const colors = {
    facebook: 'text-blue-600 border-blue-300 dark:border-blue-600',
    instagram: 'text-pink-600 border-pink-300 dark:border-pink-600',
    x: 'text-slate-900 dark:text-white border-slate-400 dark:border-slate-500',
    youtube: 'text-red-600 border-red-300 dark:border-red-600',
  }

  const Icon = icons[platform]
  const colorClass = colors[platform]

  const hoverColorClass = platform === 'facebook' 
    ? 'hover:border-blue-400 dark:hover:border-blue-500'
    : platform === 'instagram'
    ? 'hover:border-pink-400 dark:hover:border-pink-500'
    : platform === 'youtube'
    ? 'hover:border-red-400 dark:hover:border-red-500'
    : 'hover:border-slate-400 dark:hover:border-slate-500'

  const aspectRatioClass = platform === 'instagram' 
    ? 'aspect-square'
    : 'aspect-video'

  if (platform === 'facebook') {
    return (
      <div
        className={`bg-white dark:bg-slate-900/70 rounded-xl p-2 sm:p-2.5 md:p-3 border-2 border-dashed border-slate-200 dark:border-white/10 cursor-pointer hover:border-solid transition-all ${hoverColorClass} active:scale-95`}
        onClick={onClick}
      >
        <div className="flex items-center gap-1 sm:gap-1.5 mb-1.5 sm:mb-2">
          <Icon className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${colorClass.split(' ')[0]}`} />
          <span className="text-[9px] sm:text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase">
            Facebook Preview
          </span>
        </div>
        
        <div className="space-y-1.5 sm:space-y-2">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-600 flex items-center justify-center text-white text-[9px] sm:text-[10px] font-bold flex-shrink-0">
              {title.charAt(0).toUpperCase() || 'B'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] sm:text-[10px] font-semibold text-slate-900 dark:text-white truncate">
                {title || 'Business'}
              </p>
            </div>
          </div>
          
          {description && (
            <p className="text-[9px] sm:text-[10px] text-slate-900 dark:text-white line-clamp-2 sm:line-clamp-3 leading-relaxed">
              {description}
            </p>
          )}
          
          {thumbnailImage ? (
            <div className={`${aspectRatioClass} bg-white dark:bg-slate-900 rounded overflow-hidden border border-slate-200 dark:border-white/10`}>
              <img
                src={thumbnailImage}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className={`${aspectRatioClass} bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded border border-slate-200 dark:border-white/10 flex items-center justify-center`}>
              <span className="text-[8px] sm:text-[9px] text-slate-400 dark:text-slate-500 px-1 sm:px-2 text-center">No image</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (platform === 'instagram') {
    return (
      <div
        className={`bg-white dark:bg-slate-900/70 rounded-xl p-2 sm:p-2.5 md:p-3 border-2 border-dashed border-slate-200 dark:border-white/10 cursor-pointer hover:border-solid transition-all ${hoverColorClass} active:scale-95`}
        onClick={onClick}
      >
        <div className="flex items-center gap-1 sm:gap-1.5 mb-1.5 sm:mb-2">
          <Icon className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${colorClass.split(' ')[0]}`} />
          <span className="text-[9px] sm:text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase">
            Instagram Preview
          </span>
        </div>
        
        <div className="space-y-1 sm:space-y-1.5">
          <div className="flex items-center gap-1 sm:gap-1.5">
            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 p-0.5 flex-shrink-0">
              <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center">
                <span className="text-[8px] sm:text-[9px] font-bold text-slate-900 dark:text-white">
                  {title.charAt(0).toUpperCase() || 'B'}
                </span>
              </div>
            </div>
            <p className="text-[9px] sm:text-[10px] font-semibold text-slate-900 dark:text-white truncate flex-1">
              {title || 'business'}
            </p>
          </div>
          
          {thumbnailImage ? (
            <div className={`${aspectRatioClass} bg-slate-100 dark:bg-slate-900 rounded overflow-hidden border border-slate-200 dark:border-white/10`}>
              <img
                src={thumbnailImage}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className={`${aspectRatioClass} bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded border border-slate-200 dark:border-white/10 flex items-center justify-center`}>
              <span className="text-[8px] sm:text-[9px] text-slate-400 dark:text-slate-500 px-1 sm:px-2 text-center">No image</span>
            </div>
          )}
          
          <div className="flex items-center gap-1.5 sm:gap-2 px-0.5 sm:px-1">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-slate-200 dark:bg-slate-700"></div>
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-slate-200 dark:bg-slate-700"></div>
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-slate-200 dark:bg-slate-700"></div>
            <div className="ml-auto w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-slate-200 dark:bg-slate-700"></div>
          </div>
          
          {description && (
            <p className="text-[9px] sm:text-[10px] text-slate-900 dark:text-white line-clamp-2 px-0.5 sm:px-1">
              <span className="font-semibold">{title || 'business'}</span> {description}
            </p>
          )}
        </div>
      </div>
    )
  }

  if (platform === 'x') {
    return (
      <div
        className={`bg-white dark:bg-slate-900/70 rounded-xl p-2 sm:p-2.5 md:p-3 border-2 border-dashed border-slate-200 dark:border-white/10 cursor-pointer hover:border-solid transition-all ${hoverColorClass} active:scale-95`}
        onClick={onClick}
      >
        <div className="flex items-center gap-1 sm:gap-1.5 mb-1.5 sm:mb-2">
          <Icon className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${colorClass.split(' ')[0]}`} />
          <span className="text-[9px] sm:text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase">
            X Preview
          </span>
        </div>
        
        <div className="space-y-1.5 sm:space-y-2">
          <div className="flex items-start gap-1 sm:gap-1.5">
            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[8px] sm:text-[9px] font-bold flex-shrink-0">
              {title.charAt(0).toUpperCase() || 'B'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-0.5 sm:gap-1 flex-wrap">
                <p className="text-[9px] sm:text-[10px] font-bold text-slate-900 dark:text-white truncate">
                  {title || 'Business'}
                </p>
                <span className="text-[8px] sm:text-[9px] text-slate-500 dark:text-slate-400">@{title?.toLowerCase().replace(/\s+/g, '') || 'business'}</span>
                <span className="text-[8px] sm:text-[9px] text-slate-500 dark:text-slate-400">·</span>
                <span className="text-[8px] sm:text-[9px] text-slate-500 dark:text-slate-400">Now</span>
              </div>
            </div>
          </div>
          
          {description && (
            <p className="text-[9px] sm:text-[10px] text-slate-900 dark:text-white line-clamp-2 sm:line-clamp-3 leading-relaxed">
              {description}
            </p>
          )}
          
          {thumbnailImage ? (
            <div className={`${aspectRatioClass} bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden border border-slate-200 dark:border-white/10`}>
              <img
                src={thumbnailImage}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className={`${aspectRatioClass} bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-lg border border-slate-200 dark:border-white/10 flex items-center justify-center`}>
              <span className="text-[8px] sm:text-[9px] text-slate-400 dark:text-slate-500 px-1 sm:px-2 text-center">No image</span>
            </div>
          )}
          
          <div className="flex items-center justify-between px-0.5 sm:px-1 pt-0.5 sm:pt-1 border-t border-slate-200 dark:border-white/10">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-slate-200 dark:bg-slate-700"></div>
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-slate-200 dark:bg-slate-700"></div>
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-slate-200 dark:bg-slate-700"></div>
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-slate-200 dark:bg-slate-700"></div>
          </div>
        </div>
      </div>
    )
  }

  // YouTube
  return (
    <div
      className={`bg-slate-50 dark:bg-slate-900/50 rounded-xl p-2 sm:p-3 border-2 border-dashed border-slate-200 dark:border-white/10 cursor-pointer hover:border-solid transition-all ${hoverColorClass} active:scale-95`}
      onClick={onClick}
    >
      <div className="flex items-center gap-2 mb-2 sm:mb-3">
        <Icon className={`h-3 w-3 sm:h-4 sm:w-4 ${colorClass.split(' ')[0]}`} />
        <span className="text-xs font-medium text-slate-700 dark:text-slate-300 capitalize">
          YouTube
        </span>
      </div>
      <div className="space-y-2">
        {thumbnailImage ? (
          <div className={`${aspectRatioClass} bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-white/10 overflow-hidden`}>
            <img
              src={thumbnailImage}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className={`${aspectRatioClass} bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded border border-slate-200 dark:border-white/10 flex items-center justify-center`}>
            <span className="text-xs text-slate-400 dark:text-slate-500 px-2 text-center">No image</span>
          </div>
        )}
        {title && (
          <p className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-2">
            {title}
          </p>
        )}
        {description && (
          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
            {description}
          </p>
        )}
      </div>
    </div>
  )
}

export default PreviewCard
