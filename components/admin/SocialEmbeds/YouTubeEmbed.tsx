// YouTube Video Embed Component
// Displays embedded YouTube videos

import React, { useMemo, useState } from 'react'

interface YouTubeEmbedProps {
  url: string
  className?: string
}

const YouTubeEmbed: React.FC<YouTubeEmbedProps> = ({ url, className = '' }) => {
  const [error, setError] = useState(false)

  const videoId = useMemo(() => {
    const patterns = [
      // YouTube Shorts: youtube.com/shorts/VIDEO_ID
      /youtube\.com\/shorts\/([^&\n?#\/]+)/,
      // Standard watch URLs: youtube.com/watch?v=VIDEO_ID
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      // Fallback: any v= parameter
      /youtube\.com\/.*[?&]v=([^&\n?#]+)/,
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }

    return null
  }, [url])

  if (error || !videoId) {
    return (
      <div className={`border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800 ${className}`}>
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium">Unable to load YouTube video</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-red-600 dark:text-red-400 hover:underline"
            >
              View on YouTube
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          className="absolute top-0 left-0 w-full h-full rounded-lg"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onError={() => setError(true)}
        />
      </div>
    </div>
  )
}

export default React.memo(YouTubeEmbed, (prevProps, nextProps) => {
  return prevProps.url === nextProps.url && prevProps.className === nextProps.className
})
