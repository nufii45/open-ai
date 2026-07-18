import type { SamplePharmacy } from './types';

// Cached, hardcoded drugstore branches near Ateneo de Manila (Katipunan Ave /
// Loyola Heights, Quezon City). Drugstores only — no clinics. There is NO live
// API and NO geolocation: "Get directions" opens a Google Maps search so the
// person can navigate themselves.
//
// Per AGENTS.md: these are labelled illustrative and must never imply live
// stock, a current branch price, or confirmed proximity.

function mapsSearch(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export const SAMPLE_PHARMACIES: readonly SamplePharmacy[] = [
  {
    name: 'Mercury Drug',
    branch: 'Katipunan Ave, Loyola Heights',
    directionsUrl: mapsSearch('Mercury Drug Katipunan Avenue Loyola Heights Quezon City'),
    label: 'Illustrative option',
    note: 'Sample branch — call ahead to confirm stock and price.',
  },
  {
    name: 'The Generics Pharmacy',
    branch: 'Katipunan Ave, near Ateneo',
    directionsUrl: mapsSearch('The Generics Pharmacy Katipunan Avenue Quezon City'),
    label: 'Illustrative option',
    note: 'Sample branch — call ahead to confirm stock and price.',
  },
  {
    name: 'Watsons',
    branch: 'UP Town Center, Katipunan',
    directionsUrl: mapsSearch('Watsons UP Town Center Katipunan Quezon City'),
    label: 'Illustrative option',
    note: 'Sample branch — call ahead to confirm stock and price.',
  },
  {
    name: 'Southstar Drug',
    branch: 'Katipunan Ave, Quezon City',
    directionsUrl: mapsSearch('Southstar Drug Katipunan Avenue Quezon City'),
    label: 'Illustrative option',
    note: 'Sample branch — call ahead to confirm stock and price.',
  },
];

/** The three sample branches shown beside a comparison. */
export const NEAREST_SAMPLE_PHARMACIES: readonly SamplePharmacy[] = SAMPLE_PHARMACIES.slice(0, 3);
