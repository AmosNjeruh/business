// Campaign Details Form Component

import React from 'react'

interface CampaignDetailsFormProps {
  formData: {
    title: string
    description: string
    targetUrl: string
  }
  objective?: string
  errors: Record<string, string>
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
}

const CampaignDetailsForm: React.FC<CampaignDetailsFormProps> = ({
  formData,
  objective,
  errors,
  onChange,
}) => {
  const isTargetUrlRequired = objective === 'TRAFFIC' || objective === 'traffic'
  return (
    <div className="bg-white dark:bg-slate-900/70 rounded-xl p-6 border border-slate-200 dark:border-white/10 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Campaign Details</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Campaign Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={onChange}
            className={`w-full px-3 py-2.5 rounded-xl border bg-white dark:bg-white/5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-400 dark:focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/15 ${
              errors.title ? 'border-red-500 dark:border-red-500/50' : 'border-slate-200 dark:border-white/10'
            }`}
            placeholder="e.g., Summer Sale Promotion"
          />
          {errors.title && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.title}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Campaign Description *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={onChange}
            rows={4}
            className={`w-full px-3 py-2.5 rounded-xl border bg-white dark:bg-white/5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-400 dark:focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/15 resize-none ${
              errors.description
                ? 'border-red-500 dark:border-red-500/50'
                : 'border-slate-200 dark:border-white/10'
            }`}
            placeholder="Describe your campaign and what you're looking for from affiliates..."
          />
          {errors.description && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.description}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Target URL {isTargetUrlRequired ? '*' : <span className="text-slate-500 dark:text-slate-400">(Optional)</span>}
          </label>
          <input
            type="url"
            name="targetUrl"
            value={formData.targetUrl}
            onChange={onChange}
            className={`w-full px-3 py-2.5 rounded-xl border bg-white dark:bg-white/5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-400 dark:focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/15 ${
              errors.targetUrl
                ? 'border-red-500 dark:border-red-500/50'
                : 'border-slate-200 dark:border-white/10'
            }`}
            placeholder="https://yourdomain.com/landing-page"
            required={isTargetUrlRequired}
          />
          {errors.targetUrl && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.targetUrl}</p>
          )}
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {isTargetUrlRequired 
              ? 'This is the URL where affiliates will direct traffic. Make sure it\'s a valid URL with http:// or https://.'
              : 'This is the URL where affiliates will direct traffic. Make sure it\'s a valid URL with http:// or https://. Leave empty if you don\'t have a target URL yet.'}
          </p>
        </div>
      </div>
    </div>
  )
}

export default CampaignDetailsForm
