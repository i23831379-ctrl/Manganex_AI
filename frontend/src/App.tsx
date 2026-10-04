import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider } from './context/AuthContext';
import { NotificationsProvider } from './context/NotificationsContext';

import { ProtectedRoute } from './components/ProtectedRoute';
import NavBar from './components/NavBar';
import Layout from './components/Layout';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MapExplorer from './pages/MapExplorer';
import Targets from './pages/Targets';
import SatelliteScreening from './pages/SatelliteScreening';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import FieldNotes from './pages/FieldNotes';
import DataImport from './pages/DataImport';

import RemoteSensing from './pages/RemoteSensing';
import FeatureEngineering from './pages/FeatureEngineering';
import Analytics from './pages/Analytics';
import Insights from './pages/Insights';
import Prospectivity from './pages/Prospectivity';

import { ToastContainer } from './components/ToastContainer';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NotificationsProvider>
        <AuthProvider>
          <Router>
            <NavBar />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
               
              {/* Protected Application */}
              <Route element={<ProtectedRoute />}>
                <Route path="/app" element={<Layout />}>
                  {/* Default sub-route */}
                  <Route index element={<Navigate to="dashboard" replace />} />

                  {/* Main pages */}
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="maps" element={<MapExplorer />} />
                  <Route path="targets" element={<Targets />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="satellite-screening" element={<SatelliteScreening />} />
                  <Route path="feature-engineering" element={<FeatureEngineering />} />
<Route path="remote-sensing" element={<RemoteSensing />} />
      <Route path="prospectivity" element={<Prospectivity />} />
<Route path="insights" element={<Insights />} />
<Route path="field-notes" element={<FieldNotes />} />
                  <Route path="data-import" element={<DataImport />} />
                  <Route path="analytics" element={<Analytics />} />


                  {/* Fallback for unknown /app routes */}
                  <Route path="*" element={<Navigate to="dashboard" replace />} />
                </Route>
              </Route>

              {/* Global fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
          <ToastContainer />
        </AuthProvider>
      </NotificationsProvider>
    </QueryClientProvider>
  );
}

export default App;