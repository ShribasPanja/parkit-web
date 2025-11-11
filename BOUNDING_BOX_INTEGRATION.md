# Parkit Map Integration: Bounding Box Query System

## 🎯 Overview

This document explains how the Parkit app uses Google Places Autocomplete combined with dynamic map bounding box queries to show parking spots and charging stations.

## 🔄 User Flow

### Step-by-Step Process

1. **User Selects Location**

   - User types in the autocomplete input
   - Google Places API suggests locations
   - User clicks a suggestion
   - System extracts `place_id` from the selection

2. **Center the Map**

   - System geocodes the `place_id` to get lat/lng coordinates
   - Map centers on that location using `map.setCenter(location)`
   - Map animates to new position

3. **Map Moves**

   - Map pans and/or zooms to the new location
   - User can also manually pan/zoom

4. **Idle Event Fires**

   - When map stops moving, the `idle` event listener fires
   - This happens automatically after ANY map movement (initial load, user selection, pan, zoom)

5. **Get Bounds**

   - System calls `map.getBounds()` to get visible map corners
   - Returns NorthEast (NE) and SouthWest (SW) coordinates
   - Example: `{ ne: { lat: 51.52, lng: -0.10 }, sw: { lat: 51.49, lng: -0.15 } }`

6. **Fetch Data**

   - System sends bounding box coordinates to `/api/places` endpoint
   - Query parameters: `?neLat=51.52&neLng=-0.10&swLat=51.49&swLng=-0.15&type=both`

7. **Backend Query**

   - Backend uses PostGIS `ST_Within()` to find all places inside the bounding box
   - SQL: `WHERE ST_Within(location, ST_MakeEnvelope(swLng, swLat, neLng, neLat, 4326))`
   - Returns array of places with coordinates

8. **Show Markers**
   - Frontend receives places from API
   - Creates Google Maps markers for each place
   - Different colors for parking (green) vs charging (blue)

### Continuous Updates

When the user zooms out or pans:

- Steps 3-8 automatically repeat
- `idle` event fires again
- New, larger/different bounds are calculated
- Backend finds more/different places
- Map updates with new markers

## 📁 File Structure

```
src/
├── app/
│   ├── map/
│   │   └── page.tsx              # Main map page with search
│   └── api/
│       └── places/
│           └── route.ts          # API endpoint for bounding box queries
├── components/
│   ├── map/
│   │   └── MapView.tsx           # Google Maps component with idle listener
│   ├── ui/
│   │   └── PlacesAutocomplete.tsx # Google Places autocomplete
│   └── forms/
│       └── SearchForm.tsx        # Search form (alternative to map page)
```

## 🔧 Key Components

### 1. MapView Component (`src/components/map/MapView.tsx`)

**Purpose**: Displays Google Map with automatic bounds detection

**Key Features**:

- Initializes Google Maps
- Centers on location when `initialCenter` prop changes
- Fires `onBoundsChange` callback when map stops moving
- Displays markers for parking/charging stations

**Props**:

```typescript
interface MapViewProps {
  initialCenter?: { lat: number; lng: number };
  onBoundsChange?: (bounds: {
    ne: { lat: number; lng: number };
    sw: { lat: number; lng: number };
  }) => void;
  markers?: Array<{
    id: string;
    lat: number;
    lng: number;
    name: string;
    type: "parking" | "charging";
  }>;
}
```

**Key Code**:

```typescript
// Set up idle listener
map.addListener("idle", () => {
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
```

### 2. Map Page (`src/app/map/page.tsx`)

**Purpose**: Integrates autocomplete search with map view

**Key Features**:

- PlacesAutocomplete input in header
- Geocodes selected place to lat/lng
- Updates map center when location selected
- Fetches places when bounds change
- Displays markers on map

**Key Flow**:

```typescript
// 1. User selects location from autocomplete
const handleLocationSelect = async (value: string, placeId?: string) => {
  setLocation(value);
  if (placeId) {
    const coords = await getCoordinatesFromPlaceId(placeId);
    if (coords) {
      setMapCenter(coords); // This triggers map to center
    }
  }
};

// 2. Map idle event fires, fetch places in visible bounds
const handleBoundsChange = async (bounds) => {
  const params = new URLSearchParams({
    neLat: bounds.ne.lat.toString(),
    neLng: bounds.ne.lng.toString(),
    swLat: bounds.sw.lat.toString(),
    swLng: bounds.sw.lng.toString(),
    type: "both",
  });

  const response = await fetch(`/api/places?${params}`);
  const data = await response.json();
  setMarkers(data.places); // This updates markers on map
};
```

### 3. API Route (`src/app/api/places/route.ts`)

**Purpose**: Query database for places within bounding box

**Endpoint**: `GET /api/places`

**Query Parameters**:

- `neLat`: Northeast latitude
- `neLng`: Northeast longitude
- `swLat`: Southwest latitude
- `swLng`: Southwest longitude
- `type`: Filter by type ("parking" | "charging" | "both")

**Example Request**:

```
GET /api/places?neLat=51.52&neLng=-0.10&swLat=51.49&swLng=-0.15&type=both
```

**Example Response**:

```json
{
  "places": [
    {
      "id": "1",
      "name": "Central Parking Lot",
      "type": "parking",
      "lat": 51.5074,
      "lng": -0.1278
    },
    {
      "id": "2",
      "name": "EV Charging Station",
      "type": "charging",
      "lat": 51.5085,
      "lng": -0.1265
    }
  ],
  "count": 2,
  "bounds": {
    "ne": { "lat": 51.52, "lng": -0.1 },
    "sw": { "lat": 51.49, "lng": -0.15 }
  }
}
```

## 🗄️ Database Setup

