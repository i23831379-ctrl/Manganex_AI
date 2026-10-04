import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Target, Settings, Upload, ClipboardList, FileText, Database, Layers, BarChart2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Navigation items with role‑based access
const navItems = [
  { name: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard, roles: ['admin'] },
  { name: 'Satellite Search', path: '/app/satellite-screening', icon: Database, roles: ['admin', 'geologist'] },
  { name: 'Targets', path: '/app/targets', icon: Target, roles: ['admin', 'geologist'] },
  { name: 'Field Notes', path: '/app/field-notes', icon: ClipboardList, roles: ['admin', 'geologist'] },
  { name: 'Reports', path: '/app/reports', icon: FileText, roles: ['admin'] },
  { name: 'Data Import', path: '/app/data-import', icon: Upload, roles: ['admin'] },
  { name: 'Settings', path: '/app/settings', icon: Settings, roles: ['admin'] },
  { name: 'Feature Engineering', path: '/app/feature-engineering', icon: Layers, roles: ['admin', 'geologist'] },
  { name: 'Analytics', path: '/app/analytics', icon: BarChart2, roles: ['admin', 'geologist'] },
];

export default function NavBar() {
  const location = useLocation();
  const { user, logout } = useAuth();

  // Filter items based on user role (if user is undefined, show all)
  const filteredItems = navItems.filter(item => !user || item.roles.includes(user.role));

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="fixed top-0 inset-x-0 z-40 flex items-center justify-between px-6 h-16 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-md bg-indigo-600 flex items-center justify-center font-bold text-lg text-white">
          M
        </div>
        <span className="text-xl font-bold text-gray-900">MANGANEX AI</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden lg:flex gap-4 items-center">
          {filteredItems.map(item => {
            const isActive = location.pathname === item.path || (item.path !== '/app/dashboard' && location.pathname.startsWith(item.path));
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-2 px-3 py-2 rounded-md ${isActive ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'}`}
              >
                <Icon size={18} className={isActive ? 'text-indigo-600' : 'text-gray-500'} />
                {item.name}
              </Link>
            );
          })}
        </div>
        {user && (
          <button onClick={handleLogout} className="p-2 text-gray-600 hover:text-red-600">
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}
