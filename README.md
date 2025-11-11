# Parkit - Parking & Charging Station Finder

A modern web application for finding parking spots and EV charging stations using Google Maps and dynamic bounding box queries.

## 🚀 Features

- **Google Places Autocomplete**: Smart location search with suggestions
- **Dynamic Map**: Real-time bounding box queries as you pan and zoom
- **Smart Markers**: Visual indicators for parking (green) and charging (blue)
- **Modern UI**: Airbnb-inspired design with smooth animations
- **API Integration**: Ready for PostGIS spatial queries

## 📱 Pages

- **Landing Page**: `/` - Hero section with search form
- **Map View**: `/map` - Interactive map with autocomplete search

## 🔄 How It Works

1. User searches for a location using Google Places Autocomplete
2. Map centers on the selected location
3. When map stops moving, `idle` event fires
4. System gets visible map bounds (NE and SW coordinates)
5. API queries database for places within bounding box
6. Markers appear on map for all parking/charging stations in view
7. Pan or zoom → automatic refresh with new results!

See [BOUNDING_BOX_INTEGRATION.md](./BOUNDING_BOX_INTEGRATION.md) for detailed technical documentation.

## 🛠️ Setup

1. Clone the repository
2. Install dependencies:

   ```bash
   bun install
   ```

3. Create `.env.local` file:

   ```env
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
   ```

4. Run development server:

   ```bash
   bun dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## 🗄️ Database Setup

The app is designed to work with PostGIS for spatial queries. See the API route documentation for the complete schema:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE parking_spots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('parking', 'charging')),
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  -- ... other fields
);

CREATE INDEX idx_parking_spots_location
ON parking_spots USING GIST(location);
```

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx                  # Landing page
│   ├── map/
│   │   └── page.tsx              # Map view with search
│   └── api/
│       └── places/
│           └── route.ts          # Bounding box API
├── components/
│   ├── map/
│   │   └── MapView.tsx           # Google Maps with idle listener
│   ├── ui/
│   │   └── PlacesAutocomplete.tsx # Autocomplete input
│   ├── forms/
│   │   └── SearchForm.tsx        # Search form
│   └── sections/
│       └── Hero.tsx              # Hero with carousel
```

## 🔑 API Endpoints

### GET `/api/places`

Query places within a bounding box.

**Parameters**:

- `neLat`: Northeast latitude
- `neLng`: Northeast longitude
- `swLat`: Southwest latitude
- `swLng`: Southwest longitude
- `type`: Filter by type ("parking" | "charging" | "both")

**Example**:

```
GET /api/places?neLat=51.52&neLng=-0.10&swLat=51.49&swLng=-0.15&type=both
```

## 🎨 Tech Stack

- **Next.js 15**: React framework with App Router
- **React 19**: Latest React features
- **Tailwind CSS 4**: Utility-first styling
- **Google Maps JavaScript API**: Maps and Places
- **TypeScript**: Type safety
- **Bun**: Fast JavaScript runtime

## 📚 Documentation

- [Bounding Box Integration Guide](./BOUNDING_BOX_INTEGRATION.md) - Detailed technical docs
- [API Key Security](./API_KEY_SECURITY.md) - Security best practices

## 🔐 Security

The Google Maps API key is exposed client-side (`NEXT_PUBLIC_` prefix). Secure it with:

- HTTP referrer restrictions in Google Cloud Console
- API usage quotas and monitoring
- Daily spending limits

See [API_KEY_SECURITY.md](./API_KEY_SECURITY.md) for details.

## 🚧 TODO

- [ ] Implement real PostGIS database queries
- [ ] Add user authentication
- [ ] Real-time availability updates via WebSocket
- [ ] Advanced filtering (price, amenities, ratings)
- [ ] Route planning with charging stops
- [ ] Mobile app (React Native)

## 📄 License

MIT
