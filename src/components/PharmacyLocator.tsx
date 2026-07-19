'use client';

import dynamic from 'next/dynamic';
import { Car, Footprints, LocateFixed, LoaderCircle, MapPinned } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { PharmacyList } from '@/components/PharmacyList';
import { Skeleton } from '@/components/ui/skeleton';
import type { PharmacyMapLocation, PharmacyRouteRanking, RouteDestination, RouteMode } from '@/lib/pharmacies';
import type { SamplePharmacy } from '@/lib/types';

const PharmacyMap = dynamic(() => import('@/components/PharmacyMap').then((module) => module.PharmacyMap), {
  ssr: false,
  loading: () => <Skeleton className="h-72 w-full rounded-xl sm:h-80" />,
});

type Coordinates = { latitude: number; longitude: number };
type RouteData = { rankings: PharmacyRouteRanking[]; locations: PharmacyMapLocation[]; route: { pharmacyId: string; coordinates: [number, number][] } };
type NearbyData = { pharmacies: SamplePharmacy[]; locations: PharmacyMapLocation[] };
type LocatorPhase = 'idle' | 'requesting_location' | 'loading_routes' | 'ready' | 'error';

const LOCATION_ERROR = 'We could not access your location. You can still browse the suggested pharmacy directions below.';

