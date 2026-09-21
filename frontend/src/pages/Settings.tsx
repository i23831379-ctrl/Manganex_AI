import {
  Save,
  Bell,
  Shield,
  Database,
  Cpu,
  CheckCircle,
  Info,
  Globe,
  FlaskConical,
  Layers,
  Lock,
  Mail,
  Smartphone,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { useState, useCallback } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────
type TabId = 'model' | 'data' | 'notifications' | 'security';

interface TabDef {
  id: TabId;
  label: string;
  icon: React.ElementType;
}

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function Toggle({ checked, onChange, disabled = false }: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
        checked ? 'bg-purple-500' : 'bg-slate-700'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg transition-transform duration-300 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

interface SettingRowProps {
  label: string;
  description: string;
  children: React.ReactNode;
}
function SettingRow({ label, description, children }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-slate-800/40 border border-slate-700/40 hover:bg-slate-800/60 transition-colors duration-200">
      <div className="min-w-0">
        <div className="text-sm font-medium text-slate-200">{label}</div>
        <div className="text-xs text-slate-500 mt-0.5">{description}</div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

// ─── Panel: Model Configuration ───────────────────────────────────────────────
function ModelPanel() {
  const [modelVersion, setModelVersion] = useState('rf_v1_stable');
  const [threshold, setThreshold] = useState(65);
  const [explainability, setExplainability] = useState(true);
  const [ensembleMode, setEnsembleMode] = useState(false);
  const [autoRetrain, setAutoRetrain] = useState(false);

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6">
        <h2 className="text-base font-semibold text-slate-100 mb-1 flex items-center gap-2">
          <FlaskConical size={16} className="text-purple-400" />
          ML Prospectivity Model
        </h2>
        <p className="text-xs text-slate-500 mb-5">
          Select the active model used for prospectivity scoring and target generation.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">
              Active Model Version
            </label>
            <div className="relative">
              <select
                value={modelVersion}
                onChange={(e) => setModelVersion(e.target.value)}
                className="form-select pr-10 cursor-pointer"
              >
                <option value="rf_v1_stable">Random Forest v1.0 — Stable</option>
                <option value="xgb_v2_beta">XGBoost v2.1 — Beta (Experimental)</option>
                <option value="ensemble">Ensemble Default (RF + XGB)</option>
              </select>
              <ChevronRight
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none rotate-90"
              />
            </div>
            {modelVersion === 'xgb_v2_beta' && (
              <div className="mt-2 flex items-start gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                Experimental model — predictions may be less reliable for new geological regions.
              </div>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Confidence Threshold
              </label>
              <span className="font-mono text-sm font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md">
                {threshold}%
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Targets with a prospectivity score below this threshold are automatically filtered out.
            </p>
            <input
              type="range"
              min={10}
              max={95}
              step={5}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer accent-purple-500"
              style={{
                background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${((threshold - 10) / 85) * 100}%, #334155 ${((threshold - 10) / 85) * 100}%, #334155 100%)`,
              }}
            />
            <div className="flex justify-between text-xs text-slate-600 mt-1">
              <span>10%</span>
              <span>95%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel p-6">
        <h2 className="text-base font-semibold text-slate-100 mb-1 flex items-center gap-2">
          <Cpu size={16} className="text-blue-400" />
          Advanced Options
        </h2>
        <p className="text-xs text-slate-500 mb-5">Fine-tune model behaviour and pipeline features.</p>

        <div className="space-y-3">
          <SettingRow
            label="Generate SHAP Explanations"
            description="Compute SHAP values to explain each prediction. Slightly increases latency."
          >
            <Toggle checked={explainability} onChange={setExplainability} />
          </SettingRow>
          <SettingRow
            label="Ensemble Mode"
            description="Combine outputs from multiple models for improved accuracy."
          >
            <Toggle checked={ensembleMode} onChange={setEnsembleMode} />
          </SettingRow>
          <SettingRow
            label="Auto-Retrain on Verification"
            description="Trigger background model improvement when field verifications are submitted."
          >
            <Toggle checked={autoRetrain} onChange={setAutoRetrain} disabled />
          </SettingRow>
          <p className="text-xs text-slate-600 pl-1">
            Auto-retrain is disabled in Demo Mode.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Panel: Data Sources ──────────────────────────────────────────────────────
function DataPanel() {
  const [satelliteSource, setSatelliteSource] = useState('sentinel2');
  const [geologicalDb, setGeologicalDb] = useState('gsida_v2');
  const [demSource, setDemSource] = useState('srtm30m');
  const [cacheEnabled, setCacheEnabled] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1800);
  }, []);

  const sourceStatus = [
    { label: 'Sentinel-2 Multispectral', status: 'connected', latency: '~120ms' },
    { label: 'GSI Geological Database', status: 'connected', latency: '~45ms' },
    { label: 'SRTM Digital Elevation', status: 'connected', latency: '~30ms' },
    { label: 'ASTER GDEM v3', status: 'idle', latency: '—' },
  ];

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6">
        <h2 className="text-base font-semibold text-slate-100 mb-1 flex items-center gap-2">
          <Globe size={16} className="text-blue-400" />
          Remote Sensing Sources
        </h2>
        <p className="text-xs text-slate-500 mb-5">
          Configure satellite imagery and terrain data providers.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">
              Multispectral Imagery
            </label>
            <div className="relative">
              <select
                value={satelliteSource}
                onChange={(e) => setSatelliteSource(e.target.value)}
                className="form-select pr-10"
              >
                <option value="sentinel2">Sentinel-2 (ESA Copernicus)</option>
                <option value="landsat8">Landsat 8 / 9 (USGS)</option>
                <option value="aster">ASTER (NASA/METI)</option>
              </select>
              <ChevronRight size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none rotate-90" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">
              Geological Database
            </label>
            <div className="relative">
              <select value={geologicalDb} onChange={(e) => setGeologicalDb(e.target.value)} className="form-select pr-10">
                <option value="gsida_v2">GSI — Geological Survey of India (v2)</option>
                <option value="bhukosh">Bhukosh National Geological Repository</option>
                <option value="onegeology">OneGeology International</option>
              </select>
              <ChevronRight size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none rotate-90" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">
              Digital Elevation Model (DEM)
            </label>
            <div className="relative">
              <select value={demSource} onChange={(e) => setDemSource(e.target.value)} className="form-select pr-10">
                <option value="srtm30m">SRTM 30m (NASA)</option>
                <option value="astergdem3">ASTER GDEM v3 (30m)</option>
                <option value="copernicus">Copernicus DEM (30m)</option>
              </select>
              <ChevronRight size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none rotate-90" />
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <Layers size={16} className="text-emerald-400" />
              Source Connection Status
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Live status of connected data providers.</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        <div className="space-y-2">
          {sourceStatus.map((src) => (
            <div key={src.label} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
              <div className="flex items-center gap-3">
                <span className={`pulse-dot ${src.status === 'connected' ? 'pulse-dot-green' : 'pulse-dot-yellow'}`} />
                <span className="text-sm text-slate-300">{src.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-slate-500">{src.latency}</span>
                <span className={`badge text-xs ${src.status === 'connected' ? 'badge-success' : 'badge-warning'}`}>
                  {src.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-700/40">
          <SettingRow
            label="Enable Response Caching"
            description="Cache API responses locally to reduce latency and external API calls."
          >
            <Toggle checked={cacheEnabled} onChange={setCacheEnabled} />
          </SettingRow>
        </div>
      </div>
    </div>
  );
}

// ─── Panel: Notifications ─────────────────────────────────────────────────────
function NotificationsPanel() {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [highConfidenceOnly, setHighConfidenceOnly] = useState(true);
  const [verificationAlerts, setVerificationAlerts] = useState(true);
  const [reportDigest, setReportDigest] = useState(false);
  const [digestFreq, setDigestFreq] = useState('weekly');

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6">
        <h2 className="text-base font-semibold text-slate-100 mb-1 flex items-center gap-2">
          <Mail size={16} className="text-blue-400" />
          Alert Channels
        </h2>
        <p className="text-xs text-slate-500 mb-5">
          Choose how you receive notifications about new targets and system events.
        </p>

        <div className="space-y-3">
          <SettingRow label="Email Alerts" description="Receive critical alerts to your registered email address.">
            <Toggle checked={emailAlerts} onChange={setEmailAlerts} />
          </SettingRow>
          <SettingRow label="SMS Alerts" description="Get high-priority alerts via text message. (Requires phone number)">
            <Toggle checked={smsAlerts} onChange={setSmsAlerts} />
          </SettingRow>
          {smsAlerts && (
            <div className="px-1">
              <input
                type="tel"
                placeholder="+91 98765 43210"
                className="form-input text-sm"
              />
            </div>
          )}
        </div>
      </div>

      <div className="glass-panel p-6">
        <h2 className="text-base font-semibold text-slate-100 mb-1 flex items-center gap-2">
          <Smartphone size={16} className="text-purple-400" />
          Notification Triggers
        </h2>
        <p className="text-xs text-slate-500 mb-5">
          Control which events trigger alerts.
        </p>

        <div className="space-y-3">
          <SettingRow
            label="High-Confidence Targets Only"
            description="Only notify for targets with prospectivity >= 80%."
          >
            <Toggle checked={highConfidenceOnly} onChange={setHighConfidenceOnly} />
          </SettingRow>
          <SettingRow
            label="Field Verification Updates"
            description="Receive alerts when a geologist submits a field verification."
          >
            <Toggle checked={verificationAlerts} onChange={setVerificationAlerts} />
          </SettingRow>
          <SettingRow
            label="Weekly Report Digest"
            description="Receive a summary of exploration activity and new targets."
          >
            <Toggle checked={reportDigest} onChange={setReportDigest} />
          </SettingRow>

          {reportDigest && (
            <div className="px-1">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-2">Digest Frequency</label>
              <div className="relative">
                <select
                  value={digestFreq}
                  onChange={(e) => setDigestFreq(e.target.value)}
                  className="form-select pr-10 text-sm"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                </select>
                <ChevronRight size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none rotate-90" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Panel: Security ──────────────────────────────────────────────────────────
function SecurityPanel() {
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [auditLog, setAuditLog] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState('8h');
  const [ipAllowlist, setIpAllowlist] = useState(false);

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6">
        <h2 className="text-base font-semibold text-slate-100 mb-1 flex items-center gap-2">
          <Lock size={16} className="text-emerald-400" />
          Authentication
        </h2>
        <p className="text-xs text-slate-500 mb-5">
          Manage access control and session security settings.
        </p>

        <div className="space-y-3">
          <SettingRow label="Multi-Factor Authentication" description="Add an extra layer of security with TOTP or hardware keys.">
            <Toggle checked={mfaEnabled} onChange={setMfaEnabled} />
          </SettingRow>

          {mfaEnabled && (
            <div className="px-1 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-center">
              <CheckCircle size={20} className="text-emerald-400 mx-auto mb-1" />
              <p className="text-xs text-emerald-400">MFA enabled. Scan QR code in your authenticator app to configure.</p>
              <button className="mt-2 text-xs text-purple-400 flex items-center gap-1 mx-auto hover:text-purple-300 transition-colors">
                View QR Code <ExternalLink size={12} />
              </button>
            </div>
          )}

          <div className="pt-1">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-2">Session Timeout</label>
            <div className="relative">
              <select
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(e.target.value)}
                className="form-select pr-10 text-sm"
              >
                <option value="1h">1 hour</option>
                <option value="4h">4 hours</option>
                <option value="8h">8 hours (Default)</option>
                <option value="24h">24 hours</option>
                <option value="never">Never (Not recommended)</option>
              </select>
              <ChevronRight size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none rotate-90" />
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel p-6">
        <h2 className="text-base font-semibold text-slate-100 mb-1 flex items-center gap-2">
          <Shield size={16} className="text-amber-400" />
          Access &amp; Audit
        </h2>
        <p className="text-xs text-slate-500 mb-5">
          Control who can access this platform and how activity is logged.
        </p>

        <div className="space-y-3">
          <SettingRow label="Activity Audit Log" description="Record all user actions, predictions, and verifications.">
            <Toggle checked={auditLog} onChange={setAuditLog} />
          </SettingRow>
          <SettingRow label="IP Allowlist" description="Restrict access to a predefined list of trusted IP addresses.">
            <Toggle checked={ipAllowlist} onChange={setIpAllowlist} />
          </SettingRow>

          {ipAllowlist && (
            <div className="px-1">
              <textarea
                rows={3}
                placeholder={"192.168.1.0/24\n10.0.0.1\n203.0.113.0/28"}
                className="form-input text-sm font-mono resize-none"
              />
              <p className="text-xs text-slate-600 mt-1">One IP or CIDR range per line.</p>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-700/40">
          <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15 flex gap-3">
            <Info size={16} className="text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs text-slate-400">
              In <span className="text-amber-300 font-medium">Demo Mode</span>, authentication settings are informational only and do not affect access control.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── About Banner ─────────────────────────────────────────────────────────────
function AboutBanner() {
  return (
    <div className="glass-panel p-5 flex items-center gap-4 border-purple-500/20">
      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center font-black text-xl shadow-lg shadow-purple-500/30 shrink-0">
        M
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-slate-100 text-sm">MANGANEX AI — Demo v1.0.0</div>
        <div className="text-xs text-slate-500 mt-0.5 truncate">
          SIH 2026 &middot; Problem Statement SIH26009 &middot; AI-Powered Manganese Prospectivity Mapping
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="pulse-dot pulse-dot-green" />
        <span className="text-xs text-emerald-400 font-medium">Demo Active</span>
      </div>
    </div>
  );
}

// ─── Main Settings Component ──────────────────────────────────────────────────
const TABS: TabDef[] = [
  { id: 'model', label: 'Model Config', icon: Cpu },
  { id: 'data', label: 'Data Sources', icon: Database },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState<TabId>('model');
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSavedAt(new Date());
    }, 1200);
  };

  return (
    <div className="max-w-4xl space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold heading-gradient mb-1">Platform Settings</h1>
        <p className="text-slate-400 text-sm">
          Configure workspace preferences, machine learning models, data sources, and security.
        </p>
      </div>

      <AboutBanner />

      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
        {/* Sidebar tabs */}
        <nav className="space-y-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-purple-500/15 text-purple-300 border border-purple-500/25 shadow-[0_0_12px_rgba(168,85,247,0.15)]'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-purple-400' : ''} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Panel content */}
        <div className="min-w-0">
          <div key={activeTab} className="animate-in fade-in slide-in-from-right-2 duration-300">
            {activeTab === 'model' && <ModelPanel />}
            {activeTab === 'data' && <DataPanel />}
            {activeTab === 'notifications' && <NotificationsPanel />}
            {activeTab === 'security' && <SecurityPanel />}
          </div>

          {/* Footer actions */}
          <div className="mt-6 flex items-center justify-between">
            <div className="text-xs text-slate-600">
              {savedAt && (
                <span className="flex items-center gap-1.5 text-emerald-500">
                  <CheckCircle size={13} />
                  Saved at {savedAt.toLocaleTimeString()}
                </span>
              )}
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn-primary flex items-center gap-2"
            >
              <Save size={15} className={isSaving ? 'animate-pulse' : ''} />
              {isSaving ? 'Saving\u2026' : 'Save Preferences'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
