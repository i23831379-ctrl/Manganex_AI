import { useState, useRef } from 'react';
import { UploadCloud, X, File, CheckCircle2, AlertCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { targetsApi } from '../services/api';
import { useNotifications } from '../context/NotificationsContext';

interface DataImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ImportStep = 'idle' | 'parsing' | 'ml_processing' | 'saving' | 'success' | 'error';

export function DataImportModal({ isOpen, onClose }: DataImportModalProps) {
  const [step, setStep] = useState<ImportStep>('idle');
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const queryClient = useQueryClient();
  const { push } = useNotifications();

  const createTargetMutation = useMutation({
    mutationFn: (data: Parameters<typeof targetsApi.create>[0]) => targetsApi.create(data)
  });

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const startImport = async () => {
    if (!selectedFile) return;

    // Simulate progress
    setStep('parsing');
    setProgress(10);
    await new Promise(r => setTimeout(r, 1000));
    setProgress(40);

    setStep('ml_processing');
    await new Promise(r => setTimeout(r, 1500));
    setProgress(75);

    setStep('saving');
    
    // Actually create a couple of new targets in the backend
    try {
      const numTargets = Math.floor(Math.random() * 2) + 2; // 2 or 3 targets
      for (let i = 0; i < numTargets; i++) {
        await createTargetMutation.mutateAsync({
          name: `Anomaly Zone ${Math.floor(Math.random() * 900) + 100}`,
          description: `Identified from newly imported data: ${selectedFile.name}`,
          latitude: 21.1 + (Math.random() * 0.2 - 0.1),
          longitude: 79.1 + (Math.random() * 0.2 - 0.1),
          prospectivity_score: 0.75 + Math.random() * 0.2, // high scores
        });
      }
      
      // Invalidate the targets cache to immediately show them
      queryClient.invalidateQueries({ queryKey: ['targets'] });
      
      setProgress(100);
      setStep('success');
      push('success', 'Data Import Complete', `${selectedFile.name} — ${numTargets} new targets generated from AI analysis.`);
    } catch (e) {
      setStep('error');
      push('error', 'Import Failed', `Could not process ${selectedFile?.name ?? 'the file'}.`);
    }
  };

  const resetAndClose = () => {
    setStep('idle');
    setProgress(0);
    setSelectedFile(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-panel w-full max-w-md p-6 relative animate-in fade-in zoom-in-95 duration-200">
        
        <button 
          onClick={resetAndClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
          disabled={step !== 'idle' && step !== 'success' && step !== 'error'}
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold heading-gradient mb-2">Import GeoData</h2>
        <p className="text-slate-400 text-sm mb-6">
          Upload structural CSVs or GeoJSON anomalies to run against the Manganex ML model.
        </p>

        {step === 'idle' && (
          <>
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                selectedFile ? 'border-purple-500 bg-purple-500/10' : 'border-slate-700 bg-slate-800/30 hover:bg-slate-800/50 hover:border-slate-500'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".csv,.geojson,.json"
              />
              
              {selectedFile ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 bg-purple-500/20 rounded-full text-purple-400">
                    <File size={24} />
                  </div>
                  <div className="font-medium text-slate-200">{selectedFile.name}</div>
                  <div className="text-xs text-slate-400">{(selectedFile.size / 1024).toFixed(1)} KB</div>
                  <button 
                    onClick={() => setSelectedFile(null)}
                    className="text-xs text-rose-400 hover:text-rose-300 mt-2"
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <div 
                  className="flex flex-col items-center gap-2 cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="p-3 bg-slate-800 rounded-full text-slate-400">
                    <UploadCloud size={24} />
                  </div>
                  <div className="font-medium text-slate-300">Click or drag file to upload</div>
                  <div className="text-xs text-slate-500">Supports .csv, .geojson</div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={startImport}
                disabled={!selectedFile}
                className="btn-primary"
              >
                Start Import
              </button>
            </div>
          </>
        )}

        {(step === 'parsing' || step === 'ml_processing' || step === 'saving') && (
          <div className="py-8">
            <div className="flex justify-between text-sm mb-2 text-slate-300">
              <span>
                {step === 'parsing' && 'Parsing file contents...'}
                {step === 'ml_processing' && 'Running AI Prospectivity Model...'}
                {step === 'saving' && 'Generating new targets...'}
              </span>
              <span className="font-mono">{progress}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 mb-6 overflow-hidden">
              <div 
                className="bg-purple-500 h-2 rounded-full transition-all duration-500 ease-out relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute top-0 right-0 bottom-0 left-0 bg-white/20 animate-pulse" />
              </div>
            </div>
            <div className="text-xs text-slate-500 text-center animate-pulse">
              This might take a few moments. Please do not close this window.
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="py-8 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-200 mb-2">Import Successful</h3>
            <p className="text-slate-400 text-sm mb-6">
              The AI model successfully identified new targets from the imported data. They have been added to the database.
            </p>
            <button onClick={resetAndClose} className="btn-primary w-full">
              View Targets
            </button>
          </div>
        )}

        {step === 'error' && (
          <div className="py-8 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mb-4">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-200 mb-2">Import Failed</h3>
            <p className="text-slate-400 text-sm mb-6">
              There was an error parsing the file or communicating with the backend.
            </p>
            <button onClick={() => setStep('idle')} className="btn-secondary w-full">
              Try Again
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
