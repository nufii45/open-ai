'use client';

import { MapPin, Route } from 'lucide-react';
import type { PharmacyRouteRanking, RouteMode } from '@/lib/pharmacies';
import type { SamplePharmacy } from '@/lib/types';

type PharmacyListProps = {
  pharmacies: readonly SamplePharmacy[];
  rankings: readonly PharmacyRouteRanking[];
  mode: RouteMode;
  selectedPharmacyId: string | null;
  onSelectPharmacy: (pharmacyId: string) => void;
};

function formatDistance(distanceMeters: number): string {
  return distanceMeters >= 1000
    ? `${(distanceMeters / 1000).toFixed(1)} km`
    : `${Math.round(distanceMeters / 50) * 50} m`;
}

function formatDuration(durationSeconds: number): string {
  return `${Math.max(1, Math.round(durationSeconds / 60))} min`;
}

export function PharmacyList({
  pharmacies,
  rankings,
  mode,
  selectedPharmacyId,
  onSelectPharmacy,
}: PharmacyListProps) {
  const rankingByPharmacyId = new Map(rankings.map((ranking) => [ranking.pharmacyId, ranking]));
  const orderedPharmacies = rankings.length
    ? [...pharmacies].sort(
        (a, b) =>
          rankings.findIndex((ranking) => ranking.pharmacyId === a.id) -
          rankings.findIndex((ranking) => ranking.pharmacyId === b.id),
      )
    : pharmacies;
  const travelMode = mode === 'drive' ? 'driving' : 'walking';

  return (
    <section aria-labelledby="pharmacies-heading">
      <div className="mb-2.5 flex items-baseline justify-between gap-2">
        <h3 id="pharmacies-heading" className="text-sm font-semibold text-slate-700">
          Suggested drugstores
        </h3>
        <span className="text-xs text-slate-500">Illustrative only</span>
      </div>
      <p className="mb-2.5 text-xs leading-5 text-slate-500">
        {rankings.length
          ? `Sorted by estimated ${travelMode} route. No live stock or price information.`
          : 'Share a location above to see estimated route order. No live stock or price information.'}
      </p>
      <ul className="divide-y divide-slate-200 border-y border-slate-200">
        {orderedPharmacies.map((pharmacy) => {
          const ranking = rankingByPharmacyId.get(pharmacy.id);
          const isSelected = pharmacy.id === selectedPharmacyId;
          return (
          <li
            key={pharmacy.id}
            className="flex items-center justify-between gap-3 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">{pharmacy.name}</p>
              <p className="truncate text-xs text-slate-500">{pharmacy.branch}</p>
              {ranking ? (
                <p className="mt-0.5 text-xs font-medium text-teal-800">
                  {formatDistance(ranking.distanceMeters)} · about {formatDuration(ranking.durationSeconds)} by {travelMode}
                </p>
              ) : (
                <p className="mt-0.5 text-xs text-slate-500">{pharmacy.label} · confirm stock &amp; price</p>
              )}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <button
                type="button"
                onClick={() => onSelectPharmacy(pharmacy.id)}
                aria-pressed={isSelected}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3 text-sm font-medium text-teal-800 transition-[background-color,transform] duration-200 ease-out hover:bg-teal-100 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:transform-none"
              >
                <Route aria-hidden="true" className="size-4" />
                {isSelected ? 'Showing route' : 'Show route'}
              </button>
              <a
                href={pharmacy.directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-8 items-center gap-1 text-xs font-medium text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
              >
                <MapPin aria-hidden="true" className="size-3.5" />
                Open Maps
              </a>
            </div>
          </li>
          );
        })}
      </ul>
    </section>
  );
}
