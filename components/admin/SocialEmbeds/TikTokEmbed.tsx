// TikTok Embed Component
//
// Strategy:
//  • Photo posts  (/photo/) → directly build blockquote + embed.js
//    (TikTok's oEmbed API does NOT support photo posts)
//  • Video posts  (/video/) → oEmbed proxy → official blockquote HTML → embed.js
//    Falls back to manual blockquote if oEmbed is unavailable
//  • Short links / unknown → try oEmbed (TikTok resolves server-side)
//    Falls back to a "View on TikTok" card

import React, { useEffect, useRef, useState, useMemo } from 'react'
import { getTikTokOembed } from '../../../services/vendor'

interface TikTokEmbedProps {
  url: string
  className?: string
}

type PostType = 'video' | 'photo' | 'short' | 'unknown'

interface ParsedUrl {
  cleanUrl: string
  type: PostType
  id: string | null
}

// ── URL parser ────────────────────────────────────────────────────────────────
function parseTikTokUrl(raw: string): ParsedUrl {
  if (!raw) return { cleanUrl: '', type: 'unknown', id: null }

  const safeRaw = raw.trim()

  // Ensure we have a protocol so new URL() can parse it
  const withProto = safeRaw.startsWith('http') ? safeRaw : `https://${safeRaw}`

  let hostname = ''
  let pathname = safeRaw
  let cleanUrl = withProto
  let searchParams: URLSearchParams | null = null

  try {
    const u = new URL(withProto)
    hostname = u.hostname.toLowerCase()
    pathname = u.pathname
    cleanUrl = `${u.protocol}//${u.hostname}${u.pathname}`
    searchParams = u.searchParams
  } catch {
    // URL parsing failed — run regex directly against the raw string
    pathname = safeRaw
  }

  // Short-link domains (vm.tiktok.com, vt.tiktok.com)
  if (hostname.includes('vm.tiktok.com') || hostname.includes('vt.tiktok.com')) {
    return { cleanUrl, type: 'short', id: null }
  }

  // /@username/video/ID  or  /video/ID
  const videoMatch =
    pathname.match(/\/@[\w.%-]+\/video\/(\d+)/i) ||
    pathname.match(/\/video\/(\d+)/i) ||
    safeRaw.match(/\/video\/(\d+)/i)
  if (videoMatch?.[1]) return { cleanUrl, type: 'video', id: videoMatch[1] }

  // /@username/photo/ID  or  /photo/ID  (carousel/slideshow)
  const photoMatch =
    pathname.match(/\/@[\w.%-]+\/photo\/(\d+)/i) ||
    pathname.match(/\/photo\/(\d+)/i) ||
    safeRaw.match(/\/photo\/(\d+)/i)
  if (photoMatch?.[1]) return { cleanUrl, type: 'photo', id: photoMatch[1] }

  // share_item_id query parameter (present in TikTok share URLs)
  const shareItemId = searchParams?.get('share_item_id')
  if (shareItemId && /^\d{15,}$/.test(shareItemId)) {
    const isPhoto = pathname.includes('/photo/')
    return { cleanUrl, type: isPhoto ? 'photo' : 'video', id: shareItemId }
  }

  // Any 15+ digit number in the path (last-resort)
  const anyId = pathname.match(/\/(\d{15,})/) || safeRaw.match(/\/(\d{15,})/)
  if (anyId?.[1]) return { cleanUrl, type: 'video', id: anyId[1] }

  return { cleanUrl, type: 'unknown', id: null }
}

// Build the blockquote HTML that TikTok's embed.js processes
function buildBlockquote(cite: string, id: string): string {
  return `<blockquote class="tiktok-embed" cite="${cite}" data-video-id="${id}" style="max-width:605px;min-width:325px;"><section></section></blockquote>`
}

// Append a fresh embed.js so TikTok re-scans the DOM
function appendEmbedScript() {
  const script = document.createElement('script')
  script.src = 'https://www.tiktok.com/embed.js'
  script.async = true
  document.body.appendChild(script)
}

