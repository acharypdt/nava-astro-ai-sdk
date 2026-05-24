/**
 * @file lib/geocode.ts
 * @description Geocoding utility using OpenStreetMap Nominatim API (free, no API key required).
 * Converts location name to latitude/longitude coordinates.
 */

export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
}

/**
 * Geocode a location name using OpenStreetMap Nominatim API.
 * @param locationName - The location name to geocode (e.g. "New Delhi, India")
 * @returns Promise<GeocodeResult | null> - Returns lat/lng or null if not found
 */
export async function geocodeLocation(locationName: string): Promise<GeocodeResult | null> {
  if (!locationName || locationName.trim().length < 2) return null;

  // Encode the location name for URL
  const encodedLocation = encodeURIComponent(locationName.trim());
  const url = `https://nominatim.openstreetmap.org/search?q=${encodedLocation}&format=json&limit=1&accept-language=hi,en`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'NavaAstroSDK/1.0 (astrology-app)',
        'Accept-Language': 'hi,en'
      }
    });

    if (!response.ok) {
      console.warn(`Nominatim API error: ${response.status}`);
      return null;
    }

    const data = await response.json() as any[];

    if (!data || data.length === 0) {
      return null;
    }

    const result = data[0];
    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      displayName: result.display_name || locationName
    };
  } catch (error) {
    console.warn('Geocoding failed:', error);
    return null;
  }
}

/**
 * Get user's current location using browser Geolocation API.
 * @returns Promise<GeocodeResult | null> - Returns lat/lng or null if denied/unavailable
 */
export function getCurrentPosition(): Promise<GeocodeResult | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn('Geolocation API not available');
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          displayName: `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`
        });
      },
      (error) => {
        console.warn('Geolocation error:', error.message);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes cache
      }
    );
  });
}