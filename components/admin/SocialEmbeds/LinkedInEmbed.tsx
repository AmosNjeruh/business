// LinkedIn Post Embed Component
// Displays embedded LinkedIn posts

import React, { useEffect, useRef, useState } from 'react'
import Script from 'next/script'

interface LinkedInEmbedProps {
  url: string
  className?: string
}

const LinkedInEmbed: React.FC<LinkedInEmbedProps> = ({ url, className = '' }) => {
  const embedRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [isEmbedded, setIsEmbedded] = useState(false)
  const embedAttemptedRef = useRef(false)

  useEffect(() => {
    if (!embedRef.current || embedAttemptedRef.current) return

    if (embedRef.current.querySelector('div[data-linkedin-post]') || embedRef.current.querySelector('script[src*="linkedin"]')) {
      setIsLoading(false)
      setIsEmbedded(true)
      return
    }

    const loadEmbed = () => {
      if (typeof window !== 'undefined' && (window as any).IN && (window as any).IN.parse) {
        embedAttemptedRef.current = true
        if (embedRef.current) {
          embedRef.current.innerHTML = `<script type="IN/Share" data-url="${url}"></script>`
          ;(window as any).IN.parse(embedRef.current)
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
    const checkIN = setInterval(() => {
      if (loadEmbed()) {
        clearInterval(checkIN)
      }
    }, 100)

    const timeout = setTimeout(() => {
      clearInterval(checkIN)
      if (isLoading && !isEmbedded) {
        setError(true)
        setIsLoading(false)
      }
    }, 10000)

    return () => {
      clearInterval(checkIN)
      clearTimeout(timeout)
    }
  }, [url, isLoading, isEmbedded])

  if (error) {
    return (
      <div className={`border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800 ${className}`}>
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium">Unable to load LinkedIn post</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-700 dark:text-blue-400 hover:underline"
            >
              View on LinkedIn
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Script
        src="https://platform.linkedin.com/in.js"
        strategy="lazyOnload"
        id="linkedin-embed"
        onLoad={() => {
          setTimeout(() => {
            if (typeof window !== 'undefined' && (window as any).IN && embedRef.current && !embedAttemptedRef.current) {
              embedRef.current.innerHTML = `<script type="IN/Share" data-url="${url}"></script>`
              ;(window as any).IN.parse(embedRef.current)
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
          </div>
        )}
        <div 
          ref={embedRef} 
          className="linkedin-embed-container"
          style={{ minHeight: isLoading && !isEmbedded ? '200px' : 'auto' }}
          suppressHydrationWarning
        />
      </div>
    </>
  )
}

export default React.memo(LinkedInEmbed, (prevProps, nextProps) => {
  return prevProps.url === nextProps.url && prevProps.className === nextProps.className
})
