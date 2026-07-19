import { NextRequest, NextResponse } from 'next/server';

import type { PharmacyMapLocation } from '@/lib/pharmacies';
import type { SamplePharmacy } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 5;
const MAX_PAGE = 19;
const MAX_RADIUS_METERS = 8_000;

type Coordinates = { latitude: number; longitude: number };
type CareCategory = 'pharmacy' | 'clinic' | 'laboratory' | 'hospital';

const GEOAPIFY_CATEGORIES: Record<CareCategory, string> = {
  pharmacy: 'healthcare.pharmacy',
  clinic: 'healthcare.clinic_or_praxis',
  // Geoapify does not expose a laboratory-specific Places category. Use the
  // broader healthcare category rather than sending an invalid query, and keep
  // the UI's existing “confirm services” language prominent.
  laboratory: 'healthcare',
  hospital: 'healthcare.hospital',
};

type GeoapifyFeature = {
  properties?: { place_id?: string; name?: string; formatted?: string; address_line1?: string };
  geometry?: { coordinates?: [number, number] };
};

function validCoordinates(point: Coordinates | undefined): point is Coordinates {
  return Boolean(
    point &&
    Number.isFinite(point.latitude) &&
    Number.isFinite(point.longitude) &&
    point.latitude >= -90 &&
    point.latitude <= 90 &&
    point.longitude >= -180 &&
    point.longitude <= 180,
  );
}

function directionsUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey)
    return NextResponse.json(
      { error: 'Nearby pharmacy search is not configured.' },
      { status: 503 },
    );

  let origin: Coordinates | undefined;
  let category: CareCategory = 'pharmacy';
  let page = 0;
  try {
    const body = await request.json();
    origin = body?.origin;
    if (body?.category && body.category in GEOAPIFY_CATEGORIES)
      category = body.category as CareCategory;
    if (Number.isInteger(body?.page) && body.page >= 0 && body.page <= MAX_PAGE) page = body.page;
  } catch {
    // Validated below.
  }
  if (!validCoordinates(origin))
    return NextResponse.json({ error: 'A valid location is required.' }, { status: 400 });

  const url = new URL('https://api.geoapify.com/v2/places');
  url.searchParams.set('categories', GEOAPIFY_CATEGORIES[category]);
  url.searchParams.set(
    'filter',
    `circle:${origin.longitude},${origin.latitude},${MAX_RADIUS_METERS}`,
  );
  url.searchParams.set('bias', `proximity:${origin.longitude},${origin.latitude}`);
  url.searchParams.set('limit', String(PAGE_SIZE + 1));
  url.searchParams.set('offset', String(page * PAGE_SIZE));
  url.searchParams.set('apiKey', apiKey);

  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error('Places request failed');
    const data = (await response.json()) as { features?: GeoapifyFeature[] };
    const seen = new Set<string>();
    const entries = (data.features ?? [])
      .slice(0, PAGE_SIZE)
      .flatMap((feature): Array<{ pharmacy: SamplePharmacy; location: PharmacyMapLocation }> => {
        const [longitude, latitude] = feature.geometry?.coordinates ?? [];
        const placeId = feature.properties?.place_id;
        const name = feature.properties?.name?.trim();
        if (
          !placeId ||
          !name ||
          typeof latitude !== 'number' ||
          typeof longitude !== 'number' ||
          !Number.isFinite(latitude) ||
          !Number.isFinite(longitude) ||
          seen.has(placeId)
        )
          return [];
        seen.add(placeId);
        const id = `geoapify-${placeId}`;
        const branch =
          feature.properties?.address_line1?.trim() ||
          feature.properties?.formatted?.trim() ||
          'Address unavailable';
        return [
          {
            pharmacy: {
              id,
              name,
              branch,
              directionsUrl: directionsUrl(latitude, longitude),
              label: 'Nearby map result',
              note: 'Nearby map result — confirm stock, price, and operating hours directly with the pharmacy.',
            },
            location: { pharmacyId: id, latitude, longitude },
          },
        ];
      });
    return NextResponse.json(
      {
        source: 'geoapify-osm',
        category,
        page,
        pageSize: PAGE_SIZE,
        hasMore: (data.features?.length ?? 0) > PAGE_SIZE,
        pharmacies: entries.map((entry) => entry.pharmacy),
        locations: entries.map((entry) => entry.location),
      },
      { headers: { 'Cache-Control': 'private, max-age=300' } },
    );
  } catch {
    return NextResponse.json(
      { error: 'Nearby pharmacy search is unavailable right now.' },
      { status: 502 },
    );
  }
}
