import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sliders, X, GraduationCap, Building2, Shield, ArrowRight, Info } from 'lucide-react';
import type { User } from '../types';

interface DemoSimulationDrawerProps {
  onLogin: (user: User, token: string) => void;
  currentRole?: string;
}

interface DemoProfile {
  id: string;
  name: string;
  email: string;
  role: 'EGRESADO' | 'EMPLEADOR' | 'ADMIN';
  carrera?: string;
  skills?: string[];
  telefono?: string;
  description: string;
}

const DEMO_PROFILES: DemoProfile[] = [
  {
    id: 'egresado_juan',
    name: 'Juan Pérez',
    email: 'juan.perez@unsa.edu.pe',
    role: 'EGRESADO',
    carrera: 'Ingeniería de Sistemas',
    skills: ['NestJS', 'TypeScript', 'Kotlin', 'React', 'Node.js'],
    telefono: '958473621',
    description: 'Egresado de Sistemas con competencias en backend y móvil.'
  },
  {
    id: 'egresado_maria',
    name: 'María Alarcón',
    email: 'maria.alarcon@unsa.edu.pe',
    role: 'EGRESADO',
    carrera: 'Contabilidad',
    skills: ['Auditoría', 'NIIF', 'Tributación', 'Excel Avanzado'],
    telefono: '947582910',
    description: 'Egresada de Contabilidad enfocada en tributación y auditoría.'
  },
  {
    id: 'egresado_carlos',
    name: 'Carlos Mendoza',
    email: 'carlos.mendoza@unsa.edu.pe',
    role: 'EGRESADO',
    carrera: 'Ingeniería Civil',
    skills: ['AutoCAD', 'Costos y Presupuestos', 'Gestión de Obras', 'MS Project'],
    telefono: '938475829',
    description: 'Egresado de Civil orientado a la residencia y costos de obra.'
  },
  {
    id: 'empleador_tech',
    name: 'Tech Solutions SAC',
    email: 'reclutamiento@techsolutions.com',
    role: 'EMPLEADOR',
    telefono: '987654321',
    description: 'Empresa de tecnología e innovación laboral.'
  },
  {
    id: 'admin_odeeg',
    name: 'Administrador ODEEG',
    email: 'odeeg@unsa.edu.pe',
    role: 'ADMIN',
    telefono: '955555555',
    description: 'Bolsa de Trabajo y Seguimiento al Egresado UNSA.'
  }
];

export default function DemoSimulationDrawer({ onLogin, currentRole }: DemoSimulationDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleSelectProfile = (profile: DemoProfile) => {
    const mockToken = `mock-token-${profile.email}-${profile.role}`;
    const authUser: User = {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      carrera: profile.carrera,
      telefono: profile.telefono,
      skills: profile.skills
    };
    
    // Save to localStorage
    localStorage.setItem('user', JSON.stringify(authUser));
    localStorage.setItem('token', mockToken);
    
    onLogin(authUser, mockToken);
    setIsOpen(false);
    navigate('/dashboard');
  };

  const getIcon = (role: string) => {
    switch (role) {
      case 'EGRESADO':
        return <GraduationCap className="w-4 h-4 text-red-700" />;
      case 'EMPLEADOR':
        return <Building2 className="w-4 h-4 text-amber-600" />;
      case 'ADMIN':
        return <Shield className="w-4 h-4 text-slate-700" />;
      default:
        return null;
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-gradient-to-r from-red-800 to-amber-800 text-white px-4 py-2.5 rounded-full shadow-2xl hover:scale-105 hover:from-red-900 hover:to-amber-900 transition-all font-semibold text-xs border border-white/20"
      >
        <Sliders className="w-4 h-4" />
        <span>Panel de Simulación</span>
      </button>

      {/* Drawer Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white z-50 shadow-2xl border-l border-gray-100 flex flex-col justify-between transition-transform duration-300 transform ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-red-50 to-white">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-red-800" />
            <h3 className="font-bold text-gray-900 text-sm">Entorno de Simulación</h3>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs text-blue-900 leading-relaxed">
            <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p>
              Esta barra lateral es de uso exclusivo para **presentación y pruebas**. Permite alternar identidades sin cerrar sesión manualmente para verificar cómo cambian los feeds y filtros en tiempo real.
            </p>
          </div>

          <div className="space-y-2.5">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Egresados (Simulación de Carreras)</h4>
            {DEMO_PROFILES.filter(p => p.role === 'EGRESADO').map(profile => (
              <button
                key={profile.id}
                onClick={() => handleSelectProfile(profile)}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-white hover:bg-red-50/20 hover:border-red-200 text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-50 group-hover:bg-red-100 transition-colors">
                    {getIcon(profile.role)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">{profile.name}</p>
                    <p className="text-[10px] text-gray-500 font-semibold">{profile.carrera}</p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:translate-x-0.5 group-hover:text-red-700 transition-all" />
              </button>
            ))}
          </div>

          <div className="space-y-2.5 border-t border-gray-100 pt-4">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Empresa y Moderador</h4>
            {DEMO_PROFILES.filter(p => p.role !== 'EGRESADO').map(profile => (
              <button
                key={profile.id}
                onClick={() => handleSelectProfile(profile)}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-white hover:bg-amber-50/20 hover:border-amber-200 text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${profile.role === 'EMPLEADOR' ? 'bg-amber-50' : 'bg-slate-50'}`}>
                    {getIcon(profile.role)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">{profile.name}</p>
                    <p className="text-[10px] text-gray-500 font-semibold">{profile.role === 'EMPLEADOR' ? 'Empresa' : 'ODEEG Admin'}</p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:translate-x-0.5 group-hover:text-amber-700 transition-all" />
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 text-[10px] text-gray-400 text-center leading-normal">
          <p>CONECTA UNSA Intelimail &mdash; Demo Controller</p>
          <p className="mt-0.5">Rol activo actual: <strong className="text-gray-600 font-bold">{currentRole || 'Ninguno'}</strong></p>
        </div>
      </div>
    </>
  );
}
