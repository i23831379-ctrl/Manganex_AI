import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, targetsApi, fieldNotesApi } from '../services/api';
import type { ExplorationTarget } from '../services/api';
import type { FieldNote } from '../utils/reportExport';
import {
  CheckCircle2,
  Circle,
  ArrowDownWideNarrow,
  MapPin,
  Search,
  Filter,
  ShieldCheck,
  TrendingUp,
  Clock,
  Download,
  FileText,
  ClipboardEdit,
  Upload,
  Cpu
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { FieldVerificationModal } from '../components/FieldVerificationModal';
import { DataImportModal } from '../components/DataImportModal';
import { exportCsv, exportHtmlReport } from '../utils/reportExport';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';

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
function scoreLabel(score: number) {
  if (score >= 0.85) return { label: 'High', cls: 'badge-success' };
  if (score >= 0.7) return { label: 'Medium', cls: 'badge-warning' };
  return { label: 'Low', cls: 'badge badge-info' };
}

export default function Targets() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  
  const [selectedTarget, setSelectedTarget] = useState<ExplorationTarget | null>(null);
  const [fieldNotes, setFieldNotes] = useState<Record<number, FieldNote>>({});
  const [showImportModal, setShowImportModal] = useState(false);
  const { user } = useAuth();
  const { push } = useNotifications();

  useEffect(() => {
    // Load all field notes from backend and store in state keyed by targetId
    (async () => {
      try {
        const notes = await fieldNotesApi.getAll();
        const notesMap: Record<number, FieldNote> = {};
        notes.forEach((note: any) => {
          notesMap[note.target_id] = {
            targetId: note.target_id,
            geologistName: note.geologist_name,
            visitDate: note.visit_date,
            rockSample: note.rock_sample,
            accessDifficulty: note.access_difficulty,
            gpsAccuracyM: note.gps_accuracy_m,
            observations: note.observations,
            photoFilename: note.photo_filename,
            confidenceDelta: note.confidence_delta,
            submittedAt: note.submitted_at,
          };
        });
        setFieldNotes(notesMap);
      } catch (error) {
        console.error('Failed to load field notes', error);
        push('error', 'Load Error', 'Could not load field notes from backend');
      }
    })();
  }, []);

  const { data: targets, isLoading } = useQuery({
    queryKey: ['targets'],
    queryFn: api.targets,
  });

  const verifyMutation = useMutation({
    mutationFn: (id: number) => targetsApi.verify(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['targets'] }),
  });

  const sorted = useMemo(() => {
    return [...(targets || [])]
      .sort((a, b) => b.prospectivity_score - a.prospectivity_score)
      .filter((t) => {
        const matchesSearch =
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          (t.description ?? '').toLowerCase().includes(search.toLowerCase());
        const matchesFilter =
          filter === 'all' ||
          (filter === 'verified' && t.is_verified) ||
          (filter === 'unverified' && !t.is_verified);
        return matchesSearch && matchesFilter;
      });
  }, [targets, search, filter]);

  const generateMutation = useMutation({
    mutationFn: () => targetsApi.generate(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['targets'] });
      push('success', 'Targets Generated', 'AI has discovered new exploration targets.');
    },
    onError: () => push('error', 'Generation Failed', 'Could not generate new targets.')
  });

  const verifiedCount = targets?.filter((t) => t.is_verified).length ?? 0;
  const avgScore = targets && targets.length > 0
    ? targets.reduce((s, t) => s + t.prospectivity_score, 0) / targets.length
    : 0;

  const handleFieldSubmit = async (noteData: Omit<FieldNote, 'targetId' | 'submittedAt'>) => {
    if (!selectedTarget) return;
    
    // Create field note via backend
    try {
      const payload = {
        target_id: selectedTarget.id,
        geologist_name: noteData.geologistName,
        visit_date: noteData.visitDate,
        rock_sample: noteData.rockSample,
        access_difficulty: noteData.accessDifficulty,
        gps_accuracy_m: noteData.gpsAccuracyM,
        observations: noteData.observations,
        photo_filename: noteData.photoFilename,
        confidence_delta: noteData.confidenceDelta,
        submitted_at: new Date().toISOString(),
      };
      const created = await fieldNotesApi.create(payload);
      const newNote: FieldNote = {
        targetId: created.target_id,
        geologistName: created.geologist_name,
        visitDate: created.visit_date,
        rockSample: created.rock_sample,
        accessDifficulty: created.access_difficulty,
        gpsAccuracyM: created.gps_accuracy_m,
        observations: created.observations,
        photoFilename: created.photo_filename,
        confidenceDelta: created.confidence_delta,
        submittedAt: created.submitted_at,
      };
      setFieldNotes(prev => ({ ...prev, [selectedTarget.id]: newNote }));
      // Mark target as verified
      await verifyMutation.mutateAsync(selectedTarget.id);
      push('success', 'Field Visit Logged', `${selectedTarget.name} has been marked as verified.`);
    } catch (error) {
      console.error('Error submitting field note', error);
      push('error', 'Submission Failed', 'Could not save field note to backend.');
    }
    setSelectedTarget(null);
  };

  const handleExportCsv = () => exportCsv(sorted, fieldNotes);
  const handleExportReport = () => exportHtmlReport(sorted, fieldNotes);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="skeleton h-10 w-64 rounded-xl" />
        <div className="glass-panel p-6 space-y-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold heading-gradient mb-1">Target Prioritization</h1>
          <p className="text-slate-400 text-sm">Manage and verify identified manganese exploration zones.</p>
        </div>
        
        {/* Export & Import Buttons */}
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={handleExportCsv}
            disabled={sorted.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors border border-slate-700 disabled:opacity-50"
          >
            <Download size={14} /> CSV
          </button>
          <button 
            onClick={handleExportReport}
            disabled={sorted.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-white bg-purple-600 hover:bg-purple-500 transition-colors shadow-[0_0_15px_rgba(147,51,234,0.3)] disabled:opacity-50"
          >
            <FileText size={14} /> Report
          </button>
          {user?.role === 'admin' && (
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.25)]"
            >
              <Upload size={14} /> Upload
            </button>
          )}
          {user?.role === 'admin' && (
            <button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-[0_0_15px_rgba(37,99,235,0.25)] disabled:opacity-50"
            >
              <Cpu size={14} className={generateMutation.isPending ? "animate-spin" : ""} />
              Generate AI Targets
            </button>
          )}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <MapPin size={18} className="text-purple-400" />
          </div>
          <div>
            <div className="text-xs text-slate-500">Total Targets</div>
            <div className="text-xl font-bold text-slate-100">{targets?.length ?? 0}</div>
          </div>
        </div>
        <div className="glass-panel p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <ShieldCheck size={18} className="text-emerald-400" />
          </div>
          <div>
            <div className="text-xs text-slate-500">Verified</div>
            <div className="text-xl font-bold text-slate-100">{verifiedCount}</div>
          </div>
        </div>
        <div className="glass-panel p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <TrendingUp size={18} className="text-blue-400" />
          </div>
          <div>
            <div className="text-xs text-slate-500">Avg. Prospectivity</div>
            <div className={`text-xl font-bold ${scoreColor(avgScore)}`}>
              {(avgScore * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search zones…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input pl-9 text-sm py-2"
          />
        </div>
        <div className="flex items-center gap-1 glass-panel p-1 rounded-xl">
          <Filter size={14} className="text-slate-500 ml-2" />
          {(['all', 'verified', 'unverified'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 capitalize ${
                filter === f
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="glass-panel px-3 py-2 flex items-center gap-2 text-xs text-slate-400">
          <ArrowDownWideNarrow size={14} />
          By Prospectivity
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase bg-slate-800/80 text-slate-400 border-b border-slate-700/50">
              <tr>
                <th scope="col" className="px-6 py-4">Rank</th>
                <th scope="col" className="px-6 py-4">Zone Name</th>
                <th scope="col" className="px-6 py-4">Coordinates</th>
                <th scope="col" className="px-6 py-4">Prospectivity</th>
                <th scope="col" className="px-6 py-4">Category</th>
                <th scope="col" className="px-6 py-4">Status</th>
                <th scope="col" className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((target: ExplorationTarget, i) => {
                const { label, cls } = scoreLabel(target.prospectivity_score);
                const hasNote = !!fieldNotes[target.id];
                return (
                  <tr key={target.id} className="group border-b border-slate-700/30 hover:bg-slate-800/50 transition-all duration-200">
                    <td className="px-6 py-4">
                      <span className="text-lg font-black text-slate-600">#{i + 1}</span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-200">
                      <div className="flex items-center gap-2">
                        <MapPin size={15} className="text-purple-400 shrink-0" />
                        <div>
                          <div className="truncate max-w-[140px]">{target.name}</div>
                          {target.description && (
                            <div className="text-xs text-slate-500 truncate max-w-[140px]">{target.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                      {target.latitude.toFixed(4)}°N<br />
                      {target.longitude.toFixed(4)}°E
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 min-w-[130px]">
                        <div className="flex-1 bg-slate-700 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-500 ${scoreBarColor(target.prospectivity_score)}`}
                            style={{ width: `${target.prospectivity_score * 100}%` }}
                          />
                        </div>
                        <span className={`font-bold text-sm tabular-nums w-12 text-right ${scoreColor(target.prospectivity_score)}`}>
                          {(target.prospectivity_score * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${cls}`}>{label}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5 items-start">
                        {target.is_verified ? (
                          <span className="badge badge-success">
                            <CheckCircle2 size={11} /> Verified
                          </span>
                        ) : (
                          <span className="badge badge-warning">
                            <Circle size={11} /> Pending
                          </span>
                        )}
                        {hasNote && (
                          <span className="text-[10px] flex items-center gap-1 text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                            <FileText size={10} /> Notes Logged
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!target.is_verified ? (
                        <button
                          onClick={() => setSelectedTarget(target)}
                          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-purple-600 text-white transition-colors duration-200"
                        >
                          <ClipboardEdit size={14} /> Log Visit
                        </button>
                      ) : (
                        <span className="text-xs text-slate-500 font-medium px-3 py-1.5">
                          Completed
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {sorted.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <Search size={32} className="mx-auto text-slate-700 mb-3" />
                    <div className="text-slate-500">No targets match your filters.</div>
                    <button
                      onClick={() => { setSearch(''); setFilter('all'); }}
                      className="mt-2 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      Clear filters
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {targets && targets.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-700/30 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <Clock size={12} /> Live data from backend
            </span>
            <span>Showing {sorted.length} of {targets.length} targets</span>
          </div>
        )}
      </div>

      {selectedTarget && (
        <FieldVerificationModal
          target={selectedTarget}
          isOpen={true}
          onClose={() => setSelectedTarget(null)}
          onSubmit={handleFieldSubmit}
          isSubmitting={verifyMutation.isPending}
        />
      )}

      <DataImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
      />
    </div>
  );
}
