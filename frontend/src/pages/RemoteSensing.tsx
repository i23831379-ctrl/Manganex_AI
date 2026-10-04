// src/pages/RemoteSensing.tsx
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Info } from 'lucide-react';
import { api } from '../services/api';
import Provenance from '../components/Provenance';

interface SatelliteScene {
  scene_id: string;
  satellite: string;
  acquisition_date: string;
  cloud_cover: number;
  source: string;
  bounds?: number[];
  study_area?: string;
  preview_url?: string;
  sensor?: string;
}

interface BandInfo {
  band_id: string;
  name: string;
  wavelength?: string; // optical bands only
  resolution: string;
  description: string;
  availability: boolean;
  sensor: string; // 'optical' | 'sar'
}

export default function RemoteSensing() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const scene: SatelliteScene | undefined = (state as any)?.scene;

  // UI state
  const [bands, setBands] = useState<BandInfo[]>([]);
  const [selectedBands, setSelectedBands] = useState<Set<string>>(new Set());
  const [loadingBands, setLoadingBands] = useState(false);
  const [bandError, setBandError] = useState<string | null>(null);

  const [preprocessStatus, setPreprocessStatus] = useState<'READY' | 'RUNNING' | 'SUCCESS' | 'FAIL'>('READY');
  const [preprocessResult, setPreprocessResult] = useState<any>(null);
  const [preprocessError, setPreprocessError] = useState<string | null>(null);

  // Fetch bands for the selected scene
  useEffect(() => {
    if (!scene) return;
    setLoadingBands(true);
    api
      .getBands({
        scene_id: scene.scene_id,
        satellite: scene.satellite,
        source: scene.source,
        acquisition_date: scene.acquisition_date,
        cloud_cover: scene.cloud_cover,
        bbox: scene.bounds,
      })
      .then((data) => {
        setBands(data.bands);
        // Auto‑select all bands for demo data
        if (scene.source?.toLowerCase().includes('demo')) {
          setSelectedBands(new Set(data.bands.map((b: any) => b.band_id)));
        } else {
          setSelectedBands(new Set());
        }
        setBandError(null);
      })
      .catch((err) => setBandError(err.message || 'Failed to load bands'))
      .finally(() => setLoadingBands(false));
  }, [scene]);

  const toggleBand = (bandId: string) => {
    const newSet = new Set(selectedBands);
    if (newSet.has(bandId)) newSet.delete(bandId);
    else newSet.add(bandId);
    setSelectedBands(newSet);
  };

  const selectAll = () => setSelectedBands(new Set(bands.map((b) => b.band_id)));
  const clearAll = () => setSelectedBands(new Set());

  const runPreprocess = () => {
    if (!scene) return;
    if (selectedBands.size === 0) {
      setPreprocessError('Select at least one band');
      return;
    }
    setPreprocessStatus('RUNNING');
    api
      .runPreprocess({
        scene_id: scene.scene_id,
        selected_bands: Array.from(selectedBands),
        options: {},
      })
      .then((res) => {
        setPreprocessResult(res);
        setPreprocessStatus('SUCCESS');
        setPreprocessError(null);
      })
      .catch((err) => {
        setPreprocessError(err.message || 'Pre‑processing failed');
        setPreprocessStatus('FAIL');
      });
  };

  const handleBack = () => navigate('/app/satellite-screening');

  if (!scene) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4 bg-gradient-to-b from-slate-900 to-slate-800">
        <p className="text-xl text-slate-300">No satellite scene selected.</p>
        <button
          onClick={handleBack}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-medium py-2 px-4 rounded transition"
        >
          <ArrowLeft size={16} /> Return to Satellite Screening
        </button>
      </div>
    );
  }

  const isDemo = scene.source?.toLowerCase().includes('demo');

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-8">
      {isDemo && (
        <div className="p-2 bg-amber-200 border border-amber-400 text-amber-800 rounded-md text-center">
          DEMO DATA — NOT REAL SATELLITE ACQUISITION
        </div>
      )}
      <Provenance scene={scene} isDemo={isDemo} />

      <section className="p-6 rounded-xl glass-panel border border-slate-700/40 bg-slate-800/30">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-slate-200">Selected Scene</h2>
          {isDemo && (
            <span className="px-2 py-1 text-xs font-medium text-amber-800 bg-amber-200 rounded">DEMO DATA</span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300">
          <p><strong>Satellite:</strong> {scene.satellite}</p>
          <p><strong>Scene ID:</strong> {scene.scene_id}</p>
          <p><strong>Acquisition:</strong> {scene.acquisition_date}</p>
          <p><strong>Cloud %:</strong> {scene.cloud_cover}</p>
          <p><strong>Source:</strong> {scene.source}</p>
          {scene.bounds && <p><strong>Bounds:</strong> {scene.bounds.join(', ')}</p>}
          {scene.study_area && <p><strong>Study Area:</strong> {scene.study_area}</p>}
        </div>
      </section>

      <section className="p-6 rounded-xl glass-panel border border-slate-700/40 bg-slate-800/30">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-semibold text-slate-200">Band Explorer</h3>
          <div className="flex gap-2 text-sm">
            <button onClick={selectAll} className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded">Select All</button>
            <button onClick={clearAll} className="px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded">Clear All</button>
            <span className="text-slate-400">{selectedBands.size} selected</span>
          </div>
        </div>
        {loadingBands ? (
          <div className="flex justify-center py-4"><RefreshCw className="animate-spin" size={24} /></div>
        ) : bandError ? (
          <p className="p-4 bg-rose-900/30 border border-rose-700/40 text-rose-300 rounded">{bandError}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bands.map((band) => (
              <label key={band.band_id} className="flex items-start space-x-3 p-2 rounded hover:bg-slate-700/30 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedBands.has(band.band_id)}
                  onChange={() => toggleBand(band.band_id)}
                  className="mt-1"
                />
                <div className="flex flex-col">
                  <span className="font-medium text-slate-200">
                    {band.name} ({band.band_id}){band.sensor === 'sar' ? '' : ` – ${band.wavelength}`}
                  </span>
                  <span className="text-sm text-slate-400">
                    {band.resolution} • {band.description}{band.sensor === 'sar' ? ' • SAR' : ''}
                  </span>
                </div>
              </label>
            ))}
          </div>
        )}
      </section>

      {scene.satellite?.toUpperCase().includes('SENTINEL-1') && (
        <section className="p-4 rounded-md bg-slate-700/20 border border-slate-600 text-slate-200">
          <h4 className="text-lg font-medium mb-2 flex items-center"><Info size={16} className="mr-1" /> Sentinel‑1 SAR Information</h4>
          <p>This sensor provides Synthetic Aperture Radar (SAR) data. Bands are polarizations (VV, VH) and do not have wavelength values.</p>
        </section>
      )}

      <section className="p-6 rounded-xl glass-panel border border-slate-700/40 bg-slate-800/30">
        <h3 className="text-xl font-semibold text-slate-200 mb-4">Pre‑processing</h3>
        <button
          onClick={runPreprocess}
          disabled={preprocessStatus === 'RUNNING' || selectedBands.size === 0}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white rounded"
        >
          <RefreshCw size={18} /> Run Pre‑processing
        </button>
        <div className="mt-4 text-slate-300">
          <p>Status: <span className={preprocessStatus === 'READY' ? 'text-green-400' : preprocessStatus === 'RUNNING' ? 'text-yellow-400' : preprocessStatus === 'SUCCESS' ? 'text-green-400' : 'text-rose-400'}>{preprocessStatus}</span></p>
          {preprocessError && <p className="text-rose-400 mt-2">Error: {preprocessError}</p>}
          {preprocessResult && (
            <pre className="mt-2 bg-slate-900/60 p-2 rounded text-xs overflow-x-auto">
              {JSON.stringify(preprocessResult, null, 2)}
            </pre>
          )}
        </div>
      </section>
    </div>
  );
}
