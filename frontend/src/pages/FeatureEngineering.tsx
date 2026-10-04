import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { featuresApi } from '../services/api';
import { useNavigate } from 'react-router-dom';

interface FeatureDefinition {
  feature_id: string;
  name: string;
  category: string;
  required_bands: string[];
  description?: string;
}

interface FeatureValue {
  feature_id: string;
  value: any;
  provenance: Record<string, any>;
}

export default function FeatureEngineering() {
  const navigate = useNavigate();
  // Removed unused queryClient

  const { data: catalog, isLoading, isError, error } = useQuery({
    queryKey: ['featureCatalog'],
    queryFn: async () => {
      return await featuresApi.catalog();
    },
    staleTime: 5 * 60 * 1000,
  });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bandValues, setBandValues] = useState<Record<string, string>>({});
  const [calcResults, setCalcResults] = useState<FeatureValue[] | null>(null);
  const [fusedResult, setFusedResult] = useState<Record<string, any> | null>(null);

  const requiredBands = Array.from(selectedIds).reduce<string[]>((acc, fid) => {
    const f = catalog?.find((c: FeatureDefinition) => c.feature_id === fid);
    if (f) {
      f.required_bands.forEach((b) => {
        if (!acc.includes(b)) acc.push(b);
      });
    }
    return acc;
  }, []);

  const calculate = useMutation({
    mutationFn: (payload: any) => featuresApi.calculate(payload),
    onSuccess: (data) => setCalcResults(data),
    onError: (e: any) => alert(e.message),
  });

  const fuse = useMutation({
    mutationFn: (payload: any) => featuresApi.fuse(payload),
    onSuccess: (data) => setFusedResult(data.fused_vector),
    onError: (e: any) => alert(e.message),
  });

  const toggle = (fid: string) => {
    const newSet = new Set(selectedIds);
    newSet.has(fid) ? newSet.delete(fid) : newSet.add(fid);
    setSelectedIds(newSet);
  };

  const runCalc = () => {
    const bands: Record<string, number> = {};
    requiredBands.forEach((b) => {
      bands[b] = Number(bandValues[b] || 0);
    });
    calculate.mutate({ feature_ids: Array.from(selectedIds), band_values: bands });
  };

  const runFuse = () => {
    if (!calcResults) {
      alert('Calculate first');
      return;
    }
    fuse.mutate({ scene_id: 'demo', features: calcResults });
  };

  return (
    <div className="p-4">
      <button onClick={() => navigate('/app/dashboard')} className="flex items-center gap-2 mb-4">
        <ArrowLeft size={16} /> Back
      </button>
      <h1 className="text-2xl font-semibold mb-4">Feature Engineering</h1>
      {isLoading && <p>Loading catalog.</p>}
      {isError && <p>{(error as Error).message}</p>}
      {catalog && (
        <div className="grid grid-cols-2 gap-4 max-h-60 overflow-y-auto">
          {catalog.map((f: FeatureDefinition) => (
            <label key={f.feature_id} className="flex items-start">
              <input
                type="checkbox"
                checked={selectedIds.has(f.feature_id)}
                onChange={() => toggle(f.feature_id)}
                className="mr-2"
              />
              <span>{f.name} ({f.feature_id})</span>
            </label>
          ))}
        </div>
      )}

      {requiredBands.length > 0 && (
        <div className="mt-4">
          <h2 className="text-xl mb-2">Band values</h2>
          {requiredBands.map((b) => (
            <input
              key={b}
              placeholder={b}
              value={bandValues[b] || ''}
              onChange={(e) => setBandValues({ ...bandValues, [b]: e.target.value })}
              className="border rounded p-1 mr-2 mb-2"
            />
          ))}
        </div>
      )}

      <div className="mt-4 flex gap-4">
        <button onClick={runCalc} className="bg-indigo-600 text-white py-2 px-4 rounded">
          Calculate
        </button>
        <button onClick={runFuse} className="bg-teal-600 text-white py-2 px-4 rounded">
          Fuse
        </button>
      </div>

      {calcResults && (
        <pre className="mt-4 bg-gray-100 p-2 rounded overflow-x-auto">
          {JSON.stringify(calcResults, null, 2)}
        </pre>
      )}
      {fusedResult && (
        <pre className="mt-4 bg-gray-100 p-2 rounded overflow-x-auto">
          {JSON.stringify(fusedResult, null, 2)}
        </pre>
      )}
    </div>
  );
}
