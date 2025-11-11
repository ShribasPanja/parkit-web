"use client";

import { useEffect, useRef, useState } from "react";

/**
 * PlacesAutocomplete component
 *
 * Provides Google Places API autocomplete functionality for location inputs
 * using the modern AutocompleteSuggestion API (Places API New).
 * Shows suggestions in a dropdown below the input field as users type.
 *
 * Requirements:
 * - NEXT_PUBLIC_GOOGLE_MAPS_API_KEY must be set in .env.local
 * - Google Maps Places API must be enabled in Google Cloud Console
 *
 * @example
 * <PlacesAutocomplete
 *   label="Location"
 *   placeholder="Enter a city or address"
 *   value={location}
 *   onChange={(value, placeId) => {
 *     setLocation(value);
 *     setPlaceId(placeId);
 *   }}
 *   required
 * />
 */

interface PlacesAutocompleteProps {
  value: string;
  onChange: (value: string, placeId?: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
}

let isGoogleMapsLoaded = false;
let loadingPromise: Promise<void> | null = null;

const loadGoogleMapsScript = (apiKey: string): Promise<void> => {
  if (isGoogleMapsLoaded) {
    return Promise.resolve();
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Window is not defined"));
      return;
    }

    if (window.google?.maps?.places) {
      isGoogleMapsLoaded = true;
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      // Wait for google.maps.places to be available
      const checkPlacesLoaded = () => {
        if (window.google?.maps?.places) {
          isGoogleMapsLoaded = true;
          resolve();
        } else {
          // Retry after a short delay
          setTimeout(checkPlacesLoaded, 100);
        }
      };
      checkPlacesLoaded();
    };

    script.onerror = () => {
      reject(new Error("Failed to load Google Maps script"));
    };

    document.head.appendChild(script);
  });

  return loadingPromise;
};

export function PlacesAutocomplete({
  value,
  onChange,
  placeholder,
  label,
  required = false,
}: PlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [suggestions, setSuggestions] = useState<
    google.maps.places.AutocompleteSuggestion[]
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    console.log("PlacesAutocomplete: Initializing...", {
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length,
    });

    if (!apiKey) {
      const errorMsg =
        "Google Maps API key is missing. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your .env.local file";
      console.error(errorMsg);
      setApiError(errorMsg);
      return;
    }

    loadGoogleMapsScript(apiKey)
      .then(() => {
        console.log(
          "PlacesAutocomplete: Script loaded, checking google.maps.places...",
          {
            hasGoogle: !!window.google,
            hasMaps: !!window.google?.maps,
            hasPlaces: !!window.google?.maps?.places,
          }
        );

        if (!window.google?.maps?.places) {
          throw new Error(
            "Google Maps Places library not available after loading"
          );
        }

        setIsApiLoaded(true);
        setApiError(null);
        console.log("PlacesAutocomplete: API loaded successfully");
      })
      .catch((error) => {
        const errorMsg =
          "Error loading Google Maps API. Check console for details.";
        console.error("Error loading Google Maps API:", error);
        setApiError(errorMsg);
      });
  }, []);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const fetchPredictions = async (input: string) => {
    if (!input || !isApiLoaded) {
      setSuggestions([]);
      setShowSuggestions(false);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const request = {
        input,
        includedPrimaryTypes: ["geocode"],
      };

      // Use the new AutocompleteSuggestion.fetchAutocompleteSuggestions method
      const { suggestions: fetchedSuggestions } =
        await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(
          request
        );

      setLoading(false);

      if (fetchedSuggestions && fetchedSuggestions.length > 0) {
        // Limit to top 5 suggestions
        setSuggestions(fetchedSuggestions.slice(0, 5));
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error("Error fetching autocomplete suggestions:", error);
      setLoading(false);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // If input is empty, clear suggestions immediately
    if (!newValue.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      setLoading(false);
      return;
    }

    // Show loading state immediately
    setLoading(true);

    // Debounce the API call - wait 300ms after user stops typing
    debounceTimerRef.current = setTimeout(() => {
      fetchPredictions(newValue);
    }, 300);
  };

  const handleSuggestionClick = (
    suggestion: google.maps.places.AutocompleteSuggestion,
    event: React.MouseEvent
  ) => {
    event.preventDefault();
    event.stopPropagation();

    // Get the main text for display
    const displayText = suggestion.placePrediction?.text?.text || "";
    const placeId = suggestion.placePrediction?.placeId || "";

    onChange(displayText, placeId);
    setShowSuggestions(false);
    setSuggestions([]);
    // Refocus the input after selection
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow click events to register
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  return (
    <div className="relative z-20">
      <label className="flex flex-col gap-2 text-sm">
        {label && <span className="text-slate-700">{label}</span>}
        <input
          ref={inputRef}
          type="text"
          required={required}
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onFocus={() =>
            value && suggestions.length > 0 && setShowSuggestions(true)
          }
          onBlur={handleBlur}
          autoComplete="off"
          className="rounded-2xl border border-transparent bg-slate-100 px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 transition-all duration-200 ease-out focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-100"
        />
      </label>

      {apiError && (
        <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <div className="flex items-start gap-2">
            <svg
              className="mt-0.5 h-4 w-4 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="font-semibold">Autocomplete unavailable</p>
              <p className="mt-0.5">You can still type addresses manually.</p>
            </div>
          </div>
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-[100] mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 ring-1 ring-slate-900/5">
          {suggestions.map((suggestion, index) => {
            const mainText = suggestion.placePrediction?.mainText?.text || "";
            const secondaryText =
              suggestion.placePrediction?.secondaryText?.text || "";
            const placeId = suggestion.placePrediction?.placeId || "";

            return (
              <li key={placeId || index}>
                <button
                  type="button"
                  onMouseDown={(e) => handleSuggestionClick(suggestion, e)}
                  className={`w-full px-4 py-3 text-left text-sm text-slate-700 transition-colors hover:bg-emerald-50 ${
                    index !== suggestions.length - 1
                      ? "border-b border-slate-100"
                      : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <svg
                      className="mt-0.5 h-5 w-5 flex-shrink-0 text-slate-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">
                        {mainText}
                      </div>
                      {secondaryText && (
                        <div className="text-xs text-slate-500">
                          {secondaryText}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {loading && value && !showSuggestions && (
        <div className="absolute z-[100] mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-2xl shadow-slate-900/10 ring-1 ring-slate-900/5">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <svg
              className="h-4 w-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Searching locations...</span>
          </div>
        </div>
      )}
    </div>
  );
}
