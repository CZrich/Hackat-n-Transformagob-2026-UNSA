import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import DashboardEgresado from './pages/DashboardEgresado';
import DashboardEmpleador from './pages/DashboardEmpleador';
import DashboardAdmin from './pages/DashboardAdmin';

export default function App() {
  const { user, loading, login, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-10 w-10 border-4 border-unsa-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login onLogin={login} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout user={user} onLogout={logout} onLogin={login} />}>
          <Route
            element={
              <ProtectedRoute allowedRoles={['EGRESADO', 'EMPLEADOR', 'ADMIN']} userRole={user.role} />
            }
          >
            <Route
              path="/dashboard"
              element={
                user.role === 'EGRESADO' ? (
                  <DashboardEgresado user={user} />
                ) : user.role === 'EMPLEADOR' ? (
                  <DashboardEmpleador user={user} />
                ) : (
                  <DashboardAdmin />
                )
              }
            />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['EGRESADO']} userRole={user.role} />}>
            <Route path="/egresado" element={<DashboardEgresado user={user} />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['EMPLEADOR']} userRole={user.role} />}>
            <Route path="/empleador" element={<DashboardEmpleador user={user} />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} userRole={user.role} />}>
            <Route path="/admin" element={<DashboardAdmin />} />
          </Route>
        </Route>

        <Route path="/login" element={<Login onLogin={login} />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
