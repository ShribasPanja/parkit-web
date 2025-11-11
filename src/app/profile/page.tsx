"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { CommonLayout } from "@/components/layout/CommonLayout";

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  type: string;
}

interface UserDetails {
  id: string;
  email: string;
  name: string | null;
  vehicles: Vehicle[];
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [showVehicleForm, setShowVehicleForm] = useState(false);

  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
  });

  const [vehicleData, setVehicleData] = useState({
    make: "",
    model: "",
    year: new Date().getFullYear(),
    licensePlate: "",
    type: "CAR",
  });

  const fetchUserDetails = useCallback(async () => {
    try {
      setLoading(true);
      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";
      const response = await axios.get(`${backendUrl}/user/details`, {
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });
      setUserDetails(response.data.user);
      setProfileData({
        name: response.data.user.name || "",
        email: response.data.user.email || "",
      });
    } catch (err: unknown) {
      console.error("Fetch user details error:", err);
      setError("Failed to load profile details");
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    } else if (status === "authenticated") {
      fetchUserDetails();
    }
  }, [status, router, fetchUserDetails]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";
      const response = await axios.post(
        `${backendUrl}/user/details`,
        {
          name: profileData.name,
          email: profileData.email,
        },
        {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      setUserDetails(response.data.user);
      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: unknown) {
      const errorMessage = axios.isAxiosError(err) && err.response?.data?.error
        ? err.response.data.error
        : "Failed to update profile";
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";
      const response = await axios.post(
        `${backendUrl}/user/details`,
        {
          name: userDetails?.name,
          email: userDetails?.email,
          vehicles: [vehicleData],
        },
        {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      setUserDetails(response.data.user);
      setSuccess("Vehicle added successfully!");
      setShowVehicleForm(false);
      setVehicleData({
        make: "",
        model: "",
        year: new Date().getFullYear(),
        licensePlate: "",
        type: "CAR",
      });
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: unknown) {
      const errorMessage = axios.isAxiosError(err) && err.response?.data?.error
        ? err.response.data.error
        : "Failed to add vehicle";
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <CommonLayout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading profile...</p>
          </div>
        </div>
      </CommonLayout>
    );
  }

  return (
    <CommonLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
            <p className="mt-2 text-slate-600">
              Manage your account information and vehicles
            </p>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="mb-6 rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          )}
          {error && (
            <div className="mb-6 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Profile Information Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-4">
                Profile Information
              </h2>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) =>
                      setProfileData({ ...profileData, name: e.target.value })
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 transition focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-100"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) =>
                      setProfileData({ ...profileData, email: e.target.value })
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 transition focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-100"
                    placeholder="Enter your email"
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200/80 transition hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Saving..." : "Update Profile"}
                </button>
              </form>
            </div>

            {/* Vehicles Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    My Vehicles
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    Add vehicles to make bookings
                  </p>
                </div>
                {!showVehicleForm && (
                  <button
                    onClick={() => setShowVehicleForm(true)}
                    className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-200/80 transition hover:bg-emerald-600"
                  >
                    Add Vehicle
                  </button>
                )}
              </div>

              {/* Add Vehicle Form */}
              {showVehicleForm && (
                <form
                  onSubmit={handleAddVehicle}
                  className="mb-6 rounded-xl border-2 border-emerald-200 bg-emerald-50 p-4 space-y-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-slate-900">
                      Add New Vehicle
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowVehicleForm(false)}
                      className="text-slate-500 hover:text-slate-700"
                    >
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Vehicle Type
                      </label>
                      <select
                        value={vehicleData.type}
                        onChange={(e) =>
                          setVehicleData({
                            ...vehicleData,
                            type: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                      >
                        <option value="CAR">Car</option>
                        <option value="BIKE">Bike/Motorcycle</option>
                        <option value="TRUCK">Truck</option>
                        <option value="VAN">Van</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Year
                      </label>
                      <input
                        type="number"
                        value={vehicleData.year}
                        onChange={(e) =>
                          setVehicleData({
                            ...vehicleData,
                            year: parseInt(e.target.value),
                          })
                        }
                        min="1900"
                        max={new Date().getFullYear() + 1}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Make
                      </label>
                      <input
                        type="text"
                        value={vehicleData.make}
                        onChange={(e) =>
                          setVehicleData({
                            ...vehicleData,
                            make: e.target.value,
                          })
                        }
                        placeholder="e.g., Toyota, Honda"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Model
                      </label>
                      <input
                        type="text"
                        value={vehicleData.model}
                        onChange={(e) =>
                          setVehicleData({
                            ...vehicleData,
                            model: e.target.value,
                          })
                        }
                        placeholder="e.g., Camry, Civic"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        License Plate
                      </label>
                      <input
                        type="text"
                        value={vehicleData.licensePlate}
                        onChange={(e) =>
                          setVehicleData({
                            ...vehicleData,
                            licensePlate: e.target.value.toUpperCase(),
                          })
                        }
                        placeholder="e.g., ABC-1234"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowVehicleForm(false)}
                      className="flex-1 rounded-full border-2 border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-200/80 transition hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? "Adding..." : "Add Vehicle"}
                    </button>
                  </div>
                </form>
              )}

              {/* Vehicles List */}
              <div className="space-y-3">
                {userDetails?.vehicles.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                      <svg
                        className="h-8 w-8 text-slate-400"
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
                    </div>
                    <p className="text-sm font-semibold text-slate-900 mb-1">
                      No vehicles added yet
                    </p>
                    <p className="text-xs text-slate-600">
                      Add a vehicle to start making parking reservations
                    </p>
                  </div>
                ) : (
                  userDetails?.vehicles.map((vehicle) => (
                    <div
                      key={vehicle.id}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600 border-2 border-emerald-200">
                          {vehicle.type === "CAR" && (
                            <svg
                              className="h-6 w-6"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
                            </svg>
                          )}
                          {vehicle.type === "BIKE" && (
                            <svg
                              className="h-6 w-6"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M15.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM5 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5zm5.8-10l2.4-2.4.8.8c1.3 1.3 3 2.1 5.1 2.1V9c-1.5 0-2.7-.6-3.6-1.5l-1.9-1.9c-.5-.4-1-.6-1.6-.6s-1.1.2-1.4.6L7.8 8.4c-.4.4-.6.9-.6 1.4 0 .6.2 1.1.6 1.4L11 14v5h2v-6.2l-2.2-2.3zM19 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5z" />
                            </svg>
                          )}
                          {(vehicle.type === "TRUCK" ||
                            vehicle.type === "VAN") && (
                            <svg
                              className="h-6 w-6"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </h3>
                          <p className="text-sm text-slate-600">
                            {vehicle.licensePlate} • {vehicle.type}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </CommonLayout>
  );
}
