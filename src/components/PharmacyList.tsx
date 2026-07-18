import { MapPin } from 'lucide-react';
import type { SamplePharmacy } from '@/lib/types';

// Three cached sample drugstores near Ateneo. No live API, no geolocation:
// each row links out to a Google Maps search the person navigates themselves.
// Labelled illustrative — never implies live stock, price, or proximity.
export function PharmacyList({ pharmacies }: { pharmacies: readonly SamplePharmacy[] }) {
  return (
    <section aria-labelledby="pharmacies-heading">
      <div className="mb-2.5 flex items-baseline justify-between gap-2">
        <h3 id="pharmacies-heading" className="text-sm font-semibold text-slate-700">
          Nearby drugstores
        </h3>
        <span className="text-xs text-slate-500">Illustrative list</span>
      </div>
      <p className="mb-2.5 text-xs leading-5 text-slate-500">
        Not live stock, price, or location information.
      </p>
      <ul className="divide-y divide-slate-200 border-y border-slate-200">
        {pharmacies.map((pharmacy) => (
          <li
            key={`${pharmacy.name}-${pharmacy.branch}`}
            className="flex items-center justify-between gap-3 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">{pharmacy.name}</p>
              <p className="truncate text-xs text-slate-500">{pharmacy.branch}</p>
              <p className="mt-0.5 text-xs text-slate-500">{pharmacy.label} · confirm stock &amp; price</p>
            </div>
            <a
              href={pharmacy.directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3 text-sm font-medium text-teal-800 transition-[background-color,transform] duration-200 ease-out hover:bg-teal-100 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:transform-none"
            >
              <MapPin aria-hidden="true" className="size-4" />
              Get directions
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
