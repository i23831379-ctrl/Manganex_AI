import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { targetsApi } from '../services/api';
import { ChartLine, Download, Printer } from 'lucide-react';
import { exportCsv, exportHtmlReport } from '../utils/reportExport';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

export default function Insights() {
  const { data: targets, isLoading } = useQuery({
    queryKey: ['targets'],
    queryFn: targetsApi.getAll,
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-full text-slate-400">Loading insights...</div>;
  }

  // Filters
  const [minScore, setMinScore] = useState<number>(0.5);
  const [onlyVerified, setOnlyVerified] = useState<boolean>(false);

  const filteredTargets = useMemo(() => {
    return (targets || []).filter(t => {
      if (t.prospectivity_score < minScore) return false;
      if (onlyVerified && !t.is_verified) return false;
      return true;
    });
  }, [targets, minScore, onlyVerified]);

  const total = filteredTargets.length;
  const avgScore = filteredTargets.length
    ? (filteredTargets.reduce((s, t) => s + t.prospectivity_score, 0) / filteredTargets.length) * 100
    : 0;

  const handleExportCsv = () => {
    if (!total) return;
    exportCsv(filteredTargets);
  };

  const handleExportPdf = () => {
    if (!total) return;
    exportHtmlReport(filteredTargets);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <ChartLine className="text-purple-400" size={24} />
        <h1 className="text-2xl font-bold heading-gradient">Insights & Analytics</h1>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-300 uppercase">Min Prospectivity Score</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={minScore}
            onChange={e => setMinScore(Number(e.target.value))}
            className="w-48 accent-purple-500"
          />
          <span className="ml-2 text-purple-400">{(minScore * 100).toFixed(0)}%</span>
        </div>
        <div className="flex items-center space-x-2">
          <label className="text-xs font-semibold text-slate-300 uppercase">Only Verified</label>
          <input type="checkbox" checked={onlyVerified} onChange={e => setOnlyVerified(e.target.checked)} className="w-4 h-4 accent-purple-500" />
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-card p-5 rounded-xl border border-slate-800/80 bg-slate-900/40">
          <div className="text-xs uppercase text-slate-400 font-semibold">Total Targets</div>
          <div className="text-3xl font-extrabold text-white mt-1">{total}</div>
        </div>
        <div className="glass-card p-5 rounded-xl border border-slate-800/80 bg-slate-900/40">
          <div className="text-xs uppercase text-slate-400 font-semibold">Average Prospectivity</div>
          <div className="text-3xl font-extrabold text-white mt-1">{avgScore.toFixed(1)}%</div>
        </div>
      </div>

      {/* Chart */}
      <div className="mt-6 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={filteredTargets} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fill: '#cbd5e1' }} />
            <YAxis tick={{ fill: '#cbd5e1' }} domain={[0, 1]} />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} />
            <Bar dataKey="prospectivity_score" fill="#8b5cf6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Export buttons */}
      <div className="flex gap-4 mt-4">
        <button onClick={handleExportCsv} className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 text-slate-200 rounded-xl hover:border-slate-700 transition">
          <Download size={16} /> Export CSV
        </button>
        <button onClick={handleExportPdf} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-500 hover:to-indigo-500 transition">
          <Printer size={16} /> Export PDF
        </button>
      </div>
    </div>
  );
}