export function PharmacyLocator({ pharmacies }: { pharmacies: readonly SamplePharmacy[] }) {
  const [mode, setMode] = useState<RouteMode>('drive');
  const [origin, setOrigin] = useState<Coordinates | null>(null);
  const [phase, setPhase] = useState<LocatorPhase>('idle');
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [pharmacyLocations, setPharmacyLocations] = useState<PharmacyMapLocation[]>([]);
  const [activePharmacies, setActivePharmacies] = useState<readonly SamplePharmacy[]>(pharmacies);
  const [routeDestinations, setRouteDestinations] = useState<RouteDestination[] | null>(null);
  const [requestedPharmacyId, setRequestedPharmacyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedPharmacyId = requestedPharmacyId ?? routeData?.route.pharmacyId ?? null;

  const loadRoutes = async (routeOrigin: Coordinates, routeMode: RouteMode, selectedPharmacyId: string | null, destinations: RouteDestination[] | null) => {
    setPhase('loading_routes');
    setError(null);
    try {
      const response = await fetch('/api/pharmacy-routes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin: routeOrigin, mode: routeMode, selectedPharmacyId, destinations: destinations ?? undefined }),
      });
      const payload = (await response.json()) as RouteData | { error?: string };
      if (!response.ok || !('rankings' in payload)) throw new Error('error' in payload ? payload.error : 'Route estimates are unavailable right now.');
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
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  const loadNearbyPharmacies = async (nextOrigin: Coordinates) => {
    try {
      const response = await fetch('/api/nearby-pharmacies', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ origin: nextOrigin }),
      });
      const payload = (await response.json()) as NearbyData | { error?: string };
      if (!response.ok || !('pharmacies' in payload) || payload.pharmacies.length === 0) throw new Error('Nearby pharmacy search is unavailable right now. Showing suggested branches instead.');
      const destinations = payload.locations.flatMap((location): RouteDestination[] => {
        const pharmacy = payload.pharmacies.find((item) => item.id === location.pharmacyId);
        return pharmacy ? [{ ...location, name: pharmacy.name, branch: pharmacy.branch }] : [];
      });
      if (!destinations.length) throw new Error('Nearby pharmacy search returned no usable locations.');
      setActivePharmacies(payload.pharmacies);
      setPharmacyLocations(payload.locations);
      setRouteDestinations(destinations);
      await loadRoutes(nextOrigin, mode, null, destinations);
    } catch (cause) {
      setActivePharmacies(pharmacies);
      setRouteDestinations(null);
      await loadRoutes(nextOrigin, mode, null, null);
      setError(cause instanceof Error ? cause.message : 'Nearby pharmacy search is unavailable right now.');
    }
  };

  const requestLocation = () => {
    if (!navigator.geolocation) { setPhase('error'); setError(LOCATION_ERROR); return; }
    setPhase('requesting_location');
    setError(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const nextOrigin = { latitude: coords.latitude, longitude: coords.longitude };
        setRequestedPharmacyId(null);
        setOrigin(nextOrigin);
        void loadNearbyPharmacies(nextOrigin);
      },
      () => { setPhase('error'); setError(LOCATION_ERROR); },
      { enableHighAccuracy: false, maximumAge: 300_000, timeout: 10_000 },
    );
  };

  const mapLocations = useMemo(() => routeData?.locations ?? pharmacyLocations, [pharmacyLocations, routeData]);
  const mapRoute = useMemo(() => routeData?.route.coordinates ?? [], [routeData]);
  const selectPharmacy = (pharmacyId: string) => {
    setRequestedPharmacyId(pharmacyId);
    if (origin) void loadRoutes(origin, mode, pharmacyId, routeDestinations);
  };
  const selectMode = (nextMode: RouteMode) => {
    setMode(nextMode);
    if (origin) void loadRoutes(origin, nextMode, requestedPharmacyId, routeDestinations);
  };

  return (
    <section aria-labelledby="location-heading" className="border-t border-slate-200 pt-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 id="location-heading" className="text-base font-semibold text-slate-900">Nearby pharmacy directions</h3>
          <p className="mt-1 max-w-[60ch] text-sm leading-6 text-slate-600">With your permission, HealthBridge finds nearby pharmacy map results and compares estimated road routes. Your location is not saved.</p>
        </div>
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1" aria-label="Travel mode">
          <button type="button" onClick={() => selectMode('drive')} aria-pressed={mode === 'drive'} className={`inline-flex min-h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 ${mode === 'drive' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}><Car aria-hidden="true" className="size-4" />Drive</button>
          <button type="button" onClick={() => selectMode('walk')} aria-pressed={mode === 'walk'} className={`inline-flex min-h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 ${mode === 'walk' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}><Footprints aria-hidden="true" className="size-4" />Walk</button>
        </div>
      </div>

      {mapLocations.length ? <div className="mt-4"><PharmacyMap pharmacies={activePharmacies} locations={mapLocations} origin={origin} routeCoordinates={mapRoute} selectedPharmacyId={selectedPharmacyId} onSelectPharmacy={selectPharmacy} /></div> : (
        <div className="mt-4 flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center"><span className="flex size-10 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm"><MapPinned aria-hidden="true" className="size-5" /></span><p className="mt-3 text-sm font-medium text-slate-800">Nearby results stay off until you opt in.</p><p className="mt-1 max-w-sm text-sm leading-6 text-slate-600">Your location is used only for this nearby search and route estimate.</p></div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={requestLocation} disabled={phase === 'requesting_location' || phase === 'loading_routes'} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-teal-600 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300">
          {phase === 'requesting_location' || phase === 'loading_routes' ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <LocateFixed aria-hidden="true" className="size-4" />}
          {origin ? 'Refresh nearby pharmacies' : 'Find pharmacies near me'}
        </button>
        {phase === 'loading_routes' ? <p role="status" className="text-sm text-slate-600">Calculating estimated {mode === 'drive' ? 'driving' : 'walking'} routes…</p> : null}
      </div>
      {error ? <p role="alert" className="mt-3 text-sm leading-6 text-amber-800">{error}</p> : null}
      <p className="mt-3 text-xs leading-5 text-slate-500">Nearby pharmacy results are derived from OpenStreetMap data via Geoapify. Routes are estimates and do not indicate pharmacy stock, price, operating hours, or confirmed availability.</p>
      <div className="mt-5"><PharmacyList pharmacies={activePharmacies} rankings={routeData?.rankings ?? []} mode={mode} selectedPharmacyId={selectedPharmacyId} onSelectPharmacy={selectPharmacy} /></div>
    </section>
  );
}
