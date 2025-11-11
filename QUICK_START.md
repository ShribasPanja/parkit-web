# 🚀 Quick Start Guide

## Test the Map View

1. **Start the dev server**:

   ```bash
   bun dev
   ```

2. **Navigate to the map page**:

   - Open: http://localhost:3000/map

3. **Test the autocomplete flow**:

   - Type a city name (e.g., "London", "New York", "Tokyo")
   - Click a suggestion
   - Watch the map center on that location
   - See mock markers appear automatically

4. **Test dynamic updates**:

   - Pan the map by dragging
   - Zoom in/out using mouse wheel or zoom controls
   - Notice markers update each time you stop moving!

5. **Check the console** (F12):
   ```
   📍 Selected location: { value: "London, UK", coords: {...} }
   🗺️ Map bounds changed: { ne: {...}, sw: {...} }
   ✅ Fetched places: [...]
   ```

## What's Working Now

✅ **Autocomplete**: Google Places suggestions with debouncing
✅ **Map**: Centers on selected location
✅ **Idle Event**: Fires when map stops moving
✅ **Bounds Detection**: Gets visible map corners (NE/SW)
✅ **API Call**: Sends bounds to `/api/places` endpoint
✅ **Markers**: Shows mock parking/charging markers
✅ **Dynamic Updates**: Refreshes on pan/zoom

## What's Mock Data (To Replace)

🔄 **API Response**: Currently returns mock places - replace with real PostGIS query
🔄 **Database**: No database connected yet - set up PostgreSQL + PostGIS

## Next Steps

### 1. Set Up Database

```bash
# Install PostgreSQL with PostGIS
# macOS:
brew install postgresql postgis

# Linux:
apt-get install postgresql postgis

# Windows:
# Download from https://www.postgresql.org/download/windows/
```

### 2. Create Database

```sql
CREATE DATABASE parkit;
\c parkit

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE parking_spots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('parking', 'charging')),
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  address TEXT,
  capacity INTEGER,
  available_spots INTEGER,
  price_per_hour DECIMAL(10, 2),
  amenities JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_parking_spots_location
ON parking_spots USING GIST(location);
```

### 3. Add Sample Data

```sql
-- Insert parking spots in London
INSERT INTO parking_spots (name, type, location, address, capacity, price_per_hour)
VALUES
  ('Westminster Parking', 'parking',
   ST_SetSRID(ST_MakePoint(-0.1278, 51.5074), 4326),
   'Westminster, London SW1A 2AA', 100, 4.50),

  ('Covent Garden EV', 'charging',
   ST_SetSRID(ST_MakePoint(-0.1239, 51.5123), 4326),
   'Covent Garden, London WC2E 8BE', 20, 6.00),

  ('Southbank Parking', 'parking',
   ST_SetSRID(ST_MakePoint(-0.1192, 51.5074), 4326),
   'Southbank, London SE1 9PP', 150, 3.50),

  ('Tower Bridge Charging', 'charging',
   ST_SetSRID(ST_MakePoint(-0.0754, 51.5055), 4326),
   'Tower Bridge Rd, London SE1 2UP', 15, 5.50);

-- Verify
SELECT
  name,
  type,
  ST_X(location::geometry) as lng,
  ST_Y(location::geometry) as lat
FROM parking_spots;
```

### 4. Connect Database to API

Install database client:

```bash
bun add @vercel/postgres
# or
bun add pg
# or use Prisma
bun add prisma @prisma/client
```

Update `/api/places/route.ts`:

```typescript
import { sql } from "@vercel/postgres";

export async function GET(request: NextRequest) {
  // ... validation code ...

  const { rows } = await sql`
    SELECT 
      id::text,
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
      ST_MakeEnvelope(${swLng}, ${swLat}, ${neLng}, ${neLat}, 4326)
    )
    ORDER BY location <-> ST_SetSRID(ST_MakePoint(${centerLng}, ${centerLat}), 4326)
    LIMIT 100
  `;

  return NextResponse.json({ places: rows, count: rows.length });
}
```

### 5. Add Environment Variables

Add to `.env.local`:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key
POSTGRES_URL=postgresql://user:password@localhost:5432/parkit
```

### 6. Test End-to-End

1. Start dev server: `bun dev`
2. Go to http://localhost:3000/map
3. Search for a city where you added data
4. Map should show REAL markers from your database!
5. Pan/zoom → markers update with database results

## Debugging Tips

### No markers appearing?

- Check browser console for errors
- Open Network tab, look for `/api/places` calls
- Verify API returns data: http://localhost:3000/api/places?neLat=51.52&neLng=-0.10&swLat=51.49&swLng=-0.15&type=both

### Map not centering?

- Check console for "Selected location" log
- Verify Google Maps API key is valid
- Check for JavaScript errors

### Markers in wrong location?

- Verify lat/lng order in database (lng, lat for PostGIS)
- Check coordinate system (SRID 4326)
- Validate data with: `SELECT ST_AsText(location) FROM parking_spots;`

### Performance issues?

- Verify spatial index exists: `\d parking_spots`
- Check query execution plan: `EXPLAIN ANALYZE SELECT ...`
- Limit results to 100-200 markers max

## Architecture Overview

```
User → PlacesAutocomplete → Geocoding → MapView → idle event →
onBoundsChange → API call → PostGIS query → Response → Markers
                                    ↑
                          Pan/Zoom repeats from here
```

## Documentation

- 📘 [Full Integration Guide](./BOUNDING_BOX_INTEGRATION.md)
- 📊 [Flow Diagrams](./FLOW_DIAGRAM.md)
- 🔐 [API Security](./API_KEY_SECURITY.md)
- 📖 [README](./README.md)

## Need Help?

Check console logs:

- `📍 Selected location` - Autocomplete working
- `🗺️ Map bounds changed` - Idle event firing
- `✅ Fetched places` - API returning data

Happy coding! 🎉
