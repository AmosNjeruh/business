// Twitter/X Tweet Embed Component
// Displays embedded tweets from Twitter/X URLs

import React, { useEffect, useRef, useState, useCallback } from 'react'
import Script from 'next/script'

interface TwitterEmbedProps {
  url: string
  className?: string
}

const TwitterEmbed: React.FC<TwitterEmbedProps> = ({ url, className = '' }) => {
  const embedRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [tweetId, setTweetId] = useState<string | null>(null)
  const [isEmbedded, setIsEmbedded] = useState(false)
  const embedAttemptedRef = useRef(false)

  // Extract tweet ID from various Twitter/X URL formats
  useEffect(() => {
    const extractTweetId = (url: string): string | null => {
      const patterns = [
        /(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/i,
        /\/status\/(\d+)/i,
      ]

      for (const pattern of patterns) {
        const match = url.match(pattern)
        if (match && match[1]) {
          return match[1]
        }
      }

      return null
    }

    const id = extractTweetId(url)
    setTweetId(id)
    if (!id) {
      setError(true)
      setIsLoading(false)
    }
  }, [url])

  const loadTweet = useCallback(() => {
    if (!tweetId || !embedRef.current || embedAttemptedRef.current) return false
    
    if (embedRef.current && embedRef.current.querySelector('blockquote.twitter-tweet')) {
      setIsLoading(false)
      setIsEmbedded(true)
      return true
    }

    if (typeof window !== 'undefined' && (window as any).twttr && (window as any).twttr.widgets) {
      embedAttemptedRef.current = true
      if (embedRef.current) {
        embedRef.current.innerHTML = ''
      }
      
      ;(window as any).twttr.widgets
        .createTweet(tweetId, embedRef.current, {
          theme: 'light',
          align: 'center',
        })
        .then(() => {
          setIsLoading(false)
          setIsEmbedded(true)
        })
        .catch((err: any) => {
          console.error('Failed to embed tweet:', err)
          setError(true)
          setIsLoading(false)
          embedAttemptedRef.current = false
        })
      return true
    }
    return false
  }, [tweetId])

  useEffect(() => {
    if (isEmbedded && embedRef.current) {
      const hasEmbed = embedRef.current.querySelector('blockquote.twitter-tweet')
      if (!hasEmbed && embedRef.current.children.length === 0) {
        embedAttemptedRef.current = false
        setIsEmbedded(false)
        setIsLoading(true)
        loadTweet()
      }
    }
  }, [isEmbedded, loadTweet])

  useEffect(() => {
    if (!tweetId || !embedRef.current) return

    if (embedRef.current.querySelector('blockquote.twitter-tweet')) {
      setIsLoading(false)
      setIsEmbedded(true)
      return
    }

    if (embedAttemptedRef.current) {
      embedAttemptedRef.current = false
      setIsEmbedded(false)
      setIsLoading(true)
      setError(false)
    }

    if (loadTweet()) {
      return
    }

    let checkTwttr: NodeJS.Timeout | null = null
    let timeout: NodeJS.Timeout | null = null

    checkTwttr = setInterval(() => {
      if (loadTweet()) {
        if (checkTwttr) clearInterval(checkTwttr)
      }
    }, 100)

    timeout = setTimeout(() => {
      if (checkTwttr) clearInterval(checkTwttr)
      setIsLoading((prev) => {
        if (prev && !isEmbedded) {
          setError(true)
          return false
        }
        return prev
      })
    }, 10000)

    return () => {
      if (checkTwttr) clearInterval(checkTwttr)
      if (timeout) clearTimeout(timeout)
    }
  }, [tweetId, loadTweet])

  if (error || !tweetId) {
    return (
      <div className={`border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800 ${className}`}>
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium">Unable to load tweet</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              View on Twitter
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Script
        src="https://platform.twitter.com/widgets.js"
        strategy="lazyOnload"
        id="twitter-widgets"
        onLoad={() => {
          setTimeout(() => {
            loadTweet()
          }, 100)
        }}
      />
      <div className={className}>
        {isLoading && !isEmbedded && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-8 bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}
        <div 
          key={`tweet-${tweetId}`}
          ref={embedRef} 
          className="twitter-embed-container"
          style={{ minHeight: isLoading && !isEmbedded ? '200px' : 'auto' }}
          suppressHydrationWarning
        />
      </div>
    </>
  )
}

export default React.memo(TwitterEmbed, (prevProps, nextProps) => {
  return prevProps.url === nextProps.url && prevProps.className === nextProps.className
})