// ── Photo preview card (TikTok photo/carousel posts cannot be embedded) ──────
const PhotoPreviewCard: React.FC<{ url: string; className: string }> = ({ url, className }) => {
  // Try to extract username for display
  let displayName = 'TikTok Photo Post'
  try {
    const match = new URL(url).pathname.match(/\/@([\w.%-]+)\/photo\//i)
    if (match?.[1]) displayName = `@${match[1]}`
  } catch { /* ignore */ }

  return (
    <div className={`rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-black text-white">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
        </svg>
        <span className="text-sm font-semibold">TikTok</span>
        <span className="ml-auto text-xs bg-white/20 rounded px-1.5 py-0.5">Photo · Carousel</span>
      </div>

      {/* Body */}
      <div className="px-4 py-5 flex flex-col items-center gap-3 text-center">
        {/* Carousel icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 via-red-500 to-yellow-400 flex items-center justify-center shadow-md">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21h18M3 3h18" />
          </svg>
        </div>

        <div>
          <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{displayName}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
            Photo carousels can&apos;t be embedded — open on TikTok to view all slides
          </p>
        </div>

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-black text-white text-xs font-semibold hover:bg-gray-800 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
          </svg>
          View on TikTok
        </a>
      </div>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────
const TikTokEmbed: React.FC<TikTokEmbedProps> = ({ url, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const scriptAddedRef = useRef(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [embedHtml, setEmbedHtml] = useState<string | null>(null)

  const parsed = useMemo(() => parseTikTokUrl(url), [url])

  // All hooks must run unconditionally — photo check is in the render section below
  useEffect(() => {
    // Photo posts are handled by <PhotoPreviewCard> — no fetch needed
    if (parsed.type === 'photo') {
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(false)
    setEmbedHtml(null)
    scriptAddedRef.current = false

    const urlForOembed = parsed.cleanUrl || url.trim()

    const fetchEmbed = async () => {
      try {
        const data = await getTikTokOembed(urlForOembed)

        if (cancelled) return

        if (data.html) {
          setEmbedHtml(data.html)
          setIsLoading(false)
          return
        }

        // oEmbed failed — fall back to manual blockquote if we have an ID
        if (parsed.id) {
          setEmbedHtml(buildBlockquote(parsed.cleanUrl, parsed.id))
        } else {
          setError(true)
        }
      } catch {
        if (!cancelled) {
          if (parsed.id) {
            setEmbedHtml(buildBlockquote(parsed.cleanUrl, parsed.id))
          } else {
            setError(true)
          }
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchEmbed()
    return () => { cancelled = true }
  }, [url, parsed])

  // Inject HTML and fire embed.js once we have it
  useEffect(() => {
    if (!embedHtml || !containerRef.current) return
    containerRef.current.innerHTML = embedHtml
    if (scriptAddedRef.current) return
    scriptAddedRef.current = true
    appendEmbedScript()
  }, [embedHtml])

  // ── Photo posts: not embeddable → preview card ───────────────────────────
  // Also catch photo URLs that may have slipped through detection
  if (parsed.type === 'photo' || (error && url.toLowerCase().includes('/photo/'))) {
    return <PhotoPreviewCard url={url} className={className} />
  }

  // ── Generic fallback card (video that couldn't be embedded) ──────────────
  if (error) {
    // Try to extract @username for display
    let displayName = 'TikTok Post'
    try {
      const match = new URL(url.startsWith('http') ? url : `https://${url}`).pathname.match(/\/@([\w.%-]+)\//i)
      if (match?.[1]) displayName = `@${match[1]}`
    } catch { /* ignore */ }

    return (
      <div className={`rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 ${className}`}>
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-black text-white">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
          </svg>
          <span className="text-sm font-semibold">TikTok</span>
          <span className="ml-auto text-xs bg-white/20 rounded px-1.5 py-0.5">Video</span>
        </div>
        {/* Body */}
        <div className="px-4 py-5 flex flex-col items-center gap-3 text-center">
          <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center shadow-md">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{displayName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Images/Carousels can&apos;t be previewed here — open it directly on TikTok
            </p>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-black text-white text-xs font-semibold hover:bg-gray-800 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
            </svg>
            View on TikTok
          </a>
        </div>
      </div>
    )
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className={`border border-gray-200 dark:border-gray-700 rounded-lg p-8 bg-gray-50 dark:bg-gray-800 flex items-center justify-center ${className}`}>
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white" />
          <span className="text-xs">Loading TikTok post…</span>
        </div>
      </div>
    )
  }

  // ── Embed container (embed.js transforms blockquote into player) ──────────
  return (
    <div
      ref={containerRef}
      className={`tiktok-embed-wrapper ${className}`}
      suppressHydrationWarning
    />
  )
}

export default React.memo(TikTokEmbed, (prev, next) =>
  prev.url === next.url && prev.className === next.className
)
