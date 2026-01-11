import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/authStore';

// Layouts
import { DashboardLayout } from './components/layout/DashboardLayout';

// Pages
import { LoginPage } from './pages/auth/LoginPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AgencyDashboard } from './pages/agency/AgencyDashboard';
import { AgentDashboard } from './pages/agent/AgentDashboard';

// Protected Route Component
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: string[];
}> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    if (user.role === 'system_admin') return <Navigate to="/admin" replace />;
    if (user.role === 'agency_admin') return <Navigate to="/agency" replace />;
    return <Navigate to="/agent" replace />;
  }

  return <>{children}</>;
};

// Placeholder pages for additional routes
const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex items-center justify-center h-[60vh]">
    <div className="text-center">
      <h1 className="text-2xl font-bold text-sand-800 mb-2">{title}</h1>
      <p className="text-sand-500">This page is under development</p>
      <p className="text-sand-400 font-bengali text-sm mt-1">এই পেজটি নির্মাণাধীন</p>
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1C1917',
            color: '#FAFAF9',
            borderRadius: '12px',
          },
        }}
      />

      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['system_admin']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="agencies" element={<PlaceholderPage title="Manage Agencies" />} />
          <Route path="users" element={<PlaceholderPage title="Manage Users" />} />
          <Route path="reports" element={<PlaceholderPage title="Platform Reports" />} />
        </Route>

        {/* Agency Routes */}
        <Route
          path="/agency"
          element={
            <ProtectedRoute allowedRoles={['agency_admin']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AgencyDashboard />} />
          <Route path="packages" element={<PlaceholderPage title="Manage Packages" />} />
          <Route path="bookings" element={<PlaceholderPage title="All Bookings" />} />
          <Route path="agents" element={<PlaceholderPage title="Manage Agents" />} />
          <Route path="messages" element={<PlaceholderPage title="Messaging Hub" />} />
        </Route>

        {/* Agent Routes */}
        <Route
          path="/agent"
          element={
            <ProtectedRoute allowedRoles={['sales_agent']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AgentDashboard />} />
          <Route path="packages" element={<PlaceholderPage title="Available Packages" />} />
          <Route path="bookings" element={<PlaceholderPage title="My Bookings" />} />
          <Route path="new-booking" element={<PlaceholderPage title="Create New Booking" />} />
        </Route>

        {/* Default Redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
