"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface EditParkingSpotModalProps {
  open: boolean;
  onClose: () => void;
  spot: {
    id: string;
    charging?: boolean;
    covered: boolean;
  };
  type: "car" | "bike";
  onSuccess: () => void;
}

export function EditParkingSpotModal({
  open,
  onClose,
  spot,
  type,
  onSuccess,
}: EditParkingSpotModalProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    charging: false,
    covered: false,
  });

  useEffect(() => {
    if (open && spot) {
      setFormData({
        charging: (spot as { charging?: boolean }).charging || false,
        covered: spot.covered,
      });
    }
  }, [open, spot]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";
      const endpoint =
        type === "car"
          ? `/landOwner/carParking/${spot.id}`
          : `/landOwner/bikeParking/${spot.id}`;

      const response = await fetch(`${backendUrl}${endpoint}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(
          type === "car"
            ? {
                charging: formData.charging,
                covered: formData.covered,
              }
            : {
                covered: formData.covered,
              }
        ),
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to update parking spot");
      }
    } catch (error) {
      console.error("Error updating parking spot:", error);
      alert("Failed to update parking spot");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">
              Edit {type === "car" ? "Car" : "Bike"} Parking Spot
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
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
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Features */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
              Features
            </h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
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
                  <div>
                    <p className="font-medium text-slate-900">
                      Covered Parking
                    </p>
                    <p className="text-xs text-slate-500">
                      Protected from weather
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.covered}
                  onChange={(e) =>
                    setFormData({ ...formData, covered: e.target.checked })
                  }
                  className="h-5 w-5 text-emerald-500 rounded focus:ring-2 focus:ring-emerald-500"
                />
              </label>

              {type === "car" && (
                <label className="flex items-center justify-between p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center">
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
                    <div>
                      <p className="font-medium text-slate-900">EV Charging</p>
                      <p className="text-xs text-slate-500">
                        Electric vehicle charging
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.charging}
                    onChange={(e) =>
                      setFormData({ ...formData, charging: e.target.checked })
                    }
                    className="h-5 w-5 text-emerald-500 rounded focus:ring-2 focus:ring-emerald-500"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
