// Facebook Post Embed Component
// Displays embedded Facebook posts

import React, { useEffect, useRef, useState } from 'react'
import Script from 'next/script'

interface FacebookEmbedProps {
  url: string
  className?: string
}

const FacebookEmbed: React.FC<FacebookEmbedProps> = ({ url, className = '' }) => {
  const embedRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [isEmbedded, setIsEmbedded] = useState(false)
  const embedAttemptedRef = useRef(false)

  useEffect(() => {
    if (!embedRef.current || embedAttemptedRef.current) return

    if (embedRef.current.querySelector('.fb-post')) {
      setIsLoading(false)
      setIsEmbedded(true)
      return
    }

    const loadEmbed = () => {
      if (typeof window !== 'undefined' && (window as any).FB && (window as any).FB.XFBML) {
        embedAttemptedRef.current = true
        if (embedRef.current) {
          embedRef.current.innerHTML = `<div class="fb-post" data-href="${url}" data-width="500" data-show-text="true"></div>`
          ;(window as any).FB.XFBML.parse(embedRef.current)
        }
        setIsLoading(false)
        setIsEmbedded(true)
        return true
      }
      return false
    }

    if (loadEmbed()) {
      return
    }

    // Wait for script to load
    const checkFB = setInterval(() => {
      if (loadEmbed()) {
        clearInterval(checkFB)
      }
    }, 100)

    const timeout = setTimeout(() => {
      clearInterval(checkFB)
      if (isLoading && !isEmbedded) {
        setError(true)
        setIsLoading(false)
      }
    }, 10000)

    return () => {
      clearInterval(checkFB)
      clearTimeout(timeout)
    }
  }, [url, isLoading, isEmbedded])

  if (error) {
    return (
      <div className={`border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800 ${className}`}>
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium">Unable to load Facebook post</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              View on Facebook
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Script
        src="https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v18.0"
        strategy="lazyOnload"
        id="facebook-jssdk"
        onLoad={() => {
          setTimeout(() => {
            if (typeof window !== 'undefined' && (window as any).FB && embedRef.current && !embedAttemptedRef.current) {
              embedRef.current.innerHTML = `<div class="fb-post" data-href="${url}" data-width="500" data-show-text="true"></div>`
              ;(window as any).FB.XFBML.parse(embedRef.current)
              setIsLoading(false)
              setIsEmbedded(true)
              embedAttemptedRef.current = true
            }
          }, 100)
        }}
      />
      <div className={className}>
        {isLoading && !isEmbedded && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-8 bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
        <div 
          ref={embedRef} 
          className="facebook-embed-container"
          style={{ minHeight: isLoading && !isEmbedded ? '200px' : 'auto' }}
          suppressHydrationWarning
        />
      </div>
    </>
  )
}

export default React.memo(FacebookEmbed, (prevProps, nextProps) => {
  return prevProps.url === nextProps.url && prevProps.className === nextProps.className
})
