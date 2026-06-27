/**
 * Service de géocodage via Nominatim (OpenStreetMap)
 */

interface GeocodingResult {
  latitude: number;
  longitude: number;
}

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

// Simple cache mémoire pour éviter de re-géocoder la même ville plusieurs fois.
// En prod avec plusieurs instances, remplacer par un cache Redis si besoin.
const geocodeCache = new Map<string, GeocodingResult | null>();

/**
 * Géocode une ville en coordonnées GPS via Nominatim.
 * Retourne null si la ville n'a pas pu être trouvée (ex: faute de frappe).
 */
export async function geocodeCity(
  city: string,
): Promise<GeocodingResult | null> {
  const normalized = city.trim().toLowerCase();
  if (!normalized) return null;

  if (geocodeCache.has(normalized)) {
    return geocodeCache.get(normalized) ?? null;
  }

  try {
    const params = new URLSearchParams({
      q: city,
      format: "json",
      limit: "1",
      countrycodes: "fr,pf,nc,wf,pm", // fr(compte guadeloupe, martinique, guyane, réunion et mayotte) + dom-tom
    });

    const response = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
      headers: {
        "User-Agent": "DomTomConnect/1.0 (isabella.kafikaila0@gmail.com)",
      },
    });

    if (!response.ok) {
      console.error(`Nominatim a répondu avec le statut ${response.status}`);
      geocodeCache.set(normalized, null);
      return null;
    }

    const results = await response.json();

    if (!Array.isArray(results) || results.length === 0) {
      geocodeCache.set(normalized, null);
      return null;
    }

    const result: GeocodingResult = {
      latitude: parseFloat(results[0].lat),
      longitude: parseFloat(results[0].lon),
    };

    geocodeCache.set(normalized, result);
    return result;
  } catch (err) {
    console.error("Erreur de géocodage Nominatim:", err);
    return null;
  }
}
