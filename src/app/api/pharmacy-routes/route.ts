import { NextRequest, NextResponse } from 'next/server';
import {
  NEAREST_SAMPLE_PHARMACIES,
  type PharmacyMapLocation,
  type PharmacyRouteRanking,
  type RouteMode,
} from '@/lib/pharmacies';

type Coordinates = { latitude: number; longitude: number };

type RouteRequest = {
  origin?: Coordinates;
  mode?: RouteMode;
  selectedPharmacyId?: string;
};

type GeocodeResponse = {
  features?: Array<{ geometry?: { coordinates?: [number, number] } }>;
};

type MatrixResponse = {
  sources_to_targets?: Array<Array<{ distance?: number; time?: number } | null>>;
};

type RouteResponse = {
  features?: Array<{ geometry?: { coordinates?: unknown } }>;
};

// Cache only the fixed, illustrative branch pins in the server process. A
// visitor's origin is deliberately never stored or cached.
const pharmacyLocationCache = new Map<string, PharmacyMapLocation>();

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

function isRouteMode(value: unknown): value is RouteMode {
  return value === 'drive' || value === 'walk';
}

async function geocodePharmacy(
  pharmacy: (typeof NEAREST_SAMPLE_PHARMACIES)[number],
  apiKey: string,
): Promise<PharmacyMapLocation> {
  const cached = pharmacyLocationCache.get(pharmacy.id);
  if (cached) return cached;

  const text = `${pharmacy.name}, ${pharmacy.branch}, Quezon City, Philippines`;
  const url = new URL('https://api.geoapify.com/v1/geocode/search');
  url.searchParams.set('text', text);
  url.searchParams.set('filter', 'countrycode:ph');
  url.searchParams.set('limit', '1');
  url.searchParams.set('apiKey', apiKey);

  const response = await fetch(url, { next: { revalidate: 60 * 60 * 24 } });
  if (!response.ok) throw new Error(`Unable to locate ${pharmacy.id}`);
  const data = (await response.json()) as GeocodeResponse;
  const coordinates = data.features?.[0]?.geometry?.coordinates;
  if (!coordinates || !Number.isFinite(coordinates[0]) || !Number.isFinite(coordinates[1])) {
    throw new Error(`No coordinates returned for ${pharmacy.id}`);
  }

  const location = {
    pharmacyId: pharmacy.id,
    longitude: coordinates[0],
    latitude: coordinates[1],
  };
  pharmacyLocationCache.set(pharmacy.id, location);
  return location;
}

function routeCoordinates(data: RouteResponse): [number, number][] {
  const geometry = data.features?.[0]?.geometry?.coordinates;
  if (!Array.isArray(geometry) || !Array.isArray(geometry[0])) return [];

  const points = geometry[0].filter(
    (point): point is [number, number] =>
      Array.isArray(point) && Number.isFinite(point[0]) && Number.isFinite(point[1]),
  );
  return points;
}

export async function GET() {
  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Illustrative map locations are not configured yet.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  try {
    const locations = await Promise.all(
      NEAREST_SAMPLE_PHARMACIES.map((pharmacy) => geocodePharmacy(pharmacy, apiKey)),
    );
    return NextResponse.json(
      { locations },
      { headers: { 'Cache-Control': 'private, max-age=86400' } },
    );
  } catch {
    return NextResponse.json(
      { error: 'Illustrative map locations are unavailable right now.' },
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Route estimates are not configured yet.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  let body: RouteRequest;
  try {
    body = (await request.json()) as RouteRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid route request.' }, { status: 400 });
  }

  if (!validCoordinates(body.origin) || !isRouteMode(body.mode)) {
    return NextResponse.json({ error: 'Invalid location or travel mode.' }, { status: 400 });
  }

  const selectedPharmacy =
    NEAREST_SAMPLE_PHARMACIES.find((pharmacy) => pharmacy.id === body.selectedPharmacyId) ?? null;

  try {
    const locations = await Promise.all(
      NEAREST_SAMPLE_PHARMACIES.map((pharmacy) => geocodePharmacy(pharmacy, apiKey)),
    );
    const matrixResponse = await fetch(`https://api.geoapify.com/v1/routematrix?apiKey=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: body.mode,
        sources: [{ location: [body.origin.longitude, body.origin.latitude] }],
        targets: locations.map((location) => ({ location: [location.longitude, location.latitude] })),
      }),
      cache: 'no-store',
    });

    if (!matrixResponse.ok) throw new Error('Geoapify route matrix request failed.');
    const matrix = (await matrixResponse.json()) as MatrixResponse;
    const entries = matrix.sources_to_targets?.[0] ?? [];
    const rankings: PharmacyRouteRanking[] = locations.flatMap((location, index) => {
      const entry = entries[index];
      const distanceMeters = entry?.distance;
      const durationSeconds = entry?.time;
      if (
        typeof distanceMeters !== 'number' ||
        typeof durationSeconds !== 'number' ||
        !Number.isFinite(distanceMeters) ||
        !Number.isFinite(durationSeconds)
      ) {
        return [];
      }
      return [{ pharmacyId: location.pharmacyId, distanceMeters, durationSeconds }];
    });
    rankings.sort((a, b) => a.durationSeconds - b.durationSeconds || a.distanceMeters - b.distanceMeters);

    const routeTarget = selectedPharmacy ??
      NEAREST_SAMPLE_PHARMACIES.find((pharmacy) => pharmacy.id === rankings[0]?.pharmacyId) ??
      null;
    const targetLocation = locations.find((location) => location.pharmacyId === routeTarget?.id) ?? null;
    if (!routeTarget || !targetLocation) throw new Error('No route destinations are available.');

    const routeUrl = new URL('https://api.geoapify.com/v1/routing');
    routeUrl.searchParams.set(
      'waypoints',
      `${body.origin.latitude},${body.origin.longitude}|${targetLocation.latitude},${targetLocation.longitude}`,
    );
    routeUrl.searchParams.set('mode', body.mode);
    routeUrl.searchParams.set('format', 'geojson');
    routeUrl.searchParams.set('apiKey', apiKey);
    const routeResponse = await fetch(routeUrl, { cache: 'no-store' });
    if (!routeResponse.ok) throw new Error('Geoapify route request failed.');

    return NextResponse.json(
      {
        rankings,
        locations,
        route: {
          pharmacyId: routeTarget.id,
          coordinates: routeCoordinates((await routeResponse.json()) as RouteResponse),
        },
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return NextResponse.json(
      { error: 'Route estimates are unavailable right now. You can still open the sample locations in Maps.' },
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
