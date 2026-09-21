
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { targetsApi, fieldNotesApi } from '../services/api';
import { exportCsv, exportHtmlReport } from '../utils/reportExport';
import type { FieldNote } from '../utils/reportExport';
import {
  FileText,
  Download,
  Printer,
  Sliders,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  MapPin,
  Sparkles,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { useNotifications } from '../context/NotificationsContext';

export default function Reports() {
  const { push } = useNotifications();

  const [reportType, setReportType] = useState<'executive' | 'full' | 'verified'>('executive');
  const [minScore, setMinScore] = useState<number>(0.5);
  const [onlyVerified, setOnlyVerified] = useState<boolean>(false);
  const [customTitle, setCustomTitle] = useState<string>('Manganese Prospectivity Regional Dossier');

  const { data: targets, isLoading: isLoadingTargets } = useQuery({
    queryKey: ['targets'],
    queryFn: targetsApi.getAll,
  });

  const { data: rawNotes } = useQuery({
    queryKey: ['fieldNotes'],
    queryFn: fieldNotesApi.getAll,
  });

  const fieldNotesMap = useMemo(() => {
    const map: Record<number, FieldNote> = {};
    if (rawNotes) {
      rawNotes.forEach((note: any) => {
        map[note.target_id] = {
          targetId: note.target_id,
          geologistName: note.geologist_name || 'Geologist',
          visitDate: note.visit_date || note.submitted_at?.slice(0, 10) || '',
          rockSample: note.rock_sample || '',
          accessDifficulty: note.access_difficulty || 'moderate',
          gpsAccuracyM: note.gps_accuracy_m || 2.5,
          observations: note.observations || '',
          photoFilename: note.photo_filename || '',
          confidenceDelta: note.confidence_delta || 0,
          submittedAt: note.submitted_at || '',
        };
      });
    }
    return map;
  }, [rawNotes]);

  const filteredTargets = useMemo(() => {
    return (targets || []).filter((t) => {
      if (t.prospectivity_score < minScore) return false;
      if (onlyVerified && !t.is_verified) return false;
      return true;
    });
  }, [targets, minScore, onlyVerified]);

  const highPotentialCount = (targets || []).filter((t) => t.prospectivity_score >= 0.85).length;
  const verifiedCount = (targets || []).filter((t) => t.is_verified).length;
  const avgScore = targets?.length
    ? ((targets.reduce((s, t) => s + t.prospectivity_score, 0) / targets.length) * 100).toFixed(1)
    : '0.0';

  const handleExportPdf = () => {
    if (!filteredTargets.length) {
      push('warning', 'No Targets Selected', 'Adjust filter settings to include targets in the report.');
      return;
    }
    exportHtmlReport(filteredTargets, fieldNotesMap);
    push('success', 'Report Generated', 'Opened printable PDF report dossier in new tab.');
  };

  const handleExportCsv = () => {
    if (!filteredTargets.length) {
      push('warning', 'No Targets Selected', 'Adjust filter settings to export data.');
      return;
    }
    exportCsv(filteredTargets, fieldNotesMap);
    push('success', 'CSV Exported', `Downloaded ${filteredTargets.length} targets with field notes.`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-900/30">
              <FileText size={20} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold heading-gradient">Exploration Reports</h1>
          </div>
          <p className="text-sm text-slate-400 ml-13">
            Generate printable executive PDF dossiers and export target datasets.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 rounded-xl font-medium text-sm transition-all"
          >
            <FileSpreadsheet size={16} className="text-emerald-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportPdf}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-medium text-sm shadow-lg shadow-purple-900/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Printer size={16} />
            <span>Generate PDF Dossier</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Total Targets</span>
            <MapPin className="text-purple-400" size={18} />
          </div>
          <div className="text-3xl font-extrabold text-white mt-2">{targets?.length || 0}</div>
          <p className="text-xs text-slate-400 mt-1">Identified high-potential zones</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">High Potential</span>
            <Sparkles className="text-emerald-400" size={18} />
          </div>
          <div className="text-3xl font-extrabold text-white mt-2">{highPotentialCount}</div>
          <p className="text-xs text-slate-400 mt-1">Score ≥ 85% confidence</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Ground Verified</span>
            <CheckCircle2 className="text-amber-400" size={18} />
          </div>
          <div className="text-3xl font-extrabold text-white mt-2">{verifiedCount}</div>
          <p className="text-xs text-slate-400 mt-1">Field audited outcroppings</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Average Prospectivity</span>
            <TrendingUp className="text-indigo-400" size={18} />
          </div>
          <div className="text-3xl font-extrabold text-white mt-2">{avgScore}%</div>
          <p className="text-xs text-slate-400 mt-1">Mean model probability</p>
        </div>
      </div>

      {/* Main Grid: Configurator + Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Report Configurator */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800/80 bg-slate-900/50 space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-800">
            <Sliders className="text-purple-400" size={18} />
            <h2 className="text-base font-bold text-slate-100">Dossier Settings</h2>
          </div>

          {/* Title Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Dossier Title
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Report Template Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Report Template
            </label>
            <div className="space-y-2">
              {[
                { id: 'executive', title: 'Executive Summary', desc: 'High level targets & stats for leadership' },
                { id: 'full', title: 'Complete Exploration Dossier', desc: 'All targets, SHAP factors & field notes' },
                { id: 'verified', title: 'Field Verification Audit', desc: 'Focus strictly on ground-verified targets' },
              ].map((t) => (
                <div
                  key={t.id}
                  onClick={() => setReportType(t.id as any)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    reportType === t.id
                      ? 'bg-purple-600/10 border-purple-500/50 text-slate-100'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-sm font-semibold">{t.title}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{t.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Min Prospectivity Score Slider */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Min Prospectivity Score
              </label>
              <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                {(minScore * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="w-full accent-purple-500 bg-slate-950 cursor-pointer"
            />
          </div>

          {/* Only Verified Toggle */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Only Field Verified Targets
            </span>
            <input
              type="checkbox"
              checked={onlyVerified}
              onChange={(e) => setOnlyVerified(e.target.checked)}
              className="w-4 h-4 accent-purple-500 rounded bg-slate-950 border-slate-800 cursor-pointer"
            />
          </div>

          {/* Action Trigger */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <button
              onClick={handleExportPdf}
              className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-medium text-sm shadow-lg shadow-purple-900/30 transition-all flex items-center justify-center gap-2"
            >
              <Printer size={16} />
              <span>Print / Save PDF Dossier</span>
            </button>
            <button
              onClick={handleExportCsv}
              className="w-full py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
            >
              <Download size={16} />
              <span>Export Selected CSV ({filteredTargets.length})</span>
            </button>
          </div>
        </div>

        {/* Right: Interactive Target Table Preview */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-800/80 bg-slate-900/50 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="text-indigo-400" size={18} />
                <h2 className="text-base font-bold text-slate-100">Dossier Content Preview</h2>
              </div>
              <span className="text-xs font-semibold text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                {filteredTargets.length} targets included
              </span>
            </div>

            {isLoadingTargets ? (
              <div className="p-12 text-center text-slate-400 animate-pulse">
                Loading target data...
              </div>
            ) : filteredTargets.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <AlertCircle className="mx-auto text-amber-400 mb-2" size={32} />
                <p>No targets match your dossier filter criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Target Name</th>
                      <th className="py-2.5 px-3">Coordinates</th>
                      <th className="py-2.5 px-3 text-right">Prospectivity</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3">Field Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {filteredTargets.map((t) => {
                      const note = fieldNotesMap[t.id];
                      return (
                        <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-3 font-semibold text-slate-100">{t.name}</td>
                          <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                            {t.latitude.toFixed(4)}°N, {t.longitude.toFixed(4)}°E
                          </td>
                          <td className="py-3 px-3 text-right font-bold">
                            <span
                              className={`px-2 py-0.5 rounded ${
                                t.prospectivity_score >= 0.85
                                  ? 'text-emerald-400 bg-emerald-500/10'
                                  : t.prospectivity_score >= 0.7
                                  ? 'text-amber-400 bg-amber-500/10'
                                  : 'text-rose-400 bg-rose-500/10'
                              }`}
                            >
                              {(t.prospectivity_score * 100).toFixed(1)}%
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            {t.is_verified ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                <CheckCircle2 size={12} /> Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-slate-400 text-[11px]">
                            {note ? (
                              <span className="text-slate-200">{note.geologistName} · {note.accessDifficulty}</span>
                            ) : (
                              <span className="italic text-slate-500">No notes</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>Official Report Format: ISO/GIS Compliant Standard</span>
            <span className="text-purple-400 font-semibold">MANGANEX AI Prospectivity Engine v1.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}

