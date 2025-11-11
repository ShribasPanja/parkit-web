"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { CustomDatePicker } from "../ui/CustomDatePicker";

interface ReserveSpotModalProps {
  open: boolean;
  onClose: () => void;
  landOwnerId: string;
  landOwnerName: string;
  address: string;
  pricePerHour: number;
  onSuccess?: () => void;
}

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  type: string;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  hour: number;
  timeLabel: string;
  availableSpots: number;
  totalSpots: number;
  isAvailable: boolean;
  isPast: boolean;
  basicAvailable: number;
  coveredAvailable: number;
  chargingAvailable: number;
  coveredAndChargingAvailable: number;
}

interface PricingInfo {
  hourlyRate: number;
  dailyRate: number;
  coveredHourlyRate: number;
  coveredDailyRate: number;
  chargingHourlyRate: number;
  chargingDailyRate: number;
}

interface FeatureCounts {
  total: number;
  basic: number;
  covered: number;
  charging: number;
  coveredAndCharging: number;
}

export function ReserveSpotModal({
  open,
  onClose,
  landOwnerId,
  landOwnerName,
  address,
  pricePerHour,
  onSuccess,
}: ReserveSpotModalProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
  const [showPriceSummary, setShowPriceSummary] = useState(false);
  const [pricing, setPricing] = useState<PricingInfo>({
    hourlyRate: 0,
    dailyRate: 0,
    coveredHourlyRate: 0,
    coveredDailyRate: 0,
    chargingHourlyRate: 0,
    chargingDailyRate: 0,
  });
  const [featureCounts, setFeatureCounts] = useState<FeatureCounts>({
    total: 0,
    basic: 0,
    covered: 0,
    charging: 0,
    coveredAndCharging: 0,
  });
  const [selectedFeatures, setSelectedFeatures] = useState({
    covered: false,
    charging: false,
  });

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const format12Hour = (hour: number) => {
    if (hour === 0) return "12 AM";
    if (hour === 12) return "12 PM";
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  const [formData, setFormData] = useState({
    vehicleId: "",
    selectedDate: getTodayDate(),
  });

  const fetchVehicles = useCallback(async () => {
    try {
      setLoadingVehicles(true);
      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";
      const response = await axios.get(`${backendUrl}/user/details`, {
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });
      setVehicles(response.data.user?.vehicles || []);
    } catch (err: unknown) {
      console.error("Fetch vehicles error:", err);
    } finally {
      setLoadingVehicles(false);
    }
  }, [session?.accessToken]);

  const fetchTimeSlots = useCallback(async () => {
    try {
      setLoadingSlots(true);
      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";
      const selectedVehicle = vehicles.find((v) => v.id === formData.vehicleId);
      const vehicleType = selectedVehicle?.type || "CAR";

      const response = await axios.get(
        `${backendUrl}/map/availability/slots/${landOwnerId}?date=${formData.selectedDate}&vehicleType=${vehicleType}`
      );
      setTimeSlots(response.data.slots || []);
      setPricing(
        response.data.pricing || {
          hourlyRate: 0,
          dailyRate: 0,
          coveredHourlyRate: 0,
          coveredDailyRate: 0,
          chargingHourlyRate: 0,
          chargingDailyRate: 0,
        }
      );
      setFeatureCounts(
        response.data.featureCounts || {
          total: 0,
          basic: 0,
          covered: 0,
          charging: 0,
          coveredAndCharging: 0,
        }
      );
      setSelectedSlots([]); // Reset selection when date changes
    } catch (err: unknown) {
      console.error("Fetch time slots error:", err);
      setError("Failed to load available time slots");
    } finally {
      setLoadingSlots(false);
    }
  }, [vehicles, formData.vehicleId, formData.selectedDate, landOwnerId]);

  // Fetch user's vehicles
  useEffect(() => {
    if (open && session?.accessToken) {
      fetchVehicles();
    }
  }, [open, session?.accessToken, fetchVehicles]);

  // Fetch time slots when date or vehicle changes
  useEffect(() => {
    if (open && formData.selectedDate && formData.vehicleId) {
      fetchTimeSlots();
    }
  }, [open, formData.selectedDate, formData.vehicleId, fetchTimeSlots]);

  const handleSlotClick = (hour: number) => {
    const slot = timeSlots.find((s) => s.hour === hour);
    if (!slot || slot.isPast) return;

    // Check if the requested feature combination is available
    let isFeatureAvailable = false;
    if (selectedFeatures.covered && selectedFeatures.charging) {
      isFeatureAvailable = slot.coveredAndChargingAvailable > 0;
    } else if (selectedFeatures.covered) {
      isFeatureAvailable =
        slot.coveredAvailable > 0 || slot.coveredAndChargingAvailable > 0;
    } else if (selectedFeatures.charging) {
      isFeatureAvailable =
        slot.chargingAvailable > 0 || slot.coveredAndChargingAvailable > 0;
    } else {
      isFeatureAvailable =
        slot.basicAvailable > 0 ||
        slot.coveredAvailable > 0 ||
        slot.chargingAvailable > 0 ||
        slot.coveredAndChargingAvailable > 0;
    }

    if (!isFeatureAvailable) return;

    setSelectedSlots((prev) => {
      if (prev.includes(hour)) {
        // Deselect
        return prev.filter((h) => h !== hour);
      } else {
        // Select and sort
        return [...prev, hour].sort((a, b) => a - b);
      }
    });
  };

  const calculateTotalPrice = () => {
    let basePrice = pricing.hourlyRate;
    if (selectedFeatures.covered) {
      basePrice += pricing.coveredHourlyRate;
    }
    if (selectedFeatures.charging) {
      basePrice += pricing.chargingHourlyRate;
    }
    return selectedSlots.length * basePrice;
  };

  const getHourlyRate = () => {
    let rate = pricing.hourlyRate;
    if (selectedFeatures.covered) {
      rate += pricing.coveredHourlyRate;
    }
    if (selectedFeatures.charging) {
      rate += pricing.chargingHourlyRate;
    }
    return rate;
  };

  // Get available spots for the selected features
  const getAvailableCountForFeatures = (slot: TimeSlot) => {
    if (selectedFeatures.covered && selectedFeatures.charging) {
      // Both features required - only spots with both
      return slot.coveredAndChargingAvailable;
    } else if (selectedFeatures.covered) {
      // Covered only - spots with covered OR both
      return slot.coveredAvailable + slot.coveredAndChargingAvailable;
    } else if (selectedFeatures.charging) {
      // Charging only - spots with charging OR both
      return slot.chargingAvailable + slot.coveredAndChargingAvailable;
    } else {
      // No features required - all available spots
      return (
        slot.basicAvailable +
        slot.coveredAvailable +
        slot.chargingAvailable +
        slot.coveredAndChargingAvailable
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!formData.vehicleId) {
        setError("Please select a vehicle");
        setLoading(false);
        return;
      }

      if (selectedSlots.length === 0) {
        setError("Please select at least one time slot");
        setLoading(false);
        return;
      }

      // Find consecutive slot ranges
      const sortedSlots = [...selectedSlots].sort((a, b) => a - b);
      const startHour = sortedSlots[0];
      const endHour = sortedSlots[sortedSlots.length - 1] + 1; // +1 because booking ends at the end of the last hour

      const selectedDate = new Date(formData.selectedDate);
      const startDateTime = new Date(selectedDate);
      startDateTime.setHours(startHour, 0, 0, 0);

      const endDateTime = new Date(selectedDate);
      endDateTime.setHours(endHour, 0, 0, 0);

      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";
      const token = session?.accessToken;

      if (!token) {
        setError("Authentication required. Please sign in again.");
        setLoading(false);
        return;
      }

      const response = await axios.post(
        `${backendUrl}/user/bookings`,
        {
          vehicleId: formData.vehicleId,
          landOwnerId,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          totalPrice: calculateTotalPrice(),
          hasCoveredParking: selectedFeatures.covered,
          hasChargingStation: selectedFeatures.charging,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 201) {
        setSuccess(true);
        // Call onSuccess callback to refresh availability
        if (onSuccess) {
          onSuccess();
        }
        setTimeout(() => {
          onClose();
          setSuccess(false);
          setFormData({
            vehicleId: "",
            selectedDate: getTodayDate(),
          });
          setSelectedSlots([]);
        }, 2000);
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Failed to create booking");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) {
      setError("");
      setSuccess(false);
      setShowPriceSummary(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  if (!open && !showPriceSummary) return null;

  const totalPrice = calculateTotalPrice();

  // Success Modal - Show first before other modals
  if (success) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 px-3 sm:px-6 backdrop-blur-sm"
      >
        <div className="relative w-full max-w-md rounded-2xl sm:rounded-3xl bg-white p-6 sm:p-8 shadow-2xl shadow-slate-900/20 text-center">
          <div className="mx-auto mb-3 sm:mb-4 flex h-14 sm:h-16 w-14 sm:w-16 items-center justify-center rounded-full bg-emerald-100">
            <svg
              className="h-7 sm:h-8 w-7 sm:w-8 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-2">
            Booking Confirmed!
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            Your parking spot has been reserved successfully.
          </p>
        </div>
      </div>
    );
  }

  // Price Summary Modal - Full screen
  if (showPriceSummary) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 px-3 sm:px-6 backdrop-blur-sm"
        onClick={() => setShowPriceSummary(false)}
      >
        <div
          className="relative w-full max-w-2xl rounded-2xl sm:rounded-3xl bg-white p-6 sm:p-8 shadow-2xl shadow-slate-900/20"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Booking Summary
              </h2>
              <p className="text-sm text-slate-600 mt-1">{landOwnerName}</p>
            </div>
            <button
              onClick={() => setShowPriceSummary(false)}
              className="rounded-full p-2 hover:bg-slate-100 transition"
            >
              <svg
                className="h-6 w-6 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {/* Location */}
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg
                  className="h-5 w-5 text-slate-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
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
                <h3 className="text-sm font-bold text-slate-900">Location</h3>
              </div>
              <p className="text-sm text-slate-700">{address}</p>
            </div>

            {/* Date */}
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg
                  className="h-5 w-5 text-slate-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <h3 className="text-sm font-bold text-slate-900">Date</h3>
              </div>
              <p className="text-sm text-slate-700">
                {new Date(formData.selectedDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            {/* Time Slots */}
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg
                  className="h-5 w-5 text-slate-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="text-sm font-bold text-slate-900">Time Slots</h3>
              </div>
              <p className="text-sm text-slate-700">
                {selectedSlots
                  .sort((a, b) => a - b)
                  .map((h) => format12Hour(h))
                  .join(", ")}
              </p>
            </div>

            {/* Vehicle */}
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg
                  className="h-5 w-5 text-slate-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                  />
                </svg>
                <h3 className="text-sm font-bold text-slate-900">Vehicle</h3>
              </div>
              <p className="text-sm text-slate-700">
                {vehicles.find((v) => v.id === formData.vehicleId)?.make}{" "}
                {vehicles.find((v) => v.id === formData.vehicleId)?.model}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {
                  vehicles.find((v) => v.id === formData.vehicleId)
                    ?.licensePlate
                }
              </p>
            </div>

            {/* Features */}
            {(selectedFeatures.covered || selectedFeatures.charging) && (
              <div className="rounded-xl bg-gradient-to-br from-blue-50 to-amber-50 border border-blue-200 p-4 col-span-1 sm:col-span-2">
                <div className="flex items-center gap-2 mb-2">
                  <svg
                    className="h-5 w-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                    />
                  </svg>
                  <h3 className="text-sm font-bold text-slate-900">
                    Selected Features
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedFeatures.covered && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                        />
                      </svg>
                      Covered Parking
                    </span>
                  )}
                  {selectedFeatures.charging && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-xs font-semibold">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      EV Charging
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Price Breakdown */}
          <div className="rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-6 mb-6">
            <h3 className="text-lg font-bold text-emerald-900 mb-4 flex items-center gap-2">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"
                />
              </svg>
              Price Details
            </h3>

            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between py-2 border-b border-emerald-200/50">
                <span className="text-sm text-slate-700">Duration</span>
                <span className="text-sm font-bold text-slate-900">
                  {selectedSlots.length}{" "}
                  {selectedSlots.length === 1 ? "hour" : "hours"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-emerald-200/50">
                <span className="text-sm text-slate-700">Base Rate</span>
                <span className="text-sm font-bold text-slate-900">
                  ${pricePerHour.toFixed(2)}/hr
                </span>
              </div>
              {selectedFeatures.covered && (
                <div className="flex items-center justify-between py-2 border-b border-emerald-200/50">
                  <span className="text-sm text-slate-700 flex items-center gap-2">
                    <svg
                      className="h-4 w-4 text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                      />
                    </svg>
                    Covered Parking
                  </span>
                  <span className="text-sm font-bold text-blue-700">
                    +${pricing.coveredHourlyRate.toFixed(2)}/hr
                  </span>
                </div>
              )}
              {selectedFeatures.charging && (
                <div className="flex items-center justify-between py-2 border-b border-emerald-200/50">
                  <span className="text-sm text-slate-700 flex items-center gap-2">
                    <svg
                      className="h-4 w-4 text-amber-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    EV Charging
                  </span>
                  <span className="text-sm font-bold text-amber-700">
                    +${pricing.chargingHourlyRate.toFixed(2)}/hr
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between py-2 border-b border-emerald-200/50 bg-white/50 px-2 rounded-lg">
                <span className="text-sm font-semibold text-slate-800">
                  Total Hourly Rate
                </span>
                <span className="text-sm font-bold text-emerald-700">
                  ${getHourlyRate().toFixed(2)}/hr
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t-2 border-emerald-300">
              <span className="text-lg font-bold text-slate-900">
                Total Amount
              </span>
              <div className="text-right">
                <div className="text-3xl font-bold text-emerald-600">
                  ${totalPrice.toFixed(2)}
                </div>
                <div className="text-xs text-emerald-700 font-medium">
                  All fees included
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4 mb-4">
              <div className="flex items-start gap-2.5">
                <svg
                  className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm text-red-700 flex-1">{error}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowPriceSummary(false)}
              className="flex-1 rounded-xl border-2 border-slate-300 px-6 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 hover:border-slate-400 active:scale-95"
            >
              Back to Selection
            </button>
            <button
              type="button"
              onClick={(e) => {
                const syntheticEvent = e as unknown as React.FormEvent;
                handleSubmit(syntheticEvent);
              }}
              disabled={loading}
              className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-xl shadow-emerald-300/50 transition hover:from-emerald-600 hover:to-emerald-700 hover:shadow-2xl hover:shadow-emerald-400/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
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
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Confirm Booking
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 px-3 sm:px-6 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-md rounded-2xl sm:rounded-3xl bg-white p-6 sm:p-8 shadow-2xl shadow-slate-900/20 text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-3 sm:mb-4">
            Sign In Required
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mb-5 sm:mb-6">
            Please sign in to reserve a parking spot.
          </p>
          <button
            onClick={onClose}
            className="w-full rounded-full bg-emerald-500 px-5 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-emerald-200/80 transition hover:bg-emerald-600"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-3xl lg:max-w-4xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-slate-900/30 max-h-[92vh] sm:max-h-[90vh] overflow-hidden flex flex-col animate-slide-up sm:animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Gradient with better mobile design */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-emerald-500 px-4 sm:px-6 lg:px-8 py-4 sm:py-5 shadow-lg">
          <div className="flex items-start sm:items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-tight">
                Reserve Your Spot
              </h2>
              <div className="mt-2 space-y-1 sm:space-y-0 sm:flex sm:items-center sm:gap-2">
                <p className="text-sm sm:text-base text-white font-semibold truncate">
                  {landOwnerName}
                </p>
                <span className="hidden sm:inline text-blue-200">•</span>
                <p className="text-xs sm:text-sm text-blue-50 line-clamp-1">
                  {address}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 rounded-full p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all duration-200 active:scale-95"
              aria-label="Close modal"
            >
              <svg
                className="h-5 w-5 sm:h-6 sm:w-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {error && (
            <div className="mx-4 sm:mx-6 lg:mx-8 mt-4 sm:mt-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 flex items-start gap-3">
              <svg
                className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-red-700 flex-1">{error}</p>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6"
          >
            {/* Vehicle Selection */}
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                  />
                </svg>
                Select Vehicle
                <span className="text-red-500">*</span>
              </label>

              {loadingVehicles ? (
                <div className="flex items-center justify-center gap-3 text-sm text-slate-600 bg-slate-50 rounded-xl px-6 py-8">
                  <svg
                    className="animate-spin h-5 w-5 text-blue-600"
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
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span className="font-medium">Loading vehicles...</span>
                </div>
              ) : vehicles.length === 0 ? (
                <div className="rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5 sm:p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                        <svg
                          className="h-6 w-6 text-amber-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-base font-bold text-amber-900 mb-2">
                        No vehicles found
                      </p>
                      <p className="text-sm text-amber-700 mb-4">
                        Please add a vehicle to your profile before making a
                        reservation.
                      </p>
                      <a
                        href="/profile"
                        className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-amber-200/80 transition-all hover:bg-amber-600 hover:shadow-xl hover:scale-105 active:scale-95"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                        Add Vehicle to Profile
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {vehicles.map((vehicle) => (
                    <label
                      key={vehicle.id}
                      className={`
                        relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-200
                        ${
                          formData.vehicleId === vehicle.id
                            ? "border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200"
                            : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/50"
                        }
                      `}
                    >
                      <input
                        type="radio"
                        name="vehicle"
                        value={vehicle.id}
                        checked={formData.vehicleId === vehicle.id}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            vehicleId: e.target.value,
                          });
                          setSelectedSlots([]);
                          // Fetch time slots after state updates
                          setTimeout(() => fetchTimeSlots(), 0);
                        }}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-3">
                        <div
                          className={`
                          flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center
                          ${
                            formData.vehicleId === vehicle.id
                              ? "bg-blue-100"
                              : "bg-slate-100"
                          }
                        `}
                        >
                          <svg
                            className={`h-5 w-5 ${
                              formData.vehicleId === vehicle.id
                                ? "text-blue-600"
                                : "text-slate-600"
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                            />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-bold truncate ${
                              formData.vehicleId === vehicle.id
                                ? "text-blue-900"
                                : "text-slate-900"
                            }`}
                          >
                            {vehicle.make} {vehicle.model}
                          </p>
                          <p
                            className={`text-xs truncate ${
                              formData.vehicleId === vehicle.id
                                ? "text-blue-600"
                                : "text-slate-500"
                            }`}
                          >
                            {vehicle.licensePlate} • {vehicle.type}
                          </p>
                        </div>
                        {formData.vehicleId === vehicle.id && (
                          <div className="flex-shrink-0">
                            <svg
                              className="h-5 w-5 text-blue-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Date Selection */}
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Select Date
                <span className="text-red-500">*</span>
              </label>
              <CustomDatePicker
                label=""
                required
                value={formData.selectedDate}
                onChange={(value) =>
                  setFormData({ ...formData, selectedDate: value })
                }
                minDate={getTodayDate()}
              />
            </div>

            {/* Feature Selection */}
            {formData.vehicleId && featureCounts.total > 0 && (
              <div className="bg-gradient-to-br from-blue-50 to-emerald-50 rounded-2xl p-4 border-2 border-blue-100">
                <label className="block text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <svg
                    className="h-5 w-5 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                    />
                  </svg>
                  Feature Preferences
                </label>
                <p className="text-xs text-slate-600 mb-4">
                  Select the features you need. Prices will be adjusted
                  accordingly.
                </p>

                <div className="space-y-3">
                  {/* Covered Parking */}
                  {(featureCounts.covered > 0 ||
                    featureCounts.coveredAndCharging > 0) && (
                    <label className="flex items-center justify-between p-3 bg-white rounded-xl border-2 border-blue-200 cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <svg
                              className="h-5 w-5 text-blue-600"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                              />
                            </svg>
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-semibold text-slate-900">
                              Covered Parking
                            </p>
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full">
                              {featureCounts.covered +
                                featureCounts.coveredAndCharging}{" "}
                              spots
                            </span>
                          </div>
                          <p className="text-xs text-slate-600">
                            +${pricing.coveredHourlyRate}/hr
                          </p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedFeatures.covered}
                        onChange={(e) => {
                          setSelectedFeatures({
                            ...selectedFeatures,
                            covered: e.target.checked,
                          });
                          setSelectedSlots([]); // Reset selections when features change
                        }}
                        className="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </label>
                  )}

                  {/* EV Charging */}
                  {vehicles.find((v) => v.id === formData.vehicleId)?.type !==
                    "BIKE" &&
                    (featureCounts.charging > 0 ||
                      featureCounts.coveredAndCharging > 0) && (
                      <label className="flex items-center justify-between p-3 bg-white rounded-xl border-2 border-amber-200 cursor-pointer hover:bg-amber-50 hover:border-amber-300 transition-all">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                              <svg
                                className="h-5 w-5 text-amber-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13 10V3L4 14h7v7l9-11h-7z"
                                />
                              </svg>
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-semibold text-slate-900">
                                EV Charging
                              </p>
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">
                                {featureCounts.charging +
                                  featureCounts.coveredAndCharging}{" "}
                                spots
                              </span>
                            </div>
                            <p className="text-xs text-slate-600">
                              +${pricing.chargingHourlyRate}/hr
                            </p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={selectedFeatures.charging}
                          onChange={(e) => {
                            setSelectedFeatures({
                              ...selectedFeatures,
                              charging: e.target.checked,
                            });
                            setSelectedSlots([]); // Reset selections when features change
                          }}
                          className="h-5 w-5 text-amber-600 rounded focus:ring-2 focus:ring-amber-500"
                        />
                      </label>
                    )}
                </div>

                {/* Price Preview */}
                <div className="mt-4 p-3 bg-white rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 font-medium">
                      Your Rate:
                    </span>
                    <span className="text-lg font-bold text-emerald-600">
                      ${getHourlyRate().toFixed(2)}/hr
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Time Slot Selection */}
            {formData.vehicleId && (
              <div className="bg-slate-50 rounded-2xl p-3 sm:p-4 border-2 border-slate-100">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Time Slots <span className="text-red-500">*</span>
                </label>
                <p className="text-[10px] sm:text-[11px] text-slate-500 mb-2 sm:mb-3 flex items-center gap-1.5">
                  <svg
                    className="h-3 sm:h-3.5 w-3 sm:w-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Click hours to select. Green = available, Gray = unavailable
                </p>

                {loadingSlots ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <svg
                      className="animate-spin h-8 w-8 text-emerald-500 mb-2"
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
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <p className="text-xs text-slate-500 font-medium">
                      Loading available time slots...
                    </p>
                  </div>
                ) : timeSlots.length === 0 ? (
                  <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4 text-center">
                    <svg
                      className="h-10 w-10 text-red-400 mx-auto mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-xs font-semibold text-red-900 mb-0.5">
                      No Available Slots
                    </p>
                    <p className="text-[11px] text-red-600">
                      All parking spots are booked for this date and vehicle
                      type.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-8 gap-1 sm:gap-1.5 mb-2 sm:mb-3">
                      {timeSlots.map((slot) => {
                        const isSelected = selectedSlots.includes(slot.hour);
                        const availableForFeatures =
                          getAvailableCountForFeatures(slot);
                        const isDisabled =
                          !slot.isAvailable ||
                          slot.isPast ||
                          availableForFeatures === 0;

                        return (
                          <button
                            key={slot.hour}
                            type="button"
                            onClick={() => handleSlotClick(slot.hour)}
                            disabled={isDisabled}
                            className={`
                            relative aspect-square flex items-center justify-center rounded-lg text-[11px] sm:text-xs font-bold transition-all duration-200
                            ${
                              isSelected
                                ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-300/50 ring-2 ring-emerald-400 scale-105 transform"
                                : isDisabled
                                ? "bg-slate-200 text-slate-400 cursor-not-allowed opacity-60"
                                : "bg-white text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:scale-105 border-2 border-slate-200 hover:border-emerald-300 shadow-sm hover:shadow-md"
                            }
                          `}
                            title={`${
                              slot.timeLabel
                            } - ${availableForFeatures}/${
                              slot.totalSpots
                            } spots available${
                              selectedFeatures.covered ||
                              selectedFeatures.charging
                                ? " with selected features"
                                : ""
                            }`}
                          >
                            <div className="text-center">
                              <div className="text-xs sm:text-sm leading-tight">
                                {format12Hour(slot.hour)}
                              </div>
                              <div
                                className={`text-[7px] sm:text-[8px] mt-0.5 ${
                                  isSelected ? "opacity-90" : "opacity-60"
                                }`}
                              >
                                {availableForFeatures}/{slot.totalSpots}
                              </div>
                            </div>
                            {isSelected && (
                              <div className="absolute -top-0.5 -right-0.5 bg-white rounded-full p-0.5">
                                <svg
                                  className="h-2 sm:h-2.5 w-2 sm:w-2.5 text-emerald-600"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-[10px] sm:text-[11px] pt-2 sm:pt-2.5 pb-1 sm:pb-1.5 border-t border-slate-200">
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-sm"></div>
                        <span className="text-slate-600 font-medium">
                          Selected
                        </span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-lg bg-white border-2 border-slate-200 shadow-sm"></div>
                        <span className="text-slate-600 font-medium">
                          Available
                        </span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-lg bg-slate-200"></div>
                        <span className="text-slate-600 font-medium">
                          Unavailable
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {/* {selectedSlots.length > 0 && (
                <div className="mt-2 sm:mt-3 p-2.5 sm:p-3 rounded-xl bg-emerald-50 border-2 border-emerald-200 shadow-sm">
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg
                        className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-emerald-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] sm:text-[11px] font-semibold text-emerald-900 mb-0.5">
                        {selectedSlots.length}{" "}
                        {selectedSlots.length === 1 ? "hour" : "hours"} selected
                      </p>
                      <p className="text-[10px] sm:text-[11px] text-emerald-700 leading-relaxed">
                        {selectedSlots
                          .sort((a, b) => a - b)
                          .map((h) => format12Hour(h))
                          .join(", ")}
                      </p>
                    </div>
                  </div>
                </div>
              )} */}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border-2 border-slate-300 px-4 sm:px-5 py-2.5 sm:py-3 text-[11px] sm:text-xs font-bold text-slate-700 transition hover:bg-slate-50 hover:border-slate-400 active:scale-95"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setShowPriceSummary(true)}
                disabled={vehicles.length === 0 || selectedSlots.length === 0}
                className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 sm:px-5 py-2.5 sm:py-3 text-[11px] sm:text-xs font-bold text-white shadow-xl shadow-emerald-300/50 transition hover:from-emerald-600 hover:to-emerald-700 hover:shadow-2xl hover:shadow-emerald-400/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none active:scale-95 flex items-center justify-center gap-1.5 sm:gap-2"
              >
                <svg
                  className="h-3.5 sm:h-4 w-3.5 sm:w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
                Continue
              </button>
            </div>
            {/* End Action Buttons */}
          </form>
        </div>
        {/* End Scrollable Content */}
      </div>
    </div>
  );
}
