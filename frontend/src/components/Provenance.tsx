

interface SatelliteScene {
  scene_id: string;
  satellite: string;
  acquisition_date: string;
  cloud_cover: number;
  source: string;
  bounds?: number[];
  study_area?: string;
  preview_url?: string;
  sensor?: string;
}

interface ProvenanceProps {
  scene: SatelliteScene;
  isDemo: boolean;
}

export default function Provenance({ scene, isDemo }: ProvenanceProps) {
  const processing = isDemo ? 'deterministic demo' : scene.source || 'unknown';
  const status = isDemo ? 'Demo dataset' : 'Provider data';
  return (
    <section className="p-4 rounded-md bg-slate-700/20 border border-slate-600 text-slate-200 mb-4">
      <h4 className="text-lg font-medium mb-2">Data Provenance</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
        <p><strong>Source:</strong> {isDemo ? 'DEMO' : scene.source}</p>
        <p><strong>Satellite:</strong> {scene.satellite}</p>
        <p><strong>Scene ID:</strong> {scene.scene_id}</p>
        <p><strong>Acquisition:</strong> {scene.acquisition_date}</p>
        <p><strong>Processing:</strong> {processing}</p>
        <p><strong>Status:</strong> {status}</p>
      </div>
    </section>
  );
}
