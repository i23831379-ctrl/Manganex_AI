import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ShieldCheck, MapPin } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('demo123');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError('');
    setIsSubmitting(true);

    const success = await login(email);

    if (success) {
      navigate('/app/dashboard', { replace: true });
    } else {
      setError(
        'Invalid credentials. Please use one of the demo accounts.'
      );
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setError('');
    setIsSubmitting(true);

    setEmail(demoEmail);
    setPassword('demo123');

    const success = await login(demoEmail);

    if (success) {
      navigate('/app/dashboard', { replace: true });
    } else {
      setError('Demo login failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4 py-8">

      <div className="w-full max-w-md">

        {/* Logo / Header */}
        <div className="text-center mb-8">

          <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
            <ShieldCheck
              size={34}
              className="text-purple-400"
            />
          </div>

          <h1 className="text-3xl font-bold tracking-tight">
            MANGANEX AI
          </h1>

          <p className="mt-2 text-slate-400">
            AI-Powered Manganese Exploration Platform
          </p>

        </div>

        {/* Login Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8">

          <div className="mb-6">
            <h2 className="text-2xl font-semibold">
              Welcome Back
            </h2>

            <p className="text-sm text-slate-400 mt-1">
              Sign in to access your exploration dashboard.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Email Address
              </label>

              <div className="relative">

                <Mail
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 py-3 pl-10 pr-4 text-white placeholder-slate-600 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 disabled:opacity-50"
                />

              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Password
              </label>

              <div className="relative">

                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 py-3 pl-10 pr-4 text-white placeholder-slate-600 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 disabled:opacity-50"
                />

              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-purple-600 py-3 font-semibold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>

          </form>

          {/* Demo Accounts */}
          <div className="mt-7">

            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-slate-800" />

              <span className="text-xs uppercase tracking-wider text-slate-500">
                Demo Access
              </span>

              <div className="h-px flex-1 bg-slate-800" />
            </div>

            <div className="space-y-3">

              {/* Admin */}
              <button
                type="button"
                onClick={() =>
                  handleDemoLogin('admin@manganex.ai')
                }
                disabled={isSubmitting}
                className="w-full text-left rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 transition hover:border-purple-500/50 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="flex items-center gap-3">

                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <ShieldCheck
                      size={20}
                      className="text-purple-400"
                    />
                  </div>

                  <div>
                    <p className="font-medium text-white">
                      Administrator
                    </p>

                    <p className="text-xs text-slate-500">
                      admin@manganex.ai
                    </p>
                  </div>

                </div>
              </button>

              {/* Geologist */}
              <button
                type="button"
                onClick={() =>
                  handleDemoLogin('geo@manganex.ai')
                }
                disabled={isSubmitting}
                className="w-full text-left rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 transition hover:border-blue-500/50 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="flex items-center gap-3">

                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <MapPin
                      size={20}
                      className="text-blue-400"
                    />
                  </div>

                  <div>
                    <p className="font-medium text-white">
                      Geologist
                    </p>

                    <p className="text-xs text-slate-500">
                      geo@manganex.ai
                    </p>
                  </div>

                </div>
              </button>

            </div>

          </div>

          {/* Demo Information */}
          <div className="mt-6 rounded-lg bg-slate-950 border border-slate-800 p-4">

            <p className="text-xs leading-5 text-slate-500">
              <span className="text-slate-400 font-medium">
                Demo Mode:
              </span>{' '}
              Use one of the demo accounts above to access the
              MANGANEX AI platform.
            </p>

          </div>

        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-600 mt-6">
          MANGANEX AI • AI + GIS Mineral Exploration
        </p>

      </div>

    </div>
  );
}