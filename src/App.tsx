import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/authStore';

// Layouts
import { DashboardLayout } from './components/layout/DashboardLayout';

// Pages
import { LoginPage } from './pages/auth/LoginPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AgenciesManagement } from './pages/admin/AgenciesManagement';
import { UsersManagement } from './pages/admin/UsersManagement';
import { PlatformReports } from './pages/admin/PlatformReports';
import { AgencyDashboard } from './pages/agency/AgencyDashboard';
import { AgencySettings } from './pages/agency/AgencySettings';
import { AgentManagement } from './pages/agency/AgentManagement';
import { PackageManagement } from './pages/agency/PackageManagement';
import { BookingsManagement } from './pages/agency/BookingsManagement';
import { AgencyNewBooking } from './pages/agency/NewBooking';
import { AgentDashboard } from './pages/agent/AgentDashboard';
import { AvailablePackages } from './pages/agent/AvailablePackages';
import { MyBookings } from './pages/agent/MyBookings';
import { NewBooking } from './pages/agent/NewBooking';
import { ProfileSettings } from './pages/settings/ProfileSettings';
import { WhatsAppPage } from './pages/whatsapp/WhatsAppPage';

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
          <Route path="agencies" element={<AgenciesManagement />} />
          <Route path="users" element={<UsersManagement />} />
          <Route path="reports" element={<PlatformReports />} />
          <Route path="profile" element={<ProfileSettings />} />
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
          <Route path="packages" element={<PackageManagement />} />
          <Route path="bookings" element={<BookingsManagement />} />
          <Route path="new-booking" element={<AgencyNewBooking />} />
          <Route path="agents" element={<AgentManagement />} />
          <Route path="whatsapp" element={<WhatsAppPage />} />
          <Route path="settings" element={<AgencySettings />} />
          <Route path="profile" element={<ProfileSettings />} />
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
          <Route path="packages" element={<AvailablePackages />} />
          <Route path="bookings" element={<MyBookings />} />
          <Route path="new-booking" element={<NewBooking />} />
          <Route path="whatsapp" element={<WhatsAppPage />} />
          <Route path="profile" element={<ProfileSettings />} />
        </Route>

        {/* Default Redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
