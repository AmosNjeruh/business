import React, { useState, useEffect, useRef } from 'react'

interface LocationData {
  fullAddress: string
  coordinates: {
    lat: number
    lng: number
  }
  addressComponents?: any
}

interface LocationInputProps {
  value: string
  onChange: (location: string, locationData?: LocationData) => void
  placeholder?: string
  required?: boolean
  className?: string
  variant?: 'partner' | 'business'
}

const LocationInput: React.FC<LocationInputProps> = ({
  value,
  onChange,
  placeholder = 'Search location...',
  required = false,
  className = '',
  variant = 'business',
}) => {
  const [locationData, setLocationData] = useState<LocationData | null>(null)
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<any[]>([])
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false)
  const [inputValue, setInputValue] = useState(value)
  const autocompleteInputRef = useRef<HTMLInputElement>(null)
  const autocompleteServiceRef = useRef<any>(null)
  const placesServiceRef = useRef<any>(null)
  const autocompleteWidgetRef = useRef<any>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setInputValue(value)
  }, [value])

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      console.warn('Google Maps API key not found')
      return
    }

    const google = (window as any).google
    if (google?.maps?.places) {
      setIsGoogleMapsLoaded(true)
      setTimeout(() => initializeAutocomplete(), 100)
      return
    }

    const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`)
    if (existingScript) {
      const checkGoogle = setInterval(() => {
        const google = (window as any).google
        if (google?.maps?.places) {
          clearInterval(checkGoogle)
          setIsGoogleMapsLoaded(true)
          setTimeout(() => initializeAutocomplete(), 100)
        }
      }, 100)
      return () => clearInterval(checkGoogle)
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => {
      setIsGoogleMapsLoaded(true)
      setTimeout(() => initializeAutocomplete(), 100)
    }
    script.onerror = () => {
      console.error('Failed to load Google Maps script')
    }
    document.head.appendChild(script)
  }, [])

  const initializeAutocomplete = () => {
    const google = (window as any).google
    if (!google?.maps?.places || !autocompleteInputRef.current) {
      return
    }

    if (!autocompleteServiceRef.current) {
      autocompleteServiceRef.current = new google.maps.places.AutocompleteService()
    }
    
    if (!placesServiceRef.current) {
      const dummyDiv = document.createElement('div')
      const map = new google.maps.Map(dummyDiv)
      placesServiceRef.current = new google.maps.places.PlacesService(map)
    }

    if (!autocompleteWidgetRef.current && autocompleteInputRef.current) {
      try {
        autocompleteWidgetRef.current = new google.maps.places.Autocomplete(
          autocompleteInputRef.current,
          {
            fields: ['address_components', 'formatted_address', 'geometry', 'place_id'],
          }
        )

        autocompleteWidgetRef.current.addListener('place_changed', () => {
          const place = autocompleteWidgetRef.current.getPlace()
          if (place && place.place_id) {
            handlePlaceSelect(place.place_id, place)
          }
        })
      } catch (error) {
        console.warn('Failed to initialize Autocomplete widget:', error)
      }
    }
  }

  const handleAutocompleteSearch = (input: string) => {
    if (!autocompleteServiceRef.current) {
      return
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (!input.trim()) {
      setAutocompleteSuggestions([])
      setShowAutocomplete(false)
      return
    }

    debounceTimerRef.current = setTimeout(() => {
      autocompleteServiceRef.current.getPlacePredictions(
        {
          input: input.trim(),
          types: ['(regions)'],
        },
        (predictions: any[] | null, status: string) => {
          if (status === 'OK' && predictions && predictions.length > 0) {
            setAutocompleteSuggestions(predictions)
            setShowAutocomplete(true)
          } else if (status !== 'OK' && status !== 'ZERO_RESULTS') {
            autocompleteServiceRef.current.getPlacePredictions(
              {
                input: input.trim(),
              },
              (allPredictions: any[] | null, allStatus: string) => {
                if (allStatus === 'OK' && allPredictions && allPredictions.length > 0) {
                  setAutocompleteSuggestions(allPredictions)
                  setShowAutocomplete(true)
                } else {
                  setAutocompleteSuggestions([])
                  setShowAutocomplete(false)
                }
              }
            )
          } else {
            setAutocompleteSuggestions([])
            setShowAutocomplete(false)
          }
        }
      )
    }, 300)
  }

  const handlePlaceSelect = (placeId: string, place?: any) => {
    if (place && place.address_components) {
      processPlaceData(place)
      return
    }

    if (!placesServiceRef.current) return

    placesServiceRef.current.getDetails(
      { placeId, fields: ['address_components', 'formatted_address', 'geometry', 'name'] },
      (placeData: any | null, status: string) => {
        if (status === 'OK' && placeData) {
          processPlaceData(placeData)
        }
      }
    )
  }

  const processPlaceData = (place: any) => {
    if (!place.geometry?.location) {
      console.warn('Place data missing geometry')
      return
    }

    const coordinates = {
      lat: typeof place.geometry.location.lat === 'function' 
        ? place.geometry.location.lat() 
        : place.geometry.location.lat,
      lng: typeof place.geometry.location.lng === 'function'
        ? place.geometry.location.lng()
        : place.geometry.location.lng,
    }

    const newLocationData: LocationData = {
      fullAddress: place.formatted_address || place.name || '',
      coordinates,
      addressComponents: place.address_components || [],
    }

    setLocationData(newLocationData)
    onChange(newLocationData.fullAddress, newLocationData)
    setShowAutocomplete(false)
    
    if (autocompleteInputRef.current) {
      autocompleteInputRef.current.value = newLocationData.fullAddress
      setInputValue(newLocationData.fullAddress)
    }
  }

  return (
    <div className={`relative ${className}`}>
      <input
        ref={autocompleteInputRef}
        type="text"
        value={inputValue}
        onChange={(e) => {
          const newValue = e.target.value
          setInputValue(newValue)
          onChange(newValue)
          if (isGoogleMapsLoaded) {
            handleAutocompleteSearch(newValue)
          }
        }}
        onFocus={() => {
          if (inputValue && isGoogleMapsLoaded) {
            handleAutocompleteSearch(inputValue)
          }
        }}
        onBlur={() => {
          setTimeout(() => setShowAutocomplete(false), 300)
        }}
        placeholder={placeholder}
        required={required}
        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20 transition-all"
      />
      {showAutocomplete && autocompleteSuggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-slate-900 border border-white/10 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {autocompleteSuggestions.map((prediction) => (
            <button
              key={prediction.place_id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                handlePlaceSelect(prediction.place_id)
                setShowAutocomplete(false)
              }}
              className="w-full text-left px-4 py-3 hover:bg-white/5 text-white border-b border-white/10 last:border-b-0 transition-colors"
            >
              <div className="font-medium text-white">
                {prediction.structured_formatting.main_text}
              </div>
              <div className="text-sm text-slate-400 mt-0.5">
                {prediction.structured_formatting.secondary_text}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default LocationInput
