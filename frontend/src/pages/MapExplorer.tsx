import { useCallback, useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Layers, X, Map, Compass, Database, AlertTriangle, RefreshCw } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { targetsApi, mlApi, mapsApi } from '../services/api';
import type { ExplorationTarget, LayerSummary, LayerDetail } from '../services/api';
import { mockGeologicalBoundaries, mockProspectivityZones, mockFaultLines, mockAnomalies } from '../data/mockGeoData';
import ShapChart from '../components/ShapChart';

// ─── Uploaded layer state ──────────────────────────────────────────────────

interface UploadedLayerState {
  layerId: number;
  visible: boolean;
  loaded: boolean;
  loading: boolean;
  error: string | null;
}

// MapLibre source/layer IDs are strings derived from the layer's DB id
const uploadedSourceId = (id: number) => `uploaded-${id}`;
const uploadedLayerId  = (id: number) => `uploaded-layer-${id}`;

// ─── Feature popup helper ──────────────────────────────────────────────────

function buildPopupHTML(props: Record<string, unknown>): string {
  const rows = Object.entries(props)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => {
      const label = k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      return `<tr>
        <td style="padding:2px 8px 2px 0;color:#94a3b8;font-size:11px;white-space:nowrap;">${label}</td>
        <td style="padding:2px 0;color:#e2e8f0;font-size:11px;word-break:break-all;">${v}</td>
      </tr>`;
    })
    .join('');
  return `
    <div style="font-family:system-ui,sans-serif;max-width:260px;max-height:280px;overflow-y:auto;">
      <div style="font-weight:600;color:#c084fc;font-size:13px;margin-bottom:6px;border-bottom:1px solid #334155;padding-bottom:4px;">
        Feature Properties
      </div>
      <table style="border-collapse:collapse;width:100%;">${rows || '<tr><td style="color:#64748b;font-size:11px;">No properties</td></tr>'}</table>
    </div>`;
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function MapExplorer() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const mapReady = useRef(false);

  const [selectedTarget, setSelectedTarget] = useState<ExplorationTarget | null>(null);
  const [showLayersPanel, setShowLayersPanel] = useState(false);

  // static layer visibility
  const [showGeology, setShowGeology] = useState(true);
  const [showProspectivity, setShowProspectivity] = useState(true);
  const [showFaults, setShowFaults] = useState(true);
  const [showAnomalies, setShowAnomalies] = useState(false);

  // uploaded layers
  const [uploadedStates, setUploadedStates] = useState<Record<number, UploadedLayerState>>({});

  const queryClient = useQueryClient();

  // ─── Data fetching ─────────────────────────────────────────────────────

  const { data: targets, isLoading: isTargetsLoading } = useQuery({
    queryKey: ['targets'],
    queryFn: targetsApi.getAll,
  });

  const { data: explanation, isLoading: isExplanationLoading } = useQuery({
    queryKey: ['explanation', selectedTarget?.id],
    queryFn: () => mlApi.getExplanation(selectedTarget!.id),
    enabled: !!selectedTarget,
  });

  const { data: layersResponse, isLoading: isLayersLoading, error: layersError, refetch: refetchLayers } = useQuery({
    queryKey: ['maps-layers'],
    queryFn: mapsApi.getLayers,
    refetchOnWindowFocus: false,
  });

  const availableLayers: LayerSummary[] = layersResponse?.layers ?? [];

  // ─── Map initialization ─────────────────────────────────────────────────

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [79.8113, 21.4312],
      zoom: 10,
    });

    map.current.on('error', (e: any) => {
      console.error('MANGANEX GIS: MapLibre error', e);
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      const m = map.current;
      if (!m) return;
      mapReady.current = true;

      // Geological Boundaries
      m.addSource('geology', { type: 'geojson', data: mockGeologicalBoundaries as any });
      m.addLayer({
        id: 'geology-layer', type: 'fill', source: 'geology',
        layout: { visibility: 'visible' },
        paint: { 'fill-color': '#3b82f6', 'fill-opacity': 0.2, 'fill-outline-color': '#60a5fa' }
      });

      // Prospectivity Zones
      m.addSource('prospectivity', { type: 'geojson', data: mockProspectivityZones as any });
      m.addLayer({
        id: 'prospectivity-layer', type: 'fill', source: 'prospectivity',
        layout: { visibility: 'visible' },
        paint: {
          'fill-color': ['interpolate', ['linear'], ['get', 'score'], 0.5, '#f59e0b', 0.9, '#ef4444'],
          'fill-opacity': 0.4, 'fill-outline-color': '#f87171'
        }
      });

      // Structural Lineaments
      m.addSource('faults', { type: 'geojson', data: mockFaultLines as any });
      m.addLayer({
        id: 'faults-layer', type: 'line', source: 'faults',
        layout: { visibility: 'visible', 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#22d3ee', 'line-width': 2, 'line-dasharray': [2, 4] }
      });

      // Geochemical Anomalies Heatmap
      m.addSource('anomalies', { type: 'geojson', data: mockAnomalies as any });
      m.addLayer({
        id: 'anomalies-heatmap-layer', type: 'heatmap', source: 'anomalies',
        layout: { visibility: 'none' },
        paint: {
          'heatmap-weight': ['interpolate', ['linear'], ['get', 'intensity'], 0, 0, 1, 1],
          'heatmap-color': ['interpolate', ['linear'], ['heatmap-density'],
            0, 'rgba(33,102,172,0)', 0.2, 'rgba(103,169,207,0.5)',
            0.4, 'rgba(209,229,240,0.8)', 0.6, 'rgba(253,219,199,0.9)',
            0.8, '#f59e0b', 1, '#ef4444'],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 9, 20],
          'heatmap-opacity': 0.8
        }
      });
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
        mapReady.current = false;
      }
    };
  }, []);

  // ─── Static layer visibility updates ───────────────────────────────────

  useEffect(() => {
    const m = map.current;
    if (!m || !m.isStyleLoaded()) return;
    const set = (id: string, vis: boolean) => {
      if (m.getLayer(id)) m.setLayoutProperty(id, 'visibility', vis ? 'visible' : 'none');
    };
    set('geology-layer', showGeology);
    set('prospectivity-layer', showProspectivity);
    set('faults-layer', showFaults);
    set('anomalies-heatmap-layer', showAnomalies);
  }, [showGeology, showProspectivity, showFaults, showAnomalies]);

  // ─── Exploration target markers ─────────────────────────────────────────

  useEffect(() => {
    const m = map.current;
    if (!m || !targets) return;

    if (m.getLayer('exploration-target-points')) m.removeLayer('exploration-target-points');
    if (m.getSource('exploration-targets')) m.removeSource('exploration-targets');

    const geojson = {
      type: 'FeatureCollection',
      features: targets.map(t => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [t.longitude, t.latitude] },
        properties: { name: t.name, prospectivity_score: t.prospectivity_score, description: t.description, id: t.id }
      }))
    };
    m.addSource('exploration-targets', { type: 'geojson', data: geojson });
    m.addLayer({
      id: 'exploration-target-points', type: 'circle', source: 'exploration-targets',
      paint: {
        'circle-radius': 8,
        'circle-color': ['interpolate', ['linear'], ['get', 'prospectivity_score'], 0, '#3b82f6', 0.5, '#fbbf24', 1, '#ef4444'],
        'circle-stroke-color': '#ffffff', 'circle-stroke-width': 2, 'circle-opacity': 0.9
      }
    });

    const onClick = (e: maplibregl.MapMouseEvent) => {
      const features = m.queryRenderedFeatures(e.point, { layers: ['exploration-target-points'] });
      if (!features.length) return;
      const props = features[0].properties;
      new maplibregl.Popup({ offset: 15 })
        .setHTML(`<div style="font-family:system-ui,sans-serif;padding:4px;">
          <div style="font-weight:700;color:#c084fc;margin-bottom:4px;">${props.name}</div>
          <div style="color:#94a3b8;font-size:12px;">Score: ${(props.prospectivity_score * 100).toFixed(1)}%</div>
          <div style="color:#64748b;font-size:11px;margin-top:2px;">${props.description}</div>
        </div>`)
        .setLngLat(e.lngLat).addTo(m);
      const target = targets.find(t => t.id === props.id);
      if (target) setSelectedTarget(target);
    };
    m.on('click', 'exploration-target-points', onClick);
    (m as any).on('mouseenter', 'exploration-target-points', () => m.getCanvas().style.cursor = 'pointer');
    (m as any).on('mouseleave', 'exploration-target-points', () => m.getCanvas().style.cursor = '');

    return () => {
      (m as any).off('click', 'exploration-target-points', onClick);
      (m as any).off('mouseenter', 'exploration-target-points');
      (m as any).off('mouseleave', 'exploration-target-points');
    };
  }, [targets]);

  // ─── Initialize uploadedStates when layers arrive ───────────────────────

  useEffect(() => {
    if (!availableLayers.length) return;
    setUploadedStates(prev => {
      const next = { ...prev };
      availableLayers.forEach(l => {
        if (!(l.id in next)) {
          next[l.id] = { layerId: l.id, visible: false, loaded: false, loading: false, error: null };
        }
      });
      return next;
    });
  }, [availableLayers]);

  // ─── Add/remove uploaded layers on MapLibre ────────────────────────────

  const loadAndAddLayer = useCallback(async (layerId: number) => {
    const m = map.current;
    if (!m) return;

    setUploadedStates(prev => ({
      ...prev,
      [layerId]: { ...prev[layerId], loading: true, error: null }
    }));

    let detail: LayerDetail;
    try {
      detail = await queryClient.fetchQuery({
        queryKey: ['map-layer', layerId],
        queryFn: () => mapsApi.getLayer(layerId),
        staleTime: 5 * 60 * 1000,
      });
    } catch (err: any) {
      setUploadedStates(prev => ({
        ...prev,
        [layerId]: { ...prev[layerId], loading: false, error: err.message || 'Failed to load layer' }
      }));
      return;
    }

    if (!detail.geojson) {
      setUploadedStates(prev => ({
        ...prev,
        [layerId]: { ...prev[layerId], loading: false, error: detail.render_note || 'No renderable geometry (raster)' }
      }));
      return;
    }

    const srcId = uploadedSourceId(layerId);
    const lyrId = uploadedLayerId(layerId);

    // Remove stale source/layer if present
    if (m.getLayer(lyrId)) m.removeLayer(lyrId);
    if (m.getSource(srcId)) m.removeSource(srcId);

    m.addSource(srcId, { type: 'geojson', data: detail.geojson as any });

    const renderType = detail.render_type;

    if (renderType === 'point_layer') {
      m.addLayer({
        id: lyrId, type: 'circle', source: srcId,
        paint: {
          'circle-radius': 6, 'circle-color': '#10b981',
          'circle-stroke-color': '#ffffff', 'circle-stroke-width': 1.5, 'circle-opacity': 0.85
        }
      });
    } else {
      // vector — try to detect geometry type from meta
      const geoTypes: string[] = detail.geojson._meta?.geometry_types ?? [];
      const hasPolygon = geoTypes.some(t => t.includes('Polygon'));
      const hasLine = geoTypes.some(t => t.includes('Line'));

      if (hasPolygon) {
        m.addLayer({
          id: lyrId, type: 'fill', source: srcId,
          paint: { 'fill-color': '#8b5cf6', 'fill-opacity': 0.35, 'fill-outline-color': '#a78bfa' }
        });
      } else if (hasLine) {
        m.addLayer({
          id: lyrId, type: 'line', source: srcId,
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#10b981', 'line-width': 2 }
        });
      } else {
        // Default to circles (Points / unknown)
        m.addLayer({
          id: lyrId, type: 'circle', source: srcId,
          paint: {
            'circle-radius': 6, 'circle-color': '#10b981',
            'circle-stroke-color': '#ffffff', 'circle-stroke-width': 1.5
          }
        });
      }
    }

    // Feature click → property popup
    m.on('click', lyrId, (e: maplibregl.MapMouseEvent) => {
      const features = m.queryRenderedFeatures(e.point, { layers: [lyrId] });
      if (!features.length) return;
      if (popupRef.current) popupRef.current.remove();
      popupRef.current = new maplibregl.Popup({ maxWidth: '300px', offset: 8 })
        .setHTML(buildPopupHTML(features[0].properties as Record<string, unknown>))
        .setLngLat(e.lngLat)
        .addTo(m);
    });
    (m as any).on('mouseenter', lyrId, () => m.getCanvas().style.cursor = 'pointer');
    (m as any).on('mouseleave', lyrId, () => m.getCanvas().style.cursor = '');

    // Fit map to bounding box
    const bbox = detail.geojson._meta?.bbox ?? detail.bbox;
    if (bbox && bbox.length === 4) {
      const [minX, minY, maxX, maxY] = bbox;
      if (minX !== maxX || minY !== maxY) {
        m.fitBounds([[minX, minY], [maxX, maxY]], { padding: 60, maxZoom: 14, duration: 800 });
      } else {
        m.flyTo({ center: [minX, minY], zoom: 13, duration: 800 });
      }
    }

    setUploadedStates(prev => ({
      ...prev,
      [layerId]: { ...prev[layerId], loading: false, loaded: true, visible: true, error: null }
    }));
  }, [queryClient]);

  const removeLayer = useCallback((layerId: number) => {
    const m = map.current;
    if (!m) return;
    const lyrId = uploadedLayerId(layerId);
    const srcId = uploadedSourceId(layerId);
    if (m.getLayer(lyrId)) m.removeLayer(lyrId);
    if (m.getSource(srcId)) m.removeSource(srcId);
    setUploadedStates(prev => ({
      ...prev,
      [layerId]: { ...prev[layerId], visible: false }
    }));
  }, []);

  const handleUploadedLayerToggle = useCallback((layerId: number, on: boolean) => {
    const state = uploadedStates[layerId];
    if (!state) return;
    if (on) {
      if (state.loaded) {
        // Already fetched — just re-show the MapLibre layer
        const m = map.current;
        if (m) {
          const lyrId = uploadedLayerId(layerId);
          if (m.getLayer(lyrId)) m.setLayoutProperty(lyrId, 'visibility', 'visible');
        }
        setUploadedStates(prev => ({ ...prev, [layerId]: { ...prev[layerId], visible: true } }));
      } else {
        loadAndAddLayer(layerId);
      }
    } else {
      removeLayer(layerId);
    }
  }, [uploadedStates, loadAndAddLayer, removeLayer]);

  // ─── Render ─────────────────────────────────────────────────────────────

  const isAnyLoading = isTargetsLoading || isLayersLoading;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold heading-gradient">GIS Explorer</h1>
          <p className="text-sm text-slate-400">Interactive Prospectivity Map — Central India</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowLayersPanel(v => !v)}
            className={`flex items-center gap-2 text-sm transition-all duration-200 ${showLayersPanel ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Layers size={16} /> Layers
          </button>
        </div>
      </div>

      <div className="relative flex-1 rounded-2xl overflow-hidden glass-panel border-slate-700/50">
        <div ref={mapContainer} className="map-container absolute inset-0 w-full h-full" />

        {/* Global loading overlay */}
        {isAnyLoading && (
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-10 pointer-events-none">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
          </div>
        )}

        {/* ── Floating Layers Panel ── */}
        {showLayersPanel && (
          <div className="absolute top-4 left-4 glass-panel p-4 w-72 shadow-2xl z-20 animate-in fade-in slide-in-from-left-2 duration-200 max-h-[calc(100%-2rem)] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
                <Layers size={14} className="text-purple-400" /> Layer Controls
              </h3>
              <button onClick={() => setShowLayersPanel(false)} className="text-slate-500 hover:text-white transition-colors">
                <X size={15} />
              </button>
            </div>

            {/* Static layers */}
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1.5 mt-1 px-1">Base Layers</div>
            <div className="space-y-1.5 mb-3">
              {[
                { label: 'Geological Boundaries', swatch: 'bg-blue-400 opacity-60', checked: showGeology, onChange: setShowGeology },
                { label: 'ML Prospectivity Zones', swatch: 'bg-amber-400 opacity-60', checked: showProspectivity, onChange: setShowProspectivity },
                { label: 'Structural Lineaments', swatch: 'bg-cyan-400', checked: showFaults, onChange: setShowFaults },
                { label: 'Soil Anomalies', swatch: 'bg-gradient-to-tr from-rose-500 to-amber-500', checked: showAnomalies, onChange: setShowAnomalies },
              ].map(({ label, swatch, checked, onChange }) => (
                <label key={label} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/40 cursor-pointer hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-sm ${swatch}`} />
                    <span className="text-sm text-slate-300">{label}</span>
                  </div>
                  <input type="checkbox" className="rounded border-slate-600 bg-slate-800 text-purple-500 focus:ring-purple-500" checked={checked} onChange={e => onChange(e.target.checked)} />
                </label>
              ))}
              <label className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/40 cursor-pointer">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500 border-2 border-white shadow-[0_0_6px_rgba(168,85,247,0.8)]" />
                  <span className="text-sm text-slate-300">Target Markers</span>
                </div>
                <input type="checkbox" defaultChecked className="rounded border-slate-600 bg-slate-800 text-purple-500" disabled />
              </label>
            </div>

            {/* Uploaded datasets */}
            <div className="border-t border-slate-700/40 pt-3">
              <div className="flex items-center justify-between mb-1.5 px-1">
                <div className="text-xs text-slate-500 uppercase tracking-wider">Uploaded Datasets</div>
                <button onClick={() => refetchLayers()} title="Refresh layers" className="text-slate-500 hover:text-purple-400 transition-colors">
                  <RefreshCw size={12} />
                </button>
              </div>

              {layersError && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-rose-900/30 border border-rose-700/40 text-xs text-rose-400 mb-2">
                  <AlertTriangle size={12} /> Could not load uploaded layers
                </div>
              )}

              {isLayersLoading && (
                <div className="text-xs text-slate-500 px-1 py-2">Loading…</div>
              )}

              {!isLayersLoading && availableLayers.length === 0 && (
                <div className="flex flex-col items-center py-4 text-slate-600">
                  <Database size={20} className="mb-1.5" />
                  <span className="text-xs text-center">No uploaded datasets yet.<br />Use Data Import to upload files.</span>
                </div>
              )}

              <div className="space-y-1.5">
                {availableLayers.map(layer => {
                  const state = uploadedStates[layer.id];
                  const isOn = state?.visible ?? false;
                  const isLoading = state?.loading ?? false;
                  const err = state?.error ?? null;

                  return (
                    <div key={layer.id} className="rounded-lg bg-slate-800/60 border border-slate-700/40 overflow-hidden">
                      <label className="flex items-center justify-between p-2.5 cursor-pointer hover:bg-slate-800 transition-colors">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-3 h-3 rounded-sm bg-emerald-500 flex-shrink-0" />
                          <div className="min-w-0">
                            <div className="text-sm text-slate-300 truncate" title={layer.name}>{layer.name}</div>
                            <div className="text-xs text-slate-500">{layer.file_type.toUpperCase()} · {layer.row_count ?? layer.feature_count ?? '—'} records</div>
                          </div>
                        </div>
                        {isLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500 flex-shrink-0" />
                        ) : (
                          <input
                            type="checkbox"
                            className="rounded border-slate-600 bg-slate-800 text-purple-500 focus:ring-purple-500 flex-shrink-0"
                            checked={isOn}
                            onChange={e => handleUploadedLayerToggle(layer.id, e.target.checked)}
                          />
                        )}
                      </label>
                      {err && (
                        <div className="px-2.5 pb-2 text-xs text-amber-400 flex items-start gap-1.5">
                          <AlertTriangle size={11} className="mt-0.5 flex-shrink-0" />
                          <span>{err}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 pt-2 border-t border-slate-700/40 flex items-center justify-between">
                <div className="text-xs text-slate-500">Loaded targets</div>
                <div className="text-sm font-bold text-purple-400">{targets?.length ?? 0}</div>
              </div>
            </div>
          </div>
        )}

        {/* Map Legend */}
        <div className="absolute bottom-4 left-4 glass-panel px-3 py-2 z-20">
          <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
            <Map size={11} /> Legend
          </div>
          <div className="space-y-1.5">
            {[
              { swatch: 'w-3 h-3 rounded-sm bg-blue-400/50 border border-blue-400/70', label: 'Geological Boundary' },
              { swatch: 'w-3 h-3 rounded-sm bg-amber-400/50 border border-rose-400/70', label: 'Prospectivity Zone' },
              { swatch: 'w-3 h-0.5 bg-cyan-400 opacity-80', label: 'Structural Lineament' },
              { swatch: 'w-3 h-3 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 opacity-80', label: 'Geochemical Anomaly' },
              { swatch: 'w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_5px_rgba(168,85,247,0.7)]', label: 'Target Marker' },
              { swatch: 'w-3 h-3 rounded-sm bg-emerald-500 opacity-80', label: 'Uploaded Dataset' },
            ].map(({ swatch, label }) => (
              <div key={label} className="flex items-center gap-2 text-xs text-slate-400">
                <div className={swatch} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Compass / coordinates */}
        <div className="absolute bottom-4 right-4 glass-panel px-3 py-2 z-20 text-xs text-slate-500 flex items-center gap-1.5">
          <Compass size={12} className="text-purple-400" />
          Central India — 21.14°N, 79.08°E
        </div>

        {/* Selected Target XAI Side Panel */}
        {selectedTarget && (
          <div className="absolute top-0 right-0 bottom-0 w-80 bg-slate-900/95 backdrop-blur-md border-l border-slate-700 p-4 shadow-2xl z-30 flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-slate-100">{selectedTarget.name}</h3>
              <button onClick={() => setSelectedTarget(null)} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4 flex-1 overflow-y-auto pr-2">
              <div className="glass-panel p-3">
                <div className="text-xs text-slate-400">Prospectivity Score</div>
                <div className="text-2xl font-bold text-emerald-400">{(selectedTarget.prospectivity_score * 100).toFixed(1)}%</div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-2">SHAP Feature Importance</h4>
                <p className="text-xs text-slate-500 mb-3">This chart explains how each geological feature contributed to the final model prediction.</p>
                {isExplanationLoading ? (
                  <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500" />
                  </div>
                ) : explanation ? (
                  <ShapChart features={explanation.shap_features} />
                ) : (
                  <div className="text-sm text-rose-400">Failed to load explanation</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
