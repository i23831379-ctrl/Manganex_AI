import { useQuery } from '@tanstack/react-query';
import { targetsApi } from '../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Cell,
  PieChart,
  Pie,
  Legend,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
} from 'recharts';
import {
  BarChart2,
  BrainCircuit,
  CheckCircle2,
  TrendingUp,
  MapPin,
  Layers,
  Zap,
  Award,
} from 'lucide-react';
import { useMemo } from 'react';
import type { ExplorationTarget } from '../services/api';

// ── Helpers ────────────────────────────────────────────────────────────────────

function scoreColor(score: number) {
  if (score >= 0.85) return '#34d399';
  if (score >= 0.7) return '#fbbf24';
  return '#f87171';
}

// ── Static / Synthetic Data ────────────────────────────────────────────────────

const SHAP_IMPORTANCE = [
  { feature: 'Iron Oxide Index', importance: 0.312, color: '#a78bfa' },
  { feature: 'Clay Minerals',    importance: 0.241, color: '#818cf8' },
  { feature: 'Slope (°)',        importance: 0.189, color: '#60a5fa' },
  { feature: 'Lithology Type',   importance: 0.143, color: '#34d399' },
  { feature: 'Drainage Prox.',   importance: 0.078, color: '#fbbf24' },
  { feature: 'NDVI',             importance: 0.037, color: '#f87171' },
];

const ZONE_DATA = [
  { zone: 'Archean Basement',  count: 6, avgScore: 0.84 },
  { zone: 'Gondwana Sed.',     count: 4, avgScore: 0.71 },
  { zone: 'Deccan Basalt',     count: 3, avgScore: 0.58 },
  { zone: 'Alluvial Deposits', count: 2, avgScore: 0.42 },
];

const ACCURACY_TREND = [
  { run: 'Run 1', accuracy: 0.76, precision: 0.72, recall: 0.69 },
  { run: 'Run 2', accuracy: 0.78, precision: 0.76, recall: 0.73 },
  { run: 'Run 3', accuracy: 0.81, precision: 0.79, recall: 0.77 },
  { run: 'Run 4', accuracy: 0.83, precision: 0.82, recall: 0.80 },
  { run: 'Run 5', accuracy: 0.86, precision: 0.84, recall: 0.83 },
];

const RADAR_DATA = [
  { axis: 'Spectral Sig.', value: 88 },
  { axis: 'Terrain',       value: 72 },
  { axis: 'Geology',       value: 91 },
  { axis: 'Drainage',      value: 65 },
  { axis: 'Vegetation',    value: 54 },
  { axis: 'Structure',     value: 79 },
];

// ── Custom Tooltip ─────────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel p-3 text-xs">
      <p className="text-slate-300 font-semibold mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          <span className="text-slate-400">{p.name}:</span>
          <span className="text-slate-100 font-mono">
            {typeof p.value === 'number' && p.value < 2 ? (p.value * 100).toFixed(1) + '%' : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// ── KPI Card ───────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  trend?: number; // positive = up
}

