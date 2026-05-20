import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import OtpPage from './pages/auth/OtpPage';

import AdminDashboard from './pages/admin/AdminDashboard';
import CreateTestPage from './pages/admin/CreateTestPage';
import ViewTestsPage from './pages/admin/ViewTestsPage';
import SubmissionsPage from './pages/admin/SubmissionsPage';
import UsersPage from './pages/admin/UsersPage';

import UserDashboard from './pages/user/UserDashboard';
import AvailableTestsPage from './pages/user/AvailableTestsPage';
import TakeTestPage from './pages/user/TakeTestPage';
import ResultsPage from './pages/user/ResultsPage';
import ProfilePage from './pages/user/ProfilePage';

function HomeRedirect() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN' || user.role === 'TL' || user.role === 'TR') {
    return <Navigate to="/admin" replace />;
  }
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: '10px',
              background: '#1e293b',
              color: '#fff',
              fontSize: '14px',
            },
          }}
        />
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-otp" element={<OtpPage />} />

          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <RoleProtectedRoute roles={['ADMIN', 'TL', 'TR']}>
                <DashboardLayout />
              </RoleProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="create-test" element={<CreateTestPage />} />
            <Route path="tests" element={<ViewTestsPage />} />
            <Route path="submissions" element={<SubmissionsPage />} />
            <Route path="users" element={<UsersPage />} />
          </Route>

          {/* User routes */}
          <Route
            path="/dashboard"
            element={
              <RoleProtectedRoute roles={['TRAINEE', 'INTERN', 'PPO', 'TL', 'TR']}>
                <DashboardLayout />
              </RoleProtectedRoute>
            }
          >
            <Route index element={<UserDashboard />} />
            <Route path="tests" element={<AvailableTestsPage />} />
            <Route path="tests/:id/take" element={<TakeTestPage />} />
            <Route path="results" element={<ResultsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
