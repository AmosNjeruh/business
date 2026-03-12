// Campaign Schedule Form Component

import React from 'react'

interface CampaignScheduleFormProps {
  formData: {
    startDate: string
    endDate: string
  }
  errors: Record<string, string>
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  allowPastDates?: boolean
}

const CampaignScheduleForm: React.FC<CampaignScheduleFormProps> = ({
  formData,
  errors,
  onChange,
  allowPastDates = false,
}) => {
  const minStartDate = allowPastDates ? undefined : new Date().toISOString().split('T')[0]
  const minEndDate = allowPastDates 
    ? (formData.startDate || undefined)
    : (formData.startDate || new Date().toISOString().split('T')[0])

  return (
    <div className="bg-white dark:bg-slate-900/70 rounded-xl p-6 border border-slate-200 dark:border-white/10 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Campaign Schedule</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Start Date *</label>
          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={onChange}
            min={minStartDate}
            className={`w-full px-3 py-2.5 rounded-xl border bg-white dark:bg-white/5 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-400 dark:focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/15 ${
              errors.startDate ? 'border-red-500 dark:border-red-500/50' : 'border-slate-200 dark:border-white/10'
            }`}
          />
          {errors.startDate && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.startDate}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">End Date *</label>
          <input
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={onChange}
            min={minEndDate}
            className={`w-full px-3 py-2.5 rounded-xl border bg-white dark:bg-white/5 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-400 dark:focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/15 ${
              errors.endDate ? 'border-red-500 dark:border-red-500/50' : 'border-slate-200 dark:border-white/10'
            }`}
          />
          {errors.endDate && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.endDate}</p>
          )}
        </div>
      </div>
      {formData.startDate && formData.endDate && (
        <div className="mt-4 rounded-xl border border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/5 p-3">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Duration: <span className="text-slate-900 dark:text-white font-semibold">
              {Math.ceil((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / 86400000)} days
            </span>
          </p>
        </div>
      )}
    </div>
  )
}

export default CampaignScheduleForm
