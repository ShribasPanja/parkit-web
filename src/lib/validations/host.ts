import { z } from "zod";

// Car parking spot schema
export const CarParkingSchema = z.object({
  charging: z.boolean().optional(),
  covered: z.boolean().optional(),
  available: z.boolean().optional(),
  hourlyRate: z.number().nonnegative().optional(),
  dailyRate: z.number().nonnegative().optional(),
});

// Bike parking spot schema
export const BikeParkingSchema = z.object({
  covered: z.boolean().optional(),
  available: z.boolean().optional(),
  hourlyRate: z.number().nonnegative().optional(),
  dailyRate: z.number().nonnegative().optional(),
});

// Image schema
export const ImageSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
});

// Host registration schema
export const BecomeHostSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(100, "Name is too long"),
    email: z.string().email("Please enter a valid email"),
    phone: z
      .string()
      .min(8, "Phone number is too short")
      .regex(
        /^\+\d{1,4}\d{6,15}$/,
        "Phone must be in international format with country code"
      ),
    about: z
      .string()
      .min(1, "Please describe your parking space")
      .max(1000, "Description is too long"),
    address: z
      .string()
      .min(1, "Address is required")
      .max(500, "Address is too long"),
    coordinates: z
      .string()
      .min(1, "Please select a location on the map")
      .regex(
        /^-?\d+\.?\d*,-?\d+\.?\d*$/,
        "Coordinates must be in format: latitude,longitude"
      ),
    carparkings: z.array(CarParkingSchema).default([]),
    bikeparkings: z.array(BikeParkingSchema).default([]),
    images: z.array(ImageSchema).optional(),
  })
  .refine(
    (data) => data.carparkings.length > 0 || data.bikeparkings.length > 0,
    {
      message: "Please add at least one parking spot (car or bike)",
      path: ["carparkings"],
    }
  );

export type BecomeHostInput = z.infer<typeof BecomeHostSchema>;
