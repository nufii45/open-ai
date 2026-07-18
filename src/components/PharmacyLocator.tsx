'use client';

import dynamic from 'next/dynamic';
import { Car, Footprints, LocateFixed, LoaderCircle, MapPinned } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { PharmacyList } from '@/components/PharmacyList';
import { Skeleton } from '@/components/ui/skeleton';
import type {
  PharmacyMapLocation,
  PharmacyRouteRanking,
  RouteMode,
} from '@/lib/pharmacies';
import type { SamplePharmacy } from '@/lib/types';

const PharmacyMap = dynamic(
  () => import('@/components/PharmacyMap').then((module) => module.PharmacyMap),
  {
    ssr: false,
    loading: () => <Skeleton className="h-72 w-full rounded-xl sm:h-80" />,
  },
);

type Coordinates = { latitude: number; longitude: number };

type RouteData = {
  rankings: PharmacyRouteRanking[];
  locations: PharmacyMapLocation[];
  route: { pharmacyId: string; coordinates: [number, number][] };
};

type LocatorPhase = 'idle' | 'requesting_location' | 'loading_routes' | 'ready' | 'error';

const LOCATION_ERROR =
  'We could not access your location. You can still use the illustrative pharmacy list below.';

export function PharmacyLocator({ pharmacies }: { pharmacies: readonly SamplePharmacy[] }) {
  const [mode, setMode] = useState<RouteMode>('drive');
  const [origin, setOrigin] = useState<Coordinates | null>(null);
  const [phase, setPhase] = useState<LocatorPhase>('idle');
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [pharmacyLocations, setPharmacyLocations] = useState<PharmacyMapLocation[]>([]);
  const [requestedPharmacyId, setRequestedPharmacyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedPharmacyId = requestedPharmacyId ?? routeData?.route.pharmacyId ?? null;

  const loadRoutes = async (
    routeOrigin: Coordinates,
    routeMode: RouteMode,
    selectedPharmacyId: string | null,
  ) => {
    setPhase('loading_routes');
    setError(null);

    try {
      const response = await fetch('/api/pharmacy-routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin: routeOrigin, mode: routeMode, selectedPharmacyId }),
      });
      const payload = (await response.json()) as RouteData | { error?: string };
      if (!response.ok || !('rankings' in payload)) {
        throw new Error('error' in payload ? payload.error : 'Route estimates are unavailable right now.');
      }
      setRouteData(payload);
      setPhase('ready');
    } catch (cause) {
      setRouteData(null);
      setPhase('error');
      setError(cause instanceof Error ? cause.message : 'Route estimates are unavailable right now.');
    }
  };

  useEffect(() => {
    let cancelled = false;
    void fetch('/api/pharmacy-routes')
      .then(async (response) => {
        const payload = (await response.json()) as { locations?: PharmacyMapLocation[] };
        if (!response.ok || !payload.locations) throw new Error();
        if (!cancelled) setPharmacyLocations(payload.locations);
      })
      .catch(() => {
        // The no-map state remains useful when the protected key is missing or
        // the location service is temporarily unavailable.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setPhase('error');
      setError(LOCATION_ERROR);
      return;
    }

    setPhase('requesting_location');
    setError(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const nextOrigin = { latitude: coords.latitude, longitude: coords.longitude };
        setRequestedPharmacyId(null);
        setOrigin(nextOrigin);
        void loadRoutes(nextOrigin, mode, null);
      },
      () => {
        setPhase('error');
        setError(LOCATION_ERROR);
      },
      { enableHighAccuracy: false, maximumAge: 300_000, timeout: 10_000 },
    );
  };

  const mapLocations = useMemo(() => routeData?.locations ?? pharmacyLocations, [pharmacyLocations, routeData]);
  const mapRoute = useMemo(() => routeData?.route.coordinates ?? [], [routeData]);

  const selectPharmacy = (pharmacyId: string) => {
    setRequestedPharmacyId(pharmacyId);
    if (origin) void loadRoutes(origin, mode, pharmacyId);
  };

  const selectMode = (nextMode: RouteMode) => {
    setMode(nextMode);
    if (origin) void loadRoutes(origin, nextMode, requestedPharmacyId);
  };

  return (
    <section aria-labelledby="location-heading" className="border-t border-slate-200 pt-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 id="location-heading" className="text-base font-semibold text-slate-900">
            Illustrative pharmacy locations
          </h3>
          <p className="mt-1 max-w-[60ch] text-sm leading-6 text-slate-600">
            Share your location to compare estimated road routes to the sample branches below.
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1" aria-label="Travel mode">
          <button
            type="button"
            onClick={() => selectMode('drive')}
            aria-pressed={mode === 'drive'}
            className={`inline-flex min-h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 ${
              mode === 'drive' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Car aria-hidden="true" className="size-4" />
            Drive
          </button>
          <button
            type="button"
            onClick={() => selectMode('walk')}
            aria-pressed={mode === 'walk'}
            className={`inline-flex min-h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 ${
              mode === 'walk' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Footprints aria-hidden="true" className="size-4" />
            Walk
          </button>
        </div>
      </div>

      {mapLocations.length > 0 ? (
        <div className="mt-4">
          <PharmacyMap
            pharmacies={pharmacies}
            locations={mapLocations}
            origin={origin}
            routeCoordinates={mapRoute}
            selectedPharmacyId={selectedPharmacyId}
            onSelectPharmacy={selectPharmacy}
          />
        </div>
      ) : (
        <div className="mt-4 flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm">
            <MapPinned aria-hidden="true" className="size-5" />
          </span>
          <p className="mt-3 text-sm font-medium text-slate-800">Route estimates stay off until you opt in.</p>
          <p className="mt-1 max-w-sm text-sm leading-6 text-slate-600">
            Your location is used only to request the route estimate and is not saved by HealthBridge.
          </p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={requestLocation}
          disabled={phase === 'requesting_location' || phase === 'loading_routes'}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-teal-600 px-4 text-sm font-medium text-white shadow-sm transition-[background-color,transform] duration-200 ease-out hover:bg-teal-700 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 motion-reduce:transition-none motion-reduce:transform-none"
        >
          {phase === 'requesting_location' || phase === 'loading_routes' ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <LocateFixed aria-hidden="true" className="size-4" />
          )}
          {origin ? 'Refresh route estimates' : 'Use my location'}
        </button>
        {phase === 'loading_routes' ? (
          <p role="status" className="text-sm text-slate-600">
            Calculating estimated {mode === 'drive' ? 'driving' : 'walking'} routes…
          </p>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="mt-3 text-sm leading-6 text-amber-800">
          {error}
        </p>
      ) : null}

      <p className="mt-3 text-xs leading-5 text-slate-500">
        Map data © OpenStreetMap contributors. Routes are estimates and do not indicate pharmacy stock,
        price, or confirmed availability.
      </p>

      <div className="mt-5">
        <PharmacyList
          pharmacies={pharmacies}
          rankings={routeData?.rankings ?? []}
          mode={mode}
          selectedPharmacyId={selectedPharmacyId}
          onSelectPharmacy={selectPharmacy}
        />
      </div>
    </section>
  );
}
