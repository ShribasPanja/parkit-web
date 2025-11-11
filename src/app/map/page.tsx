"use client";

import { useEffect, useState, useCallback, useMemo, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import Image from "next/image";

import { MapView } from "@/components/map/MapView";
import { PlacesAutocomplete } from "@/components/ui/PlacesAutocomplete";
import { MapNavbar } from "@/components/layout/MapNavbar";
import { ReserveSpotModal } from "@/components/modals/ReserveSpotModal";

interface Place {
  id: string;
  lat: number;
  lng: number;
  name: string;
  type: "parking" | "charging";
  address?: string;
  description?: string;
  phone?: string;
  capacity?: number;
  availableSpots?: number;
  carSpots?: number;
  bikeSpots?: number;
  totalCarSpots?: number;
  totalBikeSpots?: number;
  availableCarSpots?: number;
  availableBikeSpots?: number;
  totalCarChargingSpots?: number;
  availableCarChargingSpots?: number;
  pricePerHour?: number;
  amenities?: string[];
  rating?: number;
  distance?: string;
  images?: string[];
  hasCharging?: boolean;
  hasCovered?: boolean;
}

type ViewMode = "list" | "details";

function MapPageContent() {
  const searchParams = useSearchParams();

  const [location, setLocation] = useState<string>("");
  const [mapCenter, setMapCenter] = useState<
    { lat: number; lng: number } | undefined
  >(undefined);
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [routeMode, setRouteMode] = useState<boolean>(false);
  const [routePolyline, setRoutePolyline] = useState<string>("");
  const [reserveModalOpen, setReserveModalOpen] = useState(false);

  // Debounce timer ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // AbortController for cancelling in-flight requests
  const abortControllerRef = useRef<AbortController | null>(null);

  // Memoize backend URL to avoid recreation
  const backendUrl = useMemo(
    () => process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000",
    []
  );

  // Memoize Google Maps API key
  const apiKey = useMemo(() => process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY, []);

  // Geocode place ID to coordinates (memoized with useCallback)
  const getCoordinatesFromPlaceId = useCallback(
    async (placeId: string): Promise<{ lat: number; lng: number } | null> => {
      try {
        if (!apiKey) return null;

        const response = await axios.get(
          `https://maps.googleapis.com/maps/api/geocode/json`,
          {
            params: {
              place_id: placeId,
              key: apiKey,
            },
          }
        );

        if (response.data.status === "OK" && response.data.results[0]) {
          const geocodedLocation = response.data.results[0].geometry.location;
          return { lat: geocodedLocation.lat, lng: geocodedLocation.lng };
        }
        return null;
      } catch (error) {
        console.error("Error geocoding place:", error);
        return null;
      }
    },
    [apiKey]
  );

  // Fetch places along route (memoized)
  const fetchPlacesAlongRoute = useCallback(
    async (encodedPolyline: string) => {
      try {
        const response = await axios.post(`${backendUrl}/map/along-route`, {
          encodedPolyline,
          bufferKm: 2,
          limit: 50,
        });

        const enhancedPlaces: Place[] = response.data.places.map(
          (place: {
            id: string;
            name: string;
            address: string | null;
            description: string | null;
            phone: string;
            rating: number;
            lat: number;
            lng: number;
            distanceFromRoute: number;
            pricePerHour: number;
            capacity: number;
            availableSpots: number;
            carSpots: number;
            bikeSpots: number;
            totalCarSpots: number;
            totalBikeSpots: number;
            availableCarSpots: number;
            availableBikeSpots: number;
            totalCarChargingSpots: number;
            availableCarChargingSpots: number;
            amenities: string[];
            images: string[];
            hasCharging: boolean;
            hasCovered: boolean;
          }) => ({
            id: place.id,
            name: place.name,
            lat: place.lat,
            lng: place.lng,
            type: place.hasCharging ? "charging" : "parking",
            address: place.address || "Address not available",
            description: place.description || undefined,
            phone: place.phone,
            rating: place.rating || 0,
            capacity: place.capacity,
            availableSpots: place.availableSpots,
            carSpots: place.carSpots,
            bikeSpots: place.bikeSpots,
            totalCarSpots: place.totalCarSpots,
            totalBikeSpots: place.totalBikeSpots,
            availableCarSpots: place.availableCarSpots,
            availableBikeSpots: place.availableBikeSpots,
            totalCarChargingSpots: place.totalCarChargingSpots,
            availableCarChargingSpots: place.availableCarChargingSpots,
            pricePerHour: place.pricePerHour,
            amenities: place.amenities,
            distance: `${place.distanceFromRoute.toFixed(1)} km from route`,
            images: place.images,
            hasCharging: place.hasCharging,
            hasCovered: place.hasCovered,
          })
        );

        setPlaces(enhancedPlaces);
      } catch (error) {
        console.error("Error fetching places along route:", error);
      } finally {
        setLoading(false);
      }
    },
    [backendUrl]
  );

  // Wait for Google Maps to load (optimized)
  const waitForGoogleMaps = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      if (window.google?.maps) {
        resolve();
      } else {
        const checkInterval = setInterval(() => {
          if (window.google?.maps) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
        // Add timeout to prevent infinite loop
        setTimeout(() => clearInterval(checkInterval), 10000);
      }
    });
  }, []);

  // Handle route search (memoized)
  const handleRouteSearch = useCallback(
    async (startPlaceId: string, destPlaceId: string) => {
      try {
        setLoading(true);

        await waitForGoogleMaps();

        // Get coordinates for both places in parallel
        const [startCoords, destCoords] = await Promise.all([
          getCoordinatesFromPlaceId(startPlaceId),
          getCoordinatesFromPlaceId(destPlaceId),
        ]);

        if (!startCoords || !destCoords) {
          console.error("Failed to get coordinates");
          setLoading(false);
          return;
        }

        // Use Google Maps Directions Service
        const directionsService = new google.maps.DirectionsService();

        directionsService.route(
          {
            origin: startCoords,
            destination: destCoords,
            travelMode: google.maps.TravelMode.DRIVING,
          },
          async (result, status) => {
            if (status === "OK" && result) {
              // Get the overview polyline
              const encodedPolyline = result.routes[0].overview_polyline;
              setRoutePolyline(encodedPolyline);

              // Set map center to midpoint of route
              const bounds = new google.maps.LatLngBounds();
              bounds.extend(startCoords);
              bounds.extend(destCoords);
              const center = bounds.getCenter();
              setMapCenter({ lat: center.lat(), lng: center.lng() });

              // Fetch places along route
              await fetchPlacesAlongRoute(encodedPolyline);
            } else {
              console.error("Directions request failed:", status);
              setLoading(false);
            }
          }
        );
      } catch (error) {
        console.error("Error in route search:", error);
        setLoading(false);
      }
    },
    [waitForGoogleMaps, getCoordinatesFromPlaceId, fetchPlacesAlongRoute]
  );

  useEffect(() => {
    const mode = searchParams.get("mode");
    const placeIdParam = searchParams.get("placeId");
    const locationParam = searchParams.get("location");
    const startPlaceId = searchParams.get("startPlaceId");
    const destinationPlaceId = searchParams.get("destinationPlaceId");
    const start = searchParams.get("start");
    const destination = searchParams.get("destination");

    if (mode === "route" && startPlaceId && destinationPlaceId) {
      // Route mode
      setLoading(true);
      setRouteMode(true);
      setLocation(`${start} → ${destination}`);
      handleRouteSearch(startPlaceId, destinationPlaceId);
    } else if (placeIdParam && locationParam) {
      // Normal location search
      setLoading(true);
      setRouteMode(false);
      setLocation(locationParam);
      getCoordinatesFromPlaceId(placeIdParam).then((coords) => {
        if (coords) {
          setMapCenter(coords);
          fetchNearbyPlaces(coords.lat, coords.lng);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, handleRouteSearch, getCoordinatesFromPlaceId]);

  // Fetch nearby places (memoized with request cancellation)
  const fetchNearbyPlaces = useCallback(
    async (lat: number, lng: number, radiusKm: number = 10) => {
      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new AbortController for this request
      abortControllerRef.current = new AbortController();

      setLoading(true);
      try {
        const response = await axios.get(`${backendUrl}/map/nearby`, {
          params: {
            lat,
            lng,
            radiusKm,
            limit: 50,
          },
          signal: abortControllerRef.current.signal,
        });

        const enhancedPlaces: Place[] = response.data.places.map(
          (place: {
            id: string;
            name: string;
            address: string | null;
            description: string | null;
            phone: string;
            rating: number;
            lat: number;
            lng: number;
            distanceKm: number;
            pricePerHour: number;
            capacity: number;
            availableSpots: number;
            carSpots: number;
            bikeSpots: number;
            totalCarSpots: number;
            totalBikeSpots: number;
            availableCarSpots: number;
            availableBikeSpots: number;
            totalCarChargingSpots: number;
            availableCarChargingSpots: number;
            amenities: string[];
            images: string[];
            hasCharging: boolean;
            hasCovered: boolean;
          }) => ({
            id: place.id,
            name: place.name,
            lat: place.lat,
            lng: place.lng,
            type: place.hasCharging ? "charging" : "parking",
            address: place.address || "Address not available",
            description: place.description || undefined,
            phone: place.phone,
            rating: place.rating || 0,
            capacity: place.capacity,
            availableSpots: place.availableSpots,
            carSpots: place.carSpots,
            bikeSpots: place.bikeSpots,
            totalCarSpots: place.totalCarSpots,
            totalBikeSpots: place.totalBikeSpots,
            availableCarSpots: place.availableCarSpots,
            availableBikeSpots: place.availableBikeSpots,
            totalCarChargingSpots: place.totalCarChargingSpots,
            availableCarChargingSpots: place.availableCarChargingSpots,
            pricePerHour: place.pricePerHour,
            amenities: place.amenities,
            distance: `${place.distanceKm.toFixed(1)} km`,
            images: place.images,
            hasCharging: place.hasCharging,
            hasCovered: place.hasCovered,
          })
        );

        setPlaces(enhancedPlaces);
      } catch (error) {
        // Ignore abort errors (they're expected when cancelling)
        if (axios.isCancel(error)) {
          console.log("Request cancelled:", error.message);
        } else {
          console.error("Error fetching nearby places:", error);
        }
      } finally {
        setLoading(false);
      }
    },
    [backendUrl]
  );

  // Function to refresh places data
  const refreshPlaces = useCallback(() => {
    if (mapCenter) {
      fetchNearbyPlaces(mapCenter.lat, mapCenter.lng);
    }
  }, [mapCenter, fetchNearbyPlaces]);

  // Handle location select (memoized)
  const handleLocationSelect = useCallback(
    async (value: string, placeId?: string) => {
      setLocation(value);
      if (placeId) {
        const coords = await getCoordinatesFromPlaceId(placeId);
        if (coords) {
          setMapCenter(coords);
          await fetchNearbyPlaces(coords.lat, coords.lng);
        }
      }
    },
    [getCoordinatesFromPlaceId, fetchNearbyPlaces]
  );

  // Debounced bounds change handler (with actual debouncing)
  const handleBoundsChange = useCallback(
    async (bounds: {
      ne: { lat: number; lng: number };
      sw: { lat: number; lng: number };
    }) => {
      // Clear previous timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new timer to debounce API calls
      debounceTimerRef.current = setTimeout(async () => {
        // Calculate center of bounds
        const centerLat = (bounds.ne.lat + bounds.sw.lat) / 2;
        const centerLng = (bounds.ne.lng + bounds.sw.lng) / 2;

        // Calculate approximate radius from center to corner
        const R = 6371; // Earth's radius in km
        const dLat = ((bounds.ne.lat - centerLat) * Math.PI) / 180;
        const dLng = ((bounds.ne.lng - centerLng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((centerLat * Math.PI) / 180) *
            Math.cos((bounds.ne.lat * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const radiusKm = Math.ceil(R * c);

        await fetchNearbyPlaces(centerLat, centerLng, Math.max(radiusKm, 5));
      }, 500); // 500ms debounce delay
    },
    [fetchNearbyPlaces]
  );

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Handle place click (memoized)
  const handlePlaceClick = useCallback((place: Place) => {
    setSelectedPlace(place);
    setViewMode("details");
    setMapCenter({ lat: place.lat, lng: place.lng });
  }, []);

  // Handle marker click (memoized)
  const handleMarkerClick = useCallback(
    (placeId: string) => {
      const place = places.find((p) => p.id === placeId);
      if (place) {
        handlePlaceClick(place);
      }
    },
    [places, handlePlaceClick]
  );

  // Handle back to list (memoized)
  const handleBackToList = useCallback(() => {
    setViewMode("list");
    setSelectedPlace(null);
  }, []);

  // Handle get directions (memoized)
  const handleGetDirections = useCallback((place: Place) => {
    const destination = `${place.lat},${place.lng}`;
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
    window.open(mapsUrl, "_blank");
  }, []);

  // Memoize markers array to prevent unnecessary re-renders
  const mapMarkers = useMemo(
    () =>
      places.map((place) => ({
        id: place.id,
        lat: place.lat,
        lng: place.lng,
        name: place.name,
        type: place.type,
        pricePerHour: place.pricePerHour,
      })),
    [places]
  );

  return (
    <div className="flex h-screen w-full flex-col bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <MapNavbar />

      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        <aside className="relative z-20 flex w-full md:max-w-md lg:max-w-xl flex-col border-r border-slate-200/80 bg-white/80 backdrop-blur-xl shadow-lg shadow-slate-900/5 max-h-[40vh] md:max-h-none">
          {/* Search Bar at top of sidebar */}
          <div className="border-b border-slate-200/50 bg-white/95 backdrop-blur-xl px-4 md:px-6 py-4">
            <PlacesAutocomplete
              placeholder="Search neighbourhoods, landmarks, or postcodes..."
              value={location}
              onChange={handleLocationSelect}
            />
          </div>

          <div className="flex-1 overflow-hidden bg-gradient-to-b from-transparent to-slate-50/30">
            <div className="h-full w-full overflow-y-auto px-4 md:px-6 pb-6 md:pb-8 scrollbar-hide">
              {viewMode === "list" ? (
                <div className="space-y-3 pt-5">
                  {places.length === 0 ? (
                    <div className="flex h-[60vh] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white p-10 text-center shadow-sm">
                      <div className="rounded-full bg-gradient-to-br from-emerald-50 to-teal-50 p-5">
                        <svg
                          className="h-12 w-12 text-emerald-500"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <path
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                      <div className="mt-6 space-y-2">
                        <p className="text-base font-bold text-slate-900">
                          Discover parking & charging spots
                        </p>
                        <p className="max-w-sm text-sm leading-relaxed text-slate-600">
                          Search for any location or move around the map to find
                          available spots.
                        </p>
                      </div>
                    </div>
                  ) : (
                    places.map((place) => (
                      <button
                        key={place.id}
                        onClick={() => handlePlaceClick(place)}
                        className="group w-full overflow-hidden rounded-xl border border-slate-200/80 bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-500/10"
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={`mt-0.5 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border-2 text-base font-bold shadow-md transition-transform duration-200 group-hover:scale-105 ${
                              place.type === "parking"
                                ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600 shadow-emerald-500/20"
                                : "border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 shadow-blue-500/20"
                            }`}
                          >
                            {place.type === "parking" ? "P" : "⚡"}
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col gap-2">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <h3 className="text-base font-bold text-slate-900 transition-colors group-hover:text-emerald-600">
                                  {place.name}
                                </h3>
                                <p className="mt-0.5 truncate text-xs text-slate-500">
                                  {place.address}
                                </p>
                              </div>
                              <span className="flex-shrink-0 rounded-full bg-gradient-to-br from-slate-50 to-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 shadow-sm">
                                {place.distance}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-xs">
                              <span className="flex items-center gap-1 font-semibold text-amber-500">
                                <svg
                                  className="h-3.5 w-3.5"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                  aria-hidden
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                {place.rating}
                              </span>
                              <span className="text-slate-300">•</span>
                              <span
                                className={`font-bold ${
                                  (place.availableSpots || 0) > 20
                                    ? "text-emerald-600"
                                    : "text-orange-500"
                                }`}
                              >
                                {place.availableSpots}/{place.capacity}
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="font-bold text-slate-900">
                                ${place.pricePerHour}
                                <span className="font-normal text-slate-500">
                                  /hr
                                </span>
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                              {(place.amenities || [])
                                .slice(0, 3)
                                .map((amenity) => (
                                  <span
                                    key={amenity}
                                    className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600"
                                  >
                                    {amenity}
                                  </span>
                                ))}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              ) : (
                selectedPlace && (
                  <div className="space-y-5 pt-5">
                    <button
                      onClick={handleBackToList}
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-emerald-600"
                    >
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          d="M15 6l-6 6 6 6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Back to results
                    </button>

                    <section className="space-y-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-900/5">
                      {/* Image Slider - Only show if images exist */}
                      {selectedPlace.images &&
                        selectedPlace.images.length > 0 && (
                          <div className="relative -mx-6 -mt-6 mb-6 overflow-hidden rounded-t-2xl">
                            <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-200">
                              <Image
                                src={selectedPlace.images[0]}
                                alt={selectedPlace.name}
                                fill
                                className="object-cover"
                                onError={(e) => {
                                  e.currentTarget.src =
                                    'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200"><rect fill="%23e2e8f0" width="400" height="200"/><text x="50%" y="50%" fill="%2394a3b8" font-family="system-ui" font-size="16" text-anchor="middle" dominant-baseline="middle">No Image Available</text></svg>';
                                }}
                              />
                              {selectedPlace.images.length > 1 && (
                                <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/70 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-white">
                                  <svg
                                    className="h-3.5 w-3.5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <rect
                                      x="3"
                                      y="3"
                                      width="18"
                                      height="18"
                                      rx="2"
                                      ry="2"
                                    />
                                    <circle cx="8.5" cy="8.5" r="1.5" />
                                    <polyline points="21 15 16 10 5 21" />
                                  </svg>
                                  +{selectedPlace.images.length - 1} photos
                                </div>
                              )}
                              {/* Rating Badge */}
                              {selectedPlace.rating &&
                                selectedPlace.rating > 0 && (
                                  <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1.5 text-sm font-bold text-white shadow-lg">
                                    <svg
                                      className="h-4 w-4"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                    {selectedPlace.rating.toFixed(1)}
                                  </div>
                                )}
                            </div>
                          </div>
                        )}

                      <div className="flex items-start gap-4">
                        <div
                          className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border-2 text-lg font-bold shadow-lg ${
                            selectedPlace.type === "parking"
                              ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600 shadow-emerald-500/20"
                              : "border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 shadow-blue-500/20"
                          }`}
                        >
                          {selectedPlace.type === "parking" ? "P" : "⚡"}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <h2 className="text-xl font-bold text-slate-900">
                              {selectedPlace.name}
                            </h2>
                            {selectedPlace.rating &&
                              selectedPlace.rating > 0 &&
                              !selectedPlace.images?.length && (
                                <div className="flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 border border-amber-200">
                                  <svg
                                    className="h-4 w-4 text-amber-500"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                  <span className="text-sm font-bold text-amber-700">
                                    {selectedPlace.rating.toFixed(1)}
                                  </span>
                                </div>
                              )}
                          </div>
                          <p className="text-sm text-slate-600">
                            {selectedPlace.address}
                          </p>
                          {selectedPlace.phone && (
                            <p className="text-sm text-slate-500">
                              📞 {selectedPlace.phone}
                            </p>
                          )}
                        </div>
                      </div>

                      {selectedPlace.description && (
                        <div className="rounded-xl border border-slate-200/80 bg-gradient-to-br from-blue-50 to-slate-50 p-4 shadow-sm">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                            About This Location
                          </h3>
                          <p className="text-sm text-slate-700 leading-relaxed">
                            {selectedPlace.description}
                          </p>
                        </div>
                      )}

                      {/* Quick Info */}
                      <div className="flex flex-wrap items-center gap-4 text-xs">
                        <span className="font-semibold text-slate-600">
                          📍 {selectedPlace.distance} away
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="font-semibold text-slate-600">
                          {(selectedPlace.availableSpots || 0) > 20
                            ? "✅ Great"
                            : "⚠️ Limited"}{" "}
                          availability
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm">
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Hourly Rate
                          </p>
                          <p className="mt-3 text-2xl font-bold text-slate-900">
                            ${selectedPlace.pricePerHour}
                            <span className="ml-1 text-sm font-medium text-slate-500">
                              /hr
                            </span>
                          </p>
                        </div>
                        <div className="rounded-xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm">
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Total Capacity
                          </p>
                          <p className="mt-3 text-2xl font-bold text-slate-900">
                            {selectedPlace.capacity}
                            <span className="ml-1 text-sm font-medium text-slate-500">
                              spots
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Amenities & Features
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                          {(selectedPlace.amenities || []).map((amenity) => (
                            <span
                              key={amenity}
                              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm"
                            >
                              {amenity}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="grid gap-3 border-t border-slate-200/80 pt-5">
                        <button
                          onClick={() => handleGetDirections(selectedPlace)}
                          className="group w-full rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-emerald-500/40"
                        >
                          <span className="flex items-center justify-center gap-2">
                            <svg
                              className="h-4 w-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path
                                d="M9 11l3 3L22 4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            Get Directions
                          </span>
                        </button>
                        <button
                          onClick={() => setReserveModalOpen(true)}
                          className="w-full rounded-xl border-2 border-slate-300 py-3 text-sm font-bold text-slate-700 transition-all duration-200 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700"
                        >
                          Reserve Spot
                        </button>
                      </div>
                    </section>
                  </div>
                )
              )}
            </div>
          </div>
        </aside>

        <main className="relative flex-1 p-3 md:p-6 lg:p-8">
          <div className="absolute inset-3 md:inset-6 bg-gradient-to-br from-slate-100 via-slate-50 to-white rounded-xl md:rounded-2xl overflow-hidden shadow-lg">
            <MapView
              initialCenter={mapCenter}
              onBoundsChange={handleBoundsChange}
              onMarkerClick={handleMarkerClick}
              markers={mapMarkers}
              routePolyline={routeMode ? routePolyline : undefined}
            />
          </div>
        </main>
      </div>

      {/* Full-screen loading overlay */}
      {loading && places.length === 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-6 p-8">
            {/* Animated logo/icon */}
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 opacity-20 blur-2xl animate-pulse"></div>
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 shadow-2xl shadow-emerald-500/40">
                <svg
                  className="h-12 w-12 text-white animate-bounce"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <text x="4" y="18" fontSize="16" fontWeight="bold">
                    P
                  </text>
                </svg>
              </div>
            </div>

            {/* Loading text */}
            <div className="text-center">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">
                {routeMode
                  ? "Planning your route..."
                  : "Finding parking spots..."}
              </h3>
              <p className="text-sm text-slate-600 max-w-md">
                {routeMode
                  ? "Calculating the best route and finding parking spots along the way"
                  : "Searching for the best parking and charging options nearby"}
              </p>
            </div>

            {/* Animated progress bar */}
            <div className="w-64 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-[loading_1.5s_ease-in-out_infinite]"></div>
            </div>

            {/* Loading steps */}
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span>Loading map</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div
                  className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <span>Fetching data</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div
                  className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"
                  style={{ animationDelay: "0.4s" }}
                ></div>
                <span>Preparing results</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reserve Spot Modal */}
      {selectedPlace && (
        <ReserveSpotModal
          open={reserveModalOpen}
          onClose={() => setReserveModalOpen(false)}
          landOwnerId={selectedPlace.id}
          landOwnerName={selectedPlace.name}
          address={selectedPlace.address || "Address not available"}
          pricePerHour={selectedPlace.pricePerHour || 0}
          onSuccess={refreshPlaces}
        />
      )}
    </div>
  );
}

export default function MapPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-slate-50">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-emerald-500 border-r-transparent"></div>
            <p className="mt-4 text-slate-600">Loading map...</p>
          </div>
        </div>
      }
    >
      <MapPageContent />
    </Suspense>
  );
}
