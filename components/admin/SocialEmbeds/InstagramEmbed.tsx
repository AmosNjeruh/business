// Instagram Post Embed Component
// Displays embedded Instagram posts using oEmbed iframe

import React, { useEffect, useRef, useState } from 'react'
import Script from 'next/script'

interface InstagramEmbedProps {
  url: string
  className?: string
}

const InstagramEmbed: React.FC<InstagramEmbedProps> = ({ url, className = '' }) => {
  const embedRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [isEmbedded, setIsEmbedded] = useState(false)
  const embedAttemptedRef = useRef(false)
  const [iframeSrc, setIframeSrc] = useState<string | null>(null)

  useEffect(() => {
    if (!url || embedAttemptedRef.current) return

    // Extract shortcode from Instagram URL
    const extractShortcode = (url: string): string | null => {
      const patterns = [
        /instagram\.com\/p\/([^/?]+)/i,
        /instagram\.com\/reel\/([^/?]+)/i,
        /instagram\.com\/tv\/([^/?]+)/i,
      ]

      for (const pattern of patterns) {
        const match = url.match(pattern)
        if (match && match[1]) {
          return match[1]
        }
      }
      return null
    }

    const shortcode = extractShortcode(url)
    if (!shortcode) {
      setError(true)
      setIsLoading(false)
      return
    }

    // Use Instagram oEmbed iframe approach
    const iframeUrl = `https://www.instagram.com/p/${shortcode}/embed/`
    setIframeSrc(iframeUrl)
    embedAttemptedRef.current = true
    setIsLoading(false)
    setIsEmbedded(true)
  }, [url])

  if (error) {
    return (
      <div className={`border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800 ${className}`}>
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium">Unable to load Instagram post</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-pink-600 dark:text-pink-400 hover:underline"
            >
              View on Instagram
            </a>
          </div>
        </div>
      </div>
    )
  }

  if (error || !iframeSrc) {
    return (
      <div className={`border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800 ${className}`}>
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium">Unable to load Instagram post</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-pink-600 dark:text-pink-400 hover:underline"
            >
              View on Instagram
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="relative w-full" style={{ paddingBottom: '125%' }}>
        <iframe
          src={iframeSrc || ''}
          className="absolute top-0 left-0 w-full h-full rounded-lg border-0"
          frameBorder="0"
          scrolling="no"
          allow="encrypted-media"
          onLoad={() => {
            setIsLoading(false)
            setIsEmbedded(true)
          }}
          onError={() => {
            setError(true)
            setIsLoading(false)
          }}
        />
      </div>
    </div>
  )
}

export default React.memo(InstagramEmbed, (prevProps, nextProps) => {
  return prevProps.url === nextProps.url && prevProps.className === nextProps.className
})
