"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlacesAutocomplete } from "../ui/PlacesAutocomplete";

type Mode = "discover" | "route";

type FormState = {
  location: string;
  locationPlaceId?: string;
  vehicleType: "car" | "bike" | "both";
  start: string;
  startPlaceId?: string;
  destination: string;
  destinationPlaceId?: string;
};

const defaultState: FormState = {
  location: "",
  locationPlaceId: undefined,
  vehicleType: "both",
  start: "",
  startPlaceId: undefined,
  destination: "",
  destinationPlaceId: undefined,
};

const modeTabs: { id: Mode; label: string; description: string }[] = [
  {
    id: "discover",
    label: "Find a spot",
    description: "Search welcoming parking and charging options nearby",
  },
  {
    id: "route",
    label: "Create a route",
    description: "Layer parking and charging across your journey",
  },
];

export function SearchForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("discover");
  const [state, setState] = useState<FormState>(defaultState);
  const [submitting, setSubmitting] = useState(false);

  const isDiscover = mode === "discover";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setSubmitting(true);

    try {
      // Build URL parameters for the map page
      const params = new URLSearchParams();

      if (isDiscover && state.locationPlaceId) {
        params.set("placeId", state.locationPlaceId);
        params.set("location", state.location);
        params.set("vehicleType", state.vehicleType);
      } else if (
        !isDiscover &&
        state.startPlaceId &&
        state.destinationPlaceId
      ) {
        params.set("startPlaceId", state.startPlaceId);
        params.set("start", state.start);
        params.set("destinationPlaceId", state.destinationPlaceId);
        params.set("destination", state.destination);
        params.set("vehicleType", state.vehicleType);
        params.set("mode", "route");
      }

      // Navigate to map page with search parameters
      router.push(`/map?${params.toString()}`);
    } catch (error) {
      console.error("Error processing search:", error);
      setSubmitting(false);
    }
  };

  const updateField = <Key extends keyof FormState>(
    key: Key,
    value: FormState[Key]
  ) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const modeFields = isDiscover ? (
    <div className="relative z-20 grid gap-4 animate-fade-in">
      <PlacesAutocomplete
        label="Where to?"
        placeholder="City, landmark, or postcode"
        value={state.location}
        onChange={(value, placeId) => {
          updateField("location", value);
          if (placeId) updateField("locationPlaceId", placeId);
        }}
        required
      />
    </div>
  ) : (
    <div className="relative z-20 grid gap-4 animate-fade-in sm:grid-cols-2">
      <PlacesAutocomplete
        label="Origin"
        placeholder="Street, city, or depot"
        value={state.start}
        onChange={(value, placeId) => {
          updateField("start", value);
          if (placeId) updateField("startPlaceId", placeId);
        }}
        required
      />
      <PlacesAutocomplete
        label="Destination"
        placeholder="Final stop or delivery zone"
        value={state.destination}
        onChange={(value, placeId) => {
          updateField("destination", value);
          if (placeId) updateField("destinationPlaceId", placeId);
        }}
        required
      />
    </div>
  );

  return (
    <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-xl shadow-emerald-100/70 ring-1 ring-slate-100">
      <div className="relative mx-auto mb-6 w-full max-w-xs">
        <div className="relative grid h-12 grid-cols-2 items-center rounded-full bg-slate-100 p-1">
          <span
            className={`absolute inset-y-1 w-1/2 rounded-full bg-white shadow-md shadow-emerald-100 transition-transform duration-300 ease-out ${
              mode === "route" ? "translate-x-full" : "translate-x-0"
            }`}
            aria-hidden
          />
          {modeTabs.map((tab) => {
            const active = tab.id === mode;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMode(tab.id)}
                aria-pressed={active}
                className={`relative z-10 flex h-full items-center justify-center rounded-full text-sm font-semibold transition-colors duration-200 ${
                  active
                    ? "text-slate-900"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 text-slate-600">
        <p className="text-sm text-slate-500">
          {modeTabs.find((tab) => tab.id === mode)?.description}
        </p>

        <div key={mode} className="relative space-y-6">
          {modeFields}

          <div className="relative z-0 flex flex-wrap gap-3">
            {["car", "bike", "both"].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() =>
                  updateField("vehicleType", option as FormState["vehicleType"])
                }
                className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition-all duration-200 ease-out ${
                  state.vehicleType === option
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-200/80 hover:-translate-y-0.5"
                    : "bg-slate-100 text-slate-600 hover:-translate-y-0.5 hover:bg-slate-200"
                }`}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    updateField(
                      "vehicleType",
                      option as FormState["vehicleType"]
                    );
                  }
                }}
                aria-pressed={state.vehicleType === option}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={
            submitting ||
            (isDiscover
              ? !state.locationPlaceId
              : !state.startPlaceId || !state.destinationPlaceId)
          }
          className="relative z-0 group inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-200/80 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-200 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
        >
          {submitting ? (
            <>
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="opacity-25"
                />
                <path
                  d="M12 3a9 9 0 018.944 8.003h-3.067a6 6 0 00-5.877-4.8V3z"
                  fill="currentColor"
                />
              </svg>
              <span>Loading...</span>
            </>
          ) : (
            <span>
              {isDiscover ? "Find parking & charging" : "Plan my route"}
            </span>
          )}
        </button>
      </form>
    </div>
  );
}
