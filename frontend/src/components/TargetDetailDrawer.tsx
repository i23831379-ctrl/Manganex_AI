// TargetDetailDrawer component – displays detailed information for a selected exploration target
import { X, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { mlApi } from '../services/api';
import type { ExplorationTarget, PredictionResponse, ModelStatus } from '../services/api';

interface TargetDetailDrawerProps {
  target: ExplorationTarget;
  isOpen: boolean;
  onClose: () => void;
}

export function TargetDetailDrawer({ target, isOpen, onClose }: TargetDetailDrawerProps) {
  // Fetch SHAP explanation for the target
  const {
    data: explanation,
    isLoading: explLoading,
    isError: explError,
  } = useQuery<PredictionResponse>({
    queryKey: ['explanation', target.id],
    queryFn: () => mlApi.getExplanation(target.id),
    enabled: isOpen && Boolean(target?.id),
  });

  // Fetch model status (demo/prod information)
  const {
    data: modelStatus,
    isLoading: modelLoading,
    isError: modelError,
  } = useQuery<ModelStatus>({
    queryKey: ['modelStatus'],
    queryFn: () => mlApi.manganeseModelStatus(),
    staleTime: Infinity,
    enabled: isOpen,
  });

  if (!isOpen) return null;

  // Helper to compute classification badge based on prospectivity score
  const getClassification = (score: number) => {
    if (score >= 0.85) return { label: 'High', className: 'badge-success' };
    if (score >= 0.7) return { label: 'Medium', className: 'badge-warning' };
    return { label: 'Low', className: 'badge-info' };
  };

  const classification = getClassification(target.prospectivity_score);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-white/70 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
        aria-label="Close drawer backdrop"
      />
      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-[70] w-full max-w-md bg-white border-l border-gray-200 shadow-xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              Target Details
            </h2>
            <p className="text-sm text-gray-500">
              {target.name} (ID: {target.id})
            </p>
            {/* Demo badge */}
            {modelStatus?.status === 'demo' && (
              <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                Demo Data
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close target details"
            className="p-2 text-gray-500 hover:text-gray-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Prospectivity */}
          <section>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Prospectivity</h3>
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold text-gray-800">
                {typeof target.prospectivity_score === 'number'
                  ? `${(target.prospectivity_score * 100).toFixed(1)}%`
                  : 'N/A'}
              </span>
              <span className={`badge ${classification.className}`}>{classification.label}</span>
            </div>
            <div className="w-full bg-gray-200 rounded h-2 mt-2">
              <div
                className="h-2 bg-green-500 rounded"
                style={{ width: `${target.prospectivity_score * 100}%` }}
              />
            </div>
          </section>

          {/* Location */}
          <section>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Location</h3>
            <p className="text-sm text-gray-700">
              Latitude: {target.latitude.toFixed(4)}°N<br />
              Longitude: {target.longitude.toFixed(4)}°E
            </p>
          </section>

          {/* Model Status */}
          <section>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Model Status</h3>
            {modelLoading ? (
              <p className="text-gray-500">Loading model status…</p>
            ) : modelError || !modelStatus ? (
              <p className="text-gray-500">Model status unavailable.</p>
            ) : (
              <ul className="text-sm text-gray-700 space-y-1">
                <li>Mineral: {modelStatus.mineral ?? '—'}</li>
                <li>Status: {modelStatus.status ?? '—'}</li>
                {modelStatus.record_count != null && <li>Records: {modelStatus.record_count}</li>}
                {modelStatus.training_date && (
                  <li>Trained: {new Date(modelStatus.training_date).toLocaleDateString()}</li>
                )}
                {modelStatus.feature_list?.length && (
                  <li>Features: {modelStatus.feature_list.join(', ')}</li>
                )}
              </ul>
            )}
          </section>

          {/* Explainability */}
          <section>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Explainability (SHAP)</h3>
            {explLoading ? (
              <p className="text-gray-500">Loading explanation…</p>
            ) : explError || !explanation?.shap_features?.length ? (
              <div className="flex items-center gap-2 text-amber-600">
                <AlertTriangle size={16} />
                <span className="text-xs">Demo / Simulated Explainability</span>
              </div>
            ) : (
              <ul className="space-y-1 text-sm text-gray-700">
                {explanation.shap_features.map((f, i) => (
                  <li key={i} className="flex justify-between">
                    <span>{f.feature_name}</span>
                    <span className={f.shap_value > 0 ? 'text-green-600' : 'text-red-600'}>
                      {f.shap_value > 0 ? '+' : ''}{f.shap_value.toFixed(3)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Validation Status */}
          <section>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Validation Status</h3>
            {target.is_verified ? (
              <span className="badge badge-success">Verified</span>
            ) : (
              <span className="badge badge-warning">Not yet field validated</span>
            )}
          </section>

          {/* Recommendation */}
          <section>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Recommendation</h3>
            {target.prospectivity_score >= 0.7 ? (
              <p className="text-gray-800">Recommended for field investigation.</p>
            ) : (
              <p className="text-gray-600">Current prospectivity is low; consider further data collection.</p>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
