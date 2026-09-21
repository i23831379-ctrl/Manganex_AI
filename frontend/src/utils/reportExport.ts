import type { ExplorationTarget } from '../services/api';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface FieldNote {
  targetId: number;
  geologistName: string;
  visitDate: string;
  rockSample: string;
  accessDifficulty: 'easy' | 'moderate' | 'difficult' | 'inaccessible';
  gpsAccuracyM: number;
  observations: string;
  photoFilename: string;
  confidenceDelta: number; // -20 to +20, percentage points adjustment
  submittedAt: string;
}

// ── localStorage helpers ───────────────────────────────────────────────────────

const STORAGE_KEY = 'manganex_field_notes';

export function loadFieldNotes(): Record<number, FieldNote> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveFieldNote(note: FieldNote): void {
  const existing = loadFieldNotes();
  existing[note.targetId] = note;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

// ── CSV Export ─────────────────────────────────────────────────────────────────

function escapeCsv(val: string | number | boolean): string {
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function exportCsv(
  targets: ExplorationTarget[],
  fieldNotes: Record<number, FieldNote> = {}
): void {
  const headers = [
    'Rank',
    'Name',
    'Description',
    'Latitude',
    'Longitude',
    'Prospectivity Score (%)',
    'Category',
    'Verified',
    'Geologist',
    'Visit Date',
    'Access Difficulty',
    'GPS Accuracy (m)',
    'Rock Sample',
    'Field Observations',
    'Confidence Adjustment (%)',
    'Created At',
  ];

  const sorted = [...targets].sort(
    (a, b) => b.prospectivity_score - a.prospectivity_score
  );

  function category(score: number) {
    if (score >= 0.85) return 'High';
    if (score >= 0.7) return 'Medium';
    return 'Low';
  }

  const rows = sorted.map((t, i) => {
    const note = fieldNotes[t.id];
    return [
      i + 1,
      t.name,
      t.description ?? '',
      t.latitude.toFixed(6),
      t.longitude.toFixed(6),
      (t.prospectivity_score * 100).toFixed(2),
      category(t.prospectivity_score),
      t.is_verified ? 'Yes' : 'No',
      note?.geologistName ?? '',
      note?.visitDate ?? '',
      note?.accessDifficulty ?? '',
      note?.gpsAccuracyM ?? '',
      note?.rockSample ?? '',
      note?.observations ?? '',
      note?.confidenceDelta != null ? (note.confidenceDelta >= 0 ? '+' : '') + note.confidenceDelta : '',
      new Date(t.created_at).toLocaleDateString(),
    ].map(escapeCsv);
  });

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `manganex_targets_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ── HTML Report Export ─────────────────────────────────────────────────────────

export function exportHtmlReport(
  targets: ExplorationTarget[],
  fieldNotes: Record<number, FieldNote> = {}
): void {
  const sorted = [...targets].sort(
    (a, b) => b.prospectivity_score - a.prospectivity_score
  );
  const now = new Date();

  function scoreColor(s: number) {
    if (s >= 0.85) return '#10b981';
    if (s >= 0.7) return '#f59e0b';
    return '#ef4444';
  }

  function category(s: number) {
    if (s >= 0.85) return 'High Potential';
    if (s >= 0.7) return 'Medium Potential';
    return 'Low Potential';
  }

  const targetRows = sorted
    .map((t, i) => {
      const note = fieldNotes[t.id];
      const color = scoreColor(t.prospectivity_score);
      return `
      <tr class="${i % 2 === 0 ? 'row-even' : 'row-odd'}">
        <td class="rank">#${i + 1}</td>
        <td>
          <strong>${t.name}</strong>
          ${t.description ? `<br/><small class="desc">${t.description}</small>` : ''}
        </td>
        <td class="mono">${t.latitude.toFixed(4)}°N<br/>${t.longitude.toFixed(4)}°E</td>
        <td style="color:${color};font-weight:700">${(t.prospectivity_score * 100).toFixed(1)}%</td>
        <td><span class="badge" style="background:${color}22;color:${color};border:1px solid ${color}44">${category(t.prospectivity_score)}</span></td>
        <td>${t.is_verified ? '<span class="verified">✓ Verified</span>' : '<span class="pending">○ Pending</span>'}</td>
        <td class="notes-cell">
          ${note
            ? `<strong>${note.geologistName}</strong> · ${note.visitDate}<br/>
               <em>Access:</em> ${note.accessDifficulty} · <em>GPS ±${note.gpsAccuracyM}m</em><br/>
               ${note.observations ? `<span class="obs">${note.observations}</span>` : ''}
               ${note.confidenceDelta !== 0 ? `<br/><em>Confidence adj: ${note.confidenceDelta > 0 ? '+' : ''}${note.confidenceDelta}%</em>` : ''}`
            : '<span class="no-note">No field visit logged</span>'
          }
        </td>
      </tr>`;
    })
    .join('');

  const verifiedCount = targets.filter((t) => t.is_verified).length;
  const avgScore =
    targets.length > 0
      ? targets.reduce((s, t) => s + t.prospectivity_score, 0) / targets.length
      : 0;
  const highCount = targets.filter((t) => t.prospectivity_score >= 0.85).length;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>MANGANEX AI — Exploration Report ${now.toLocaleDateString()}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; color: #1e293b; background: #f8fafc; padding: 40px; }
    @media print { body { padding: 0; background: white; } .no-print { display: none; } }

    header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; border-bottom: 3px solid #7c3aed; padding-bottom: 20px; }
    .logo { font-size: 28px; font-weight: 800; background: linear-gradient(135deg, #7c3aed, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .report-meta { text-align: right; color: #64748b; font-size: 12px; line-height: 1.8; }

    .kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
    .kpi { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .kpi-value { font-size: 28px; font-weight: 800; color: #7c3aed; }
    .kpi-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin-top: 4px; }

    h2 { font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 16px; padding-left: 12px; border-left: 4px solid #7c3aed; }

    table { width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.06); margin-bottom: 32px; font-size: 13px; }
    thead { background: #1e293b; color: #f8fafc; }
    thead th { padding: 12px 14px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; }
    .row-even { background: #ffffff; }
    .row-odd  { background: #f8fafc; }
    td { padding: 12px 14px; vertical-align: top; border-bottom: 1px solid #e2e8f0; }
    .rank { font-weight: 800; color: #cbd5e1; font-size: 16px; }
    .mono { font-family: monospace; font-size: 12px; color: #64748b; }
    .badge { padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; white-space: nowrap; }
    .verified { color: #10b981; font-weight: 600; }
    .pending { color: #f59e0b; font-weight: 600; }
    .notes-cell { font-size: 12px; color: #475569; max-width: 240px; }
    .obs { display: block; margin-top: 4px; font-style: italic; color: #64748b; }
    .no-note { color: #cbd5e1; font-style: italic; }
    .desc { color: #94a3b8; }

    footer { text-align: center; color: #94a3b8; font-size: 11px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
    .disclaimer { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 12px 16px; font-size: 12px; color: #92400e; margin-top: 32px; }

    .print-btn { position: fixed; bottom: 32px; right: 32px; background: #7c3aed; color: white; border: none; border-radius: 12px; padding: 14px 24px; font-size: 14px; font-weight: 600; cursor: pointer; box-shadow: 0 8px 20px rgba(124,58,237,0.4); transition: all 0.2s; }
    .print-btn:hover { background: #6d28d9; transform: translateY(-2px); }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">🖨 Print / Save PDF</button>

  <header>
    <div>
      <div class="logo">MANGANEX AI</div>
      <div style="font-size:13px;color:#64748b;margin-top:6px;">AI-Powered Manganese Prospectivity Mapping</div>
    </div>
    <div class="report-meta">
      <div><strong>Report Generated</strong></div>
      <div>${now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
      <div>${now.toLocaleTimeString()}</div>
      <div style="margin-top:6px;padding:3px 10px;background:#7c3aed22;color:#7c3aed;border-radius:20px;font-size:11px;font-weight:600;display:inline-block">DEMO MODE</div>
    </div>
  </header>

  <div class="kpi-row">
    <div class="kpi"><div class="kpi-value">${targets.length}</div><div class="kpi-label">Total Targets</div></div>
    <div class="kpi"><div class="kpi-value" style="color:#10b981">${highCount}</div><div class="kpi-label">High Potential</div></div>
    <div class="kpi"><div class="kpi-value">${(avgScore * 100).toFixed(1)}%</div><div class="kpi-label">Avg Prospectivity</div></div>
    <div class="kpi"><div class="kpi-value" style="color:#f59e0b">${verifiedCount}</div><div class="kpi-label">Field Verified</div></div>
  </div>

  <h2>Exploration Target Summary</h2>
  <table>
    <thead>
      <tr>
        <th>Rank</th>
        <th>Zone Name</th>
        <th>Coordinates</th>
        <th>Score</th>
        <th>Category</th>
        <th>Status</th>
        <th>Field Notes</th>
      </tr>
    </thead>
    <tbody>${targetRows}</tbody>
  </table>

  <div class="disclaimer">
    ⚠ <strong>Important Disclaimer:</strong> All prospectivity scores and AI predictions are generated by a simulated Random Forest model for demonstration purposes only. These results do NOT constitute proof of actual manganese reserves and must not be used as the sole basis for any exploration or investment decision. Field verification by qualified geologists is mandatory before any commercial activity.
  </div>

  <footer>
    MANGANEX AI · SIH 2026 — Problem Statement SIH26009 · Generated ${now.toISOString()}
  </footer>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