### PostGIS Extension

```sql
-- Enable PostGIS for spatial queries
CREATE EXTENSION IF NOT EXISTS postgis;
```

### Table Schema

```sql
CREATE TABLE parking_spots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('parking', 'charging')),
  location GEOGRAPHY(POINT, 4326) NOT NULL,  -- lat/lng coordinates
  address TEXT,
  capacity INTEGER,
  available_spots INTEGER,
  price_per_hour DECIMAL(10, 2),
  amenities JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Spatial index for fast bounding box queries (CRITICAL for performance!)
CREATE INDEX idx_parking_spots_location
ON parking_spots USING GIST(location);
```

### Insert Example Data

```sql
-- Insert a parking spot (note: longitude first, then latitude)
INSERT INTO parking_spots (name, type, location, address, capacity, price_per_hour)
VALUES (
  'Central Parking Garage',
  'parking',
  ST_SetSRID(ST_MakePoint(-0.1278, 51.5074), 4326),  -- lng, lat
  '123 Main St, London',
  200,
  3.50
);

-- Insert a charging station
INSERT INTO parking_spots (name, type, location, address, capacity, price_per_hour)
VALUES (
  'SuperCharger Station',
  'charging',
  ST_SetSRID(ST_MakePoint(-0.1265, 51.5085), 4326),
  '456 Electric Ave, London',
  10,
  5.00
);
```

### Bounding Box Query

```sql
-- Find all places within bounding box
SELECT
  id,
  name,
  type,
  ST_X(location::geometry) as lng,
  ST_Y(location::geometry) as lat,
  address,
  capacity,
  available_spots,
  price_per_hour
FROM parking_spots
WHERE ST_Within(
  location,
  ST_MakeEnvelope(
    -0.15,  -- swLng (southwest longitude)
    51.49,  -- swLat (southwest latitude)
    -0.10,  -- neLng (northeast longitude)
    51.52,  -- neLat (northeast latitude)
    4326    -- SRID (WGS84 coordinate system)
  )
)
ORDER BY location <-> ST_SetSRID(ST_MakePoint(-0.1278, 51.5074), 4326)
LIMIT 100;
```

## 🔗 Integration with Prisma (Optional)

If using Prisma, you can use raw SQL for spatial queries:

```typescript
// prisma/schema.prisma
model ParkingSpot {
  id              String   @id @default(uuid())
  name            String
  type            String   // "parking" or "charging"
  location        Unsupported("geography(Point,4326)")
  address         String?
  capacity        Int?
  availableSpots  Int?     @map("available_spots")
  pricePerHour    Decimal? @map("price_per_hour")
  amenities       Json?
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @default(now()) @updatedAt @map("updated_at")

  @@index([location], type: Gist)
  @@map("parking_spots")
}
```

```typescript
// src/app/api/places/route.ts
import { prisma } from "@/lib/prisma";

const places = await prisma.$queryRaw`
  SELECT 
    id,
    name,
    type,
    ST_X(location::geometry) as lng,
    ST_Y(location::geometry) as lat,
    address,
    capacity,
    available_spots as "availableSpots",
    price_per_hour as "pricePerHour"
  FROM parking_spots
  WHERE ST_Within(
    location,
    ST_MakeEnvelope(${swLng}, ${swLat}, ${neLng}, ${neLat}, 4326)
  )
  ${type !== "both" ? Prisma.sql`AND type = ${type}` : Prisma.empty}
  ORDER BY location <-> ST_SetSRID(ST_MakePoint(${centerLng}, ${centerLat}), 4326)
  LIMIT 100
`;
```

## 🚀 Getting Started

1. **Visit the map page**: Navigate to `/map`
2. **Search for a location**: Type in the search bar and select from suggestions
3. **Watch the magic**: Map centers, then automatically fetches and displays nearby places
4. **Pan/Zoom**: Move around - markers update automatically!

## 🎨 Customization

### Change marker colors:

```typescript
// In MapView.tsx
icon: {
  path: google.maps.SymbolPath.CIRCLE,
  scale: 8,
  fillColor: markerData.type === "parking" ? "#10b981" : "#3b82f6", // Change these!
  fillOpacity: 1,
  strokeColor: "#ffffff",
  strokeWeight: 2,
}
```

### Adjust query radius:

- Currently uses visible map bounds
- To use a fixed radius instead, calculate bounds from center + radius
- Example: Show places within 5km of center point

### Add filters:

- Vehicle type (car/bike)
- Price range
- Amenities (covered, security, EV charging power)
- Availability (real-time)

## 📊 Performance Considerations

1. **Spatial Index**: CRITICAL - always create GIST index on location column
2. **Limit Results**: Cap at 100-200 markers to keep map responsive
3. **Debounce**: Consider debouncing the `idle` event if users pan rapidly
4. **Clustering**: For dense areas, use marker clustering library
5. **Caching**: Cache results by bounds for faster repeated queries

## 🐛 Debugging

**Console logs to watch**:

- `📍 Selected location:` - Fired when user picks from autocomplete
- `🗺️ Map bounds changed:` - Fired when map stops moving (idle event)
- `✅ Fetched places:` - API response with places

**Common issues**:

- No markers appearing: Check API response in Network tab
- Markers in wrong location: Verify lat/lng order (lat first in display, lng first in PostGIS)
- Performance issues: Verify spatial index exists on database

## 🎯 Next Steps

1. **Replace mock data**: Implement real PostGIS queries in API route
2. **Add real-time availability**: WebSocket updates for available spots
3. **Implement filtering**: Vehicle type, price, amenities
4. **Add route planning**: Show charging stations along driving route
5. **User accounts**: Save favorite spots, booking history
