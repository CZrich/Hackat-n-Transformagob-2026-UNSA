import { Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Building2, GraduationCap, Shield } from 'lucide-react';
import type { User } from '../types';

interface LayoutProps {
  user: User;
  onLogout: () => void;
}

function roleIcon(role: string) {
  switch (role) {
    case 'EGRESADO':
      return <GraduationCap className="w-5 h-5" />;
    case 'EMPLEADOR':
      return <Building2 className="w-5 h-5" />;
    case 'ADMIN':
      return <Shield className="w-5 h-5" />;
    default:
      return null;
  }
}

function roleLabel(role: string) {
  switch (role) {
    case 'EGRESADO':
      return 'Egresado';
    case 'EMPLEADOR':
      return 'Empleador';
    case 'ADMIN':
      return 'Admin UDEG';
    default:
      return role;
  }
}

export default function Layout({ user, onLogout }: LayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-xl font-bold text-unsa-700"
            >
              <Building2 className="w-7 h-7" />
              CONECTA-UNSA
            </button>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {roleIcon(user.role)}
                <span className="hidden sm:inline">{user.name}</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-unsa-100 text-unsa-700">
                  {roleLabel(user.role)}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
          CONECTA-UNSA &copy; {new Date().getFullYear()} &mdash; Universidad Nacional de San Agustín
        </div>
      </footer>
    </div>
  );
}
