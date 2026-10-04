import axios from 'axios';

// Base URL read from VITE_API_URL or defaults to relative /api
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Global error handling – keep errors for UI to display
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Attach a user‑friendly message if not present
    const msg = error?.response?.data?.detail || error.message || 'API request failed';
    return Promise.reject(new Error(msg));
  }
);

export interface ExplorationTarget {
  id: number;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  prospectivity_score: number;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}
export interface FeatureDefinition {
  feature_id: string;
  name: string;
  category: string;
  required_bands: string[];
  description?: string;
}
export interface ShapFeature {
  feature_name: string;
  feature_value: number;
  shap_value: number;
}

export interface PredictionResponse {
  target_id?: number;
  latitude: number;
  longitude: number;
  prospectivity_score: number;
  base_value: number;
  shap_features: ShapFeature[];
  model_version: string;
}

// Model status response interface
export interface ModelStatus {
  mineral: string;
  status: string;
  metrics?: Record<string, unknown> | null;
  training_date?: string | null;
  feature_list?: string[];
  record_count?: number | null;
}

export const api = {
  // Existing functions...
  // Health check
  health: async () => {
    const response = await apiClient.get('/health');
    return response.data;
  },
  // Targets (base URL already includes /api)
  targets: async () => {
    const response = await apiClient.get<ExplorationTarget[]>('/targets');
    return response.data;
  },
  // Model status (generic)
  modelStatus: async () => {
    const response = await apiClient.get('/manganese/model/status');
    return response.data;
  },
  // Backward compatible alias
  manganeseModelStatus: async () => {
    const response = await apiClient.get('/manganese/model/status');
    return response.data;
  },
  // Prospectivity GeoJSON
  prospectivity: async () => {
    const response = await apiClient.get('/maps/prospectivity');
    return response.data;
  },
  // Prediction POST
  predict: async (payload: any) => {
    const response = await apiClient.post('/ml/predict', payload);
    return response.data;
  },
  // Satellite search
  // Remote Sensing
  getBands: async (payload: any) => {
    const response = await apiClient.post('/remote-sensing/bands', payload);
    return response.data;
  },
  runPreprocess: async (payload: any) => {
    const response = await apiClient.post('/remote-sensing/preprocess', payload);
    return response.data;
  },
  // Satellite search
  searchSatellite: async (payload: any) => {
    const response = await apiClient.post('/satellite/search', payload);
    return response.data;
  },
  // Upload data POST (legacy ML endpoint)
  uploadData: async (payload: { csv_text: string }) => {
    const response = await apiClient.post('/ml/upload-data', payload);
    return response.data;
  },
};

// Feature Engineering API
export const featuresApi = {
  catalog: async (): Promise<FeatureDefinition[]> => {
    const response = await apiClient.get<FeatureDefinition[]>('/features/catalog');
    return response.data;
  },
  calculate: async (payload: any): Promise<any> => {
    const response = await apiClient.post('/features/calculate', payload);
    return response.data;
  },
  fuse: async (payload: any): Promise<any> => {
    const response = await apiClient.post('/features/fuse', payload);
    return response.data;
  },
};


export const targetsApi = {
  getAll: api.targets,
  create: async (data: Omit<ExplorationTarget, 'id' | 'created_at' | 'updated_at' | 'is_verified'>) => {
    const response = await apiClient.post<ExplorationTarget>('/targets', data);
    return response.data;
  },
  verify: async (id: number) => {
    const response = await apiClient.put<ExplorationTarget>(`/targets/${id}/verify`);
    return response.data;
  },
  generate: async () => {
    const response = await apiClient.post<ExplorationTarget[]>('/targets/generate');
    return response.data;
  },
};

export const mlApi = {
  // Predict manganese prospectivity for a single location
  predict: async (latitude: number, longitude: number) => {
    const response = await apiClient.post<PredictionResponse>('/ml/predict', { latitude, longitude });
    return response.data;
  },
  // Retrieve manganese prospectivity collection (GeoJSON)
  manganeseProspectivity: async () => {
    const response = await apiClient.get('/manganese/prospectivity');
    return response.data;
  },
  // Retrieve map-wide prospectivity GeoJSON
  prospectivity: async () => {
    const response = await apiClient.get('/maps/prospectivity');
    return response.data;
  },
  // Model status endpoint
  manganeseModelStatus: async () => {
    const response = await apiClient.get('/manganese/model/status');
    return response.data;
  },
  // Explanation for a specific target (SHAP values)
  getExplanation: async (targetId: number) => {
    const response = await apiClient.get<PredictionResponse>(`/ml/target/${targetId}/explanation`);
    return response.data;
  },
};

// Field Notes API
export const fieldNotesApi = {
  // Get all field notes (admin view)
  getAll: async (): Promise<any[]> => {
    const response = await apiClient.get<any[]>('/field-notes');
    return response.data;
  },
  // Get notes for a specific target
  getByTarget: async (targetId: number): Promise<any[]> => {
    const response = await apiClient.get<any[]>(`/targets/${targetId}/field-notes`);
    return response.data;
  },
  // Create a new field note
  create: async (payload: any): Promise<any> => {
    const response = await apiClient.post<any>('/field-notes/', payload);
    return response.data;
  },
  // Update a field note (partial)
  update: async (noteId: number, payload: any): Promise<any> => {
    const response = await apiClient.patch<any>(`/field-notes/${noteId}`, payload);
    return response.data;
  },
  // Delete a field note
  delete: async (noteId: number): Promise<void> => {
    await apiClient.delete(`/field-notes/${noteId}`);
  },
};

// ─── Maps / Geospatial Layers API ────────────────────────────────────────────

export interface LayerSummary {
  id: number;
  name: string;
  type: string;           // "csv" | "vector" | "raster"
  file_type: string;
  crs: string | null;
  bbox: [number, number, number, number] | null;
  size_bytes: number;
  status: string;
  uploaded_at: string | null;
  row_count: number | null;
  feature_count: number | null;
  width: number | null;
  height: number | null;
  band_count: number | null;
}

export interface LayersResponse {
  layers: LayerSummary[];
  total: number;
}

export interface GeoJSONMeta {
  source_file: string;
  crs: string;
  bbox: [number, number, number, number] | null;
  total_rows?: number;
  valid_features?: number;
  skipped_rows?: number;
  lat_column?: string;
  lon_column?: string;
  feature_count?: number;
  geometry_types?: string[];
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
  _meta?: GeoJSONMeta;
}

export interface GeoJSONFeature {
  type: 'Feature';
  geometry: {
    type: string;
    coordinates: number[] | number[][] | number[][][];
  };
  properties: Record<string, unknown>;
}

export interface LayerDetail extends LayerSummary {
  render_type: 'point_layer' | 'vector_layer' | 'raster_metadata' | 'unknown';
  geojson: GeoJSONFeatureCollection | null;
  render_note?: string;
}

export const mapsApi = {
  getLayers: async (): Promise<LayersResponse> => {
    const response = await apiClient.get<LayersResponse>('/maps/layers');
    return response.data;
  },
  getLayer: async (layerId: number): Promise<LayerDetail> => {
    const response = await apiClient.get<LayerDetail>(`/maps/layers/${layerId}`);
    return response.data;
  },
};

