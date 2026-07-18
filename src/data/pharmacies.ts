// Cached real drugstores near the Ateneo de Manila origin. Drugstores only —
// no clinics. Coordinates are cached (no geolocation, no live Places call);
// live Google Places results are an additive fallback layered on top of this.

export interface Pharmacy {
  name: string;
  chain: string;
  address: string;
  lat: number;
  lng: number;
}

// Fixed origin: Ateneo de Manila University, Loyola Heights, Quezon City.
export const ORIGIN = { lat: 14.6394, lng: 121.0779 } as const;

export const pharmacies: Pharmacy[] = [
  { name: "Mercury Drug — Katipunan", chain: "Mercury Drug", address: "Katipunan Ave, Loyola Heights, Quezon City", lat: 14.6355, lng: 121.0733 },
  { name: "The Generics Pharmacy — Katipunan", chain: "The Generics Pharmacy", address: "Katipunan Ave, Loyola Heights, Quezon City", lat: 14.6368, lng: 121.0728 },
  { name: "Watsons — UP Town Center", chain: "Watsons", address: "Katipunan Ave, Diliman, Quezon City", lat: 14.6541, lng: 121.0686 },
  { name: "Southstar Drug — Xavierville", chain: "Southstar Drug", address: "Xavierville Ave, Loyola Heights, Quezon City", lat: 14.6421, lng: 121.0801 },
  { name: "Rose Pharmacy — Katipunan", chain: "Rose Pharmacy", address: "Katipunan Ave, Blue Ridge, Quezon City", lat: 14.6289, lng: 121.0736 },
  { name: "Mercury Drug — Blue Ridge", chain: "Mercury Drug", address: "Katipunan Ave, Blue Ridge A, Quezon City", lat: 14.6262, lng: 121.0721 },
];

export interface PharmacyWithDistance extends Pharmacy {
  /** Straight-line distance from ORIGIN, in kilometers. */
  distanceKm: number;
}

// Haversine great-circle distance in km. Good enough for "nearest 3"; we are
// not routing, just ranking cached points around a fixed origin.
function distanceKm(from: { lat: number; lng: number }, to: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((from.lat * Math.PI) / 180) *
      Math.cos((to.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** The `count` nearest drugstores to the fixed Ateneo origin, closest first. */
export function nearestPharmacies(count = 3): PharmacyWithDistance[] {
  return pharmacies
    .map((p) => ({ ...p, distanceKm: distanceKm(ORIGIN, p) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, count);
}
