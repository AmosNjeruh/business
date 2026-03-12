// Campaign Requirements Form Component

import React, { useState } from 'react'
import { FaTimes, FaChevronDown, FaChevronUp } from 'react-icons/fa'

interface RequirementsFormProps {
  requirements: string[]
  onChange: (index: number, value: string) => void
  onAdd: () => void
  onRemove: (index: number) => void
}

const RequirementsForm: React.FC<RequirementsFormProps> = ({
  requirements,
  onChange,
  onAdd,
  onRemove,
}) => {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div className="bg-white dark:bg-slate-900/70 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 sm:p-6 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">Campaign Requirements</h2>
          {requirements.filter(r => r.trim()).length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 rounded-full text-xs font-medium">
              {requirements.filter(r => r.trim()).length}
            </span>
          )}
        </div>
        {isExpanded ? (
          <FaChevronUp className="text-slate-500 dark:text-slate-400 h-4 w-4 sm:h-5 sm:w-5" />
        ) : (
          <FaChevronDown className="text-slate-500 dark:text-slate-400 h-4 w-4 sm:h-5 sm:w-5" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-3 border-t border-slate-200 dark:border-white/10 pt-4">
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={onAdd} className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
              Add Requirement
            </button>
          </div>

          <div className="space-y-2">
            {requirements.map((requirement, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={requirement}
                  onChange={(e) => onChange(index, e.target.value)}
                  placeholder="e.g., Must have at least 1000 followers"
                  className="flex-1 px-3 py-2 text-xs border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-white dark:bg-white/5 text-slate-900 dark:text-white"
                />
                {requirements.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className="text-red-500 hover:text-red-700 p-1"
                    aria-label="Remove requirement"
                  >
                    <FaTimes className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default RequirementsForm
