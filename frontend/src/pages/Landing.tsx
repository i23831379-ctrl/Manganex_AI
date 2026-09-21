import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Map, BrainCircuit, BarChart2, Smartphone,
  ArrowRight, ChevronDown, Zap, Shield, Globe, Layers,
} from 'lucide-react';

// ── Animated particle canvas ────────────────────────────────────────────────
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const PARTICLE_COUNT = 70;
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.5 + 0.1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(139,92,246,${0.12 * (1 - dist / 130)})`;
            ctx.lineWidth = 0.6;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139,92,246,${p.alpha})`;
        ctx.fill();

        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      });

      animFrame = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0"
    />
  );
}

// ── Animated counter ─────────────────────────────────────────────────────────
function AnimatedCounter({ end, suffix = '', duration = 2000 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const startTime = useRef<number | null>(null);

  useEffect(() => {
    const step = (ts: number) => {
      if (!startTime.current) startTime.current = ts;
      const progress = Math.min((ts - startTime.current) / duration, 1);
      // ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    const raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [end, duration]);

  return <>{count.toLocaleString()}{suffix}</>;
}

// ── Feature card ─────────────────────────────────────────────────────────────
function FeatureCard({
  icon: Icon,
  title,
  desc,
  color,
  bg,
  delay,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  color: string;
  bg: string;
  delay: string;
}) {
  return (
    <div
      className="glass-panel p-6 flex flex-col gap-4 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(139,92,246,0.15)] transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
      style={{ animationDelay: delay, animationFillMode: 'both' }}
    >
      <div className={`${bg} ${color} p-3 rounded-xl w-fit`}>
        <Icon size={22} />
      </div>
      <div>
        <h3 className="font-semibold text-slate-100 mb-1">{title}</h3>
        <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

// ── Main Landing Page ─────────────────────────────────────────────────────────
export default function Landing() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const featuresRef = useRef<HTMLElement>(null);

  // If already logged in, skip landing
 useEffect(() => {
  if (user) {
    navigate('/app/dashboard', { replace: true });
  }
}, [user, navigate]);
  const handleEnterPlatform = () => navigate('/login');

  const handleViewDemo = async () => {
    setIsDemoLoading(true);
    const success = await login('admin@manganex.ai');
   if (success) navigate('/app/dashboard', { replace: true });
    else setIsDemoLoading(false);
  };

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 overflow-x-hidden">

      {/* ── Hero Section ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 text-center overflow-hidden">
        <ParticleCanvas />

        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* SIH Badge */}
        <div
          className="relative z-10 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/40 bg-purple-500/10 text-purple-300 text-xs font-medium mb-8 animate-in fade-in slide-in-from-top-4 duration-700"
        >
          <Zap size={12} className="text-purple-400" />
          Smart India Hackathon 2026 · SIH26009
        </div>

        {/* Logo + Title */}
        <div className="relative z-10 animate-in fade-in slide-in-from-bottom-6 duration-700" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
          <div className="flex justify-center mb-6">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center font-black text-4xl shadow-2xl shadow-purple-500/40 ring-1 ring-white/10">
              M
            </div>
          </div>

          <h1 className="text-5xl sm:text-7xl font-black tracking-tight mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-violet-300 to-blue-400">
              MANGANEX
            </span>
            <span className="text-white"> AI</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-3 font-light">
            AI-Powered Manganese Mineral Prospectivity Mapping
          </p>
          <p className="text-sm text-slate-500 max-w-xl mx-auto mb-10">
            Integrating satellite remote sensing, geological intelligence, terrain analysis
            and explainable AI to prioritize exploration targets across Central India.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleEnterPlatform}
              className="group flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold text-base shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-[1.03] transition-all duration-300 active:scale-95"
            >
              Enter Platform
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={handleViewDemo}
              disabled={isDemoLoading}
              className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-base hover:bg-slate-700 hover:border-purple-500/50 hover:scale-[1.03] transition-all duration-300 active:scale-95 disabled:opacity-60"
            >
              {isDemoLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-slate-400 border-t-purple-400 rounded-full animate-spin" />
                  Loading Demo…
                </span>
              ) : (
                <>
                  <Globe size={18} />
                  View Live Demo
                </>
              )}
            </button>
          </div>
        </div>

        {/* Scroll hint */}
        <button
          onClick={scrollToFeatures}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 text-slate-600 hover:text-slate-400 transition-colors animate-bounce"
          aria-label="Scroll to features"
        >
          <span className="text-xs tracking-widest uppercase">Explore</span>
          <ChevronDown size={18} />
        </button>
      </section>

      {/* ── Stats Band ── */}
      <section className="border-y border-slate-800 py-10 px-4 bg-slate-800/30">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { end: 1240, suffix: ' km²', label: 'Area Analyzed' },
            { end: 94,   suffix: '%',    label: 'Model Accuracy' },
            { end: 15,   suffix: '+',    label: 'AI Targets Found' },
            { end: 6,    suffix: '',     label: 'Geological Features' },
          ].map(stat => (
            <div key={stat.label}>
              <div className="text-3xl sm:text-4xl font-black heading-gradient mb-1">
                <AnimatedCounter end={stat.end} suffix={stat.suffix} />
              </div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature Cards ── */}
      <section ref={featuresRef} className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything a geologist needs,{' '}
              <span className="heading-gradient">in one platform</span>
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto text-sm">
              From raw satellite data to field-verified exploration targets — MANGANEX AI
              handles the entire prospectivity analysis workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <FeatureCard
              icon={Map}
              title="GIS Explorer"
              desc="Interactive MapLibre map with geological boundaries, fault lines, prospectivity zones, and geochemical heatmaps."
              color="text-blue-400"
              bg="bg-blue-500/10"
              delay="0ms"
            />
            <FeatureCard
              icon={BrainCircuit}
              title="AI / ML Model"
              desc="Simulated Random Forest classifier producing explainable prospectivity scores with SHAP feature decomposition."
              color="text-purple-400"
              bg="bg-purple-500/10"
              delay="80ms"
            />
            <FeatureCard
              icon={BarChart2}
              title="Analytics Dashboard"
              desc="Six interactive Recharts visualizations: score distributions, tier pie, feature importance, and scatter plots."
              color="text-emerald-400"
              bg="bg-emerald-500/10"
              delay="160ms"
            />
            <FeatureCard
              icon={Smartphone}
              title="Mobile-First"
              desc="Fully responsive with a bottom tab bar for field geologists on phones, and an adaptive layout for tablets."
              color="text-amber-400"
              bg="bg-amber-500/10"
              delay="240ms"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-5">
            <FeatureCard
              icon={Shield}
              title="Role-Based Access"
              desc="Admin and Geologist roles with protected routes — field staff see only what they need."
              color="text-rose-400"
              bg="bg-rose-500/10"
              delay="320ms"
            />
            <FeatureCard
              icon={Layers}
              title="Data Import"
              desc="Drag-and-drop CSV / GeoJSON upload that runs the AI model and creates new targets in the database instantly."
              color="text-cyan-400"
              bg="bg-cyan-500/10"
              delay="400ms"
            />
            <FeatureCard
              icon={Zap}
              title="Activity Feed"
              desc="Real-time toast notifications and a bell feed that logs every verification, import, and prediction event."
              color="text-violet-400"
              bg="bg-violet-500/10"
              delay="480ms"
            />
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-20 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-950/20 to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to explore?
          </h2>
          <p className="text-slate-400 mb-8 text-sm">
            Jump straight into the live demo — no setup required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleViewDemo}
              disabled={isDemoLoading}
              className="group flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold text-base shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-[1.03] transition-all duration-300 active:scale-95 disabled:opacity-60"
            >
              {isDemoLoading ? 'Loading…' : <>Launch Demo <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>}
            </button>
            <button
              onClick={handleEnterPlatform}
              className="px-8 py-3.5 rounded-xl border border-slate-700 text-slate-300 font-semibold text-base hover:border-slate-500 hover:text-white transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-800 py-8 px-4 text-center text-xs text-slate-600">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center font-bold text-[10px]">M</div>
            <span className="font-semibold text-slate-500">MANGANEX AI</span>
          </div>
          <span className="hidden sm:inline text-slate-700">·</span>
          <span>SIH 2026 — Problem Statement SIH26009</span>
          <span className="hidden sm:inline text-slate-700">·</span>
          <span>AI predictions are for decision support only. Field verification required.</span>
        </div>
      </footer>

    </div>
  );
}
