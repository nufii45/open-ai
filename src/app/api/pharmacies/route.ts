// Phase 3 — pharmacies route. Live Google Places API (New) nearby search layered
// on top of the cached Ateneo drugstore set. This is the ADDITIVE layer: it must
// never break the card. On ANY failure it falls back to pharmacies.ts.
//
// Guardrails:
// - GOOGLE_PLACES_API_KEY read server-side only, sent via the X-Goog-Api-Key header.
// - includedTypes: ["pharmacy"] only — drugstores, never clinics. No geolocation:
//   the search is centered on the fixed Ateneo ORIGIN.
// - Mandatory fallback to cached pharmacies.ts on timeout / quota / bad key / empty.
//   Responses are tagged source: "live" or source: "cached". The card never renders empty.

import { NextResponse } from 'next/server';
import {
  ORIGIN,
  nearestPharmacies,
  type Pharmacy,
  type PharmacyWithDistance,
} from '@/data/pharmacies';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SEARCH_RADIUS_M = 4000; // 4km around the fixed origin
const RESULT_COUNT = 3;

// Haversine great-circle distance in km — same ranking math the cached set uses,
// applied here to live Places results so both sources sort identically.
function distanceKm(to: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((to.lat - ORIGIN.lat) * Math.PI) / 180;
  const dLng = ((to.lng - ORIGIN.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((ORIGIN.lat * Math.PI) / 180) *
      Math.cos((to.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function cached() {
  return NextResponse.json({
    source: 'cached' as const,
    pharmacies: nearestPharmacies(RESULT_COUNT),
  });
}

async function livePharmacies(apiKey: string): Promise<PharmacyWithDistance[] | null> {
  const res = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location',
    },
    body: JSON.stringify({
      includedTypes: ['pharmacy'],
      maxResultCount: 10,
      locationRestriction: {
        circle: {
          center: { latitude: ORIGIN.lat, longitude: ORIGIN.lng },
          radius: SEARCH_RADIUS_M,
        },
      },
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  const places: unknown[] = Array.isArray(data?.places) ? data.places : [];

  const mapped: PharmacyWithDistance[] = [];
  for (const p of places as Record<string, unknown>[]) {
    const loc = p?.location as { latitude?: number; longitude?: number } | undefined;
    const name = (p?.displayName as { text?: string } | undefined)?.text;
    if (!loc || typeof loc.latitude !== 'number' || typeof loc.longitude !== 'number') continue;
    if (!name) continue;
    const base: Pharmacy = {
      name,
      chain: name,
      address: typeof p?.formattedAddress === 'string' ? p.formattedAddress : '',
      lat: loc.latitude,
      lng: loc.longitude,
    };
    mapped.push({ ...base, distanceKm: distanceKm(base) });
  }

  if (mapped.length === 0) return null;
  return mapped.sort((a, b) => a.distanceKm - b.distanceKm).slice(0, RESULT_COUNT);
}

export async function GET(): Promise<NextResponse> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return cached();

  try {
    const live = await livePharmacies(apiKey);
    if (!live) return cached();
    return NextResponse.json({ source: 'live' as const, pharmacies: live });
  } catch {
    return cached(); // timeout / network / parse — cached list, never empty
  }
}
