// YouTube Video Preview Component

import React from 'react'
import { FaPlay, FaThumbsUp, FaThumbsDown, FaShare, FaSave } from 'react-icons/fa'

interface YouTubePreviewProps {
  videoLink: string
  title: string
  description: string
  businessName?: string
}

const YouTubePreview: React.FC<YouTubePreviewProps> = ({
  videoLink,
  title,
  description,
  businessName = 'Your Channel',
}) => {
  const extractYouTubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return match && match[2].length === 11 ? match[2] : null
  }

  const getYouTubeThumbnailUrl = (url: string) => {
    const videoId = extractYouTubeVideoId(url)
    return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null
  }

  const videoId = extractYouTubeVideoId(videoLink)
  const thumbnailUrl = videoId ? getYouTubeThumbnailUrl(videoLink) : null

  if (!videoId) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-lg overflow-hidden shadow-lg max-w-2xl mx-auto border border-slate-200 dark:border-white/10">
        <div className="p-6 text-center">
          <p className="text-slate-500 dark:text-slate-400 text-sm">Invalid YouTube URL</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg overflow-hidden shadow-lg w-full max-w-[240px] mx-auto border border-slate-200 dark:border-white/10">
      <div className="relative w-full bg-black" style={{ aspectRatio: '16/9' }}>
        {thumbnailUrl ? (
          <>
            <img
              src={thumbnailUrl}
              alt="Video thumbnail"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg hover:bg-red-700 transition-colors cursor-pointer">
                <FaPlay className="h-5 w-5 text-white ml-0.5" />
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-800">
            <FaPlay className="h-10 w-10 text-slate-600" />
          </div>
        )}
        <div className="absolute bottom-1.5 right-1.5 bg-black bg-opacity-75 text-white text-[9px] px-1 py-0.5 rounded">
          10:30
        </div>
      </div>

      <div className="p-1.5">
        <h3 className="text-[10px] font-semibold text-slate-900 dark:text-white mb-1 line-clamp-2">
          {title || 'Your Campaign Title'}
        </h3>
        
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
              {businessName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-slate-900 dark:text-white truncate">
                {businessName}
              </p>
              <p className="text-[9px] text-slate-500 dark:text-slate-400">
                1.2K subscribers
              </p>
            </div>
          </div>
        </div>

        {description && (
          <div className="mb-1.5">
            <p className="text-[10px] text-slate-700 dark:text-slate-300 line-clamp-2">
              {description}
            </p>
          </div>
        )}

        <div className="flex items-center gap-2 pt-1.5 border-t border-slate-200 dark:border-white/10">
          <button className="flex items-center gap-1 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
            <FaThumbsUp className="h-3 w-3" />
            <span className="text-[9px]">1.2K</span>
          </button>
          <button className="flex items-center gap-1 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
            <FaThumbsDown className="h-3 w-3" />
            <span className="text-[9px]">12</span>
          </button>
          <button className="flex items-center gap-1 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors ml-auto">
            <FaShare className="h-3 w-3" />
            <span className="text-[9px]">Share</span>
          </button>
          <button className="flex items-center gap-1 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
            <FaSave className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default YouTubePreview
