import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { mlApi } from '../services/api';
import Provenance from '../components/Provenance';

// Types from API client
interface ModelStatus {
  mineral: string;
  status: string;
  metrics: any;
  training_date: any;
  feature_list: string[];
  record_count: any;
}

interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    geometry: any;
    properties: {
      target_id: number;
      mineral: string;
      classification: string;
      manganese_probability: number;
      model_status: string;
      latitude: number;
      longitude: number;
    };
  }>;
}

export default function Prospectivity() {
  const {
    data: modelStatus,
    isLoading: modelLoading,
    error: modelError,
  } = useQuery<ModelStatus>({
    queryKey: ['modelStatus'],
    queryFn: mlApi.manganeseModelStatus,
  });

  const {
    data: prospectData,
    isLoading: prospectLoading,
    error: prospectError,
  } = useQuery<GeoJSONFeatureCollection>({
    queryKey: ['prospectivity'],
    queryFn: mlApi.prospectivity,
  });

  // Map initialization
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;
    mapRef.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [79.8113, 21.4312],
      zoom: 9,
    });
    mapRef.current.addControl(new maplibregl.NavigationControl(), 'top-right');
  }, []);

  // Add prospectivity layer when data is ready
  useEffect(() => {
    if (!mapRef.current || !prospectData) return;
    const map = mapRef.current;
    if (map.getSource('prospectivity')) {
      map.removeLayer('prospectivity-layer');
      map.removeSource('prospectivity');
    }
    map.addSource('prospectivity', {
      type: 'geojson',
      data: prospectData,
    });
    map.addLayer({
      id: 'prospectivity-layer',
      type: 'fill',
      source: 'prospectivity',
      paint: {
        'fill-color': [
          'match',
          ['get', 'classification'],
          'VERY_HIGH', '#ef4444',
          'HIGH', '#f59e0b',
          'MEDIUM', '#fbbf24',
          'LOW', '#a3a3a3',
          '#9ca3af',
        ],
        'fill-opacity': 0.4,
        'fill-outline-color': '#374151',
      },
    });
  }, [prospectData]);

  const totalTargets = prospectData?.features.length ?? 0;
  const classificationCounts = prospectData?.features.reduce((acc, f) => {
    const c = f.properties.classification;
    acc[c] = (acc[c] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) ?? {};

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Manganese Prospectivity</h1>
          <p className="text-gray-600">AI‑driven mineral potential assessment</p>
        </div>
        {modelLoading ? (
          <p className="text-gray-500">Loading model status…</p>
        ) : modelError ? (
          <p className="text-red-600">Error loading model status</p>
        ) : modelStatus ? (
          <div className="bg-gray-50 p-3 rounded shadow-sm border border-gray-200">
            <p className="text-sm text-gray-700"><strong>Model:</strong> {modelStatus.mineral} ({modelStatus.status})</p>
            <p className="text-sm text-gray-700"><strong>Features used:</strong> {modelStatus.feature_list?.length ?? 0}</p>
          </div>
        ) : null}
      </header>

      {/* Provenance indicator */}
      {prospectData && (
        <Provenance
          scene={null as any}
          isDemo={prospectData.features.some(f => f.properties.model_status === 'demo')}
        />
      )}

      {/* Summary cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded shadow border">
          <h2 className="text-lg font-medium text-gray-800">Total Targets</h2>
          <p className="text-2xl font-semibold text-indigo-600 mt-2">{totalTargets}</p>
        </div>
        {['VERY_HIGH', 'HIGH', 'MEDIUM', 'LOW'].map(cls => (
          <div key={cls} className="p-4 bg-white rounded shadow border">
            <h2 className="text-lg font-medium text-gray-800">{cls.replace('_', ' ')}</h2>
            <p className="text-2xl font-semibold text-indigo-600 mt-2">{classificationCounts[cls] ?? 0}</p>
          </div>
        ))}
      </section>

      {/* Map */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Prospectivity Map</h2>
        {prospectLoading ? (
          <p className="text-gray-500">Loading map data…</p>
        ) : prospectError ? (
          <p className="text-red-600">Error loading prospectivity data</p>
        ) : (
          <div ref={mapContainer} className="w-full h-96 rounded shadow border" />
        )}
      </section>

      {/* Ranking table */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Target Ranking</h2>
        {prospectLoading ? (
          <p className="text-gray-500">Loading ranking…</p>
        ) : prospectError ? (
          <p className="text-red-600">Error loading ranking data</p>
        ) : totalTargets === 0 ? (
          <p className="text-gray-600">No prospectivity results available.</p>
        ) : (
          <div className="overflow-auto rounded shadow border bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Rank</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Target ID</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Classification</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Score</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Latitude</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Longitude</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {prospectData?.features
                  .slice()
                  .sort((a, b) => b.properties.manganese_probability - a.properties.manganese_probability)
                  .map((feat, idx) => (
                    <tr key={feat.properties.target_id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-800">{idx + 1}</td>
                      <td className="px-4 py-2 text-sm text-gray-800">{feat.properties.target_id}</td>
                      <td className="px-4 py-2 text-sm text-gray-800">
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            feat.properties.classification === 'VERY_HIGH'
                              ? 'bg-red-200 text-red-800'
                              : feat.properties.classification === 'HIGH'
                              ? 'bg-orange-200 text-orange-800'
                              : feat.properties.classification === 'MEDIUM'
                              ? 'bg-yellow-200 text-yellow-800'
                              : 'bg-gray-200 text-gray-800'
                          }`}
                        >
                          {feat.properties.classification.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-800">{feat.properties.manganese_probability.toFixed(3)}</td>
                      <td className="px-4 py-2 text-sm text-gray-800">{feat.properties.latitude.toFixed(5)}</td>
                      <td className="px-4 py-2 text-sm text-gray-800">{feat.properties.longitude.toFixed(5)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
