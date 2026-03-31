// Audience Targeting Form Component (Simplified - text-based locations)

import React, { useEffect, useRef, useState } from 'react'
import { FaMapMarkerAlt, FaChevronDown, FaChevronUp, FaTimes } from 'react-icons/fa'

interface LocationTarget {
  lat?: number
  lng?: number
  radius?: number
  address: string
  type?: 'text' | 'map'
}

interface AudienceTargetingFormProps {
  audienceTargeting: {
    locations?: LocationTarget[]
  } | null
  onChange: (audienceTargeting: { locations?: LocationTarget[] } | null) => void
}

const AudienceTargetingForm: React.FC<AudienceTargetingFormProps> = ({
  audienceTargeting,
  onChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [locationInput, setLocationInput] = useState('')
  const hasAutoExpandedRef = useRef(false)

  const locations = audienceTargeting?.locations || []

  useEffect(() => {
    if (hasAutoExpandedRef.current) return
    if (locations.length === 0) return
    setIsExpanded(true)
    hasAutoExpandedRef.current = true
  }, [locations.length])

  const handleAddLocation = () => {
    if (!locationInput.trim()) return

    const isDuplicate = locations.some(
      (loc) => loc.address.toLowerCase().trim() === locationInput.toLowerCase().trim()
    )
    if (isDuplicate) {
      return
    }

    const locationTarget: LocationTarget = {
      address: locationInput.trim(),
      type: 'text',
    }

    const newLocations = [...locations, locationTarget]
    onChange({ locations: newLocations })
    setLocationInput('')
  }

  const handleRemoveLocation = (index: number) => {
    const newLocations = locations.filter((_, i) => i !== index)
    if (newLocations.length === 0) {
      onChange(null)
    } else {
      onChange({ locations: newLocations })
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900/70 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 sm:p-6 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <FaMapMarkerAlt className="text-emerald-600 dark:text-emerald-400 flex-shrink-0 h-4 w-4 sm:h-5 sm:w-5" />
          <h2 className="text-base sm:text-xl font-semibold text-slate-900 dark:text-white truncate">
            Audience Targeting (Optional)
          </h2>
          {locations.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 rounded-full text-xs font-medium flex-shrink-0">
              {locations.length} location{locations.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {isExpanded ? (
          <FaChevronUp className="text-slate-500 dark:text-slate-400 flex-shrink-0 ml-2 h-4 w-4 sm:h-5 sm:w-5" />
        ) : (
          <FaChevronDown className="text-slate-500 dark:text-slate-400 flex-shrink-0 ml-2 h-4 w-4 sm:h-5 sm:w-5" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4 border-t border-slate-200 dark:border-white/10 pt-4">
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Target specific locations for your campaign. Type locations (countries, cities, regions).
          </p>

          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddLocation()
                  }
                }}
                className="flex-1 px-3 py-2 text-xs border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-white dark:bg-white/5 text-slate-900 dark:text-white"
                placeholder="Type location (e.g., Kenya, Africa, New York, Nairobi)"
              />
              <button
                type="button"
                onClick={handleAddLocation}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs"
              >
                Add
              </button>
            </div>
          </div>

          {locations.length > 0 && (
            <div className="space-y-2">
              <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                Selected Locations ({locations.length})
              </label>
              <div className="space-y-2">
                {locations.map((location, index) => (
                  <div
                    key={index}
                    className="flex items-start justify-between p-2 sm:p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <FaMapMarkerAlt className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                        <span className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white truncate">
                          {location.address}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveLocation(index)}
                      className="ml-2 p-1.5 sm:p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors flex-shrink-0"
                      aria-label="Remove location"
                    >
                      <FaTimes className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AudienceTargetingForm
