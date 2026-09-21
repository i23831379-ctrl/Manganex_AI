import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider } from './context/AuthContext';
import { NotificationsProvider } from './context/NotificationsContext';

import { ProtectedRoute } from './components/ProtectedRoute';
import Layout from './components/Layout';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MapExplorer from './pages/MapExplorer';
import Targets from './pages/Targets';
import Settings from './pages/Settings';

import DataImport from './pages/DataImport';
import FieldNotes from './pages/FieldNotes';
import Reports from './pages/Reports';

import { ToastContainer } from './components/ToastContainer';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NotificationsProvider>
        <AuthProvider>
          <Router>
            <Routes>

              {/* =========================
                  PUBLIC ROUTES
              ========================== */}

              <Route path="/" element={<Landing />} />

              <Route path="/login" element={<Login />} />


              {/* =========================
                  PROTECTED APPLICATION
              ========================== */}

              <Route element={<ProtectedRoute />}>
                <Route path="/app" element={<Layout />}>

                  {/* Default app page */}
                  <Route
                    index
                    element={<Navigate to="dashboard" replace />}
                  />

                  {/* Main pages */}
                  <Route
                    path="dashboard"
                    element={<Dashboard />}
                  />

                  <Route
                    path="maps"
                    element={<MapExplorer />}
                  />

                  <Route
                    path="targets"
                    element={<Targets />}
                  />

                  <Route
                    path="settings"
                    element={<Settings />}
                  />

                  <Route
                    path="reports"
                    element={<Reports />}
                  />

                  <Route
                    path="field-notes"
                    element={<FieldNotes />}
                  />

                  <Route
                    path="data-import"
                    element={<DataImport />}
                  />

                  {/* Unknown /app route */}
                  <Route
                    path="*"
                    element={<Navigate to="dashboard" replace />}
                  />

                </Route>
              </Route>


              {/* =========================
                  GLOBAL FALLBACK
              ========================== */}

              <Route
                path="*"
                element={<Navigate to="/" replace />}
              />

            </Routes>
          </Router>

          <ToastContainer />

        </AuthProvider>
      </NotificationsProvider>
    </QueryClientProvider>
  );
}

export default App;