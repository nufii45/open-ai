'use client';

import { useEffect } from 'react';
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import type { PharmacyMapLocation } from '@/lib/pharmacies';
import type { SamplePharmacy } from '@/lib/types';

type Coordinates = { latitude: number; longitude: number };

type PharmacyMapProps = {
  pharmacies: readonly SamplePharmacy[];
  locations: readonly PharmacyMapLocation[];
  origin: Coordinates | null;
  routeCoordinates: readonly [number, number][];
  selectedPharmacyId: string | null;
  onSelectPharmacy: (pharmacyId: string) => void;
};

function FitMapBounds({
  locations,
  origin,
  routeCoordinates,
}: Pick<PharmacyMapProps, 'locations' | 'origin' | 'routeCoordinates'>) {
  const map = useMap();

  useEffect(() => {
    const points = routeCoordinates.length
      ? routeCoordinates.map(([longitude, latitude]) => [latitude, longitude] as [number, number])
      : locations.map(({ latitude, longitude }) => [latitude, longitude] as [number, number]);
    if (origin) points.push([origin.latitude, origin.longitude]);
    if (points.length > 1) map.fitBounds(points, { padding: [28, 28], animate: false });
  }, [locations, map, origin, routeCoordinates]);

  return null;
}

export function PharmacyMap({
  pharmacies,
  locations,
  origin,
  routeCoordinates,
  selectedPharmacyId,
  onSelectPharmacy,
}: PharmacyMapProps) {
  const firstLocation = locations[0];
  if (!firstLocation) return null;

  const pharmacyById = new Map(pharmacies.map((pharmacy) => [pharmacy.id, pharmacy]));
  const routePositions = routeCoordinates.map(
    ([longitude, latitude]) => [latitude, longitude] as [number, number],
  );

  return (
    <div className="pharmacy-map h-56 overflow-hidden rounded-xl border border-stone-300 bg-slate-100 sm:h-64">
      <MapContainer
        center={[firstLocation.latitude, firstLocation.longitude]}
        zoom={14}
        scrollWheelZoom={false}
        className="h-full w-full"
        aria-label="Nearby care locations and selected route"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitMapBounds locations={locations} origin={origin} routeCoordinates={routeCoordinates} />
        {routePositions.length > 1 ? (
          <Polyline positions={routePositions} pathOptions={{ color: '#1d4ed8', weight: 5, opacity: 0.86 }} />
        ) : null}
        {origin ? (
          <CircleMarker
            center={[origin.latitude, origin.longitude]}
            radius={8}
            pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#1d4ed8', fillOpacity: 1 }}
          >
            <Popup>Your shared location</Popup>
          </CircleMarker>
        ) : null}
        {locations.map((location) => {
          const pharmacy = pharmacyById.get(location.pharmacyId);
          if (!pharmacy) return null;
          const isSelected = location.pharmacyId === selectedPharmacyId;
          return (
            <CircleMarker
              key={location.pharmacyId}
              center={[location.latitude, location.longitude]}
              radius={isSelected ? 9 : 7}
              eventHandlers={{ click: () => onSelectPharmacy(location.pharmacyId) }}
              pathOptions={{
                color: '#ffffff',
                weight: 3,
                fillColor: isSelected ? '#1d4ed8' : '#475569',
                fillOpacity: 1,
              }}
            >
              <Popup>
                <strong>{pharmacy.name}</strong>
                <br />
                {pharmacy.branch}
                <br />
                {pharmacy.label}
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
