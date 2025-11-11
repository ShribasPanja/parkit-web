"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { BecomeHostSchema } from "@/lib/validations/host";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { LocationPicker } from "@/components/map/LocationPicker";

interface BecomeHostModalProps {
  open: boolean;
  onClose: () => void;
}

interface CarParkingSpot {
  charging: boolean;
  covered: boolean;
  available: boolean;
  hourlyRate: number;
  dailyRate: number;
}

interface BikeParkingSpot {
  covered: boolean;
  available: boolean;
  hourlyRate: number;
  dailyRate: number;
}

interface HostFormData {
  name: string;
  email: string;
  phone: string;
  about: string;
  address: string;
  coordinates: string;
  carparkings: CarParkingSpot[];
  bikeparkings: BikeParkingSpot[];
  images: { url: string }[];
}

export function BecomeHostModal({ open, onClose }: BecomeHostModalProps) {
  const { data: session } = useSession();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<HostFormData>({
    name: session?.user?.name || "",
    email: session?.user?.email || "",
    phone: "",
    about: "",
    address: "",
    coordinates: "",
    carparkings: [],
    bikeparkings: [],
    images: [],
  });

  const [currentCarParking, setCurrentCarParking] = useState<CarParkingSpot>({
    charging: false,
    covered: false,
    available: true,
    hourlyRate: 0,
    dailyRate: 0,
  });

  const [currentBikeParking, setCurrentBikeParking] = useState<BikeParkingSpot>(
    {
      covered: false,
      available: true,
      hourlyRate: 0,
      dailyRate: 0,
    }
  );

  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [mapCoordinates, setMapCoordinates] = useState({
    lat: 20.5937, // Default to India center
    lng: 78.9629,
  });

  useEffect(() => {
    if (!open) {
      setStep(1);
      setError("");
      setSuccess(false);
    }
  }, [open]);

  useEffect(() => {
    if (session?.user) {
      setFormData((prev) => ({
        ...prev,
        name: session.user.name || prev.name,
        email: session.user.email || prev.email,
      }));
    }
  }, [session]);

  // Parse coordinates when formData.coordinates changes (for initial load)
  useEffect(() => {
    if (formData.coordinates) {
      const [lat, lng] = formData.coordinates.split(",").map(Number);
      if (!isNaN(lat) && !isNaN(lng)) {
        setMapCoordinates({ lat, lng });
      }
    }
  }, [formData.coordinates]);

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

  const handleNext = () => {
    setError("");
    if (step === 1) {
      if (!formData.name || !formData.email || !formData.phone) {
        setError("Please fill in all required fields");
        return;
      }
      // Validate phone number format (should already be formatted by PhoneInput)
      const phoneRegex = /^\+\d{1,4}\d{6,15}$/;
      if (!phoneRegex.test(formData.phone)) {
        setError("Please enter a valid phone number");
        return;
      }
    }
    if (step === 2) {
      if (!formData.about || !formData.address || !formData.coordinates) {
        setError("Please fill in all fields and select a location on the map");
        return;
      }
    }
    // Step 3 (car parking) - can be skipped if they'll add bike parking
    // Step 4 (bike parking) - validate that at least one parking type exists
    if (step === 4) {
      if (
        formData.carparkings.length === 0 &&
        formData.bikeparkings.length === 0
      ) {
        setError("Please add at least one parking spot (car or bike)");
        return;
      }
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setError("");
    setStep(step - 1);
  };

  const addCarParking = () => {
    if (currentCarParking.hourlyRate <= 0 && currentCarParking.dailyRate <= 0) {
      setError("Please set at least one rate (hourly or daily)");
      return;
    }
    setFormData({
      ...formData,
      carparkings: [...formData.carparkings, currentCarParking],
    });
    setCurrentCarParking({
      charging: false,
      covered: false,
      available: true,
      hourlyRate: 0,
      dailyRate: 0,
    });
    setError("");
  };

  const removeCarParking = (index: number) => {
    setFormData({
      ...formData,
      carparkings: formData.carparkings.filter((_, i) => i !== index),
    });
  };

  const addBikeParking = () => {
    if (
      currentBikeParking.hourlyRate <= 0 &&
      currentBikeParking.dailyRate <= 0
    ) {
      setError("Please set at least one rate (hourly or daily)");
      return;
    }
    setFormData({
      ...formData,
      bikeparkings: [...formData.bikeparkings, currentBikeParking],
    });
    setCurrentBikeParking({
      covered: false,
      available: true,
      hourlyRate: 0,
      dailyRate: 0,
    });
    setError("");
  };

  const removeBikeParking = (index: number) => {
    setFormData({
      ...formData,
      bikeparkings: formData.bikeparkings.filter((_, i) => i !== index),
    });
  };

  const addImage = () => {
    if (!currentImageUrl) {
      setError("Please enter an image URL");
      return;
    }
    try {
      new URL(currentImageUrl);
      setFormData({
        ...formData,
        images: [...formData.images, { url: currentImageUrl }],
      });
      setCurrentImageUrl("");
      setError("");
    } catch {
      setError("Please enter a valid URL");
    }
  };

  const removeImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    });
  };

  const handleLocationChange = (lat: number, lng: number) => {
    setMapCoordinates({ lat, lng });
    setFormData({
      ...formData,
      coordinates: `${lat},${lng}`,
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      // Validate form data with Zod schema
      const validatedData = BecomeHostSchema.parse(formData);

      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

      // Get the access token from session
      const token = session?.accessToken;
      if (!token) {
        setError("Authentication required. Please sign in again.");
        setLoading(false);
        return;
      }

      const response = await axios.post(
        `${backendUrl}/landOwner`,
        validatedData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 201) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 2000);
      }
    } catch (err: unknown) {
      // Handle Zod validation errors
      if (err instanceof Error && err.name === "ZodError") {
        const zodError = err as unknown as { errors: Array<{ message: string }> };
        const firstError = zodError.errors[0];
        setError(firstError.message || "Please check your input");
      } else {
        const errorMessage = axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : "Failed to register as host";
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  if (success) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 px-6 backdrop-blur-sm"
      >
        <div className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl shadow-slate-900/20 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <svg
              className="h-8 w-8 text-emerald-600"
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
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">
            Welcome aboard!
          </h2>
          <p className="text-slate-600">
            Your hosting profile has been created successfully.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 px-6 backdrop-blur-sm overflow-y-auto py-8"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-3xl bg-white p-8 shadow-2xl shadow-slate-900/20 my-8"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">
              Step {step} of 5
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {Math.round((step / 5) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        </div>

        <div className="space-y-6 text-slate-900">
          {/* Step 1: Basic Information */}
          {step === 1 && (
            <>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold">Basic Information</h2>
                <p className="text-sm text-slate-500">
                  Let&apos;s start with your contact details
                </p>
              </div>
              {error && (
                <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}
              <div className="space-y-4">
                <label className="flex flex-col gap-2 text-sm text-slate-700">
                  Full Name <span className="text-red-500">*</span>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 transition focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-100"
                    placeholder="John Doe"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm text-slate-700">
                  Email <span className="text-red-500">*</span>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 transition focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-100"
                    placeholder="john@example.com"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm text-slate-700">
                  Phone Number <span className="text-red-500">*</span>
                  <PhoneInput
                    country={"in"}
                    value={formData.phone}
                    onChange={(phone) =>
                      setFormData({ ...formData, phone: `+${phone}` })
                    }
                    inputStyle={{
                      width: "100%",
                      height: "48px",
                      fontSize: "14px",
                      paddingLeft: "48px",
                      borderRadius: "16px",
                      border: "1px solid #e2e8f0",
                      backgroundColor: "#f8fafc",
                    }}
                    buttonStyle={{
                      borderRadius: "16px 0 0 16px",
                      border: "1px solid #e2e8f0",
                      backgroundColor: "#f8fafc",
                    }}
                    containerStyle={{
                      width: "100%",
                    }}
                    dropdownStyle={{
                      borderRadius: "12px",
                    }}
                  />
                  <p className="text-xs text-slate-500">
                    Select your country and enter your phone number
                  </p>
                </label>
              </div>
            </>
          )}

          {/* Step 2: About & Location */}
          {step === 2 && (
            <>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold">About & Location</h2>
                <p className="text-sm text-slate-500">
                  Tell us about your parking space
                </p>
              </div>
              {error && (
                <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}
              <div className="space-y-4">
                <label className="flex flex-col gap-2 text-sm text-slate-700">
                  About Your Space <span className="text-red-500">*</span>
                  <textarea
                    value={formData.about}
                    onChange={(e) =>
                      setFormData({ ...formData, about: e.target.value })
                    }
                    rows={4}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 transition focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-100"
                    placeholder="Describe your parking space, accessibility, nearby landmarks..."
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm text-slate-700">
                  Address <span className="text-red-500">*</span>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 transition focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-100"
                    placeholder="123 Main St, City, Country"
                  />
                </label>
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-slate-700">
                    Location Pin <span className="text-red-500">*</span>
                  </label>
                  <LocationPicker
                    latitude={mapCoordinates.lat}
                    longitude={mapCoordinates.lng}
                    onLocationChange={handleLocationChange}
                  />
                </div>
              </div>
            </>
          )}

          {/* Step 3: Car Parking Spots */}
          {step === 3 && (
            <>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold">
                  Car Parking Spots <span className="text-red-500">*</span>
                </h2>
                <p className="text-sm text-slate-500">
                  Add your car parking spaces (you can add bike parking in the
                  next step)
                </p>
              </div>
              {error && (
                <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}
              <div className="space-y-4">
                {formData.carparkings.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-700">
                      Added Spots ({formData.carparkings.length})
                    </p>
                    {formData.carparkings.map((spot, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-xl bg-slate-50 p-3"
                      >
                        <div className="text-sm">
                          <span className="font-semibold">
                            Spot {index + 1}
                          </span>
                          <span className="text-slate-500 ml-2">
                            {spot.charging ? "• Charging" : ""}{" "}
                            {spot.covered ? "• Covered" : ""}
                          </span>
                          <div className="text-xs text-slate-500">
                            ${spot.hourlyRate}/hr • ${spot.dailyRate}/day
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCarParking(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="rounded-2xl border-2 border-dashed border-slate-200 p-4 space-y-4">
                  <p className="text-sm font-semibold text-slate-700">
                    Add New Spot
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={currentCarParking.charging}
                        onChange={(e) =>
                          setCurrentCarParking({
                            ...currentCarParking,
                            charging: e.target.checked,
                          })
                        }
                        className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-400"
                      />
                      EV Charging
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={currentCarParking.covered}
                        onChange={(e) =>
                          setCurrentCarParking({
                            ...currentCarParking,
                            covered: e.target.checked,
                          })
                        }
                        className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-400"
                      />
                      Covered
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex flex-col gap-2 text-sm text-slate-700">
                      Hourly Rate ($)
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={currentCarParking.hourlyRate}
                        onChange={(e) =>
                          setCurrentCarParking({
                            ...currentCarParking,
                            hourlyRate: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-sm text-slate-700">
                      Daily Rate ($)
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={currentCarParking.dailyRate}
                        onChange={(e) =>
                          setCurrentCarParking({
                            ...currentCarParking,
                            dailyRate: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                      />
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={addCarParking}
                    className="w-full rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 transition"
                  >
                    Add Car Spot
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Step 4: Bike Parking Spots */}
          {step === 4 && (
            <>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold">
                  Bike Parking Spots <span className="text-red-500">*</span>
                </h2>
                <p className="text-sm text-slate-500">
                  Add your bike parking spaces (at least one parking type
                  required)
                </p>
              </div>
              {error && (
                <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}
              <div className="space-y-4">
                {formData.bikeparkings.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-700">
                      Added Spots ({formData.bikeparkings.length})
                    </p>
                    {formData.bikeparkings.map((spot, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-xl bg-slate-50 p-3"
                      >
                        <div className="text-sm">
                          <span className="font-semibold">
                            Spot {index + 1}
                          </span>
                          <span className="text-slate-500 ml-2">
                            {spot.covered ? "• Covered" : ""}
                          </span>
                          <div className="text-xs text-slate-500">
                            ${spot.hourlyRate}/hr • ${spot.dailyRate}/day
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeBikeParking(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="rounded-2xl border-2 border-dashed border-slate-200 p-4 space-y-4">
                  <p className="text-sm font-semibold text-slate-700">
                    Add New Spot
                  </p>
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={currentBikeParking.covered}
                      onChange={(e) =>
                        setCurrentBikeParking({
                          ...currentBikeParking,
                          covered: e.target.checked,
                        })
                      }
                      className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-400"
                    />
                    Covered
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex flex-col gap-2 text-sm text-slate-700">
                      Hourly Rate ($)
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={currentBikeParking.hourlyRate}
                        onChange={(e) =>
                          setCurrentBikeParking({
                            ...currentBikeParking,
                            hourlyRate: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-sm text-slate-700">
                      Daily Rate ($)
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={currentBikeParking.dailyRate}
                        onChange={(e) =>
                          setCurrentBikeParking({
                            ...currentBikeParking,
                            dailyRate: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                      />
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={addBikeParking}
                    className="w-full rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 transition"
                  >
                    Add Bike Spot
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Step 5: Images */}
          {step === 5 && (
            <>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold">Property Images</h2>
                <p className="text-sm text-slate-500">
                  Add photos of your parking space (optional)
                </p>
              </div>
              {error && (
                <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}
              <div className="space-y-4">
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    {formData.images.map((img, index) => (
                      <div
                        key={index}
                        className="relative aspect-video rounded-xl overflow-hidden bg-slate-100"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.url}
                          alt={`Property ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 rounded-full bg-red-500 p-2 text-white hover:bg-red-600 transition"
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
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="rounded-2xl border-2 border-dashed border-slate-200 p-4 space-y-4">
                  <label className="flex flex-col gap-2 text-sm text-slate-700">
                    Image URL
                    <input
                      type="url"
                      value={currentImageUrl}
                      onChange={(e) => setCurrentImageUrl(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                      placeholder="https://example.com/image.jpg"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={addImage}
                    className="w-full rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 transition"
                  >
                    Add Image
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 pt-4">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 rounded-full border-2 border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Back
              </button>
            )}
            {step < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200/80 transition hover:bg-emerald-600"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200/80 transition hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Submitting..." : "Complete Registration"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
