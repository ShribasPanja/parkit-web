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
  landOwner: {
    id: string;
    name: string;
    email: string;
  };
  vehicle: {
    id: string;
    make: string;
    model: string;
    licensePlate: string;
    type: "CAR" | "BIKE" | "TRUCK" | "VAN";
  };
}

export default function MyBookingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<
    "ALL" | "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED"
  >("ALL");
  const [ratingBookingId, setRatingBookingId] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";
      const response = await axios.get(`${backendUrl}/user/bookings`, {
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

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.accessToken) {
      fetchBookings();
    }
  }, [session?.accessToken, fetchBookings]);

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

  const submitRating = async (booking: Booking) => {
    if (rating === 0) {
      alert("Please select a rating");
      return;
    }

    try {
      setSubmittingRating(true);
      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";
      await axios.post(
        `${backendUrl}/owner/ratings`,
        {
          landOwnerId: booking.landOwner.id,
          rating: rating,
          review: review.trim() || null,
        },
        {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Reset rating form
      setRatingBookingId(null);
      setRating(0);
      setHoverRating(0);
      setReview("");

      alert("Thank you for your rating!");
    } catch (err: unknown) {
      console.error("Submit rating error:", err);
      const errorMessage = axios.isAxiosError(err) && err.response?.data?.error
        ? err.response.data.error
        : "Failed to submit rating";
      alert(errorMessage);
    } finally {
      setSubmittingRating(false);
    }
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return "🕐";
      case "CONFIRMED":
        return "✓";
      case "CANCELLED":
        return "✗";
      case "COMPLETED":
        return "✓";
      default:
        return "○";
    }
  };

  const filteredBookings =
    filter === "ALL" ? bookings : bookings.filter((b) => b.status === filter);

  // Calculate stats
  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "PENDING").length,
    confirmed: bookings.filter((b) => b.status === "CONFIRMED").length,
    completed: bookings.filter((b) => b.status === "COMPLETED").length,
    totalSpent: bookings
      .filter((b) => b.status === "COMPLETED")
      .reduce((sum, b) => sum + b.totalPrice, 0),
  };

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
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  My Bookings
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  View and manage your parking reservations
                </p>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4">
                <div className="text-center px-4 py-2 bg-slate-50 rounded-lg">
                  <p className="text-2xl font-bold text-slate-900">
                    {stats.confirmed}
                  </p>
                  <p className="text-xs text-slate-500">Active</p>
                </div>
                <div className="text-center px-4 py-2 bg-emerald-50 rounded-lg border border-emerald-200">
                  <p className="text-2xl font-bold text-emerald-600">
                    ${stats.totalSpent.toFixed(0)}
                  </p>
                  <p className="text-xs text-slate-500">Total Spent</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

          {/* Bookings List */}
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
              <p className="text-sm text-slate-500 mb-4">
                {filter === "ALL"
                  ? "You haven't made any bookings yet"
                  : `No ${filter.toLowerCase()} bookings`}
              </p>
              <button
                onClick={() => router.push("/map")}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Book a Parking Spot
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition group"
                >
                  {/* Status Bar */}
                  <div className={`h-1.5 ${getStatusColor(booking.status)}`} />

                  <div className="p-5">
                    {/* Show rating form if this booking is being rated */}
                    {ratingBookingId === booking.id ? (
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                          <div>
                            <h3 className="text-lg font-bold text-slate-900">
                              Rate Your Experience
                            </h3>
                            <p className="text-xs text-slate-500">
                              {booking.landOwner.name}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setRatingBookingId(null);
                              setRating(0);
                              setHoverRating(0);
                              setReview("");
                            }}
                            disabled={submittingRating}
                            className="text-slate-400 hover:text-slate-600 transition disabled:opacity-50"
                          >
                            <svg
                              className="w-6 h-6"
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

                        {/* Star Rating */}
                        <div className="text-center py-6">
                          <p className="text-sm text-slate-600 mb-4">
                            How would you rate this parking spot?
                          </p>
                          <div className="flex items-center justify-center gap-3">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                className="transition-transform hover:scale-125 focus:outline-none"
                              >
                                <svg
                                  className={`w-12 h-12 ${
                                    star <= (hoverRating || rating)
                                      ? "text-yellow-400 fill-yellow-400"
                                      : "text-slate-300 fill-slate-300"
                                  } transition-colors`}
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={1}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                                  />
                                </svg>
                              </button>
                            ))}
                          </div>
                          {rating > 0 && (
                            <p className="text-sm text-slate-600 mt-3">
                              {rating === 1 && "Poor"}
                              {rating === 2 && "Fair"}
                              {rating === 3 && "Good"}
                              {rating === 4 && "Very Good"}
                              {rating === 5 && "Excellent"}
                            </p>
                          )}
                        </div>

                        {/* Review Text */}
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Share your experience (optional)
                          </label>
                          <textarea
                            value={review}
                            onChange={(e) => setReview(e.target.value)}
                            placeholder="Tell us about your parking experience..."
                            className="w-full px-4 py-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                            rows={4}
                          />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-2">
                          <button
                            onClick={() => submitRating(booking)}
                            disabled={submittingRating || rating === 0}
                            className="flex-1 bg-emerald-500 text-white py-3 rounded-lg text-sm font-semibold hover:bg-emerald-600 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                          >
                            {submittingRating ? (
                              <span className="flex items-center justify-center gap-2">
                                <svg
                                  className="animate-spin h-4 w-4"
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
                                Submitting...
                              </span>
                            ) : (
                              "Submit Rating"
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setRatingBookingId(null);
                              setRating(0);
                              setHoverRating(0);
                              setReview("");
                            }}
                            disabled={submittingRating}
                            className="px-6 bg-slate-100 text-slate-700 py-3 rounded-lg text-sm font-semibold hover:bg-slate-200 transition disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Normal booking card content */}
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <svg
                                className="w-5 h-5 text-slate-400"
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
                              <p className="font-bold text-slate-900">
                                {booking.landOwner.name}
                              </p>
                            </div>
                            <p className="text-xs text-slate-500">
                              {booking.landOwner.email}
                            </p>
                          </div>
                          <span
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${getStatusBadge(
                              booking.status
                            )}`}
                          >
                            {getStatusIcon(booking.status)} {booking.status}
                          </span>
                        </div>

                        {/* Vehicle */}
                        <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-lg">
                          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-xl">
                            {booking.vehicle.type === "CAR" && "🚗"}
                            {booking.vehicle.type === "BIKE" && "🏍️"}
                            {booking.vehicle.type === "TRUCK" && "🚚"}
                            {booking.vehicle.type === "VAN" && "🚐"}
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
                            <span className="text-slate-500">Start</span>
                            <span className="font-medium text-slate-900">
                              {formatDate(booking.startTime)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-500">End</span>
                            <span className="font-medium text-slate-900">
                              {formatDate(booking.endTime)}
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

                        {/* Status Message */}
                        {booking.status === "PENDING" && (
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                            <p className="text-xs text-amber-700 font-medium">
                              ⏳ Waiting for host confirmation
                            </p>
                          </div>
                        )}

                        {booking.status === "CONFIRMED" && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                            <p className="text-xs text-blue-700 font-medium">
                              ✓ Confirmed - See you there!
                            </p>
                          </div>
                        )}

                        {booking.status === "COMPLETED" && (
                          <>
                            {ratingBookingId === booking.id ? (
                              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                                <p className="text-sm font-semibold text-slate-900 mb-3">
                                  Rate your parking experience
                                </p>

                                {/* Star Rating */}
                                <div className="flex items-center justify-center gap-2 mb-3">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      type="button"
                                      onClick={() => setRating(star)}
                                      onMouseEnter={() => setHoverRating(star)}
                                      onMouseLeave={() => setHoverRating(0)}
                                      className="transition-transform hover:scale-110"
                                    >
                                      <svg
                                        className={`w-8 h-8 ${
                                          star <= (hoverRating || rating)
                                            ? "text-yellow-400 fill-yellow-400"
                                            : "text-slate-300 fill-slate-300"
                                        }`}
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={1}
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                                        />
                                      </svg>
                                    </button>
                                  ))}
                                </div>

                                {/* Review Text */}
                                <textarea
                                  value={review}
                                  onChange={(e) => setReview(e.target.value)}
                                  placeholder="Share your experience (optional)"
                                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-3"
                                  rows={3}
                                />

                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => submitRating(booking)}
                                    disabled={submittingRating || rating === 0}
                                    className="flex-1 bg-emerald-500 text-white py-2 rounded-lg text-sm font-semibold hover:bg-emerald-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {submittingRating
                                      ? "Submitting..."
                                      : "Submit Rating"}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setRatingBookingId(null);
                                      setRating(0);
                                      setHoverRating(0);
                                      setReview("");
                                    }}
                                    disabled={submittingRating}
                                    className="px-4 bg-slate-100 text-slate-700 py-2 rounded-lg text-sm font-semibold hover:bg-slate-200 transition disabled:opacity-50"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                                  <p className="text-xs text-emerald-700 font-medium">
                                    ✓ Completed - Thank you!
                                  </p>
                                </div>
                                <button
                                  onClick={() => setRatingBookingId(booking.id)}
                                  className="w-full bg-white border-2 border-emerald-500 text-emerald-600 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-50 transition flex items-center justify-center gap-2"
                                >
                                  <svg
                                    className="w-4 h-4 fill-current"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                  >
                                    <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                                  </svg>
                                  Rate Your Experience
                                </button>
                              </div>
                            )}
                          </>
                        )}

                        {booking.status === "CANCELLED" && (
                          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                            <p className="text-xs text-slate-600 font-medium">
                              ✗ Cancelled
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
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
