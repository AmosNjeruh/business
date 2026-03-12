// Business Suite – Post Preview Modal
// Shows how a submitted post/content looks across social platforms.
// Usage: <PostPreviewModal submission={...} onClose={() => {}} />

import React, { useState } from "react";
import {
  FaTimes, FaInstagram, FaYoutube, FaTwitter, FaHeart,
  FaComment, FaShare, FaBookmark, FaEllipsisH, FaPlay,
  FaExternalLinkAlt, FaThumbsUp, FaEye, FaCheckCircle,
  FaTimesCircle, FaSpinner,
} from "react-icons/fa";

// Tiktok doesn't have an official FA icon, use a text placeholder
const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
  </svg>
);

type Platform = "instagram" | "tiktok" | "twitter" | "youtube";

interface PostPreviewProps {
  submission: {
    id: string;
    partner?: { name?: string; picture?: string };
    campaign?: { title?: string };
    submittedUrl?: string;
    caption?: string;
    platform?: string;
    imageUrl?: string;
    thumbnailUrl?: string;
    status: string;
    createdAt?: string;
  };
  onClose: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  actionLoading?: boolean;
}

const PLATFORMS: { key: Platform; label: string; icon: React.ElementType; color: string }[] = [
  { key: "instagram", label: "Instagram", icon: FaInstagram, color: "text-pink-600 dark:text-pink-400" },
  { key: "tiktok", label: "TikTok", icon: TikTokIcon, color: "text-slate-900 dark:text-white" },
  { key: "twitter", label: "X / Twitter", icon: FaTwitter, color: "text-sky-500 dark:text-sky-400" },
  { key: "youtube", label: "YouTube", icon: FaYoutube, color: "text-red-600 dark:text-red-500" },
];

