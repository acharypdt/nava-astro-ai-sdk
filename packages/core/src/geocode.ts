import { GeocodeResult } from './types';

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

export async function geocodeLocation(locationName: string): Promise<GeocodeResult | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}&limit=1`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'NavaAstroSDK/1.0' }
    });
    if (!res.ok) return null;
    const data: NominatimResult[] = await res.json() as NominatimResult[];
    if (!data || data.length === 0) return null;
    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      displayName: data[0].display_name
    };
  } catch {
    return null;
  }
}

export async function getCurrentPosition(): Promise<{ lat: number; lng: number } | null> {
  if (typeof navigator === 'undefined' || typeof window === 'undefined' || !navigator.geolocation) return null;
  try {
    const pos = await new Promise<{ coords: { latitude: number; longitude: number } }>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({ coords: { latitude: p.coords.latitude, longitude: p.coords.longitude } }),
        reject,
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  } catch {
    return null;
  }
}
