'use client';

import dynamic from 'next/dynamic';
import {
  ArrowLeft,
  ArrowRight,
  Car,
  Footprints,
  LocateFixed,
  LoaderCircle,
  MapPinned,
  Navigation,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import type { CareJourney } from '@/lib/careJourneys';
import type {
  PharmacyMapLocation,
  PharmacyRouteRanking,
  RouteDestination,
  RouteMode,
} from '@/lib/pharmacies';
import type { SamplePharmacy } from '@/lib/types';

const PharmacyMap = dynamic(
  () => import('@/components/PharmacyMap').then((module) => module.PharmacyMap),
  { ssr: false, loading: () => <Skeleton className="h-56 w-full rounded-xl sm:h-64" /> },
);
type Coordinates = { latitude: number; longitude: number };
type RouteData = {
  rankings: PharmacyRouteRanking[];
  locations: PharmacyMapLocation[];
  route: { pharmacyId: string; coordinates: [number, number][] };
};
type NearbyData = {
  pharmacies: SamplePharmacy[];
  locations: PharmacyMapLocation[];
  page: number;
  hasMore: boolean;
};
type LocatorPhase = 'idle' | 'requesting_location' | 'loading_routes' | 'ready' | 'error';
type Category = CareJourney['locationCategory'];
const COPY: Record<Category, { singular: string; plural: string }> = {
  pharmacy: { singular: 'pharmacy', plural: 'pharmacies' },
  clinic: { singular: 'clinic', plural: 'clinics' },
  laboratory: { singular: 'laboratory', plural: 'laboratories' },
  hospital: { singular: 'hospital', plural: 'hospitals' },
};

function routeSummary(ranking: PharmacyRouteRanking | undefined, mode: RouteMode) {
  if (!ranking) return 'Route estimate loading';
  const distance =
    ranking.distanceMeters < 1000
      ? `${Math.round(ranking.distanceMeters)} m`
      : `${(ranking.distanceMeters / 1000).toFixed(1)} km`;
  const minutes = Math.max(1, Math.round(ranking.durationSeconds / 60));
  return `${distance} · about ${minutes} min by ${mode === 'drive' ? 'driving' : 'walking'}`;
}

export function PharmacyLocator({
  pharmacies,
  category,
}: {
  pharmacies: readonly SamplePharmacy[];
  category: Category;
}) {
  const [mode, setMode] = useState<RouteMode>('drive');
  const [origin, setOrigin] = useState<Coordinates | null>(null);
  const [phase, setPhase] = useState<LocatorPhase>('idle');
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [locations, setLocations] = useState<PharmacyMapLocation[]>([]);
  const [activeLocations, setActiveLocations] = useState<readonly SamplePharmacy[]>([]);
  const [destinations, setDestinations] = useState<RouteDestination[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const copy = COPY[category];

  async function loadRoutes(
    nextOrigin: Coordinates,
    nextMode: RouteMode,
    requestedId: string | null,
    nextDestinations: readonly RouteDestination[],
  ) {
    if (!nextDestinations.length) return;
    setPhase('loading_routes');
    try {
      const response = await fetch('/api/pharmacy-routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: nextOrigin,
          mode: nextMode,
          selectedPharmacyId: requestedId,
          destinations: nextDestinations,
        }),
      });
      const data = (await response.json()) as RouteData | { error?: string };
      if (!response.ok || !('rankings' in data))
        throw new Error('Route estimates are unavailable right now.');
      setRouteData(data);
      setSelectedId(data.route.pharmacyId);
      setPhase('ready');
    } catch (cause) {
      setRouteData(null);
      setPhase('error');
      setError(
        cause instanceof Error ? cause.message : 'Route estimates are unavailable right now.',
      );
    }
  }
  async function findNearby(nextOrigin: Coordinates, nextPage: number) {
    setPhase('loading_routes');
    setError(null);
    try {
      const response = await fetch('/api/nearby-pharmacies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin: nextOrigin, category, page: nextPage }),
      });
      const data = (await response.json()) as NearbyData | { error?: string };
      if (!response.ok || !('pharmacies' in data) || !data.pharmacies.length)
        throw new Error(`Nearby ${copy.plural} search is unavailable right now.`);
      const nextDestinations = data.locations.flatMap((location): RouteDestination[] => {
        const place = data.pharmacies.find((item) => item.id === location.pharmacyId);
        return place ? [{ ...location, name: place.name, branch: place.branch }] : [];
      });
      if (!nextDestinations.length)
        throw new Error(`Nearby ${copy.plural} search returned no usable locations.`);
      const firstId = data.pharmacies[0]?.id ?? null;
      setActiveLocations(data.pharmacies);
      setLocations(data.locations);
      setDestinations(nextDestinations);
      setSelectedId(firstId);
      setPage(data.page);
      setHasMore(data.hasMore);
      await loadRoutes(nextOrigin, mode, firstId, nextDestinations);
    } catch (cause) {
      setActiveLocations(category === 'pharmacy' ? pharmacies : []);
      setLocations([]);
      setDestinations([]);
      setRouteData(null);
      setHasMore(false);
      setPhase('error');
      setError(
        cause instanceof Error
          ? cause.message
          : `Nearby ${copy.plural} search is unavailable right now.`,
      );
    }
  }
  function requestLocation() {
    if (!navigator.geolocation) {
      setPhase('error');
      setError('Location is not available in this browser. You can still use your visit card.');
      return;
    }
    setPhase('requesting_location');
    setError(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const nextOrigin = { latitude: coords.latitude, longitude: coords.longitude };
        setOrigin(nextOrigin);
        void findNearby(nextOrigin, 0);
      },
      () => {
        setPhase('error');
        setError('We could not access your location. You can still use your visit card.');
      },
      { enableHighAccuracy: false, maximumAge: 300_000, timeout: 10_000 },
    );
  }
  function selectPlace(id: string) {
    setSelectedId(id);
    if (origin) void loadRoutes(origin, mode, id, destinations);
  }
  function selectMode(nextMode: RouteMode) {
    setMode(nextMode);
    if (origin) void loadRoutes(origin, nextMode, selectedId, destinations);
  }
  function changePage(nextPage: number) {
    if (origin) void findNearby(origin, nextPage);
  }

  const mapLocations = useMemo(() => routeData?.locations ?? locations, [locations, routeData]);
  const activeId = selectedId ?? routeData?.route.pharmacyId ?? null;
  const selectedPlace =
    activeLocations.find((place) => place.id === activeId) ?? activeLocations[0] ?? null;
  const selectedRanking = routeData?.rankings.find((item) => item.pharmacyId === selectedPlace?.id);
  const mapRoute = routeData?.route.coordinates ?? [];

  return (
    <section
      aria-labelledby="location-heading"
      className="hb-stage-panel rounded-[1.5rem] border border-stone-300 bg-[#f8f1e7] p-5 shadow-sm sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-blue-800">
            STEP 4 · NAVIGATION GUIDANCE
          </p>
          <h2
            id="location-heading"
            className="mt-1 text-xl font-bold tracking-tight text-slate-950"
          >
            Find a nearby {copy.singular}
          </h2>
          <p className="mt-1 max-w-[60ch] text-sm leading-6 text-slate-600">
            Opt in to compare estimated routes. Your location is used for this search only and is
            not saved.
          </p>
        </div>
        <div
          className="inline-flex rounded-lg border border-stone-300 bg-[#fffaf2] p-1"
          aria-label="Travel mode"
        >
          <button
            type="button"
            onClick={() => selectMode('drive')}
            aria-pressed={mode === 'drive'}
            className={`inline-flex min-h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 ${mode === 'drive' ? 'bg-blue-800 text-white' : 'text-slate-600 hover:bg-[#efe7da]'}`}
          >
            <Car className="size-4" aria-hidden="true" />
            Drive
          </button>
          <button
            type="button"
            onClick={() => selectMode('walk')}
            aria-pressed={mode === 'walk'}
            className={`inline-flex min-h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 ${mode === 'walk' ? 'bg-blue-800 text-white' : 'text-slate-600 hover:bg-[#efe7da]'}`}
          >
            <Footprints className="size-4" aria-hidden="true" />
            Walk
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2.5 text-xs leading-5 text-slate-600">
        <span className="font-semibold text-blue-900">Privacy:</span> Your location stays in this
        browser and is only sent to retrieve this route estimate.
      </div>
      {mapLocations.length ? (
        <div className="mt-4">
          <PharmacyMap
            pharmacies={activeLocations}
            locations={mapLocations}
            origin={origin}
            routeCoordinates={mapRoute}
            selectedPharmacyId={activeId}
            onSelectPharmacy={selectPlace}
          />
        </div>
      ) : (
        <div className="mt-4 flex min-h-44 flex-col items-center justify-center rounded-xl border border-dashed border-stone-300 bg-[#f0ece4] px-5 py-8 text-center">
          <span className="flex size-10 items-center justify-center rounded-full border border-stone-300 bg-[#fffaf2] text-blue-800 shadow-sm">
            <MapPinned className="size-5" aria-hidden="true" />
          </span>
          <p className="mt-3 text-sm font-medium text-slate-800">
            Nearby results stay off until you opt in.
          </p>
          <p className="mt-1 max-w-sm text-sm leading-6 text-slate-600">
            Your location is used only for this nearby {copy.singular} search and route estimate.
          </p>
        </div>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={requestLocation}
          disabled={phase === 'requesting_location' || phase === 'loading_routes'}
          className="hb-primary-cta inline-flex min-h-11 items-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {phase === 'requesting_location' || phase === 'loading_routes' ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <LocateFixed className="size-4" aria-hidden="true" />
          )}
          {origin ? `Refresh nearby ${copy.plural}` : `Find ${copy.plural} near me`}
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
      {category === 'laboratory' ? (
        <p className="mt-3 text-xs leading-5 text-amber-800">
          Public map data does not provide a laboratory-only category here, so these are nearby
          healthcare locations. Confirm laboratory services directly before travelling.
        </p>
      ) : null}

      {selectedPlace ? (
        <section className="mt-5 rounded-[1.25rem] bg-slate-950 p-4 text-[#fffaf2]">
          <p className="text-xs font-semibold tracking-[0.14em] text-blue-200">
            SELECTED DESTINATION
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold">{selectedPlace.name}</h3>
              <p className="mt-0.5 text-sm text-slate-300">{selectedPlace.branch}</p>
              <p className="mt-2 text-sm font-medium text-blue-200">
                {routeSummary(selectedRanking, mode)}
              </p>
            </div>
            <a
              href={selectedPlace.directionsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#fffaf2] px-3 text-sm font-semibold text-slate-950 transition hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Navigation className="size-4" aria-hidden="true" />
              Open route
            </a>
          </div>
        </section>
      ) : null}

      <div className="mt-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Nearby results</h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Select one place to update the map and route. Results do not confirm service, price,
              hours, or stock.
            </p>
          </div>
          <span className="shrink-0 text-xs font-medium text-slate-500">Map data only</span>
        </div>
        {activeLocations.length ? (
          <ol className="mt-3 divide-y divide-stone-200 border-y border-stone-200">
            {activeLocations.map((place, index) => {
              const isSelected = place.id === activeId;
              const ranking = routeData?.rankings.find((item) => item.pharmacyId === place.id);
              return (
                <li key={place.id}>
                  <button
                    type="button"
                    onClick={() => selectPlace(place.id)}
                    aria-pressed={isSelected}
                    className={`flex w-full items-center gap-3 px-1 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-inset ${isSelected ? 'bg-blue-50/80' : 'hover:bg-[#efe7da]/70'}`}
                  >
                    <span
                      className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${isSelected ? 'bg-blue-800 text-white' : 'border border-stone-300 bg-[#fffaf2] text-slate-600'}`}
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-900">
                        {place.name}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-slate-500">
                        {place.branch}
                      </span>
                      <span
                        className={`mt-1 block text-xs font-medium ${isSelected ? 'text-blue-800' : 'text-slate-600'}`}
                      >
                        {routeSummary(ranking, mode)}
                      </span>
                    </span>
                    <span
                      className={`text-xs font-semibold ${isSelected ? 'text-blue-800' : 'text-slate-500'}`}
                    >
                      {isSelected ? 'On map' : 'Select'}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        ) : null}
      </div>
      {activeLocations.length ? (
        <nav
          aria-label="Nearby results pages"
          className="mt-4 flex items-center justify-between border-t border-stone-200 pt-3"
        >
          <button
            type="button"
            onClick={() => changePage(page - 1)}
            disabled={page === 0 || phase === 'loading_routes'}
            className="inline-flex min-h-10 items-center gap-1 rounded-lg px-2 text-sm font-medium text-slate-700 hover:bg-[#efe7da] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Previous
          </button>
          <p className="text-xs font-medium text-slate-600">
            Results {page * 5 + 1}–{page * 5 + activeLocations.length}
          </p>
          <button
            type="button"
            onClick={() => changePage(page + 1)}
            disabled={!hasMore || phase === 'loading_routes'}
            className="inline-flex min-h-10 items-center gap-1 rounded-lg px-2 text-sm font-medium text-slate-700 hover:bg-[#efe7da] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
          >
            Next
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        </nav>
      ) : null}
      <p className="mt-4 text-xs leading-5 text-slate-500">
        Nearby results are derived from OpenStreetMap data via Geoapify. Routes are estimates and do
        not indicate services, price, operating hours, or confirmed availability.
      </p>
    </section>
  );
}
