# OpenMics Map Components

This directory contains the refactored map components that were previously part of the large `OpenMicsMap.tsx` file. The code has been broken down into smaller, more manageable and reusable components.

## Structure

### Main Component
- **`OpenMicsMapRefactored.tsx`** - The main map component that orchestrates all the other components and services

### Services
- **`GeocodingService.ts`** - Handles address geocoding with caching and viewport-based loading
- **`LocationService.ts`** - Manages user location functionality
- **`MarkerManager.ts`** - Manages map markers with viewport-based loading
- **`MapInitializer.ts`** - Handles map initialization and configuration

### UI Components
- **`MapLegend.tsx`** - Displays the map legend with pin colors and borough information
- **`MapControls.tsx`** - Contains map controls like the recenter button and progress indicators
- **`TokenInput.tsx`** - Form for entering Mapbox token

### Utilities
- **`MapUtils.ts`** - Utility functions for formatting, colors, and calculations

## Key Features

### 🎯 **Viewport-Based Loading**
- **Performance Optimized**: Only loads markers within the current map viewport
- **Dynamic Loading**: As users pan or zoom, new markers are loaded automatically
- **Smart Caching**: Geocoded addresses are cached to avoid repeated API calls
- **User-Centric**: Defaults to user's location with close zoom (zoom level 14)

### 📍 **User Location Integration**
- **Automatic Location Request**: Requests location permission on component mount
- **Close Zoom Default**: Zooms to user location with detailed view
- **User Marker**: Shows "You are here" marker with red pin
- **Recenter Functionality**: Button to return to user location

### 🗺️ **Map Interaction**
- **Pan & Zoom Responsive**: Markers load/unload based on viewport changes
- **Individual Markers**: Each mic is shown as an individual marker (no clustering)
- **Hover Effects**: Popup shows mic details on hover with distance information (desktop)
- **Touch Interaction**: Tap to show popup, long press (500ms) to open detailed modal (mobile)
- **Click Interaction**: Click markers to open detailed modal (desktop)
- **Distance Display**: Shows distance from user location in popup (📍 1.4mi away)

### ⚡ **Performance Benefits**
- **Reduced Initial Load**: Only loads nearby mics instead of all mics
- **Progressive Loading**: Markers appear as user explores the map
- **Memory Efficient**: Removes markers outside current viewport
- **Cached Geocoding**: Avoids repeated API calls for same addresses

## Usage

### Basic Usage
```tsx
import { OpenMicsMapRefactored } from '@/components/map';

<OpenMicsMapRefactored 
  mics={mics} 
  onMicSelect={handleMicSelect} 
/>
```

### Using Individual Components
```tsx
import { MapLegend, MapControls, GeocodingService } from '@/components/map';

// Use individual components as needed
<MapLegend />
<MapControls 
  onRecenter={handleRecenter}
  locationLoading={false}
  loadedMicCount={25}
/>
```

## How Viewport-Based Loading Works

1. **Initial Load**: Map starts at user location with zoom level 14
2. **Viewport Detection**: Calculates current map bounds (north, south, east, west)
3. **Mic Filtering**: Finds mics that fall within the current viewport
4. **Geocoding**: Geocodes addresses for mics in viewport (with caching)
5. **Marker Creation**: Creates individual markers for each mic with distance info
6. **Dynamic Updates**: Repeats process when user pans or zooms

## Distance Calculation

The map automatically calculates and displays the distance from the user's location to each mic:

- **Real-time Calculation**: Distance is calculated when markers are created
- **Smart Formatting**: 
  - Under 0.1 miles: Shows in feet (e.g., "📍 450ft away")
  - Under 1 mile: Shows in feet (e.g., "📍 2,640ft away")
  - Under 10 miles: Shows with decimal (e.g., "📍 2.3mi away")
  - Over 10 miles: Shows rounded (e.g., "📍 15mi away")
- **User Location Required**: Distance only shows when user location is available
- **Hover Display**: Distance appears in the popup when hovering over markers

### Viewport Bounds Example
```typescript
interface ViewportBounds {
  north: number; // Latitude of northern edge
  south: number; // Latitude of southern edge
  east: number;  // Longitude of eastern edge
  west: number;  // Longitude of western edge
}
```

## Benefits of Refactoring

1. **Maintainability** - Each component has a single responsibility
2. **Reusability** - Components can be used independently
3. **Testability** - Smaller components are easier to test
4. **Readability** - Code is more organized and easier to understand
5. **Performance** - Viewport-based loading significantly improves performance

## Migration from Original

The original `OpenMicsMap.tsx` file was over 1000 lines. This refactored version maintains the same functionality while being much more manageable:

- **Original**: 1,086 lines in a single file
- **Refactored**: 8 files with clear separation of concerns
- **Main component**: ~300 lines (much more manageable)
- **Performance**: Viewport-based loading vs. loading all markers at once

## Dependencies

- `mapbox-gl` - Map rendering
- `react` - UI framework
- `@/types/openMic` - TypeScript types
- `@/components/ui/*` - UI components (Button, Input)

## Environment Variables

### Required Setup

#### Local Development
1. **Create a `.env` file** in the project root:
```bash
# .env
VITE_MAPBOX_TOKEN=your_mapbox_token_here
```

2. **Get your Mapbox token** from [https://account.mapbox.com/access-tokens/](https://account.mapbox.com/access-tokens/)

3. **Replace `your_mapbox_token_here`** with your actual token

#### Production Deployment
Since `.env` files are not committed to git, set environment variables in your hosting platform:

- **Vercel**: Project Settings → Environment Variables
- **Netlify**: Site Settings → Environment Variables  
- **Railway/Render**: Project Settings → Environment Variables
- **Heroku**: `heroku config:set VITE_MAPBOX_TOKEN=your_token`

See `MAPBOX_SETUP.md` for detailed instructions.

### Available Variables

- `VITE_MAPBOX_TOKEN` - **Required** - Your Mapbox access token
- `VITE_SUPABASE_URL` - Optional - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Optional - Supabase anonymous key

### Development Override

For development, you can also set a token in localStorage:
```javascript
localStorage.setItem('mapbox_token', 'your_token_here');
```

## Performance Comparison

| Feature | Original | Refactored |
|---------|----------|------------|
| Initial Load | All markers | Viewport markers only |
| Memory Usage | High (all markers) | Low (viewport markers) |
| Geocoding | All addresses | Viewport addresses |
| User Experience | Slow initial load | Fast, responsive |
| Scalability | Poor with large datasets | Excellent with large datasets | 