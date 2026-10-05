
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fieldNotesApi, targetsApi } from '../services/api';
import type { ExplorationTarget } from '../services/api';
import {
  ClipboardList,
  Plus,
  Search,
  MapPin,
  Calendar,
  User,
  Compass,
  Trash2,
  Tag,
  TrendingUp,
  TrendingDown,
  X,
  FileText
} from 'lucide-react';
import { useNotifications } from '../context/NotificationsContext';
import { useAuth } from '../context/AuthContext';

interface FieldNoteData {
  id?: number;
  target_id: number;
  geologist_name: string;
  visit_date: string;
  rock_sample: string;
  access_difficulty: string;
  gps_accuracy_m: number;
  observations: string;
  photo_filename?: string;
  confidence_delta: number;
  verification_status?: boolean;
}

export default function FieldNotes() {
  const queryClient = useQueryClient();
  const { push } = useNotifications();
  const { user } = useAuth();

  const [search, setSearch] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedTargetId, setSelectedTargetId] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState<FieldNoteData>({
    target_id: 1,
    geologist_name: user?.username || 'Dr. A. Sharma',
    visit_date: new Date().toISOString().slice(0, 10),
    rock_sample: 'Psilomelane / Pyrolusite matrix',
    access_difficulty: 'moderate',
    gps_accuracy_m: 2.5,
    observations: '',
    confidence_delta: 5,
  });

  const { data: notes, isLoading: isLoadingNotes } = useQuery({
    queryKey: ['fieldNotes'],
    queryFn: fieldNotesApi.getAll,
  });

  const { data: targets } = useQuery({
    queryKey: ['targets'],
    queryFn: targetsApi.getAll,
  });

  const createNoteMutation = useMutation({
    mutationFn: (payload: FieldNoteData) => fieldNotesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fieldNotes'] });
      push('success', 'Field Note Created', 'Observations successfully recorded in database');
      setShowAddModal(false);
      setFormData({
        target_id: targets?.[0]?.id || 1,
        geologist_name: user?.username || 'Dr. A. Sharma',
        visit_date: new Date().toISOString().slice(0, 10),
        rock_sample: 'Psilomelane / Pyrolusite matrix',
        access_difficulty: 'moderate',
        gps_accuracy_m: 2.5,
        observations: '',
        confidence_delta: 5,
      });
    },
    onError: (err: any) => {
      push('error', 'Error Creating Note', err.message || 'Failed to save field note');
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: number) => fieldNotesApi.delete(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fieldNotes'] });
      push('info', 'Field Note Deleted', 'Field observation record removed');
    },
    onError: (err: any) => {
      push('error', 'Delete Failed', err.message || 'Could not delete note');
    },
  });

  const targetsMap = (targets || []).reduce((acc, t) => {
    acc[t.id] = t;
    return acc;
  }, {} as Record<number, ExplorationTarget>);

  const filteredNotes = (notes || []).filter((note: any) => {
    const target = targetsMap[note.target_id];
    const targetName = target ? target.name.toLowerCase() : '';
    const matchesSearch =
      (note.geologist_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (note.observations || '').toLowerCase().includes(search.toLowerCase()) ||
      (note.rock_sample || '').toLowerCase().includes(search.toLowerCase()) ||
      targetName.includes(search.toLowerCase());

    const matchesDiff =
      selectedDifficulty === 'all' || note.access_difficulty === selectedDifficulty;
    const matchesTarget =
      selectedTargetId === 'all' || note.target_id === Number(selectedTargetId);

    return matchesSearch && matchesDiff && matchesTarget;
  });

  const difficultyBadge = (diff: string) => {
    switch (diff) {
      case 'easy':
        return <span className="px-2.5 py-1 text-xs rounded-lg font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Easy Access</span>;
      case 'moderate':
        return <span className="px-2.5 py-1 text-xs rounded-lg font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">Moderate</span>;
      case 'difficult':
        return <span className="px-2.5 py-1 text-xs rounded-lg font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20">Difficult Terrain</span>;
      case 'inaccessible':
        return <span className="px-2.5 py-1 text-xs rounded-lg font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">Inaccessible</span>;
      default:
        return <span className="px-2.5 py-1 text-xs rounded-lg font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">{diff}</span>;
    }
  };

  const avgConfidence = (notes || []).length
    ? ((notes || []).reduce((sum: number, n: any) => sum + (n.confidence_delta || 0), 0) / (notes || []).length).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-900/30">
              <ClipboardList size={20} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold heading-gradient">Field Notes Ledger</h1>
          </div>
          <p className="text-sm text-slate-400 ml-13">
            Ground-truth geological field observations and confidence adjustments.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-medium shadow-lg shadow-purple-900/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus size={18} />
          <span>New Field Note</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Total Logs</span>
            <FileText className="text-purple-400" size={18} />
          </div>
          <div className="text-3xl font-extrabold text-white mt-2">{(notes || []).length}</div>
          <p className="text-xs text-slate-400 mt-1">Recorded field observations</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Targets Covered</span>
            <MapPin className="text-emerald-400" size={18} />
          </div>
          <div className="text-3xl font-extrabold text-white mt-2">
            {new Set((notes || []).map((n: any) => n.target_id)).size}
          </div>
          <p className="text-xs text-slate-400 mt-1">Unique target locations visited</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Avg. Confidence Adj.</span>
            <TrendingUp className="text-indigo-400" size={18} />
          </div>
          <div className="text-3xl font-extrabold text-white mt-2">
            {Number(avgConfidence) >= 0 ? `+${avgConfidence}%` : `${avgConfidence}%`}
          </div>
          <p className="text-xs text-slate-400 mt-1">Mean model score delta</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">GPS Accuracy</span>
            <Compass className="text-amber-400" size={18} />
          </div>
          <div className="text-3xl font-extrabold text-white mt-2">±2.1m</div>
          <p className="text-xs text-slate-400 mt-1">High-precision field survey</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 rounded-2xl border border-slate-800/80 bg-slate-900/40 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search notes, geologists, samples..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Target Filter */}
          <select
            value={selectedTargetId}
            onChange={(e) => setSelectedTargetId(e.target.value)}
            className="bg-slate-950/60 border border-slate-800 text-slate-300 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500"
          >
            <option value="all">All Targets</option>
            {(targets || []).map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          {/* Access Filter */}
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="bg-slate-950/60 border border-slate-800 text-slate-300 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500"
          >
            <option value="all">All Terrain Difficulties</option>
            <option value="easy">Easy Access</option>
            <option value="moderate">Moderate</option>
            <option value="difficult">Difficult Terrain</option>
            <option value="inaccessible">Inaccessible</option>
          </select>
        </div>
      </div>

      {/* Notes List */}
      {isLoadingNotes ? (
        <div className="glass-panel rounded-2xl p-12 text-center text-slate-400 animate-pulse">
          <ClipboardList className="mx-auto text-purple-400 mb-3" size={32} />
          <p>Loading ground-truth field notes...</p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center text-slate-400 border border-slate-800">
          <FileText className="mx-auto text-slate-600 mb-3" size={40} />
          <h3 className="text-lg font-semibold text-slate-200">No field notes found</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
            No observation notes match your search criteria or none have been submitted yet.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 px-4 py-2 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded-xl text-sm font-medium hover:bg-purple-600/30 transition-colors"
          >
            Create Note
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNotes.map((note: any) => {
            const target = targetsMap[note.target_id];
            return (
              <div
                key={note.id}
                className="glass-card rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5 flex flex-col justify-between hover:border-purple-500/40 transition-all group"
              >
                <div>
                  {/* Top line: Target & Access */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-purple-400 shrink-0" />
                        <span className="font-bold text-slate-100 text-base">
                          {target ? target.name : `Target #${note.target_id}`}
                        </span>
                      </div>
                      {target && (
                        <p className="text-xs text-slate-400 ml-6">
                          {target.latitude.toFixed(4)}°N, {target.longitude.toFixed(4)}°E
                        </p>
                      )}
                    </div>
                    {difficultyBadge(note.access_difficulty)}
                  </div>

                  {/* Geologist & Visit Date info */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 bg-slate-950/40 p-2.5 rounded-xl mb-3 border border-slate-800/60">
                    <div className="flex items-center gap-1.5">
                      <User size={14} className="text-indigo-400" />
                      <span className="font-medium text-slate-200">{note.geologist_name || 'Anonymous Geologist'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-purple-400" />
                      <span>{note.visit_date || note.submitted_at?.slice(0, 10) || 'Recent'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Compass size={14} className="text-amber-400" />
                      <span>GPS ±{note.gps_accuracy_m ?? 2.5}m</span>
                    </div>
                  </div>

                  {/* Observations */}
                  <p className="text-xs text-slate-300 leading-relaxed mb-3 line-clamp-3">
                    {note.observations || note.note_text || 'No detailed qualitative observations recorded.'}
                  </p>

                  {/* Rock Sample */}
                  {note.rock_sample && (
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                      <Tag size={14} className="text-purple-400 shrink-0" />
                      <span className="font-medium text-slate-300">Sample:</span>
                      <span className="italic text-slate-300">{note.rock_sample}</span>
                    </div>
                  )}
                </div>

                {/* Bottom line: Confidence adjustment & Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 mt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Score Adj:</span>
                    <span
                      className={`text-xs font-extrabold px-2 py-0.5 rounded-lg flex items-center gap-1 ${
                        (note.confidence_delta || 0) >= 0
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {(note.confidence_delta || 0) >= 0 ? (
                        <TrendingUp size={12} />
                      ) : (
                        <TrendingDown size={12} />
                      )}
                      {(note.confidence_delta || 0) >= 0 ? `+${note.confidence_delta}%` : `${note.confidence_delta}%`}
                    </span>
                  </div>

                  <button
                    onClick={() => deleteNoteMutation.mutate(note.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Delete Note"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Field Note Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <ClipboardList size={20} />
              </div>
              <h2 className="text-xl font-bold text-slate-100">Log Field Observation</h2>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createNoteMutation.mutate(formData);
              }}
              className="space-y-4"
            >
              {/* Target Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Target Zone
                </label>
                <select
                  value={formData.target_id}
                  onChange={(e) => setFormData({ ...formData, target_id: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-purple-500"
                >
                  {(targets || []).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (Lat: {t.latitude.toFixed(3)}, Lon: {t.longitude.toFixed(3)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Geologist Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Geologist
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.geologist_name}
                    onChange={(e) => setFormData({ ...formData, geologist_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Visit Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Visit Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.visit_date}
                    onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Rock Sample */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Rock / Mineral Sample
                  </label>
                  <input
                    type="text"
                    value={formData.rock_sample}
                    onChange={(e) => setFormData({ ...formData, rock_sample: e.target.value })}
                    placeholder="e.g., Manganese Oxide Nodules"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Terrain Access */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Access Difficulty
                  </label>
                  <select
                    value={formData.access_difficulty}
                    onChange={(e) => setFormData({ ...formData, access_difficulty: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-purple-500"
                  >
                    <option value="easy">Easy Access</option>
                    <option value="moderate">Moderate</option>
                    <option value="difficult">Difficult Terrain</option>
                    <option value="inaccessible">Inaccessible</option>
                  </select>
                </div>
              </div>

              {/* Confidence Adjustment Slider */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Confidence Adjustment Delta
                  </label>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded ${
                      formData.confidence_delta >= 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
                    }`}
                  >
                    {formData.confidence_delta >= 0 ? `+${formData.confidence_delta}%` : `${formData.confidence_delta}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-20"
                  max="20"
                  value={formData.confidence_delta}
                  onChange={(e) => setFormData({ ...formData, confidence_delta: Number(e.target.value) })}
                  className="w-full accent-purple-500 bg-slate-950 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>-20% (Downgrade)</span>
                  <span>0% (Neutral)</span>
                  <span>+20% (Upgrade)</span>
                </div>
              </div>

              {/* Field Observations Textarea */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Field Observations & Lithology
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe outcropping patterns, weathering grade, mineral assemblages..."
                  value={formData.observations}
                  onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createNoteMutation.isPending}
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-purple-900/30"
                >
                  {createNoteMutation.isPending ? 'Saving...' : 'Save Observation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

