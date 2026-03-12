// Campaign Visibility Form Component

import React from 'react'
import { FaGlobe, FaLock, FaInfoCircle } from 'react-icons/fa'

interface CampaignVisibilityFormProps {
  isPublic: boolean
  onChange: (isPublic: boolean) => void
  requireConnectedSocialMedia?: boolean
  onRequireConnectedSocialChange?: (value: boolean) => void
}

const CampaignVisibilityForm: React.FC<CampaignVisibilityFormProps> = ({
  isPublic,
  onChange,
  requireConnectedSocialMedia = false,
  onRequireConnectedSocialChange,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900/70 rounded-xl p-6 border border-slate-200 dark:border-white/10 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">Campaign Visibility</h2>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch gap-3">
          <button
            type="button"
            onClick={() => onChange(true)}
            className={`flex-1 p-4 rounded-xl border-2 transition-all ${
              isPublic
                ? 'border-emerald-400 dark:border-emerald-400/60 bg-emerald-50 dark:bg-emerald-400/10'
                : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/3 hover:bg-slate-100 dark:hover:bg-white/6'
            }`}
          >
            <div className="flex items-center gap-3">
              <FaGlobe className={`h-5 w-5 ${isPublic ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
              <div className="text-left">
                <p className={`text-xs font-semibold ${isPublic ? 'text-emerald-600 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'}`}>
                  Public Campaign
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Visible to all partners</p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onChange(false)}
            className={`flex-1 p-4 rounded-xl border-2 transition-all ${
              !isPublic
                ? 'border-emerald-400 dark:border-emerald-400/60 bg-emerald-50 dark:bg-emerald-400/10'
                : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/3 hover:bg-slate-100 dark:hover:bg-white/6'
            }`}
          >
            <div className="flex items-center gap-3">
              <FaLock className={`h-5 w-5 ${!isPublic ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
              <div className="text-left">
                <p className={`text-xs font-semibold ${!isPublic ? 'text-emerald-600 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'}`}>
                  Private Campaign
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Invite-only partners</p>
              </div>
            </div>
          </button>
        </div>

        <div className="flex items-start gap-2 p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl">
          <FaInfoCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-slate-700 dark:text-slate-300">
            {isPublic ? (
              <>Public campaigns appear in the partner marketplace and can be discovered by all partners.</>
            ) : (
              <>Private campaigns are invitation-only. Partners won't see them unless you invite them.</>
            )}
          </div>
        </div>

        {onRequireConnectedSocialChange && (
          <div className="pt-2 border-t border-slate-200 dark:border-white/10">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={requireConnectedSocialMedia}
                onChange={(e) => onRequireConnectedSocialChange(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <span className="text-xs font-medium text-slate-900 dark:text-white flex items-center gap-2">
                  Verified partners only
                </span>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5">
                  Only partners who have connected at least one social media account can apply.
                </p>
              </div>
            </label>
          </div>
        )}
      </div>
    </div>
  )
}

export default CampaignVisibilityForm
