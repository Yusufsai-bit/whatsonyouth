import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Link } from 'react-router-dom';

// Fix default marker icon paths (Leaflet+bundlers issue)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const categoryColors: Record<string, string> = {
  Events: '#5847E0',
  Jobs: '#1A2A4A',
  Grants: '#1A3A2A',
  Programs: '#0A2A3A',
  Wellbeing: '#D85A30',
};

function makeIcon(color: string) {
  const html = `<div style="background:${color};width:22px;height:22px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>`;
  return L.divIcon({ html, className: '', iconSize: [22, 22], iconAnchor: [11, 22] });
}

export interface MapPin {
  id: string;
  title: string;
  organisation: string;
  location: string;
  category: string;
  latitude: number;
  longitude: number;
}

function FitBounds({ pins }: { pins: MapPin[] }) {
  const map = useMap();
  useEffect(() => {
    if (!pins.length) return;
    const bounds = L.latLngBounds(pins.map(p => [p.latitude, p.longitude] as [number, number]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
  }, [pins, map]);
  return null;
}

export default function MapView({ pins }: { pins: MapPin[] }) {
  if (!pins.length) {
    return (
      <div className="bg-brand-section-alt border border-brand-card-border rounded-xl p-10 text-center">
        <p className="font-body text-brand-text-secondary">No listings have a mapped location yet.</p>
        <p className="font-body text-sm text-brand-text-muted mt-2">Try the list view, or check back soon.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden border border-brand-card-border" style={{ height: '600px' }}>
      <MapContainer
        center={[-37.8136, 144.9631]}
        zoom={7}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds pins={pins} />
        {pins.map(p => (
          <Marker key={p.id} position={[p.latitude, p.longitude]} icon={makeIcon(categoryColors[p.category] || '#5847E0')}>
            <Popup>
              <div className="font-body" style={{ minWidth: 200 }}>
                <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{p.organisation}</div>
                <div style={{ fontWeight: 700, fontSize: 14, margin: '4px 0', color: '#0A0A0A' }}>{p.title}</div>
                <div style={{ fontSize: 12, color: '#555' }}>{p.location}</div>
                <Link to={`/listings/${p.id}`} style={{ display: 'inline-block', marginTop: 8, color: '#4A3BC9', fontWeight: 500, fontSize: 13 }}>
                  View details →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
