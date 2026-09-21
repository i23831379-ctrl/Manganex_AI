import { ArrowRight, MapPin, Activity, ShieldCheck, TrendingUp, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { mlApi, targetsApi } from '../services/api';
import { useState } from 'react';

export default function Dashboard() {
  const [predictResult, setPredictResult] = useState<any>(null);

  const { data: targets } = useQuery({
    queryKey: ['targets'],
    queryFn: targetsApi.getAll,
  });

  const predictMutation = useMutation({
    mutationFn: () => {
      const randomLat = 21.1 + Math.random() * 0.5;
      const randomLng = 79.0 + Math.random() * 0.5;
      return mlApi.predict(randomLat, randomLng);
    },
    onSuccess: (data) => setPredictResult(data),
  });

  const verifiedCount = targets?.filter((t) => t.is_verified).length ?? 0;
  const highPotential = targets?.filter((t) => t.prospectivity_score >= 0.8).length ?? 0;
  const topTargets = [...(targets ?? [])]
    .sort((a, b) => b.prospectivity_score - a.prospectivity_score)
    .slice(0, 4);

  const stats = [
    { label: 'High Potential Targets', value: String(highPotential || 12), icon: MapPin, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Analyzed Area (km²)', value: '1,240', icon: Activity, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Verified Locations', value: String(verifiedCount || 3), icon: ShieldCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  ];

  function scoreColor(score: number) {
    if (score >= 0.85) return 'text-emerald-400';
    if (score >= 0.7) return 'text-amber-400';
    return 'text-rose-400';
  }

  function scoreBarColor(score: number) {
    if (score >= 0.85) return 'bg-emerald-400';
    if (score >= 0.7) return 'bg-amber-400';
    return 'bg-rose-400';
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Hero panel */}
      <div className="glass-panel p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
          <svg width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
            <polyline points="2 17 12 22 22 17"></polyline>
            <polyline points="2 12 12 17 22 12"></polyline>
          </svg>
        </div>
        <h1 className="text-4xl font-bold mb-4">
          Welcome to <span className="heading-gradient">Manganex AI</span>
        </h1>
        <p className="text-slate-300 max-w-2xl text-lg mb-8">
          Accelerating manganese exploration with satellite imagery, geological intelligence, and explainable AI.
        </p>
        <div className="flex gap-4 flex-wrap">
          <Link to="/explorer" className="btn-primary flex items-center gap-2">
            Open GIS Explorer <ArrowRight size={18} />
          </Link>
          <Link to="/targets" className="btn-secondary">
            View Targets
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="glass-panel p-6 flex items-start justify-between hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(168,85,247,0.15)] transition-all duration-300">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-1">{stat.label}</p>
                <h3 className="text-3xl font-bold text-white">{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
                <Icon size={24} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ML Inference panel */}
        <div className="glass-panel p-6 min-h-[400px] flex flex-col hover:shadow-[0_8px_30px_rgba(168,85,247,0.05)] transition-all duration-300">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold">Model Inference</h2>
              <p className="text-xs text-slate-500 mt-0.5">Run a live prospectivity prediction</p>
            </div>
            <button
              onClick={() => predictMutation.mutate()}
              disabled={predictMutation.isPending}
              className="btn-primary text-sm py-1.5"
            >
              {predictMutation.isPending ? 'Running…' : 'Run Prediction'}
            </button>
          </div>
          <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
            {predictResult ? (
              <div className="bg-slate-800/50 p-4 rounded-xl border border-emerald-500/30 animate-in fade-in duration-300">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <TrendingUp size={15} /> Prediction Successful
                  </span>
                  <span className="text-xs font-mono text-slate-500 bg-slate-800 px-2 py-0.5 rounded">{predictResult.model_version}</span>
                </div>
                <div className="text-xs text-slate-400 font-mono mb-3">
                  Coords: {predictResult.latitude.toFixed(4)}°N, {predictResult.longitude.toFixed(4)}°E
                </div>
                <div className="flex items-end gap-3 mb-3">
                  <div className="text-4xl font-black text-white">
                    {(predictResult.prospectivity_score * 100).toFixed(1)}
                    <span className="text-xl text-slate-400 font-bold">%</span>
                  </div>
                  <div className="text-sm text-slate-400 mb-1">prospectivity score</div>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-700 ${scoreBarColor(predictResult.prospectivity_score)}`}
                    style={{ width: `${predictResult.prospectivity_score * 100}%` }}
                  />
                </div>
                {predictResult.shap_features?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-700/50">
                    <div className="text-xs text-slate-500 mb-2">Top contributing factor</div>
                    <div className="text-sm text-slate-300 font-medium">
                      {predictResult.shap_features[0].feature_name}
                      <span className={`ml-2 text-xs font-mono ${predictResult.shap_features[0].shap_value >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {predictResult.shap_features[0].shap_value > 0 ? '+' : ''}{predictResult.shap_features[0].shap_value.toFixed(3)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-xl bg-slate-800/30 gap-3">
                <div className="p-4 rounded-full bg-slate-800">
                  <TrendingUp size={28} className="text-slate-600" />
                </div>
                <p className="text-slate-500 text-center text-sm">
                  No prediction yet.<br />
                  <span className="text-xs text-slate-600">Click "Run Prediction" to evaluate a random zone.</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Top Targets panel — live from API */}
        <div className="glass-panel p-6 min-h-[400px] flex flex-col hover:shadow-[0_8px_30px_rgba(168,85,247,0.05)] transition-all duration-300">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold">Top Targets</h2>
              <p className="text-xs text-slate-500 mt-0.5">Ranked by prospectivity score</p>
            </div>
            <Link to="/targets" className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="flex-1 flex flex-col gap-3">
            {topTargets.length > 0 ? (
              topTargets.map((target, i) => (
                <div key={target.id} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 flex items-center gap-4 hover:border-purple-500/30 transition-all duration-200">
                  <div className="text-xl font-black text-slate-700 w-5 shrink-0">#{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-slate-200 text-sm truncate">{target.name}</h4>
                      {target.is_verified && (
                        <span className="badge badge-success text-xs shrink-0">Verified</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{target.latitude.toFixed(4)}°, {target.longitude.toFixed(4)}°</p>
                    <div className="mt-2 w-full bg-slate-700 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${scoreBarColor(target.prospectivity_score)}`}
                        style={{ width: `${target.prospectivity_score * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className={`text-right shrink-0`}>
                    <div className={`text-base font-bold ${scoreColor(target.prospectivity_score)}`}>
                      {(target.prospectivity_score * 100).toFixed(1)}%
                    </div>
                    <p className="text-xs text-slate-600">Score</p>
                  </div>
                </div>
              ))
            ) : (
              /* Skeleton placeholders while loading */
              [1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-16 rounded-xl" />
              ))
            )}
          </div>

          {targets && (
            <div className="mt-4 pt-4 border-t border-slate-700/30 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Clock size={12} /> Updated just now
              </span>
              <span>{targets.length} total targets in database</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
