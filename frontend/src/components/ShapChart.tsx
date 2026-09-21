import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { ShapFeature } from '../services/api';

interface ShapChartProps {
  features: ShapFeature[];
}

export default function ShapChart({ features }: ShapChartProps) {
  // Sort features by absolute SHAP value for better visual hierarchy
  const sortedFeatures = [...features].sort((a, b) => Math.abs(b.shap_value) - Math.abs(a.shap_value));

  // Format data for recharts
  const data = sortedFeatures.map(f => ({
    name: f.feature_name,
    value: f.shap_value,
    displayValue: f.feature_value
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg shadow-xl">
          <p className="font-semibold text-slate-200">{data.name}</p>
          <p className="text-sm text-slate-400">Value: {data.displayValue}</p>
          <p className={`text-sm font-medium ${data.value >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            Impact: {data.value > 0 ? '+' : ''}{data.value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
          <XAxis type="number" stroke="#94a3b8" />
          <YAxis 
            dataKey="name" 
            type="category" 
            axisLine={false}
            tickLine={false}
            stroke="#94a3b8"
            width={140}
            style={{ fontSize: '11px' }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1e293b' }} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.value >= 0 ? '#34d399' : '#fb7185'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
