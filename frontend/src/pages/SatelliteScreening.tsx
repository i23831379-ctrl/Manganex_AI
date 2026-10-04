// src/pages/SatelliteScreening.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';
// import type { SatelliteSceneResponse } from '../services/api'; // removed unused type
import { format } from 'date-fns';

import { useNavigate } from 'react-router-dom';

export default function SatelliteScreening() {
  // Form state
  const [bbox, setBbox] = useState('79.5,21.0,80.5,22.0'); // default central India
  const [startDate, setStartDate] = useState(format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [maxCloud, setMaxCloud] = useState(20);
  const [satellite, setSatellite] = useState('Sentinel-2');
  const [showResults, setShowResults] = useState(false);

  // const queryClient = useQueryClient(); // removed unused queryClient

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['satelliteSearch', bbox, startDate, endDate, maxCloud, satellite],
    queryFn: async () => {
      const payload = {
        bbox: bbox.split(',').map(Number),
        start_date: startDate,
        end_date: endDate,
        max_cloud: Number(maxCloud),
        satellite: satellite || null,
      };
      return await api.searchSatellite(payload);
    },
    enabled: false,
    staleTime: 5 * 60 * 1000,
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowResults(false);
    await refetch();
    setShowResults(true);
  };

  const navigate = useNavigate();

  const handleSelectScene = (scene: any) => {
    // Pass the entire scene object to the next page via navigation state
    navigate('/app/remote-sensing', { state: { scene } });
  };

  return (
    <div className="flex flex-col max-w-4xl mx-auto space-y-6 p-4">
      <h1 className="text-3xl font-bold heading-gradient">Satellite Screening</h1>
      <p className="text-slate-400">Search for satellite scenes in the demo catalogue or a real provider.</p>

      <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-800/60 p-6 rounded-xl glass-panel">
        <div className="flex flex-col space-y-1">
          <label className="text-sm text-slate-300">Bounding Box (west,south,east,north)</label>
          <input
            type="text"
            value={bbox}
            onChange={(e) => setBbox(e.target.value)}
            className="rounded bg-slate-700 border border-slate-600 text-slate-200 px-2 py-1"
            placeholder="79.5,21.0,80.5,22.0"
          />
        </div>
        <div className="flex flex-col space-y-1">
          <label className="text-sm text-slate-300">Satellite</label>
          <select
            value={satellite}
            onChange={(e) => setSatellite(e.target.value)}
            className="rounded bg-slate-700 border border-slate-600 text-slate-200 px-2 py-1"
          >
            <option value="Sentinel-2">Sentinel‑2</option>
            <option value="Landsat">Landsat</option>
            <option value="">Any</option>
          </select>
        </div>
        <div className="flex flex-col space-y-1">
          <label className="text-sm text-slate-300">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded bg-slate-700 border border-slate-600 text-slate-200 px-2 py-1"
          />
        </div>
        <div className="flex flex-col space-y-1">
          <label className="text-sm text-slate-300">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded bg-slate-700 border border-slate-600 text-slate-200 px-2 py-1"
          />
        </div>
        <div className="flex flex-col space-y-1">
          <label className="text-sm text-slate-300">Max Cloud (%)</label>
          <input
            type="number"
            min={0}
            max={100}
            value={maxCloud}
            onChange={(e) => setMaxCloud(Number(e.target.value))}
            className="rounded bg-slate-700 border border-slate-600 text-slate-200 px-2 py-1"
          />
        </div>
        <div className="flex items-end justify-end md:col-span-2">
          <button
            type="submit"
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            <Search size={18} /> Search
          </button>
        </div>
      </form>

      {isLoading && (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
        </div>
      )}

      {isError && (
        <div className="flex items-center gap-2 p-4 bg-rose-900/30 border border-rose-700/40 text-rose-400 rounded">
          <AlertTriangle size={20} /> {(error as Error).message}
        </div>
      )}

      {showResults && data && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-200">Results ({data.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.map((scene: any) => (
              <div key={scene.scene_id} className="p-4 rounded-xl glass-panel border border-slate-700/40 cursor-pointer hover:shadow-[0_4px_12px_rgba(168,85,247,0.2)]" onClick={() => handleSelectScene(scene)}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-slate-300">{scene.scene_id}</p>
                    <p className="text-sm text-slate-500">{scene.satellite} – {scene.acquisition_date}</p>
                  </div>
                  <span className="text-xs text-purple-400">{scene.source}</span>
                </div>
                <div className="mt-2 text-xs text-slate-400">
                  Cloud: {scene.cloud_cover}%
                </div>
                {scene.preview_url && (
                  <img src={scene.preview_url} alt="preview" className="mt-2 w-full rounded" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
