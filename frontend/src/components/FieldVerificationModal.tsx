import { useState } from 'react';
import { X, MapPin, Camera, Save, AlertTriangle } from 'lucide-react';
import type { ExplorationTarget } from '../services/api';
import type { FieldNote } from '../utils/reportExport';

interface FieldVerificationModalProps {
  target: ExplorationTarget;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (note: Omit<FieldNote, 'targetId' | 'submittedAt'>) => void;
  isSubmitting?: boolean;
}

export function FieldVerificationModal({ target, isOpen, onClose, onSubmit, isSubmitting }: FieldVerificationModalProps) {
  const [geologistName, setGeologistName] = useState('');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [rockSample, setRockSample] = useState('');
  const [accessDifficulty, setAccessDifficulty] = useState<FieldNote['accessDifficulty']>('moderate');
  const [gpsAccuracy, setGpsAccuracy] = useState('5');
  const [observations, setObservations] = useState('');
  const [confidenceDelta, setConfidenceDelta] = useState('0');
  
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      geologistName,
      visitDate,
      rockSample,
      accessDifficulty,
      gpsAccuracyM: parseInt(gpsAccuracy) || 5,
      observations,
      photoFilename: 'demo-photo.jpg', // mocked for demo
      confidenceDelta: parseInt(confidenceDelta) || 0,
    });
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 z-[70] w-full max-w-md bg-slate-900 border-l border-slate-700 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <MapPin size={18} className="text-purple-400" />
              Log Field Visit
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Verify {target.name} · Score: {(target.prospectivity_score * 100).toFixed(1)}%
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6">
          <form id="field-form" onSubmit={handleSubmit} className="space-y-5">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">Geologist Name <span className="text-rose-400">*</span></label>
                <input 
                  required
                  type="text" 
                  value={geologistName}
                  onChange={e => setGeologistName(e.target.value)}
                  className="form-input text-sm"
                  placeholder="E.g. Dr. A. Sharma"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">Visit Date <span className="text-rose-400">*</span></label>
                <input 
                  required
                  type="date" 
                  value={visitDate}
                  onChange={e => setVisitDate(e.target.value)}
                  className="form-input text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Access Difficulty</label>
              <select 
                value={accessDifficulty}
                onChange={e => setAccessDifficulty(e.target.value as FieldNote['accessDifficulty'])}
                className="form-select text-sm"
              >
                <option value="easy">Easy (Road access)</option>
                <option value="moderate">Moderate (Short hike)</option>
                <option value="difficult">Difficult (Off-trail, steep)</option>
                <option value="inaccessible">Inaccessible</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">GPS Accuracy (±m)</label>
                <input 
                  type="number"
                  min="1" max="100"
                  value={gpsAccuracy}
                  onChange={e => setGpsAccuracy(e.target.value)}
                  className="form-input text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">AI Confidence Adj.</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="range"
                    min="-20" max="20" step="5"
                    value={confidenceDelta}
                    onChange={e => setConfidenceDelta(e.target.value)}
                    className="flex-1 accent-purple-500"
                  />
                  <span className="text-xs font-mono text-slate-300 w-8 text-right">
                    {parseInt(confidenceDelta) > 0 ? '+' : ''}{confidenceDelta}%
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Rock Sample Ref (Optional)</label>
              <input 
                type="text" 
                value={rockSample}
                onChange={e => setRockSample(e.target.value)}
                className="form-input text-sm"
                placeholder="E.g. S-4022-MN"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Field Observations <span className="text-rose-400">*</span></label>
              <textarea 
                required
                rows={4}
                value={observations}
                onChange={e => setObservations(e.target.value)}
                className="form-input text-sm resize-none"
                placeholder="Describe outcroppings, vegetation anomalies, mineralisation signs..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Site Photo</label>
              <div className="border-2 border-dashed border-slate-700 rounded-lg p-4 text-center hover:bg-slate-800/50 transition-colors cursor-pointer group">
                <Camera size={24} className="mx-auto text-slate-500 group-hover:text-purple-400 mb-2 transition-colors" />
                <p className="text-xs text-slate-400">Click to upload photo (Demo)</p>
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-800 bg-slate-900/90 backdrop-blur">
          <div className="flex items-start gap-2 mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Submitting this form will permanently mark <strong>{target.name}</strong> as Verified in the system database.
            </p>
          </div>
          
          <div className="flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg font-medium text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              form="field-form"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 rounded-lg font-medium text-sm text-white bg-purple-600 hover:bg-purple-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(147,51,234,0.3)]"
            >
              {isSubmitting ? 'Saving...' : (
                <>
                  <Save size={16} /> Save & Verify
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </>
  );
}
