import { Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Building2, GraduationCap, Shield } from 'lucide-react';
import type { User } from '../types';
import DemoSimulationDrawer from './DemoSimulationDrawer';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  onLogin: (user: User, token: string) => void;
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

export default function Layout({ user, onLogout, onLogin }: LayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-xl font-black text-red-800"
            >
              <GraduationCap className="w-7 h-7 text-red-700" />
              <span>CONECTA UNSA</span>
            </button>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 bg-gray-50 p-2 rounded-xl border border-gray-100">
                {roleIcon(user.role)}
                <span className="hidden sm:inline">{user.name}</span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-800 border border-red-200/20">
                  {roleLabel(user.role)}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all border border-gray-200"
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
      
      <DemoSimulationDrawer onLogin={onLogin} currentRole={user.role} />

      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-gray-400">
          CONECTA UNSA &copy; {new Date().getFullYear()} &mdash; Universidad Nacional de San Agustín de Arequipa
        </div>
      </footer>
    </div>
  );
}

