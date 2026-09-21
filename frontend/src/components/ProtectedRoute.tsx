import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, type UserRole } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-900 text-slate-200">
        <ShieldAlert size={48} className="text-rose-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-slate-400 mb-6 text-center max-w-md">
          Your role ({user.role}) does not have permission to view this page.
        </p>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors border border-slate-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  return <Outlet />;
}
