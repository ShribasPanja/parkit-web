"use client";

import { useEffect, useRef, useState } from "react";

interface MapViewProps {
  initialCenter?: { lat: number; lng: number };
  onBoundsChange?: (bounds: {
    ne: { lat: number; lng: number };
    sw: { lat: number; lng: number };
  }) => void;
  onMarkerClick?: (placeId: string) => void;
  markers?: Array<{
    id: string;
    lat: number;
    lng: number;
    name: string;
    type: "parking" | "charging";
    pricePerHour?: number;
  }>;
  routePolyline?: string; // Encoded polyline for route display
}

/**
 * MapView Component
 *
 * Displays a Google Map that:
 * 1. Centers on a location when initialCenter changes
 * 2. Fires onBoundsChange when the map stops moving (idle event)
 * 3. Shows markers for parking spots and charging stations
 *
 * Usage Flow:
 * - User selects location from autocomplete
 * - Parent passes new lat/lng to initialCenter
 * - Map centers on that location
 * - When map stops moving, idle event fires
 * - onBoundsChange callback sends visible bounds to parent
 * - Parent queries backend with bounding box
 * - Backend returns places within bounds
 * - Parent passes places as markers prop
 * - Map displays markers
 */
export function MapView({
  initialCenter,
  onBoundsChange,
  onMarkerClick,
  markers = [],
  routePolyline,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.OverlayView[]>([]);
  const activeInfoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const previousMarkerIdsRef = useRef<Set<string>>(new Set());
  const routePolylineRef = useRef<google.maps.Polyline | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error("Google Maps API key is missing");
      return;
    }

    // Wait for Google Maps to load
    const checkGoogleMaps = () => {
      if (window.google?.maps) {
        const map = new google.maps.Map(mapRef.current!, {
          center: initialCenter || { lat: 20, lng: 0 }, // Default: World view
          zoom: initialCenter ? 13 : 2,
          mapId: "parkit-map", // For advanced markers
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });

        mapInstanceRef.current = map;
        setIsLoaded(true);

        // Set up idle listener - fires when map stops moving (only after user interaction)
        let isFirstLoad = true;
        map.addListener("idle", () => {
          // Skip the first idle event (initial load)
          if (isFirstLoad) {
            isFirstLoad = false;
            return;
          }

          const bounds = map.getBounds();
          if (bounds && onBoundsChange) {
            const ne = bounds.getNorthEast();
            const sw = bounds.getSouthWest();
            onBoundsChange({
              ne: { lat: ne.lat(), lng: ne.lng() },
              sw: { lat: sw.lat(), lng: sw.lng() },
            });
          }
        });
      } else {
        setTimeout(checkGoogleMaps, 100);
      }
    };

    checkGoogleMaps();
  }, []); // Only run once on mount

  // Center map when initialCenter changes
  useEffect(() => {
    if (!mapInstanceRef.current || !initialCenter) return;

    mapInstanceRef.current.setCenter(initialCenter);
    mapInstanceRef.current.setZoom(14);

    // Trigger bounds change callback after centering
    const bounds = mapInstanceRef.current.getBounds();
    if (bounds && onBoundsChange) {
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      onBoundsChange({
        ne: { lat: ne.lat(), lng: ne.lng() },
        sw: { lat: sw.lat(), lng: sw.lng() },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCenter]);

  // Update markers when markers prop changes
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;

    // Get current marker IDs
    const currentMarkerIds = new Set(markers.map((m) => m.id));

    // Find new markers (not in previous set)
    const newMarkerIds = new Set(
      [...currentMarkerIds].filter(
        (id) => !previousMarkerIdsRef.current.has(id)
      )
    );

    // Clear existing markers
    markersRef.current.forEach((overlay) => overlay.setMap(null));
    markersRef.current = [];

    // Add new markers with custom HTML content
    markers.forEach((markerData) => {
      const isNewMarker = newMarkerIds.has(markerData.id);

      // Create custom overlay class
      class CustomMarker extends google.maps.OverlayView {
        private position: google.maps.LatLng;
        private containerDiv: HTMLDivElement | null = null;

        constructor(position: google.maps.LatLng, map: google.maps.Map) {
          super();
          this.position = position;
          this.setMap(map);
        }

        onAdd() {
          const markerDiv = document.createElement("div");
          markerDiv.style.position = "absolute";
          markerDiv.style.cursor = "pointer";

          // Add pop-in animation only for NEW markers with staggered delay
          if (isNewMarker) {
            const newMarkerIndex = [...newMarkerIds].indexOf(markerData.id);
            markerDiv.style.animation = `markerPopIn 0.5s ease-out ${
              newMarkerIndex * 0.05
            }s both`;
          }

          markerDiv.innerHTML = `
            <div class="custom-marker" style="
              display: flex;
              flex-direction: column;
              align-items: center;
              filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
            ">
              <div style="
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 4px;
                background: ${
                  markerData.type === "parking" ? "#10b981" : "#3b82f6"
                };
                color: white;
                border-radius: 20px;
                padding: 6px 12px;
                font-family: system-ui, -apple-system, sans-serif;
                font-size: 14px;
                font-weight: 700;
                white-space: nowrap;
                transition: all 0.2s ease;
                position: relative;
                border: 2px solid white;
                box-shadow: 0 0 0 1px ${
                  markerData.type === "parking" ? "#10b981" : "#3b82f6"
                };
              ">
                <span style="font-size: 12px;">
                  ${markerData.type === "parking" ? "🅿️" : "⚡"}
                </span>
                <span>
                  $${markerData.pricePerHour || "—"}
                </span>
              </div>
              <div style="
                width: 0;
                height: 0;
                border-left: 6px solid transparent;
                border-right: 6px solid transparent;
                border-top: 8px solid ${
                  markerData.type === "parking" ? "#10b981" : "#3b82f6"
                };
                margin-top: -2px;
              "></div>
            </div>
          `;

          // Add hover effects
          const innerDiv = markerDiv.querySelector(
            ".custom-marker > div"
          ) as HTMLElement;
          markerDiv.addEventListener("mouseenter", () => {
            innerDiv.style.transform = "scale(1.1)";
            innerDiv.style.boxShadow = `0 0 0 2px white, 0 0 0 4px ${
              markerData.type === "parking" ? "#10b981" : "#3b82f6"
            }`;
          });
          markerDiv.addEventListener("mouseleave", () => {
            innerDiv.style.transform = "scale(1)";
            innerDiv.style.boxShadow = `0 0 0 1px ${
              markerData.type === "parking" ? "#10b981" : "#3b82f6"
            }`;
          });

          // Add click listener
          markerDiv.addEventListener("click", () => {
            // Close previously opened info window
            if (activeInfoWindowRef.current) {
              activeInfoWindowRef.current.close();
            }

            // Notify parent component
            if (onMarkerClick) {
              onMarkerClick(markerData.id);
            }

            // Also show info window
            const infoWindow = new google.maps.InfoWindow({
              content: `
                <div style="padding: 12px; min-width: 200px;">
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <div style="
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      width: 32px;
                      height: 32px;
                      border-radius: 10px;
                      background: ${
                        markerData.type === "parking" ? "#10b981" : "#3b82f6"
                      };
                      color: white;
                      font-size: 16px;
                      font-weight: bold;
                    ">
                      ${markerData.type === "parking" ? "P" : "⚡"}
                    </div>
                    <div>
                      <h3 style="margin: 0; font-weight: 600; font-size: 15px; color: #1e293b;">
                        ${markerData.name}
                      </h3>
                      <p style="margin: 2px 0 0 0; font-size: 12px; color: #64748b;">
                        ${
                          markerData.type === "parking"
                            ? "Parking"
                            : "Charging Station"
                        }
                      </p>
                    </div>
                  </div>
                  <div style="
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    margin-top: 8px;
                    padding-top: 8px;
                    border-top: 1px solid #e2e8f0;
                    font-size: 14px;
                    font-weight: 600;
                    color: #1e293b;
                  ">
                    <span>$${markerData.pricePerHour || "—"}</span>
                    <span style="font-weight: 400; color: #64748b;">/hr</span>
                  </div>
                </div>
              `,
              position: this.position,
            });
            infoWindow.open(mapInstanceRef.current!);

            // Store reference to currently open info window
            activeInfoWindowRef.current = infoWindow;
          });

          this.containerDiv = markerDiv;
          const panes = this.getPanes();
          panes?.overlayMouseTarget.appendChild(markerDiv);
        }

        draw() {
          if (!this.containerDiv) return;
          const projection = this.getProjection();
          const point = projection.fromLatLngToDivPixel(this.position);
          if (point) {
            this.containerDiv.style.left = point.x - 40 + "px";
            this.containerDiv.style.top = point.y - 30 + "px";
          }
        }

        onRemove() {
          if (this.containerDiv) {
            this.containerDiv.parentNode?.removeChild(this.containerDiv);
            this.containerDiv = null;
          }
        }
      }

      const position = new google.maps.LatLng(markerData.lat, markerData.lng);
      const overlay = new CustomMarker(position, mapInstanceRef.current!);
      markersRef.current.push(overlay);
    });

    // Update previous marker IDs for next comparison
    previousMarkerIdsRef.current = currentMarkerIds;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markers, isLoaded]);

  // Render route polyline when routePolyline changes
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;

    // Clear previous polyline if exists
    if (routePolylineRef.current) {
      routePolylineRef.current.setMap(null);
      routePolylineRef.current = null;
    }

    // If no route polyline provided, just clear and return
    if (!routePolyline) return;

    // Decode the encoded polyline to path coordinates
    const decodedPath = google.maps.geometry.encoding.decodePath(routePolyline);

    // Create and render the polyline with bold blue styling
    const polyline = new google.maps.Polyline({
      path: decodedPath,
      geodesic: true,
      strokeColor: "#0937cfff", // Bold dark blue color for better visibility
      strokeOpacity: 0.9,
      strokeWeight: 6,
      map: mapInstanceRef.current,
      zIndex: 100, // Ensure route appears above other elements
    });

    routePolylineRef.current = polyline;

    // Fit map bounds to show the entire route with some padding
    const bounds = new google.maps.LatLngBounds();
    decodedPath.forEach((point) => bounds.extend(point));
    mapInstanceRef.current.fitBounds(bounds, {
      top: 80,
      right: 80,
      bottom: 80,
      left: 80,
    });
  }, [routePolyline, isLoaded]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapRef} className="h-full w-full rounded-2xl" />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 rounded-2xl">
          <div className="flex flex-col items-center gap-3">
            <svg
              className="h-8 w-8 animate-spin text-emerald-500"
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
            <p className="text-sm text-slate-600">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
}
