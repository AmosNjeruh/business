// Video Link Form Component

import React, { useState } from 'react'
import { FaChevronDown, FaChevronUp } from 'react-icons/fa'

interface VideoLinkFormProps {
  videoLink: string
  errors: Record<string, string>
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

const VideoLinkForm: React.FC<VideoLinkFormProps> = ({ videoLink, errors, onChange }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="bg-white dark:bg-slate-900/70 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 sm:p-6 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Video Link (Optional)</label>
          {videoLink && (
            <span className="ml-2 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 rounded-full text-xs font-medium">
              Added
            </span>
          )}
        </div>
        {isExpanded ? (
          <FaChevronUp className="text-slate-500 dark:text-slate-400 h-4 w-4 sm:h-5 sm:w-5" />
        ) : (
          <FaChevronDown className="text-slate-500 dark:text-slate-400 h-4 w-4 sm:h-5 sm:w-5" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-3 border-t border-slate-200 dark:border-white/10 pt-4">
          <input
            type="url"
            name="videoLink"
            value={videoLink}
            onChange={onChange}
            placeholder="e.g., https://www.youtube.com/watch?v=..."
            className={`w-full px-3 py-2.5 text-xs border rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-white dark:bg-white/5 text-slate-900 dark:text-white ${
              errors.videoLink ? 'border-red-500 dark:border-red-500/50' : 'border-slate-200 dark:border-white/10'
            }`}
          />
          {errors.videoLink && (
            <p className="text-xs text-red-600 dark:text-red-400">{errors.videoLink}</p>
          )}
          <p className="text-xs text-slate-500 dark:text-slate-400">
            You can add a YouTube, Vimeo, or other video link for your campaign.
          </p>
        </div>
      )}
    </div>
  )
}

export default VideoLinkForm
