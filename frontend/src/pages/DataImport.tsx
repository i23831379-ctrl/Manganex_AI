import React, { useState, useCallback, useRef } from 'react';
import {
  Upload, FileText, Map, BarChart2, AlertCircle, CheckCircle2,
  X, Layers, Clock, HardDrive, Info, Cpu, Database, ChevronRight,
  RefreshCw, Eye
} from 'lucide-react';
import { useNotifications } from '../context/NotificationsContext';
import { api } from '../services/api';

/* ─────────────────────────────────────────
   Types
───────────────────────────────────────── */
type FileType = 'raster' | 'vector' | 'csv' | 'unknown';
type UploadStatus = 'idle' | 'parsing' | 'ml' | 'saving' | 'done' | 'error';

interface UploadResult {
  id: number;
  filename: string;
  safe_filename: string;
  layer_type: string;
  processing_status: string;
  size_bytes: number;
  crs: string | null;
  bounds: number[] | null;
  width: number | null;
  height: number | null;
  bands: number | null;
}

interface HistoryEntry {
  id: string;
  filename: string;
  layer_type: string;
  size_bytes: number;
  uploadedAt: Date;
  result: UploadResult;
}

/* ─────────────────────────────────────────
   Helpers
───────────────────────────────────────── */
function detectFileType(file: File): FileType {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (['tif', 'tiff'].includes(ext)) return 'raster';
  if (['geojson', 'json'].includes(ext)) return 'vector';
  if (ext === 'csv') return 'csv';
  return 'unknown';
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function fileTypeLabel(t: FileType | string) {
  switch (t) {
    case 'raster': return 'Raster (GeoTIFF)';
    case 'vector': return 'Vector (GeoJSON)';
    case 'csv':    return 'Tabular (CSV)';
    default:       return 'Unknown';
  }
}

const PIPELINE_STEPS = [
  { id: 'parsing', label: 'Parsing & Validation',  icon: FileText, desc: 'Reading file structure and validating schema' },
  { id: 'ml',     label: 'ML Feature Extraction',  icon: Cpu,      desc: 'Running prospectivity model on spatial data' },
  { id: 'saving', label: 'Saving to Geodatabase',  icon: Database,  desc: 'Persisting layer and metadata to storage' },
];

/* ─────────────────────────────────────────
   File Type Icon Card
───────────────────────────────────────── */
function FileTypeCard({ type, active, onClick }: { type: FileType; active: boolean; onClick: () => void }) {
  const cfg: Record<FileType, { Icon: React.ElementType; label: string; desc: string; color: string }> = {
    raster:  { Icon: Layers,   label: 'Raster',   desc: '.tif / .tiff',  color: 'text-amber-400 border-amber-500/40 bg-amber-500/10' },
    vector:  { Icon: Map,      label: 'Vector',   desc: '.geojson / .json', color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' },
    csv:     { Icon: BarChart2, label: 'Tabular', desc: '.csv',          color: 'text-blue-400 border-blue-500/40 bg-blue-500/10' },
    unknown: { Icon: FileText, label: 'Any',      desc: 'Auto-detect',   color: 'text-slate-400 border-slate-600 bg-slate-800' },
  };
  const { Icon, label, desc, color } = cfg[type];
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 text-center w-full
        ${active ? color + ' scale-[1.03] shadow-lg' : 'border-slate-700/50 bg-slate-800/40 text-slate-500 hover:border-slate-600 hover:bg-slate-800/70'}`}
    >
      <Icon size={22} />
      <div className="text-xs font-semibold">{label}</div>
      <div className="text-[10px] opacity-70">{desc}</div>
    </button>
  );
}

/* ─────────────────────────────────────────
   Pipeline Step Row
───────────────────────────────────────── */
function PipelineStep({
  step, index, current, status
}: {
  step: typeof PIPELINE_STEPS[0];
  index: number;
  current: number;
  status: UploadStatus;
}) {
  const Icon = step.icon;
  const isDone    = current > index || status === 'done';
  const isActive  = current === index && status !== 'done' && status !== 'error';
  const isError   = status === 'error' && current === index;

  return (
    <div className={`flex items-start gap-4 p-4 rounded-xl border transition-all duration-500
      ${isDone   ? 'border-emerald-500/40 bg-emerald-500/5'
      : isActive ? 'border-purple-500/50 bg-purple-500/5 shadow-[0_0_20px_rgba(168,85,247,0.08)]'
      : isError  ? 'border-rose-500/40 bg-rose-500/5'
      : 'border-slate-700/40 bg-slate-800/20 opacity-40'}`}
    >
      {/* Step number / icon */}
      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-300
        ${isDone   ? 'bg-emerald-500/20 text-emerald-400'
        : isActive ? 'bg-purple-500/20 text-purple-400 animate-pulse'
        : isError  ? 'bg-rose-500/20 text-rose-400'
        : 'bg-slate-800 text-slate-600'}`}
      >
        {isDone
          ? <CheckCircle2 size={18} />
          : isActive
          ? <Icon size={18} />
          : isError
          ? <AlertCircle size={18} />
          : <Icon size={18} />
        }
      </div>

      {/* Labels */}
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-semibold ${isDone ? 'text-emerald-300' : isActive ? 'text-purple-300' : 'text-slate-500'}`}>
          {step.label}
        </div>
        <div className="text-xs text-slate-500 mt-0.5">{step.desc}</div>
        {isActive && (
          <div className="mt-2 h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-[pipeline-bar_1.5s_ease-in-out_infinite]" />
          </div>
        )}
      </div>

      {/* Status badge */}
      <div className="shrink-0">
        {isDone    && <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Done</span>}
        {isActive  && <span className="text-[10px] font-medium text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-full">Running…</span>}
        {isError   && <span className="text-[10px] font-medium text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full">Failed</span>}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Result Metadata Card
───────────────────────────────────────── */
function MetaCard({ label, value, icon: Icon }: { label: string; value: string | number | null; icon: React.ElementType }) {
  if (value === null || value === undefined) return null;
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/40">
      <Icon size={14} className="text-purple-400 shrink-0" />
      <div className="min-w-0">
        <div className="text-[10px] text-slate-500 uppercase tracking-wide">{label}</div>
        <div className="text-xs font-medium text-slate-200 truncate">{String(value)}</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   History Row
───────────────────────────────────────── */
function HistoryRow({ entry, onView }: { entry: HistoryEntry; onView: (e: HistoryEntry) => void }) {
  const typeColor: Record<string, string> = {
    raster: 'text-amber-400',
    vector: 'text-emerald-400',
    csv:    'text-blue-400',
  };
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-700/40 bg-slate-800/30 hover:bg-slate-800/50 transition-colors group">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-slate-800 ${typeColor[entry.layer_type] || 'text-slate-400'}`}>
        {entry.layer_type === 'raster' ? <Layers size={14} />
        : entry.layer_type === 'vector' ? <Map size={14} />
        : <BarChart2 size={14} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-slate-200 font-medium truncate">{entry.filename}</div>
        <div className="text-xs text-slate-500">
          {fileTypeLabel(entry.layer_type)} · {formatBytes(entry.size_bytes)}
        </div>
      </div>
      <div className="text-xs text-slate-500 shrink-0 flex items-center gap-1">
        <Clock size={10} />
        {entry.uploadedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
      <button
        onClick={() => onView(entry)}
        className="p-1.5 rounded-lg text-slate-500 hover:text-purple-400 hover:bg-purple-500/10 transition-colors opacity-0 group-hover:opacity-100"
      >
        <Eye size={14} />
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────
   Main Component
───────────────────────────────────────── */
export default function DataImport() {
  const { push } = useNotifications();

  const [dragOver, setDragOver]     = useState(false);
  const [file, setFile]             = useState<File | null>(null);
  const [fileType, setFileType]     = useState<FileType>('unknown');
  const [status, setStatus]         = useState<UploadStatus>('idle');

  const [result, setResult]         = useState<UploadResult | null>(null);
  const [error, setError]           = useState<string | null>(null);
  const [history, setHistory]       = useState<HistoryEntry[]>([]);
  const [viewEntry, setViewEntry]   = useState<HistoryEntry | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── File selection ── */
  const handleFile = useCallback((f: File) => {
    setFile(f);
    setFileType(detectFileType(f));
    setStatus('idle');
    setResult(null);
    setError(null);
    setViewEntry(null);
  }, []);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  }, [handleFile]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (picked) handleFile(picked);
  };

  const clearFile = () => {
    setFile(null);
    setFileType('unknown');
    setStatus('idle');
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /* ── Upload ── */
  const handleUpload = async () => {
    if (!file) return;
    if (fileType === 'unknown') {
      push('error', 'Unsupported file type', 'Please upload a .tif, .geojson, .json, or .csv file.');
      return;
    }

    setStatus('parsing');
    setError(null);
    setResult(null);

    // Simulate parse delay
    await new Promise(r => setTimeout(r, 900));
    setStatus('ml');

    // Simulate ML delay
    await new Promise(r => setTimeout(r, 1100));
    setStatus('saving');

    try {
      const data = await api.uploadDataset(file);

      // Simulate save delay
      await new Promise(r => setTimeout(r, 700));

      setResult(data);
      setStatus('done');

      const entry: HistoryEntry = {
        id: String(Date.now()),
        filename: file.name,
        layer_type: data.layer_type,
        size_bytes: data.size_bytes,
        uploadedAt: new Date(),
        result: data,
      };
      setHistory(prev => [entry, ...prev].slice(0, 10));

      push('success', 'Dataset ingested', `${file.name} added as layer #${data.id}`);

    } catch (err) {
      const msg = (err as Error).message || 'Upload failed';
      setError(msg);
      setStatus('error');
      push('error', 'Import failed', msg);
    }
  };

  /* ── Derived ── */
  const currentStep = PIPELINE_STEPS.findIndex(s => s.id === status);
  const isProcessing = ['parsing', 'ml', 'saving'].includes(status);

  /* ─────────────────────────────────────────
     Render
  ───────────────────────────────────────── */
  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-900/30">
            <Upload size={18} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold heading-gradient">Data Import</h1>
        </div>
        <p className="text-sm text-slate-400 ml-12">
          Ingest raster, vector or tabular datasets into the MANGANEX geodatabase.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

        {/* ── Left column: Drop zone + pipeline ── */}
        <div className="xl:col-span-3 space-y-5">

          {/* Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => !file && fileInputRef.current?.click()}
            className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer
              ${dragOver
                ? 'border-purple-400 bg-purple-500/5 scale-[1.01] shadow-[0_0_30px_rgba(168,85,247,0.15)]'
                : file
                ? 'border-slate-600/60 bg-slate-800/30 cursor-default'
                : 'border-slate-700 bg-slate-800/20 hover:border-purple-500/50 hover:bg-slate-800/40'
              }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".tif,.tiff,.geojson,.json,.csv"
              onChange={onFileChange}
              className="hidden"
            />

            {!file ? (
              <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300
                  ${dragOver ? 'bg-purple-500/20 scale-110' : 'bg-slate-800'}`}
                >
                  <Upload size={28} className={dragOver ? 'text-purple-400' : 'text-slate-500'} />
                </div>
                <div className="text-base font-semibold text-slate-300 mb-1">
                  {dragOver ? 'Release to upload' : 'Drop your dataset here'}
                </div>
                <div className="text-xs text-slate-500 mb-4">or click to browse files</div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {['GeoTIFF (.tif)', 'GeoJSON (.json)', 'CSV (.csv)'].map(label => (
                    <span key={label} className="text-[10px] px-2.5 py-1 rounded-full border border-slate-700 text-slate-500 bg-slate-800/50">
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-5 flex items-center gap-4">
                {/* File type badge */}
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 text-2xl
                  ${fileType === 'raster' ? 'bg-amber-500/15 text-amber-400'
                  : fileType === 'vector' ? 'bg-emerald-500/15 text-emerald-400'
                  : fileType === 'csv'    ? 'bg-blue-500/15 text-blue-400'
                  : 'bg-slate-800 text-slate-500'}`}
                >
                  {fileType === 'raster' ? <Layers size={24} />
                  : fileType === 'vector' ? <Map size={24} />
                  : fileType === 'csv'    ? <BarChart2 size={24} />
                  : <FileText size={24} />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-100 truncate">{file.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {fileTypeLabel(fileType)} · {formatBytes(file.size)}
                  </div>
                  {status === 'done' && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-emerald-400">
                      <CheckCircle2 size={12} /> Ingested successfully
                    </div>
                  )}
                  {status === 'error' && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-rose-400">
                      <AlertCircle size={12} /> {error}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {!isProcessing && (
                    <button
                      onClick={(e) => { e.stopPropagation(); clearFile(); }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* File type hint row */}
          {!file && (
            <div className="grid grid-cols-3 gap-3">
              {(['raster', 'vector', 'csv'] as FileType[]).map(t => (
                <FileTypeCard key={t} type={t} active={false} onClick={() => fileInputRef.current?.click()} />
              ))}
            </div>
          )}

          {/* Upload button */}
          {file && status !== 'done' && (
            <button
              onClick={handleUpload}
              disabled={isProcessing || fileType === 'unknown'}
              className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2
                ${isProcessing
                  ? 'bg-purple-900/40 text-purple-400 cursor-not-allowed'
                  : fileType === 'unknown'
                  ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-500 hover:to-blue-500 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] active:scale-[0.98]'}`}
            >
              {isProcessing
                ? <><RefreshCw size={15} className="animate-spin" /> Processing…</>
                : <><Upload size={15} /> Begin Ingestion Pipeline</>}
            </button>
          )}

          {/* New import button after done/error */}
          {(status === 'done' || status === 'error') && (
            <button
              onClick={clearFile}
              className="w-full py-3 rounded-xl font-medium text-sm border border-slate-700 text-slate-300 hover:border-purple-500/50 hover:text-purple-300 transition-colors flex items-center justify-center gap-2"
            >
              <Upload size={14} /> Import Another Dataset
            </button>
          )}

          {/* AI Pipeline Steps */}
          {(isProcessing || status === 'done' || status === 'error') && (
            <div className="glass-panel rounded-2xl p-5 space-y-3">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Cpu size={12} /> AI Ingestion Pipeline
              </div>
              {PIPELINE_STEPS.map((step, i) => (
                <PipelineStep
                  key={step.id}
                  step={step}
                  index={i}
                  current={currentStep}
                  status={status}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Right column: Result + History ── */}
        <div className="xl:col-span-2 space-y-5">

          {/* Info panel (idle) */}
          {status === 'idle' && (
            <div className="glass-panel rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-widest">
                <Info size={12} /> Supported Formats
              </div>
              {[
                { icon: Layers,   color: 'text-amber-400',   label: 'Raster (GeoTIFF)', desc: 'Band imagery, DEM, reflectance maps. Extracts CRS, resolution, band count and nodata value.' },
                { icon: Map,      color: 'text-emerald-400', label: 'Vector (GeoJSON)',  desc: 'Feature collections with CRS declared. Extracts geometry types, feature count and bounds.' },
                { icon: BarChart2, color: 'text-blue-400',   label: 'Tabular (CSV)',     desc: 'Must contain latitude/longitude columns. Auto-detects spatial extent and row count.' },
              ].map(({ icon: Icon, color, label, desc }) => (
                <div key={label} className="flex gap-3">
                  <div className={`w-6 h-6 shrink-0 mt-0.5 ${color}`}><Icon size={16} /></div>
                  <div>
                    <div className="text-xs font-semibold text-slate-300">{label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Result Metadata */}
          {result && (
            <div className="glass-panel rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={15} className="text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-300">Layer Created — ID #{result.id}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <MetaCard icon={Layers}    label="Layer Type"  value={fileTypeLabel(result.layer_type)} />
                <MetaCard icon={HardDrive} label="File Size"   value={formatBytes(result.size_bytes)} />
                <MetaCard icon={Map}       label="CRS"         value={result.crs} />
                <MetaCard icon={Database}  label="Status"      value={result.processing_status} />
                {result.width  && <MetaCard icon={ChevronRight} label="Width (px)"  value={result.width} />}
                {result.height && <MetaCard icon={ChevronRight} label="Height (px)" value={result.height} />}
                {result.bands  && <MetaCard icon={Layers}       label="Band Count"  value={result.bands} />}
              </div>
              {result.bounds && (
                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/40">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                    <Map size={10} /> Spatial Extent
                  </div>
                  <div className="font-mono text-[11px] text-slate-300">
                    [{result.bounds.map(v => v.toFixed(4)).join(', ')}]
                  </div>
                  <div className="text-[10px] text-slate-600 mt-0.5">[minLon, minLat, maxLon, maxLat]</div>
                </div>
              )}
            </div>
          )}

          {/* View entry metadata (from history) */}
          {viewEntry && !result && (
            <div className="glass-panel rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Eye size={14} className="text-purple-400" />
                  <span className="text-sm font-semibold text-slate-200">Layer Details</span>
                </div>
                <button onClick={() => setViewEntry(null)} className="p-1 rounded text-slate-500 hover:text-slate-300">
                  <X size={14} />
                </button>
              </div>
              <div className="text-xs text-slate-400 font-medium truncate">{viewEntry.filename}</div>
              <div className="grid grid-cols-2 gap-2">
                <MetaCard icon={Layers}    label="Layer Type"  value={fileTypeLabel(viewEntry.result.layer_type)} />
                <MetaCard icon={HardDrive} label="File Size"   value={formatBytes(viewEntry.result.size_bytes)} />
                <MetaCard icon={Map}       label="CRS"         value={viewEntry.result.crs} />
                <MetaCard icon={Database}  label="Status"      value={viewEntry.result.processing_status} />
              </div>
            </div>
          )}

          {/* Upload History */}
          {history.length > 0 && (
            <div className="glass-panel rounded-2xl p-5 space-y-3">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Clock size={12} /> Session History
              </div>
              <div className="space-y-2">
                {history.map(entry => (
                  <HistoryRow key={entry.id} entry={entry} onView={(e) => { setViewEntry(e); setResult(null); }} />
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Pipeline animation keyframe injection */}
      <style>{`
        @keyframes pipeline-bar {
          0%   { width: 0%; margin-left: 0; }
          50%  { width: 70%; margin-left: 15%; }
          100% { width: 0%; margin-left: 100%; }
        }
        .animate-\\[pipeline-bar_1\\.5s_ease-in-out_infinite\\] {
          animation: pipeline-bar 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
