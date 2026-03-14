// Social Media Embeds - Unified Component
// Automatically detects platform and renders appropriate embed

import React from 'react'
import TwitterEmbed from './TwitterEmbed'
import InstagramEmbed from './InstagramEmbed'
import FacebookEmbed from './FacebookEmbed'
import YouTubeEmbed from './YouTubeEmbed'
import TikTokEmbed from './TikTokEmbed'
import LinkedInEmbed from './LinkedInEmbed'

interface SocialEmbedProps {
  url: string
  platform?: string
  className?: string
}

const SocialEmbed: React.FC<SocialEmbedProps> = ({ url, platform, className = '' }) => {
  const detectPlatform = (url: string, platform?: string): string | null => {
    if (platform) {
      const lower = platform.toLowerCase()
      if (['twitter', 'x'].includes(lower)) return 'twitter'
      if (['instagram'].includes(lower)) return 'instagram'
      if (['facebook'].includes(lower)) return 'facebook'
      if (['youtube'].includes(lower)) return 'youtube'
      if (['tiktok'].includes(lower)) return 'tiktok'
      if (['linkedin'].includes(lower)) return 'linkedin'
    }

    const lowerUrl = url.toLowerCase()
    if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) return 'twitter'
    if (lowerUrl.includes('instagram.com')) return 'instagram'
    if (lowerUrl.includes('facebook.com') || lowerUrl.includes('fb.com')) return 'facebook'
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'youtube'
    if (lowerUrl.includes('tiktok.com')) return 'tiktok'
    if (lowerUrl.includes('linkedin.com')) return 'linkedin'

    return null
  }

  const detectedPlatform = detectPlatform(url, platform)

  switch (detectedPlatform) {
    case 'twitter':
      return <TwitterEmbed url={url} className={className} />
    case 'instagram':
      return <InstagramEmbed url={url} className={className} />
    case 'facebook':
      return <FacebookEmbed url={url} className={className} />
    case 'youtube':
      return <YouTubeEmbed url={url} className={className} />
    case 'tiktok':
      return <TikTokEmbed url={url} className={className} />
    case 'linkedin':
      return <LinkedInEmbed url={url} className={className} />
    default:
      // Fallback: show link
      return (
        <div className={`border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800 ${className}`}>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View Post
          </a>
        </div>
      )
  }
}

export default SocialEmbed

// Export individual components for direct use
export {
  TwitterEmbed,
  InstagramEmbed,
  FacebookEmbed,
  YouTubeEmbed,
  TikTokEmbed,
  LinkedInEmbed,
}