function getInitials(name?: string | null) {
  if (!name) return "P";
  const p = name.trim().split(" ");
  return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : name.charAt(0).toUpperCase();
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Instagram Preview ─────────────────────────────────────────────────────────
function InstagramPreview({ submission }: { submission: PostPreviewProps["submission"] }) {
  return (
    <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 max-w-sm mx-auto shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-pink-500 via-red-500 to-yellow-500 p-0.5">
            <div className="h-full w-full rounded-full overflow-hidden bg-slate-300 dark:bg-slate-700">
              {submission.partner?.picture ? (
                <img src={submission.partner.picture} className="h-full w-full object-cover" alt="" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-white">
                  {getInitials(submission.partner?.name)}
                </div>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">{submission.partner?.name || "creator"}</p>
            <p className="text-[10px] text-slate-400">Sponsored</p>
          </div>
        </div>
        <FaEllipsisH className="h-3.5 w-3.5 text-slate-500" />
      </div>
      {/* Image */}
      <div className="aspect-square bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-700 relative overflow-hidden">
        {submission.imageUrl || submission.thumbnailUrl ? (
          <img src={submission.imageUrl || submission.thumbnailUrl} className="w-full h-full object-cover" alt="" />
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <FaInstagram className="h-12 w-12 text-slate-400 dark:text-slate-600 mb-2" />
            <p className="text-xs text-slate-400 dark:text-slate-500">Post preview</p>
          </div>
        )}
      </div>
      {/* Actions */}
      <div className="px-3 pt-2.5 pb-1">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <FaHeart className="h-5 w-5 text-slate-700 dark:text-white" />
            <FaComment className="h-5 w-5 text-slate-700 dark:text-white" />
            <FaShare className="h-5 w-5 text-slate-700 dark:text-white" />
          </div>
          <FaBookmark className="h-5 w-5 text-slate-700 dark:text-white" />
        </div>
        <p className="text-[11px] font-semibold text-slate-900 dark:text-white mb-1">1,284 likes</p>
        <p className="text-[11px] text-slate-800 dark:text-slate-200 leading-relaxed line-clamp-3">
          <span className="font-semibold">{submission.partner?.name?.toLowerCase().replace(" ", "_") || "creator"}</span>{" "}
          {submission.caption || "Check out this amazing product! 🔥 #ad #sponsored"}
        </p>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{submission.createdAt ? fmtDate(submission.createdAt) : "Just now"}</p>
      </div>
    </div>
  );
}

// ── TikTok Preview ────────────────────────────────────────────────────────────
function TikTokPreview({ submission }: { submission: PostPreviewProps["submission"] }) {
  return (
    <div className="bg-black rounded-2xl overflow-hidden max-w-xs mx-auto shadow-xl" style={{ aspectRatio: "9/16", maxHeight: 480 }}>
      <div className="relative h-full w-full">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          {submission.imageUrl || submission.thumbnailUrl ? (
            <img src={submission.imageUrl || submission.thumbnailUrl} className="w-full h-full object-cover opacity-80" alt="" />
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <TikTokIcon />
              <p className="text-xs text-slate-400 mt-2">TikTok preview</p>
            </div>
          )}
        </div>
        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <FaPlay className="h-6 w-6 text-white ml-1" />
          </div>
        </div>
        {/* Right actions */}
        <div className="absolute right-3 bottom-24 flex flex-col items-center gap-4">
          <div className="flex flex-col items-center gap-1">
            <FaHeart className="h-7 w-7 text-white" />
            <span className="text-[10px] text-white font-medium">24.7K</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <FaComment className="h-6 w-6 text-white" />
            <span className="text-[10px] text-white font-medium">1,243</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <FaBookmark className="h-6 w-6 text-white" />
            <span className="text-[10px] text-white font-medium">8,910</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <FaShare className="h-6 w-6 text-white" />
            <span className="text-[10px] text-white font-medium">Share</span>
          </div>
        </div>
        {/* Bottom info */}
        <div className="absolute bottom-4 left-3 right-16">
          <p className="text-xs font-bold text-white mb-1">@{submission.partner?.name?.toLowerCase().replace(" ", "_") || "creator"}</p>
          <p className="text-[11px] text-white/90 line-clamp-2">{submission.caption || "#ad Check this out! 🔥"}</p>
          <div className="flex items-center gap-1 mt-2">
            <div className="h-4 w-4 rounded-full bg-gradient-to-tr from-pink-500 to-yellow-500 animate-spin-slow" />
            <p className="text-[10px] text-white/80 truncate">{submission.campaign?.title || "Sponsored"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Twitter/X Preview ─────────────────────────────────────────────────────────
function TwitterPreview({ submission }: { submission: PostPreviewProps["submission"] }) {
  return (
    <div className="bg-white dark:bg-[#15202b] rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 max-w-sm mx-auto shadow-xl">
      <div className="p-4">
        <div className="flex gap-3">
          <div className="h-10 w-10 rounded-full overflow-hidden bg-slate-300 dark:bg-slate-700 flex-shrink-0">
            {submission.partner?.picture ? (
              <img src={submission.partner.picture} className="h-full w-full object-cover" alt="" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-sm font-bold text-slate-600 dark:text-white">
                {getInitials(submission.partner?.name)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-sm font-bold text-slate-900 dark:text-white">{submission.partner?.name || "Creator"}</span>
              <span className="text-xs text-slate-400 dark:text-slate-500">@{submission.partner?.name?.toLowerCase().replace(" ", "_") || "creator"}</span>
              <span className="text-xs text-slate-400 dark:text-slate-500">·</span>
              <span className="text-xs text-slate-400 dark:text-slate-500">{submission.createdAt ? fmtDate(submission.createdAt) : "now"}</span>
            </div>
            <p className="text-sm text-slate-800 dark:text-slate-200 mt-1 leading-relaxed">
              {submission.caption || "Check out this amazing product! #ad #sponsored 🔥"}
            </p>
            {(submission.imageUrl || submission.thumbnailUrl) && (
              <div className="mt-3 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10">
                <img src={submission.imageUrl || submission.thumbnailUrl} className="w-full object-cover max-h-56" alt="" />
              </div>
            )}
            <div className="flex items-center justify-between mt-3 text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1 hover:text-sky-500 cursor-pointer"><FaComment className="h-3.5 w-3.5" /><span className="text-xs">142</span></div>
              <div className="flex items-center gap-1 hover:text-green-500 cursor-pointer"><FaShare className="h-3.5 w-3.5" /><span className="text-xs">234</span></div>
              <div className="flex items-center gap-1 hover:text-pink-500 cursor-pointer"><FaHeart className="h-3.5 w-3.5" /><span className="text-xs">1.8K</span></div>
              <div className="flex items-center gap-1 hover:text-sky-500 cursor-pointer"><FaEye className="h-3.5 w-3.5" /><span className="text-xs">42K</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── YouTube Preview ───────────────────────────────────────────────────────────
function YouTubePreview({ submission }: { submission: PostPreviewProps["submission"] }) {
  return (
    <div className="bg-white dark:bg-[#0f0f0f] rounded-2xl overflow-hidden max-w-sm mx-auto shadow-xl border border-slate-200 dark:border-white/5">
      <div className="aspect-video bg-slate-900 relative">
        {submission.imageUrl || submission.thumbnailUrl ? (
          <img src={submission.imageUrl || submission.thumbnailUrl} className="w-full h-full object-cover" alt="" />
        ) : (
          <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-slate-800 to-slate-900">
            <FaYoutube className="h-12 w-12 text-red-600 mb-2" />
            <p className="text-xs text-slate-400">YouTube preview</p>
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-14 w-14 rounded-full bg-black/60 flex items-center justify-center">
            <FaPlay className="h-5 w-5 text-white ml-0.5" />
          </div>
        </div>
        <div className="absolute bottom-2 right-2 bg-black/90 text-white text-[10px] font-mono px-1.5 py-0.5 rounded">1:24</div>
      </div>
      <div className="p-3 flex gap-3">
        <div className="h-9 w-9 rounded-full overflow-hidden bg-slate-300 dark:bg-slate-700 flex-shrink-0">
          {submission.partner?.picture ? (
            <img src={submission.partner.picture} className="h-full w-full object-cover" alt="" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-sm font-bold text-slate-600 dark:text-white">
              {getInitials(submission.partner?.name)}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2 leading-tight">
            {submission.caption || `${submission.campaign?.title || "Campaign"} | Sponsored`}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{submission.partner?.name || "Creator"}</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">12K views · {submission.createdAt ? fmtDate(submission.createdAt) : "Just now"}</p>
        </div>
      </div>
      <div className="px-3 pb-3 flex items-center gap-3">
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/10 text-xs font-medium text-slate-700 dark:text-slate-200">
          <FaThumbsUp className="h-3 w-3" /> 428
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/10 text-xs font-medium text-slate-700 dark:text-slate-200">
          <FaShare className="h-3 w-3" /> Share
        </button>
      </div>
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────
const PostPreviewModal: React.FC<PostPreviewProps> = ({
  submission, onClose, onApprove, onReject, actionLoading,
}) => {
  const detectedPlatform = (): Platform => {
    const url = submission.submittedUrl || "";
    const p = submission.platform?.toLowerCase() || "";
    if (p.includes("instagram") || url.includes("instagram.com")) return "instagram";
    if (p.includes("tiktok") || url.includes("tiktok.com")) return "tiktok";
    if (p.includes("twitter") || p.includes("x.com") || url.includes("twitter.com") || url.includes("x.com")) return "twitter";
    if (p.includes("youtube") || url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
    return "instagram";
  };

  const [activePlatform, setActivePlatform] = useState<Platform>(detectedPlatform());

  const isPending = ["PENDING", "PENDING_REVIEW"].includes(submission.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-white/8">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Post Preview</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {submission.partner?.name} · {submission.campaign?.title}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
            <FaTimes className="h-4 w-4" />
          </button>
        </div>

        {/* Platform tabs */}
        <div className="px-5 pt-4 flex gap-2 overflow-x-auto">
          {PLATFORMS.map(({ key, label, icon: Icon, color }) => (
            <button key={key} onClick={() => setActivePlatform(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-all ${
                activePlatform === key
                  ? "bg-slate-900 dark:bg-white border-transparent text-white dark:text-slate-900"
                  : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}>
              <Icon className={`h-3.5 w-3.5 ${activePlatform === key ? "text-white dark:text-slate-900" : color}`} />
              {label}
            </button>
          ))}
        </div>

        {/* Preview */}
        <div className="p-5">
          {activePlatform === "instagram" && <InstagramPreview submission={submission} />}
          {activePlatform === "tiktok" && <TikTokPreview submission={submission} />}
          {activePlatform === "twitter" && <TwitterPreview submission={submission} />}
          {activePlatform === "youtube" && <YouTubePreview submission={submission} />}
        </div>

        {/* Original link + caption */}
        <div className="px-5 space-y-3 border-t border-slate-200 dark:border-white/8 pt-4 pb-2">
          {submission.submittedUrl && (
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Original URL</p>
              <a href={submission.submittedUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:underline">
                <FaExternalLinkAlt className="h-2.5 w-2.5" />
                {submission.submittedUrl.length > 60 ? submission.submittedUrl.slice(0, 60) + "…" : submission.submittedUrl}
              </a>
            </div>
          )}
          {submission.caption && (
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Caption</p>
              <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-white/3 border border-slate-200 dark:border-white/8 rounded-xl p-3 leading-relaxed">
                {submission.caption}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        {isPending && onApprove && onReject && (
          <div className="px-5 py-4 flex gap-3 border-t border-slate-200 dark:border-white/8">
            <button onClick={onReject} disabled={actionLoading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 dark:border-red-500/25 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-300 text-sm font-semibold hover:bg-red-100 dark:hover:bg-red-500/20 disabled:opacity-50 transition-all">
              {actionLoading ? <FaSpinner className="animate-spin h-3.5 w-3.5" /> : <FaTimesCircle className="h-3.5 w-3.5" />}
              Reject
            </button>
            <button onClick={onApprove} disabled={actionLoading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all">
              {actionLoading ? <FaSpinner className="animate-spin h-3.5 w-3.5" /> : <FaCheckCircle className="h-3.5 w-3.5" />}
              Approve Work
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostPreviewModal;
