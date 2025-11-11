"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { CommonLayout } from "@/components/layout/CommonLayout";
import { EditParkingSpotModal } from "@/components/modals/EditParkingSpotModal";
import { AddParkingSpotModal } from "@/components/modals/AddParkingSpotModal";

interface CarParking {
  id: string;
  charging: boolean;
  covered: boolean;
  available: boolean;
  createdAt: string;
  isBooked?: boolean;
  isManuallyOccupied?: boolean;
}

interface BikeParking {
  id: string;
  covered: boolean;
  available: boolean;
  createdAt: string;
  isBooked?: boolean;
  isManuallyOccupied?: boolean;
}

interface PricingInfo {
  hourlyRate: number;
  dailyRate: number;
  coveredHourlyRate: number;
  coveredDailyRate: number;
  chargingHourlyRate: number;
  chargingDailyRate: number;
}

interface Stats {
  carBookings: number;
  bikeBookings: number;
  totalCarSpots: number;
  totalBikeSpots: number;
}

export default function MyListingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [carParkings, setCarParkings] = useState<CarParking[]>([]);
  const [bikeParkings, setBikeParkings] = useState<BikeParking[]>([]);
  const [pricing, setPricing] = useState<PricingInfo>({
    hourlyRate: 5,
    dailyRate: 40,
    coveredHourlyRate: 2,
    coveredDailyRate: 10,
    chargingHourlyRate: 3,
    chargingDailyRate: 15,
  });
  const [stats, setStats] = useState<Stats>({
    carBookings: 0,
    bikeBookings: 0,
    totalCarSpots: 0,
    totalBikeSpots: 0,
  });
  const [activeTab, setActiveTab] = useState<"car" | "bike">("car");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [pricingEditMode, setPricingEditMode] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState<
    CarParking | BikeParking | null
  >(null);

  const fetchParkingSpots = useCallback(async () => {
    try {
      setLoading(true);
      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";
      const response = await axios.get(`${backendUrl}/landOwner/parkingSpots`, {
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      setCarParkings(response.data.carParkings || []);
      setBikeParkings(response.data.bikeParkings || []);
      setPricing(
        response.data.pricing || {
          hourlyRate: 5,
          dailyRate: 40,
          coveredHourlyRate: 2,
          coveredDailyRate: 10,
          chargingHourlyRate: 3,
          chargingDailyRate: 15,
        }
      );
      setStats(
        response.data.stats || {
          carBookings: 0,
          bikeBookings: 0,
          totalCarSpots: 0,
          totalBikeSpots: 0,
        }
      );
    } catch (error) {
      console.error("Error fetching parking spots:", error);
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    } else if (status === "authenticated") {
      fetchParkingSpots();
    }
  }, [status, router, fetchParkingSpots]);

  const toggleParkingSpot = async (
    type: "car" | "bike",
    spotId: string,
    currentAvailability: boolean
  ) => {
    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";
      const endpoint =
        type === "car"
          ? `/landOwner/carParking/${spotId}`
          : `/landOwner/bikeParking/${spotId}`;

      await axios.patch(
        `${backendUrl}${endpoint}`,
        { available: !currentAvailability },
        {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
          },
        }
      );

      // Refresh the list
      await fetchParkingSpots();
    } catch (error) {
      console.error("Error toggling parking spot:", error);
    }
  };

  const getSpotStatus = (spot: CarParking | BikeParking) => {
    if (spot.isBooked) {
      return {
        label: "Occupied",
        color: "text-red-600 bg-red-50 border-red-200",
      };
    }
    if (!spot.available) {
      return {
        label: "Disabled",
        color: "text-gray-600 bg-gray-50 border-gray-200",
      };
    }
    return {
      label: "Available",
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    };
  };

  const updatePricing = async (newPricing: PricingInfo) => {
    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";
      await axios.patch(`${backendUrl}/landOwner/pricing`, newPricing, {
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });
      setPricing(newPricing);
      setPricingEditMode(false);
    } catch (error) {
      console.error("Error updating pricing:", error);
      alert("Failed to update pricing");
    }
  };

  const handleEditSpot = (spot: CarParking | BikeParking) => {
    setSelectedSpot(spot);
    setEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    fetchParkingSpots();
    setEditModalOpen(false);
    setSelectedSpot(null);
  };

  const handleAddSuccess = () => {
    fetchParkingSpots();
    setAddModalOpen(false);
  };

  if (status === "loading" || loading) {
    return (
      <CommonLayout>
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-500"></div>
            <p className="text-sm text-slate-600">Loading your listings...</p>
          </div>
        </div>
      </CommonLayout>
    );
  }

  const currentParkings = activeTab === "car" ? carParkings : bikeParkings;
  const availableCount = currentParkings.filter(
    (p) => p.available && !p.isBooked
  ).length;
  const occupiedCount = currentParkings.filter((p) => p.isBooked).length;
  const disabledCount = currentParkings.filter(
    (p) => !p.available && !p.isBooked
  ).length;

  return (
    <CommonLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                  My Listings
                </h1>
                <p className="text-slate-600">
                  Manage your parking spots and availability
                </p>
              </div>
              <button
                onClick={() => setAddModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/30"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Spot
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">
                    Total Spots
                  </p>
                  <p className="text-3xl font-bold text-slate-900">
                    {stats.totalCarSpots + stats.totalBikeSpots}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
                  <svg
                    className="h-6 w-6 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-emerald-200 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">
                    Available
                  </p>
                  <p className="text-3xl font-bold text-emerald-600">
                    {availableCount}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center">
                  <svg
                    className="h-6 w-6 text-emerald-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-red-200 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">
                    Occupied
                  </p>
                  <p className="text-3xl font-bold text-red-600">
                    {occupiedCount}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center">
                  <svg
                    className="h-6 w-6 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">
                    Disabled
                  </p>
                  <p className="text-3xl font-bold text-slate-600">
                    {disabledCount}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <svg
                    className="h-6 w-6 text-slate-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Card */}
          <div className="mb-8">
            <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-xl border border-emerald-200 p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    Pricing Settings
                  </h3>
                  <p className="text-sm text-slate-600">
                    Set base price and additional charges for features
                  </p>
                </div>
                {!pricingEditMode && (
                  <button
                    onClick={() => setPricingEditMode(true)}
                    className="px-4 py-2 text-sm font-medium text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100 rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                )}
              </div>

              {!pricingEditMode ? (
                <div className="space-y-4">
                  {/* Base Pricing */}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                      Base Pricing (No Features)
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-4 border border-slate-200">
                        <p className="text-sm font-medium text-slate-600 mb-2">
                          Hourly Rate
                        </p>
                        <p className="text-2xl font-bold text-slate-900">
                          ${pricing.hourlyRate}
                          <span className="text-base font-normal text-slate-500">
                            /hr
                          </span>
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-slate-200">
                        <p className="text-sm font-medium text-slate-600 mb-2">
                          Daily Rate
                        </p>
                        <p className="text-2xl font-bold text-slate-900">
                          ${pricing.dailyRate}
                          <span className="text-base font-normal text-slate-500">
                            /day
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Feature Surcharges */}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                      Additional Charges for Features
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Covered */}
                      <div className="bg-white rounded-lg p-4 border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
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
                          <p className="text-sm font-semibold text-blue-900">
                            Covered Parking
                          </p>
                        </div>
                        <p className="text-sm text-slate-600">
                          +${pricing.coveredHourlyRate}/hr, +$
                          {pricing.coveredDailyRate}/day
                        </p>
                      </div>

                      {/* Charging */}
                      <div className="bg-white rounded-lg p-4 border border-amber-200">
                        <div className="flex items-center gap-2 mb-2">
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
                          <p className="text-sm font-semibold text-amber-900">
                            EV Charging
                          </p>
                        </div>
                        <p className="text-sm text-slate-600">
                          +${pricing.chargingHourlyRate}/hr, +$
                          {pricing.chargingDailyRate}/day
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Example Calculations */}
                  <div className="bg-white/50 rounded-lg p-4 border border-slate-200">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Example Prices
                    </p>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                      <div className="text-slate-600">Covered Only:</div>
                      <div className="font-semibold text-slate-900">
                        ${pricing.hourlyRate + pricing.coveredHourlyRate}/hr, $
                        {pricing.dailyRate + pricing.coveredDailyRate}/day
                      </div>
                      <div className="text-slate-600">Charging Only:</div>
                      <div className="font-semibold text-slate-900">
                        ${pricing.hourlyRate + pricing.chargingHourlyRate}/hr, $
                        {pricing.dailyRate + pricing.chargingDailyRate}/day
                      </div>
                      <div className="text-slate-600">Both Features:</div>
                      <div className="font-semibold text-slate-900">
                        $
                        {pricing.hourlyRate +
                          pricing.coveredHourlyRate +
                          pricing.chargingHourlyRate}
                        /hr, $
                        {pricing.dailyRate +
                          pricing.coveredDailyRate +
                          pricing.chargingDailyRate}
                        /day
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  {/* Base Pricing Inputs */}
                  <div className="mb-6">
                    <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
                      Base Pricing (No Features)
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Hourly Rate ($)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={pricing.hourlyRate}
                          onChange={(e) =>
                            setPricing({
                              ...pricing,
                              hourlyRate: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Daily Rate ($)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={pricing.dailyRate}
                          onChange={(e) =>
                            setPricing({
                              ...pricing,
                              dailyRate: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Feature Surcharge Inputs */}
                  <div className="mb-6">
                    <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
                      Additional Charges for Features
                    </p>

                    {/* Covered */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
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
                        Covered Parking Surcharge
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={pricing.coveredHourlyRate}
                            onChange={(e) =>
                              setPricing({
                                ...pricing,
                                coveredHourlyRate:
                                  parseFloat(e.target.value) || 0,
                              })
                            }
                            placeholder="Extra per hour"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                          />
                          <p className="text-xs text-slate-500 mt-1">
                            Extra per hour
                          </p>
                        </div>
                        <div>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={pricing.coveredDailyRate}
                            onChange={(e) =>
                              setPricing({
                                ...pricing,
                                coveredDailyRate:
                                  parseFloat(e.target.value) || 0,
                              })
                            }
                            placeholder="Extra per day"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                          />
                          <p className="text-xs text-slate-500 mt-1">
                            Extra per day
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Charging */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
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
                        EV Charging Surcharge
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={pricing.chargingHourlyRate}
                            onChange={(e) =>
                              setPricing({
                                ...pricing,
                                chargingHourlyRate:
                                  parseFloat(e.target.value) || 0,
                              })
                            }
                            placeholder="Extra per hour"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-slate-900"
                          />
                          <p className="text-xs text-slate-500 mt-1">
                            Extra per hour
                          </p>
                        </div>
                        <div>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={pricing.chargingDailyRate}
                            onChange={(e) =>
                              setPricing({
                                ...pricing,
                                chargingDailyRate:
                                  parseFloat(e.target.value) || 0,
                              })
                            }
                            placeholder="Extra per day"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-slate-900"
                          />
                          <p className="text-xs text-slate-500 mt-1">
                            Extra per day
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setPricingEditMode(false);
                        // Reset to original values
                        fetchParkingSpots();
                      }}
                      className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => updatePricing(pricing)}
                      className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50">
              <div className="flex">
                <button
                  onClick={() => setActiveTab("car")}
                  className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors relative ${
                    activeTab === "car"
                      ? "text-emerald-600 bg-white"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
                      />
                    </svg>
                    Car Parking ({stats.totalCarSpots})
                  </div>
                  {activeTab === "car" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600"></div>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("bike")}
                  className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors relative ${
                    activeTab === "bike"
                      ? "text-emerald-600 bg-white"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg
                      className="h-5 w-5"
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
                    Bike Parking ({stats.totalBikeSpots})
                  </div>
                  {activeTab === "bike" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600"></div>
                  )}
                </button>
              </div>
            </div>

            {/* Spots Grid */}
            <div className="p-6">
              {currentParkings.length === 0 ? (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-slate-100 mb-4">
                    <svg
                      className="h-8 w-8 text-slate-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    No {activeTab === "car" ? "car" : "bike"} parking spots yet
                  </h3>
                  <p className="text-sm text-slate-600 mb-6">
                    Create your first parking spot to start earning
                  </p>
                  <button
                    onClick={() => setAddModalOpen(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/30"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Add Parking Spot
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentParkings.map((spot, index) => {
                    const status = getSpotStatus(spot);
                    const isCarSpot = "charging" in spot;

                    return (
                      <div
                        key={spot.id}
                        className="group bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg hover:border-emerald-300 transition-all duration-200"
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-500/30">
                              {isCarSpot ? "🚗" : "🏍️"}
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-900">
                                Spot #{index + 1}
                              </h3>
                              <p className="text-xs text-slate-500">
                                ID: {spot.id.slice(0, 8)}...
                              </p>
                            </div>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold border ${status.color}`}
                          >
                            {status.label}
                          </span>
                        </div>

                        {/* Features */}
                        <div className="space-y-3 mb-4">
                          <div className="flex flex-wrap gap-2 pt-2">
                            {spot.covered && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">
                                <svg
                                  className="h-3 w-3"
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
                                Covered
                              </span>
                            )}
                            {isCarSpot && (spot as CarParking).charging && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded-md text-xs font-medium">
                                <svg
                                  className="h-3 w-3"
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
                                Charging
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-4 border-t border-slate-100">
                          <button
                            onClick={() =>
                              toggleParkingSpot(
                                activeTab,
                                spot.id,
                                spot.available
                              )
                            }
                            disabled={spot.isBooked}
                            className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                              spot.isBooked
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                : spot.available
                                ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                : "bg-emerald-500 text-white hover:bg-emerald-600"
                            }`}
                          >
                            {spot.isBooked
                              ? "Occupied"
                              : spot.available
                              ? "Disable"
                              : "Enable"}
                          </button>
                          <button
                            onClick={() => handleEditSpot(spot)}
                            className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {selectedSpot && (
        <EditParkingSpotModal
          open={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedSpot(null);
          }}
          spot={selectedSpot}
          type={activeTab}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Add Modal */}
      <AddParkingSpotModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        type={activeTab}
        onSuccess={handleAddSuccess}
      />
    </CommonLayout>
  );
}
