// Audience Targeting Form Component
// For location-based audience targeting with map interface (like Facebook Ads)

import React, { useState, useEffect, useRef } from 'react'
import { FaMapMarkerAlt, FaChevronDown, FaChevronUp, FaLocationArrow, FaTimes, FaSearch } from 'react-icons/fa'

interface LocationTarget {
  lat?: number // Optional - only for map-based locations
  lng?: number // Optional - only for map-based locations
  radius?: number // Optional - only for map-based locations (in kilometers)
  address: string
  type?: 'text' | 'map' // 'text' for typed locations, 'map' for current location
}

interface AudienceTargetingFormProps {
  audienceTargeting: {
    locations?: LocationTarget[]
  } | null
  onChange: (audienceTargeting: { locations?: LocationTarget[] } | null) => void
}

declare global {
  interface Window {
    google?: any
  }
}

const AudienceTargetingForm: React.FC<AudienceTargetingFormProps> = ({
  audienceTargeting,
  onChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<LocationTarget | null>(null)
  const [radius, setRadius] = useState(50) // Default 50km
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [locationInput, setLocationInput] = useState('')
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const circleRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const locationInputRef = useRef<HTMLInputElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const autocompleteServiceRef = useRef<any>(null)
  const placesServiceRef = useRef<any>(null)
  const autocompleteWidgetRef = useRef<any>(null)
  const hasAutoExpandedRef = useRef(false)

  const locations = audienceTargeting?.locations || []

  useEffect(() => {
    if (!hasAutoExpandedRef.current && locations.length > 0) {
      setIsExpanded(true)
      hasAutoExpandedRef.current = true
    }
  }, [locations.length])

  // Load Google Maps script
  useEffect(() => {
    if (!isExpanded) return

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      setMapError('Google Maps API key not configured')
      return
    }

    if (window.google && window.google.maps) {
      setIsMapLoaded(true)
      initializeMap()
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`
    script.async = true
    script.defer = true
    script.onload = () => {
      setIsMapLoaded(true)
      initializeMap()
      initializeAutocomplete()
    }
    script.onerror = () => {
      setMapError('Failed to load Google Maps')
    }
    document.head.appendChild(script)

    return () => {
      const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`)
      if (existingScript && !window.google) {
        existingScript.remove()
      }
    }
  }, [isExpanded])

  useEffect(() => {
    if (isMapLoaded && isExpanded && mapRef.current) {
      initializeMap()
      initializeAutocomplete()
    }
  }, [isMapLoaded, isExpanded])

  useEffect(() => {
    if (!isMapLoaded || !isExpanded) return

    const handleResize = () => {
      if (mapInstanceRef.current && window.google) {
        setTimeout(() => {
          window.google.maps.event.trigger(mapInstanceRef.current, 'resize')
        }, 100)
      }
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    }
  }, [isMapLoaded, isExpanded])

  const initializeAutocomplete = () => {
    const google = window.google
    if (!google?.maps?.places || !locationInputRef.current) {
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

    if (!autocompleteWidgetRef.current && locationInputRef.current) {
      try {
        autocompleteWidgetRef.current = new google.maps.places.Autocomplete(
          locationInputRef.current,
          {
            fields: ['address_components', 'formatted_address', 'geometry', 'place_id', 'name'],
          }
        )

        autocompleteWidgetRef.current.addListener('place_changed', () => {
          const place = autocompleteWidgetRef.current.getPlace()
          if (place && place.place_id) {
            handlePlaceSelect(place.place_id, place)
          } else if (place) {
            const userInput = locationInputRef.current?.value || ''
            const address = userInput || place.formatted_address || place.name || ''
            let lat: number | undefined
            let lng: number | undefined
            if (place.geometry?.location) {
              const location = place.geometry.location
              lat = typeof location.lat === 'function' ? location.lat() : location.lat
              lng = typeof location.lng === 'function' ? location.lng() : location.lng
            }
            handleAddTypedLocation(address, lat, lng)
          }
        })
      } catch (error) {
        console.warn('Failed to initialize Autocomplete widget:', error)
      }
    }
  }

  useEffect(() => {
    if (circleRef.current && currentLocation) {
      circleRef.current.setRadius(radius * 1000)
    }
  }, [radius, currentLocation])

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return

    const google = window.google
    const defaultCenter = currentLocation
      ? { lat: currentLocation.lat, lng: currentLocation.lng }
      : { lat: 0, lng: 0 }

    mapInstanceRef.current = new google.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: currentLocation ? getZoomLevel(radius) : 2,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      streetViewControl: false,
      fullscreenControl: true,
    })

    mapInstanceRef.current.addListener('click', (event: any) => {
      const lat = event.latLng.lat()
      const lng = event.latLng.lng()
      handleMapClick(lat, lng)
    })

    if (currentLocation) {
      drawLocationOnMap(currentLocation)
    }
  }

  const handleMapClick = (lat: number, lng: number) => {
    setLocationInput('')
    setShowSuggestions(false)
    setAutocompleteSuggestions([])
    setMapError(null)

    const google = window.google
    if (google?.maps) {
      const geocoder = new google.maps.Geocoder()
      geocoder.geocode({ location: { lat, lng } }, (results: any[], status: string) => {
        if (status === 'OK' && results && results.length > 0) {
          const address = results[0].formatted_address
          const location: LocationTarget = {
            lat,
            lng,
            radius,
            address,
            type: 'map',
          }
          setCurrentLocation(location)
          setLocationInput(address)
          drawLocationOnMap(location)
        } else {
          const address = `${lat.toFixed(6)}, ${lng.toFixed(6)}`
          const location: LocationTarget = {
            lat,
            lng,
            radius,
            address,
            type: 'map',
          }
          setCurrentLocation(location)
          setLocationInput(address)
          drawLocationOnMap(location)
        }
      })
    } else {
      const address = `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      const location: LocationTarget = {
        lat,
        lng,
        radius,
        address,
        type: 'map',
      }
      setCurrentLocation(location)
      setLocationInput(address)
      if (mapInstanceRef.current) {
        drawLocationOnMap(location)
      }
    }
  }

  const getZoomLevel = (radiusKm: number): number => {
    if (radiusKm <= 1) return 14
    if (radiusKm <= 5) return 12
    if (radiusKm <= 25) return 10
    if (radiusKm <= 50) return 9
    if (radiusKm <= 100) return 8
    if (radiusKm <= 500) return 7
    return 6
  }

  const drawLocationOnMap = (location: LocationTarget) => {
    if (!mapInstanceRef.current || !window.google) return
    if (!location.lat || !location.lng || !location.radius) return

    const google = window.google
    const center = { lat: location.lat, lng: location.lng }

    mapInstanceRef.current.setCenter(center)
    mapInstanceRef.current.setZoom(getZoomLevel(location.radius))

    if (circleRef.current) {
      circleRef.current.setMap(null)
    }
    if (markerRef.current) {
      markerRef.current.setMap(null)
    }

    circleRef.current = new google.maps.Circle({
      strokeColor: '#3B82F6',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#3B82F6',
      fillOpacity: 0.15,
      map: mapInstanceRef.current,
      center: center,
      radius: location.radius * 1000,
    })

    markerRef.current = new google.maps.Marker({
      position: center,
      map: mapInstanceRef.current,
      title: location.address,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#3B82F6',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2,
      },
    })
  }

  const getCurrentLocation = () => {
    if (!('geolocation' in navigator)) {
      setMapError('Geolocation is not supported by your browser')
      return
    }

    setLocationInput('')
    setShowSuggestions(false)
    setAutocompleteSuggestions([])
    setIsGettingLocation(true)
    setMapError(null)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        const lat = latitude
        const lng = longitude

        const google = window.google
        if (google?.maps) {
          const geocoder = new google.maps.Geocoder()
          geocoder.geocode({ location: { lat, lng } }, (results: any[], status: string) => {
            setIsGettingLocation(false)
            if (status === 'OK' && results && results.length > 0) {
              const address = results[0].formatted_address
              const location: LocationTarget = {
                lat,
                lng,
                radius,
                address,
                type: 'map',
              }
              setCurrentLocation(location)
              setLocationInput(address)
              drawLocationOnMap(location)
            } else {
              const address = `${lat.toFixed(6)}, ${lng.toFixed(6)}`
              const location: LocationTarget = {
                lat,
                lng,
                radius,
                address,
                type: 'map',
              }
              setCurrentLocation(location)
              setLocationInput(address)
              drawLocationOnMap(location)
            }
          })
        } else {
          setIsGettingLocation(false)
          const address = `${lat.toFixed(6)}, ${lng.toFixed(6)}`
          const location: LocationTarget = {
            lat,
            lng,
            radius,
            address,
            type: 'map',
          }
          setCurrentLocation(location)
          setLocationInput(address)
          if (mapInstanceRef.current) {
            drawLocationOnMap(location)
          }
        }
      },
      (error) => {
        setIsGettingLocation(false)
        setMapError('Failed to get your location. Please enable location permissions.')
        console.error('Geolocation error:', error)
      }
    )
  }

  const handleAddLocation = () => {
    if (!currentLocation) {
      setMapError('Please select a location first')
      return
    }

    const newLocations = [...locations, currentLocation]
    onChange({ locations: newLocations })
    setCurrentLocation(null)
    setLocationInput('')
    setRadius(50)

    if (circleRef.current) {
      circleRef.current.setMap(null)
      circleRef.current = null
    }
    if (markerRef.current) {
      markerRef.current.setMap(null)
      markerRef.current = null
    }
  }

  const handleRemoveLocation = (index: number) => {
    const newLocations = locations.filter((_, i) => i !== index)
    if (newLocations.length === 0) {
      onChange(null)
    } else {
      onChange({ locations: newLocations })
    }
  }

  const handleRadiusChange = (newRadius: number) => {
    setRadius(newRadius)
    if (currentLocation) {
      const updatedLocation = { ...currentLocation, radius: newRadius }
      setCurrentLocation(updatedLocation)
      drawLocationOnMap(updatedLocation)
    }
  }

  const handleLocationInputChange = (value: string) => {
    setLocationInput(value)
    setShowSuggestions(value.length > 2)

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (!value.trim()) {
      setAutocompleteSuggestions([])
      setShowSuggestions(false)
      return
    }

    if (value.length > 2 && autocompleteServiceRef.current) {
      debounceTimerRef.current = setTimeout(() => {
        autocompleteServiceRef.current.getPlacePredictions(
          {
            input: value.trim(),
            types: ['(regions)'],
          },
          (predictions: any[] | null, status: string) => {
            if (status === 'OK' && predictions && predictions.length > 0) {
              setAutocompleteSuggestions(predictions)
              setShowSuggestions(true)
            } else if (status !== 'OK' && status !== 'ZERO_RESULTS') {
              autocompleteServiceRef.current.getPlacePredictions(
                {
                  input: value.trim(),
                },
                (allPredictions: any[] | null, allStatus: string) => {
                  if (allStatus === 'OK' && allPredictions && allPredictions.length > 0) {
                    setAutocompleteSuggestions(allPredictions)
                    setShowSuggestions(true)
                  } else {
                    setAutocompleteSuggestions([])
                    setShowSuggestions(false)
                  }
                }
              )
            } else {
              setAutocompleteSuggestions([])
              setShowSuggestions(false)
            }
          }
        )
      }, 300)
    } else {
      setAutocompleteSuggestions([])
      setShowSuggestions(false)
    }
  }

  const handlePlaceSelect = async (placeId: string, place?: any) => {
    const selectedPrediction = autocompleteSuggestions.find(p => p.place_id === placeId)
    const selectedDescription = selectedPrediction?.description || locationInput

    if (window.google?.maps?.places && placesServiceRef.current) {
      placesServiceRef.current.getDetails(
        { placeId, fields: ['geometry', 'formatted_address', 'address_components', 'name'] },
        (placeDetails: any, status: string) => {
          if (status === 'OK' && placeDetails) {
            const geometry = placeDetails.geometry
            let lat: number | undefined
            let lng: number | undefined

            if (geometry?.location) {
              const location = geometry.location
              lat = typeof location.lat === 'function' ? location.lat() : location.lat
              lng = typeof location.lng === 'function' ? location.lng() : location.lng
            }

            const address = selectedDescription || placeDetails.formatted_address || placeDetails.name || ''
            handleAddTypedLocation(address, lat, lng, geometry?.viewport)
          } else {
            handleAddTypedLocation(selectedDescription)
          }
        }
      )
    } else {
      handleAddTypedLocation(selectedDescription)
    }
  }

  const handleAddTypedLocation = (address: string, lat?: number, lng?: number, viewport?: any) => {
    if (!address.trim()) return

    const isDuplicate = locations.some(
      (loc) => loc.address.toLowerCase().trim() === address.toLowerCase().trim()
    )
    if (isDuplicate) {
      setMapError('This location is already added')
      setTimeout(() => setMapError(null), 3000)
      return
    }

    const locationTarget: LocationTarget = {
      address: address.trim(),
      type: 'text',
      ...(lat && lng && { lat, lng }),
    }

    const newLocations = [...locations, locationTarget]
    onChange({ locations: newLocations })
    setLocationInput('')
    setShowSuggestions(false)
    setMapError(null)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <FaMapMarkerAlt className="text-blue-600 dark:text-blue-400 flex-shrink-0 h-4 w-4 sm:h-5 sm:w-5" />
          <h2 className="text-base sm:text-xl font-semibold text-gray-900 dark:text-white truncate">
            Audience Targeting (Optional)
          </h2>
          {locations.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-xs font-medium flex-shrink-0">
              {locations.length} location{locations.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {isExpanded ? (
          <FaChevronUp className="text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2 h-4 w-4 sm:h-5 sm:w-5" />
        ) : (
          <FaChevronDown className="text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2 h-4 w-4 sm:h-5 sm:w-5" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Target specific locations for your campaign. Type locations (countries, cities) or use the map to select a precise location with radius.
          </p>

          {locations.filter(loc => loc.type === 'text' || !loc.type).length > 0 && (
            <div className="space-y-2">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                Selected Locations ({locations.filter(loc => loc.type === 'text' || !loc.type).length})
              </label>
              <div className="space-y-2">
                {locations
                  .filter(loc => loc.type === 'text' || !loc.type)
                  .map((location) => {
                    const actualIndex = locations.findIndex(loc => loc === location)
                    return (
                      <div
                        key={actualIndex}
                        className="flex items-start justify-between p-2 sm:p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <FaMapMarkerAlt className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                            <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                              {location.address}
                            </span>
                          </div>
                          {location.lat && location.lng && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 ml-5 sm:ml-6 break-words">
                              Location coordinates: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                            </p>
                          )}
                          {!location.lat && !location.lng && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 ml-5 sm:ml-6">
                              Text-based location
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveLocation(actualIndex)}
                          className="ml-2 p-1.5 sm:p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors flex-shrink-0"
                          aria-label="Remove location"
                        >
                          <FaTimes className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}

          <div className="space-y-2 sm:space-y-3">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
              Add Locations (Countries, Cities, Continents)
            </label>

            <div className="relative">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3 sm:h-4 sm:w-4" />
                <input
                  ref={locationInputRef}
                  type="text"
                  value={locationInput}
                  onChange={(e) => {
                    const newValue = e.target.value
                    setLocationInput(newValue)
                    if (isMapLoaded) {
                      handleLocationInputChange(newValue)
                    }
                  }}
                  onFocus={() => {
                    if (locationInput && isMapLoaded) {
                      handleLocationInputChange(locationInput)
                    }
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowSuggestions(false), 300)
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && locationInput.trim() && !showSuggestions) {
                      e.preventDefault()
                      handleAddTypedLocation(locationInput.trim())
                    }
                  }}
                  className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Type location (e.g., Kenya, Africa, New York, Nairobi)"
                />
              </div>

              {showSuggestions && autocompleteSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl max-h-48 sm:max-h-60 overflow-y-auto">
                  {autocompleteSuggestions.map((prediction) => (
                    <button
                      key={prediction.place_id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        void handlePlaceSelect(prediction.place_id)
                        setShowSuggestions(false)
                      }}
                      onTouchStart={(e) => {
                        e.preventDefault()
                        void handlePlaceSelect(prediction.place_id)
                        setShowSuggestions(false)
                      }}
                      className="w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-700 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 last:border-b-0 transition-colors touch-manipulation"
                    >
                      <div className="flex items-center gap-2">
                        <FaMapMarkerAlt className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                            {prediction.structured_formatting.main_text}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {prediction.structured_formatting.secondary_text}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Type and select locations to add them. Multiple locations can be added. Locations are geocoded for partner filtering.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
            <span className="text-xs text-gray-500 dark:text-gray-400">OR</span>
            <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
          </div>

          <div className="space-y-2 sm:space-y-3">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
              Precise Location with Radius (Map-based)
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Click anywhere on the map to select a location, or use the button below to use your current location. Adjust the radius slider to set your targeting area.
            </p>

            <button
              type="button"
              onClick={getCurrentLocation}
              disabled={isGettingLocation || !isMapLoaded}
              className="w-full px-4 py-2.5 sm:py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm touch-manipulation"
            >
              <FaLocationArrow className={isGettingLocation ? 'animate-spin' : 'h-3 w-3 sm:h-4 sm:w-4'} />
              {isGettingLocation ? 'Getting Location...' : 'Use Current Location'}
            </button>

            {mapError && (
              <div className="p-2.5 sm:p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                <p className="text-xs sm:text-sm text-red-800 dark:text-red-200">{mapError}</p>
              </div>
            )}

            <div
              ref={mapRef}
              className="w-full h-48 sm:h-64 rounded-lg border-2 border-gray-300 dark:border-gray-600 overflow-hidden touch-pan-x touch-pan-y"
              style={{ minHeight: '192px' }}
            />

            {currentLocation && (
              <div className="space-y-2 sm:space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="p-2.5 sm:p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                  <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                    <FaMapMarkerAlt className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white break-words">
                      {currentLocation.address}
                    </span>
                  </div>
                  {currentLocation.radius && currentLocation.lat && currentLocation.lng && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 ml-5 sm:ml-6 break-words">
                      Radius: {currentLocation.radius} km • {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                      Target Radius
                    </label>
                    <span className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {radius} km
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="500"
                    value={radius}
                    onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
                    className="w-full h-2.5 sm:h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600 touch-manipulation"
                    style={{
                      background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${((radius - 1) / 499) * 100}%, #E5E7EB ${((radius - 1) / 499) * 100}%, #E5E7EB 100%)`,
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>1 km</span>
                    <span>250 km</span>
                    <span>500 km</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddLocation}
                  className="w-full px-4 py-2.5 sm:py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm touch-manipulation"
                >
                  <FaMapMarkerAlt className="h-3 w-3 sm:h-4 sm:w-4" />
                  Add This Location
                </button>
              </div>
            )}

            {locations.filter(loc => loc.type === 'map').length > 0 && (
              <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                  Map-based Locations ({locations.filter(loc => loc.type === 'map').length})
                </label>
                <div className="space-y-2">
                  {locations
                    .filter(loc => loc.type === 'map')
                    .map((location) => {
                      const actualIndex = locations.findIndex(loc => loc === location)
                      return (
                        <div
                          key={actualIndex}
                          className="flex items-start justify-between p-2 sm:p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <FaMapMarkerAlt className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                              <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                                {location.address}
                              </span>
                            </div>
                            {location.radius && location.lat && location.lng && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 ml-5 sm:ml-6 break-words">
                                Radius: {location.radius} km • {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveLocation(actualIndex)}
                            className="ml-2 p-1.5 sm:p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors flex-shrink-0"
                            aria-label="Remove location"
                          >
                            <FaTimes className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
                          </button>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default AudienceTargetingForm