function KpiCard({ label, value, sub, icon: Icon, color, bg, trend }: KpiCardProps) {
  return (
    <div className="glass-panel p-5 flex items-start gap-4 hover:scale-[1.02] transition-transform duration-200">
      <div className={`${bg} ${color} p-3 rounded-xl shrink-0`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-bold text-slate-50">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
        {trend !== undefined && (
          <p className={`text-xs mt-1 font-medium ${trend >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}% vs baseline
          </p>
        )}
      </div>
    </div>
  );
}

// ── Section Header ─────────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
        <Icon size={18} />
      </div>
      <div>
        <h2 className="text-sm font-semibold text-slate-200">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function Analytics() {
  const { data: targets, isLoading } = useQuery({
    queryKey: ['targets'],
    queryFn: targetsApi.getAll,
  });

  // Derived stats
  const stats = useMemo(() => {
    const ts: ExplorationTarget[] = targets ?? [];
    const total = ts.length;
    const verified = ts.filter((t) => t.is_verified).length;
    const high = ts.filter((t) => t.prospectivity_score >= 0.85).length;
    const avgScore = total > 0 ? ts.reduce((s, t) => s + t.prospectivity_score, 0) / total : 0;
    return { total, verified, high, avgScore };
  }, [targets]);

  // Score distribution histogram (10 buckets)
  const histData = useMemo(() => {
    const ts: ExplorationTarget[] = targets ?? [];
    const buckets = Array.from({ length: 10 }, (_, i) => ({
      bucket: `${(i * 10).toString().padStart(2, '0')}–${((i + 1) * 10).toString().padStart(2, '0')}%`,
      count: 0,
      fill: i >= 8 ? '#34d399' : i >= 7 ? '#fbbf24' : '#60a5fa',
    }));
    ts.forEach((t) => {
      const idx = Math.min(9, Math.floor(t.prospectivity_score * 10));
      buckets[idx].count++;
    });
    return buckets;
  }, [targets]);

  // Tier pie
  const tierData = useMemo(() => {
    const ts: ExplorationTarget[] = targets ?? [];
    const high = ts.filter((t) => t.prospectivity_score >= 0.85).length;
    const med  = ts.filter((t) => t.prospectivity_score >= 0.7 && t.prospectivity_score < 0.85).length;
    const low  = ts.filter((t) => t.prospectivity_score < 0.7).length;
    // Fallback to illustrative values if no data
    return [
      { name: 'High Potential',   value: high || 5,  color: '#34d399' },
      { name: 'Medium Potential', value: med  || 7,  color: '#fbbf24' },
      { name: 'Low Potential',    value: low  || 3,  color: '#f87171' },
    ];
  }, [targets]);

  // Scatter: lat vs score
  const scatterData = useMemo(() => {
    const ts: ExplorationTarget[] = targets ?? [];
    return ts.map((t) => ({ lat: +t.latitude.toFixed(3), score: +(t.prospectivity_score * 100).toFixed(1), name: t.name }));
  }, [targets]);

  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold heading-gradient">Analytics &amp; Insights</h1>
          <p className="text-sm text-slate-500 mt-1">AI model performance, prospectivity distribution &amp; geological breakdown</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 glass-panel px-3 py-2">
          <span className="pulse-dot pulse-dot-green" />
          Demo data · {targets?.length ?? '—'} targets loaded
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Targets"
          value={isLoading ? '—' : stats.total || 15}
          sub="In current database"
          icon={MapPin}
          color="text-purple-400"
          bg="bg-purple-500/10"
          trend={12}
        />
        <KpiCard
          label="Avg. Prospectivity"
          value={isLoading ? '—' : `${(stats.avgScore * 100 || 73.4).toFixed(1)}%`}
          sub="Across all targets"
          icon={TrendingUp}
          color="text-blue-400"
          bg="bg-blue-500/10"
          trend={5}
        />
        <KpiCard
          label="High Potential"
          value={isLoading ? '—' : stats.high || 5}
          sub="Score ≥ 85%"
          icon={Zap}
          color="text-emerald-400"
          bg="bg-emerald-500/10"
          trend={8}
        />
        <KpiCard
          label="Verified Sites"
          value={isLoading ? '—' : stats.verified || 3}
          sub="Field-confirmed"
          icon={CheckCircle2}
          color="text-amber-400"
          bg="bg-amber-500/10"
        />
      </div>

      {/* Row 2: Score distribution + Tier pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Histogram */}
        <div className="glass-panel p-5 lg:col-span-2">
          <SectionHeader icon={BarChart2} title="Prospectivity Score Distribution" subtitle="Frequency histogram across all targets" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={histData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
              <XAxis dataKey="bucket" tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Targets" radius={[4, 4, 0, 0]}>
                {histData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tier Pie */}
        <div className="glass-panel p-5">
          <SectionHeader icon={Layers} title="Tier Classification" subtitle="By prospectivity score" />
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={tierData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {tierData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} fillOpacity={0.9} />
                ))}
              </Pie>
              <Legend
                formatter={(value) => <span className="text-xs text-slate-400">{value}</span>}
              />
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3: SHAP importance + Model accuracy trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* SHAP feature importance */}
        <div className="glass-panel p-5">
          <SectionHeader icon={BrainCircuit} title="SHAP Feature Importance" subtitle="Mean |SHAP| value across all predictions" />
          <div className="space-y-3 mt-2">
            {SHAP_IMPORTANCE.map((item) => (
              <div key={item.feature} className="flex items-center gap-3">
                <span className="text-xs text-slate-400 w-36 shrink-0">{item.feature}</span>
                <div className="flex-1 bg-slate-700/40 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all duration-700"
                    style={{ width: `${item.importance * 100 / 0.312}%`, background: item.color }}
                  />
                </div>
                <span className="text-xs font-mono text-slate-300 w-10 text-right">{(item.importance * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-600 mt-4 italic">Based on simulated Random Forest model — illustrative only.</p>
        </div>

        {/* Model accuracy trend */}
        <div className="glass-panel p-5">
          <SectionHeader icon={Award} title="Model Performance Trend" subtitle="Accuracy, Precision & Recall per training run" />
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={ACCURACY_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
              <XAxis dataKey="run" tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis domain={[0.6, 1]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} tick={{ fill: '#64748b', fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={(v) => <span className="text-xs text-slate-400 capitalize">{v}</span>} />
              <Line type="monotone" dataKey="accuracy"  stroke="#a78bfa" strokeWidth={2} dot={{ r: 4, fill: '#a78bfa' }} name="Accuracy" />
              <Line type="monotone" dataKey="precision" stroke="#60a5fa" strokeWidth={2} dot={{ r: 4, fill: '#60a5fa' }} name="Precision" />
              <Line type="monotone" dataKey="recall"    stroke="#34d399" strokeWidth={2} dot={{ r: 4, fill: '#34d399' }} name="Recall" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 4: Radar + Scatter + Geological zone breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Radar */}
        <div className="glass-panel p-5">
          <SectionHeader icon={Zap} title="Feature Coverage Radar" subtitle="Avg. signal strength per dimension" />
          <ResponsiveContainer width="100%" height={230}>
            <RadarChart data={RADAR_DATA}>
              <PolarGrid stroke="rgba(148,163,184,0.15)" />
              <PolarAngleAxis dataKey="axis" tick={{ fill: '#64748b', fontSize: 10 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} />
              <Radar name="Coverage" dataKey="value" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.25} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Scatter: lat vs score */}
        <div className="glass-panel p-5">
          <SectionHeader icon={MapPin} title="Latitude vs. Score" subtitle="Spatial prospectivity distribution" />
          <ResponsiveContainer width="100%" height={230}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
              <XAxis dataKey="lat" name="Latitude" tick={{ fill: '#64748b', fontSize: 10 }} label={{ value: 'Lat °N', position: 'insideBottom', offset: -4, fill: '#475569', fontSize: 10 }} />
              <YAxis dataKey="score" name="Score (%)" tick={{ fill: '#64748b', fontSize: 10 }} domain={[0, 100]} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0]?.payload;
                return (
                  <div className="glass-panel p-2 text-xs">
                    <p className="font-semibold text-slate-200">{d?.name ?? '—'}</p>
                    <p className="text-slate-400">Lat: {d?.lat}°N · Score: {d?.score}%</p>
                  </div>
                );
              }} />
              <Scatter
                data={scatterData.length ? scatterData : [
                  { lat: 21.12, score: 88, name: 'Zone A' },
                  { lat: 21.25, score: 74, name: 'Zone B' },
                  { lat: 21.38, score: 91, name: 'Zone C' },
                  { lat: 21.19, score: 61, name: 'Zone D' },
                  { lat: 21.45, score: 83, name: 'Zone E' },
                ]}
                fill="#60a5fa"
                fillOpacity={0.8}
              >
                {(scatterData.length ? scatterData : []).map((entry, i) => (
                  <Cell key={i} fill={scoreColor(entry.score / 100)} fillOpacity={0.85} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Geological zone breakdown */}
        <div className="glass-panel p-5">
          <SectionHeader icon={Layers} title="Geological Zones" subtitle="Target distribution by lithology" />
          <div className="space-y-4 mt-2">
            {ZONE_DATA.map((z) => (
              <div key={z.zone}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">{z.zone}</span>
                  <span className="text-slate-500 font-mono">{z.count} targets · avg {(z.avgScore * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-slate-700/40 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-2.5 rounded-full"
                    style={{
                      width: `${(z.count / 6) * 100}%`,
                      background: `linear-gradient(90deg, ${scoreColor(z.avgScore)}, ${scoreColor(z.avgScore)}88)`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Summary mini-table */}
          <div className="mt-5 border-t border-slate-700/30 pt-4 space-y-1">
            {ZONE_DATA.map((z) => (
              <div key={z.zone} className="flex justify-between text-xs text-slate-500">
                <span>{z.zone}</span>
                <span
                  className="font-semibold"
                  style={{ color: scoreColor(z.avgScore) }}
                >
                  {(z.avgScore * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer note */}
      <p className="text-center text-xs text-slate-600 italic">
        ⚠ All predictions are AI-generated prospectivity estimates. Require field verification before any exploration decisions.
      </p>
    </div>
  );
}
