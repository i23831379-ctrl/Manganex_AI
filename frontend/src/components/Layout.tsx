import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Target, Settings, Menu, X, LogOut, Upload, ClipboardList, FileText, Database } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { NotificationBell } from './NotificationBell';

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const userInitial = user?.username?.charAt(0).toUpperCase() || 'U';

  const allNavItems = [
    { name: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard, roles: ['admin'] },
    { name: 'Satellite Search', path: '/app/satellite-screening', icon: Database, roles: ['admin', 'geologist'] },
    { name: 'Targets',   path: '/app/targets',   icon: Target,          roles: ['admin', 'geologist'] },
    { name: 'Field Notes', path: '/app/field-notes', icon: ClipboardList, roles: ['admin', 'geologist'] },
    { name: 'Reports',   path: '/app/reports',   icon: FileText,        roles: ['admin'] },
    { name: 'Data Import', path: '/app/data-import', icon: Upload, roles: ['admin'] },
    { name: 'Settings', path: '/app/settings', icon: Settings, roles: ['admin'] },
  ];

  const navItems = allNavItems.filter(item =>
    !user || item.roles.includes(user.role)
  );

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-900 text-slate-50 lg:pl-64">
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar (desktop always visible, mobile slide-over) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 glass-panel m-4 flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-5">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center font-bold text-lg shadow-lg">
              M
            </div>
            <span className="text-xl font-bold tracking-tight heading-gradient">MANGANEX</span>
          </div>
          <div className="flex items-center gap-1">
            <NotificationBell />
            <button
              className="lg:hidden text-slate-400 hover:text-white p-1"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X size={22} />
            </button>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-4 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== '/app/dashboard' && location.pathname.startsWith(item.path));
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-purple-500/20 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)] scale-[1.02]'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 hover:scale-[1.02]'
                }`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <Icon size={20} className={isActive ? 'text-purple-400' : ''} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="mt-auto px-4 pb-4 space-y-3">
          <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20">
            <div className="text-sm font-medium text-purple-300 mb-1">Demo Mode Active</div>
            <div className="text-xs text-slate-400">AI predictions are illustrative only.</div>
          </div>

          {/* User Profile */}
          {user && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-xs font-bold shrink-0">
                  {userInitial}
                </div>
                <div className="truncate">
                  <div className="text-sm font-medium text-slate-200 truncate">{user.username}</div>
                  <div className="text-xs text-slate-500 capitalize">{user.role}</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-700 rounded-lg transition-colors shrink-0"
                title="Log out"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="h-14 flex items-center justify-between px-4 border-b border-slate-800 lg:hidden shrink-0 z-50">
          <button
            className="p-2 text-slate-400 hover:text-white rounded-lg"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <div className="font-bold heading-gradient text-sm tracking-wide">MANGANEX AI</div>
          <div className="flex items-center gap-1">
            <NotificationBell />
            {user && (
              <div className="w-7 h-7 rounded-full bg-purple-500 flex items-center justify-center text-xs font-bold">
                {userInitial}
              </div>
            )}
          </div>
        </header>

        {/* Page content — pb-24 on mobile to clear bottom nav */}
        <div className="flex-1 overflow-auto p-4 pb-24 lg:pb-8 lg:p-8">
          <div className="max-w-7xl mx-auto h-full">
            <Outlet />
          </div>
        </div>
      </main>

      {/* ── Mobile Bottom Navigation Bar ── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex items-stretch bg-slate-900/95 backdrop-blur-xl border-t border-slate-800">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors ${
                isActive ? 'text-purple-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <div className={`p-1.5 rounded-lg transition-colors ${isActive ? 'bg-purple-500/20' : ''}`}>
                <Icon size={18} />
              </div>
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
