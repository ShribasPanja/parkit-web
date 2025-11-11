"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { CommonLayout } from "@/components/layout/CommonLayout";

interface Booking {
  id: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  vehicle: {
    id: string;
    make: string;
    model: string;
    licensePlate: string;
    type: "CAR" | "BIKE" | "TRUCK" | "VAN";
  };
}

interface CarParking {
  id: string;
  charging: boolean;
  covered: boolean;
  available: boolean;
  hourlyRate: number;
  dailyRate: number;
  createdAt: string;
  isBooked?: boolean;
  isManuallyOccupied?: boolean;
}

interface BikeParking {
  id: string;
  covered: boolean;
  available: boolean;
  hourlyRate: number;
  dailyRate: number;
  createdAt: string;
  isBooked?: boolean;
  isManuallyOccupied?: boolean;
}

export default function ManageBookingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [carParkings, setCarParkings] = useState<CarParking[]>([]);
  const [bikeParkings, setBikeParkings] = useState<BikeParking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"bookings" | "spots">("bookings");
  const [filter, setFilter] = useState<
    "ALL" | "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED"
  >("ALL");
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(
    null
  );
  const [togglingSpotId, setTogglingSpotId] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [autoAccept, setAutoAccept] = useState(false);
  const [isTogglingAutoAccept, setIsTogglingAutoAccept] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Fetch host info to get autoAccept setting
  useEffect(() => {
    const fetchHostInfo = async () => {
      if (session?.accessToken) {
        try {
          const backendUrl =
            process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";
          const response = await axios.get(`${backendUrl}/landOwner/me`, {
            headers: {
              Authorization: `Bearer ${session?.accessToken}`,
            },
          });
          if (response.data.isHost && response.data.landOwner) {
            setAutoAccept(response.data.landOwner.autoAccept || false);
          }
        } catch (err: unknown) {
          console.error("Fetch host info error:", err);
        }
      }
    };
    fetchHostInfo();
  }, [session?.accessToken]);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";
      const response = await axios.get(`${backendUrl}/landOwner/bookings`, {
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });
      setBookings(response.data.bookings);
      setError("");
    } catch (err: unknown) {
      console.error("Fetch bookings error:", err);
      const errorMessage = axios.isAxiosError(err) && err.response?.data?.error 
        ? err.response.data.error 
        : "Failed to load bookings";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  const fetchParkingSpots = useCallback(async () => {
    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";
      const response = await axios.get(`${backendUrl}/landOwner/parkingSpots`, {
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });
      setCarParkings(response.data.carParkings);
      setBikeParkings(response.data.bikeParkings);
    } catch (err: unknown) {
      console.error("Fetch parking spots error:", err);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    if (session?.accessToken) {
      fetchBookings();
      fetchParkingSpots();

      // // Refresh bookings every minute to auto-complete expired ones
      // const interval = setInterval(() => {
      //   fetchBookings();
      //   fetchParkingSpots();
      // }, 60000); // 60 seconds

      // return () => clearInterval(interval);
    }
  }, [session?.accessToken, fetchBookings, fetchParkingSpots]);

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      setUpdatingBookingId(bookingId);
      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";
      const response = await axios.patch(
        `${backendUrl}/landOwner/bookings/${bookingId}`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Update the booking in the local state
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? response.data.booking : b))
      );

      // Update selected booking if it's the one being updated
      if (selectedBooking?.id === bookingId) {
        setSelectedBooking(response.data.booking);
      }

      // Refresh parking spots to show updated availability
      await fetchParkingSpots();
    } catch (err: unknown) {
      console.error("Update booking error:", err);
      const errorMessage = axios.isAxiosError(err) && err.response?.data?.error
        ? err.response.data.error
        : "Failed to update booking";
      alert(errorMessage);
    } finally {
      setUpdatingBookingId(null);
    }
  };

  const toggleParkingSpot = async (
    spotId: string,
    type: "car" | "bike",
    currentAvailable: boolean
  ) => {
    try {
      setTogglingSpotId(spotId);
      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";
      const endpoint = type === "car" ? "carParking" : "bikeParking";

      const response = await axios.patch(
        `${backendUrl}/landOwner/${endpoint}/${spotId}`,
        { available: !currentAvailable },
        {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Update the parking spot in the local state
      if (type === "car") {
        setCarParkings((prev) =>
          prev.map((p) => (p.id === spotId ? response.data.parking : p))
        );
      } else {
        setBikeParkings((prev) =>
          prev.map((p) => (p.id === spotId ? response.data.parking : p))
        );
      }
    } catch (err: unknown) {
      console.error("Toggle parking spot error:", err);
      const errorMessage = axios.isAxiosError(err) && err.response?.data?.error
        ? err.response.data.error
        : "Failed to toggle parking spot";
      alert(errorMessage);
    } finally {
      setTogglingSpotId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const hours = Math.abs(endDate.getTime() - startDate.getTime()) / 36e5;
    return `${Math.round(hours)}h`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-amber-500";
      case "CONFIRMED":
        return "bg-blue-500";
      case "CANCELLED":
        return "bg-slate-400";
      case "COMPLETED":
        return "bg-emerald-500";
      default:
        return "bg-slate-300";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "CONFIRMED":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "CANCELLED":
        return "bg-slate-50 text-slate-700 border-slate-200";
      case "COMPLETED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const toggleAutoAccept = async () => {
    setIsTogglingAutoAccept(true);
    const newValue = !autoAccept;

    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";
      await axios.patch(
        `${backendUrl}/landOwner/autoAccept`,
        { autoAccept: newValue },
        {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      setAutoAccept(newValue);

      // If turning on auto-accept, refresh bookings to trigger backend auto-accept
      if (newValue) {
        await fetchBookings();
      }
    } catch (err: unknown) {
      console.error("Toggle auto-accept error:", err);
      const errorMessage = axios.isAxiosError(err) && err.response?.data?.error
        ? err.response.data.error
        : "Failed to update auto-accept setting";
      alert(errorMessage);
    } finally {
      setIsTogglingAutoAccept(false);
    }
  };

  const filteredBookings =
    filter === "ALL" ? bookings : bookings.filter((b) => b.status === filter);

  if (status === "loading" || loading) {
    return (
      <CommonLayout>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
        </div>
      </CommonLayout>
    );
  }

  return (
    <CommonLayout>
      <div className="bg-slate-50">
        {/* Header */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Host Dashboard
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  Manage bookings and parking spots
                </p>
              </div>

              {/* Stats & Auto-Accept */}
              <div className="flex items-center gap-6">
                {/* Auto-Accept Toggle */}
                <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-900">
                      Auto-Accept
                    </p>
                    <p className="text-xs text-slate-500">New bookings</p>
                  </div>
                  <button
                    onClick={toggleAutoAccept}
                    disabled={isTogglingAutoAccept}
                    className={`relative w-14 h-7 rounded-full transition ${
                      autoAccept ? "bg-emerald-500" : "bg-slate-300"
                    } ${isTogglingAutoAccept ? "opacity-50" : ""}`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        autoAccept ? "translate-x-7" : ""
                      }`}
                    />
                  </button>
                </div>

                {/* Stats */}
                <div className="hidden md:flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-900">
                      {bookings.filter((b) => b.status === "PENDING").length}
                    </p>
                    <p className="text-xs text-slate-500">Pending</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-900">
                      {bookings.filter((b) => b.status === "CONFIRMED").length}
                    </p>
                    <p className="text-xs text-slate-500">Active</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-600">
                      $
                      {bookings
                        .filter((b) => b.status === "COMPLETED")
                        .reduce((sum, b) => sum + b.totalPrice, 0)
                        .toFixed(0)}
                    </p>
                    <p className="text-xs text-slate-500">Revenue</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mt-6 border-b border-slate-200">
              <button
                onClick={() => setActiveTab("bookings")}
                className={`pb-3 px-1 text-sm font-semibold border-b-2 transition ${
                  activeTab === "bookings"
                    ? "border-emerald-500 text-emerald-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                Bookings ({bookings.length})
              </button>
              <button
                onClick={() => setActiveTab("spots")}
                className={`pb-3 px-1 text-sm font-semibold border-b-2 transition ${
                  activeTab === "spots"
                    ? "border-emerald-500 text-emerald-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                Parking Spots ({carParkings.length + bikeParkings.length})
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Bookings Tab */}
          {activeTab === "bookings" && (
            <div>
              {/* Filters */}
              <div className="flex flex-wrap gap-2 mb-6">
                {["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].map(
                  (statusFilter) => (
                    <button
                      key={statusFilter}
                      onClick={() => setFilter(statusFilter as "ALL" | "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED")}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                        filter === statusFilter
                          ? "bg-emerald-500 text-white shadow-sm"
                          : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
                      }`}
                    >
                      {statusFilter}{" "}
                      <span className="opacity-70">
                        (
                        {statusFilter === "ALL"
                          ? bookings.length
                          : bookings.filter((b) => b.status === statusFilter)
                              .length}
                        )
                      </span>
                    </button>
                  )
                )}
              </div>

              {/* Bookings Grid */}
              {filteredBookings.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                  <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <svg
                      className="w-8 h-8 text-slate-400"
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
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">
                    No bookings found
                  </h3>
                  <p className="text-sm text-slate-500">
                    {filter === "ALL"
                      ? "No bookings yet"
                      : `No ${filter.toLowerCase()} bookings`}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition group"
                    >
                      {/* Status Bar */}
                      <div
                        className={`h-1.5 ${getStatusColor(booking.status)}`}
                      />

                      <div className="p-5">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <p className="font-bold text-slate-900 mb-1">
                              {booking.user.name || "Guest"}
                            </p>
                            <p className="text-xs text-slate-500">
                              {booking.user.email}
                            </p>
                          </div>
                          <span
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${getStatusBadge(
                              booking.status
                            )}`}
                          >
                            {booking.status}
                          </span>
                        </div>

                        {/* Vehicle */}
                        <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-lg">
                          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                            🚗
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {booking.vehicle.make} {booking.vehicle.model}
                            </p>
                            <p className="text-xs text-slate-500">
                              {booking.vehicle.licensePlate}
                            </p>
                          </div>
                        </div>

                        {/* Time & Price */}
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-500">Check-in</span>
                            <span className="font-medium text-slate-900">
                              {formatDate(booking.startTime)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-500">Duration</span>
                            <span className="font-medium text-slate-900">
                              {formatDuration(
                                booking.startTime,
                                booking.endTime
                              )}
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                            <span className="text-sm font-semibold text-slate-900">
                              Total
                            </span>
                            <span className="text-lg font-bold text-emerald-600">
                              ${booking.totalPrice.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        {booking.status === "PENDING" && (
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                updateBookingStatus(booking.id, "CONFIRMED")
                              }
                              disabled={updatingBookingId === booking.id}
                              className="flex-1 bg-emerald-500 text-white py-2 rounded-lg text-sm font-semibold hover:bg-emerald-600 transition disabled:opacity-50"
                            >
                              {updatingBookingId === booking.id
                                ? "..."
                                : "Accept"}
                            </button>
                            <button
                              onClick={() =>
                                updateBookingStatus(booking.id, "CANCELLED")
                              }
                              disabled={updatingBookingId === booking.id}
                              className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg text-sm font-semibold hover:bg-slate-200 transition disabled:opacity-50"
                            >
                              {updatingBookingId === booking.id
                                ? "..."
                                : "Decline"}
                            </button>
                          </div>
                        )}

                        {booking.status === "CONFIRMED" && (
                          <button
                            onClick={() =>
                              updateBookingStatus(booking.id, "COMPLETED")
                            }
                            disabled={updatingBookingId === booking.id}
                            className="w-full bg-blue-500 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 transition disabled:opacity-50"
                          >
                            {updatingBookingId === booking.id
                              ? "Updating..."
                              : "Mark Complete"}
                          </button>
                        )}

                        {booking.status === "COMPLETED" && (
                          <div className="text-center py-2 text-sm text-emerald-600 font-medium">
                            ✓ Completed
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Parking Spots Tab */}
          {activeTab === "spots" && (
            <div className="space-y-8">
              {/* Car Parking */}
              {carParkings.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-slate-900 mb-4">
                    Car Parking ({carParkings.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {carParkings.map((spot, index) => (
                      <div
                        key={spot.id}
                        className={`bg-white rounded-xl border-2 p-4 transition hover:shadow-md ${
                          spot.isBooked
                            ? "border-blue-300 bg-blue-50"
                            : spot.available
                            ? "border-slate-200"
                            : "border-slate-300 bg-slate-50"
                        }`}
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                                spot.isBooked
                                  ? "bg-blue-500 text-white"
                                  : "bg-blue-100 text-blue-600"
                              }`}
                            >
                              C{index + 1}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">
                                Spot {index + 1}
                              </p>
                            </div>
                          </div>

                          {/* Toggle */}
                          <button
                            onClick={() =>
                              toggleParkingSpot(spot.id, "car", spot.available)
                            }
                            disabled={
                              togglingSpotId === spot.id || spot.isBooked
                            }
                            className={`relative w-11 h-6 rounded-full transition ${
                              spot.available ? "bg-emerald-500" : "bg-slate-300"
                            } ${
                              togglingSpotId === spot.id || spot.isBooked
                                ? "opacity-50"
                                : ""
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                                spot.available ? "translate-x-5" : ""
                              }`}
                            />
                          </button>
                        </div>

                        {/* Features */}
                        <div className="flex gap-2 mb-3">
                          {spot.charging && (
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
                              ⚡ Charging
                            </span>
                          )}
                          {spot.covered && (
                            <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                              🏠 Covered
                            </span>
                          )}
                        </div>

                        {/* Price */}
                        <div className="flex items-baseline gap-1 mb-2">
                          <span className="text-lg font-bold text-slate-900">
                            ${spot.hourlyRate}
                          </span>
                          <span className="text-xs text-slate-500">/hr</span>
                        </div>

                        {/* Status */}
                        <div className="pt-3 border-t border-slate-200">
                          {spot.isBooked ? (
                            <span className="text-xs font-semibold text-blue-600">
                              🔵 Reserved
                            </span>
                          ) : spot.available ? (
                            <span className="text-xs font-semibold text-emerald-600">
                              ✓ Available
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-slate-500">
                              ✗ Unavailable
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bike Parking */}
              {bikeParkings.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-slate-900 mb-4">
                    Bike Parking ({bikeParkings.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {bikeParkings.map((spot, index) => (
                      <div
                        key={spot.id}
                        className={`bg-white rounded-xl border-2 p-4 transition hover:shadow-md ${
                          spot.isBooked
                            ? "border-orange-300 bg-orange-50"
                            : spot.available
                            ? "border-slate-200"
                            : "border-slate-300 bg-slate-50"
                        }`}
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                                spot.isBooked
                                  ? "bg-orange-500 text-white"
                                  : "bg-orange-100 text-orange-600"
                              }`}
                            >
                              B{index + 1}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">
                                Spot {index + 1}
                              </p>
                            </div>
                          </div>

                          {/* Toggle */}
                          <button
                            onClick={() =>
                              toggleParkingSpot(spot.id, "bike", spot.available)
                            }
                            disabled={
                              togglingSpotId === spot.id || spot.isBooked
                            }
                            className={`relative w-11 h-6 rounded-full transition ${
                              spot.available ? "bg-emerald-500" : "bg-slate-300"
                            } ${
                              togglingSpotId === spot.id || spot.isBooked
                                ? "opacity-50"
                                : ""
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                                spot.available ? "translate-x-5" : ""
                              }`}
                            />
                          </button>
                        </div>

                        {/* Features */}
                        {spot.covered && (
                          <div className="mb-3">
                            <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                              🏠 Covered
                            </span>
                          </div>
                        )}

                        {/* Price */}
                        <div className="flex items-baseline gap-1 mb-2">
                          <span className="text-lg font-bold text-slate-900">
                            ${spot.hourlyRate}
                          </span>
                          <span className="text-xs text-slate-500">/hr</span>
                        </div>

                        {/* Status */}
                        <div className="pt-3 border-t border-slate-200">
                          {spot.isBooked ? (
                            <span className="text-xs font-semibold text-orange-600">
                              🟠 Reserved
                            </span>
                          ) : spot.available ? (
                            <span className="text-xs font-semibold text-emerald-600">
                              ✓ Available
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-slate-500">
                              ✗ Unavailable
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {carParkings.length === 0 && bikeParkings.length === 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                  <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <svg
                      className="w-8 h-8 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">
                    No parking spots
                  </h3>
                  <p className="text-sm text-slate-500">
                    Add parking spots to your listing
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 max-w-md bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 shadow-lg">
          {error}
        </div>
      )}
    </CommonLayout>
  );
}
