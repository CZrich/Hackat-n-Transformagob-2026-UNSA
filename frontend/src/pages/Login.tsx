import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Building2, Shield, Mail, Lock, Phone, User as UserIcon, AlertCircle, X } from 'lucide-react';
import { CARRERAS } from '../config';
import Button from '../components/ui/Button';
import Card, { CardContent } from '../components/ui/Card';
import DemoSimulationDrawer from '../components/DemoSimulationDrawer';
import type { User } from '../types';

interface LoginProps {
  onLogin: (user: User, token: string) => void;
}

type TabOption = 'LOGIN' | 'REGISTER';
type RoleOption = 'EGRESADO' | 'EMPLEADOR' | 'ADMIN';

export default function Login({ onLogin }: LoginProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabOption>('LOGIN');
  const [selectedRole, setSelectedRole] = useState<RoleOption>('EGRESADO');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Login form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register form fields (Egresado)
  const [egresadoForm, setEgresadoForm] = useState({
    name: '',
    email: '',
    carrera: '' as typeof CARRERAS[number] | '',
    telefono: '',
    password: ''
  });

  // Register form fields (Empresa)
  const [empresaForm, setEmpresaForm] = useState({
    company_name: '',
    ruc: '',
    email: '',
    contact_name: '',
    rubro: '',
    telefono: '',
    password: ''
  });

  // Google Popup Simulator states
  const [showGooglePopup, setShowGooglePopup] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleCarrera, setGoogleCarrera] = useState<typeof CARRERAS[number] | ''>('');
  const [googlePopupError, setGooglePopupError] = useState('');

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Handle standard login form submit
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Por favor, complete todos los campos');
      return;
    }

    const emailClean = email.trim().toLowerCase();

    // Validations based on domain
    if (selectedRole === 'EGRESADO') {
      if (!emailClean.endsWith('@unsa.edu.pe')) {
        setError('Los egresados de la UNSA deben iniciar sesión con su correo institucional (@unsa.edu.pe)');
        return;
      }
    } else {
      // Empresa or Admin: accept any domain
      if (!emailRegex.test(emailClean)) {
        setError('Ingrese un correo electrónico válido');
        return;
      }
    }

    setLoading(true);
    simulateLogin(emailClean, selectedRole);
  };

  // Common simulation logic for login (called by both form and Google popup)
  const simulateLogin = (userEmail: string, role: RoleOption, carreraOverride?: string) => {
    setTimeout(() => {
      let loggedUser: User = {
        id: `user_${Date.now()}`,
        email: userEmail,
        name: role === 'EGRESADO' ? 'Egresado UNSA' : role === 'EMPLEADOR' ? 'Empresa Asociada' : 'Admin ODEEG',
        role: role,
        carrera: role === 'EGRESADO' ? (carreraOverride || CARRERAS[0]) : undefined,
        telefono: '999888777',
        skills: role === 'EGRESADO' ? ['TypeScript', 'React'] : []
      };

      // Match preset demo profiles if email matches
      if (userEmail === 'juan.perez@unsa.edu.pe' && role === 'EGRESADO') {
        loggedUser = {
          id: 'egresado_juan',
          name: 'Juan Pérez',
          email: 'juan.perez@unsa.edu.pe',
          role: 'EGRESADO',
          carrera: 'Ingeniería de Sistemas',
          skills: ['NestJS', 'TypeScript', 'Kotlin', 'React', 'Node.js'],
          telefono: '958473621'
        };
      } else if (userEmail === 'maria.alarcon@unsa.edu.pe' && role === 'EGRESADO') {
        loggedUser = {
          id: 'egresado_maria',
          name: 'María Alarcón',
          email: 'maria.alarcon@unsa.edu.pe',
          role: 'EGRESADO',
          carrera: 'Contabilidad',
          skills: ['Auditoría', 'NIIF', 'Tributación', 'Excel Avanzado'],
          telefono: '947582910'
        };
      } else if (userEmail === 'carlos.mendoza@unsa.edu.pe' && role === 'EGRESADO') {
        loggedUser = {
          id: 'egresado_carlos',
          name: 'Carlos Mendoza',
          email: 'carlos.mendoza@unsa.edu.pe',
          role: 'EGRESADO',
          carrera: 'Ingeniería Civil',
          skills: ['AutoCAD', 'Costos y Presupuestos', 'Gestión de Obras', 'MS Project'],
          telefono: '938475829'
        };
      } else if (userEmail === 'reclutamiento@techsolutions.com' && role === 'EMPLEADOR') {
        loggedUser = {
          id: 'empleador_tech',
          name: 'Tech Solutions SAC',
          email: 'reclutamiento@techsolutions.com',
          role: 'EMPLEADOR',
          telefono: '987654321',
          ruc: '20123456789',
          contact_name: 'Contacto Corporativo',
          rubro: 'Tecnología'
        };
      } else if (userEmail === 'odeeg@unsa.edu.pe' && role === 'ADMIN') {
        loggedUser = {
          id: 'admin_odeeg',
          name: 'Administrador ODEEG',
          email: 'odeeg@unsa.edu.pe',
          role: 'ADMIN',
          telefono: '955555555'
        };
      } else {
        // Look in local registered users
        const localRaw = localStorage.getItem('mock_registered_users') || '[]';
        try {
          const localUsers = JSON.parse(localRaw);
          const found = localUsers.find((u: any) => u.email.toLowerCase() === userEmail && u.role === role);
          if (found) {
            loggedUser = found;
          }
        } catch {}
      }

      const mockToken = `mock-token-${userEmail}-${role}`;
      localStorage.setItem('user', JSON.stringify(loggedUser));
      localStorage.setItem('token', mockToken);
      onLogin(loggedUser, mockToken);
      setLoading(false);
      navigate('/dashboard');
    }, 1000);
  };

  // Handle standard registration form submit
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (selectedRole === 'EGRESADO') {
      const { name, email: regEmail, carrera, telefono, password: regPassword } = egresadoForm;
      const cleanEmail = regEmail.trim().toLowerCase();

      if (!name || !regEmail || !carrera || !telefono || !regPassword) {
        setError('Por favor, complete todos los campos');
        return;
      }
      if (!cleanEmail.endsWith('@unsa.edu.pe')) {
        setError('Los egresados de la UNSA deben registrarse con su correo institucional (@unsa.edu.pe)');
        return;
      }
      if (!/^\d{9}$/.test(telefono.trim())) {
        setError('El número de teléfono debe contener 9 dígitos');
        return;
      }
      if (regPassword.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres');
        return;
      }

      setLoading(true);
      setTimeout(() => {
        const newUser: User = {
          id: `egresado_${Date.now()}`,
          email: cleanEmail,
          name: name.trim(),
          role: 'EGRESADO',
          carrera,
          telefono: telefono.trim(),
          skills: ['TypeScript', 'React'] // generic initial tags
        };

        saveLocalUser(newUser);

        const mockToken = `mock-token-${cleanEmail}-EGRESADO`;
        localStorage.setItem('user', JSON.stringify(newUser));
        localStorage.setItem('token', mockToken);
        onLogin(newUser, mockToken);
        setLoading(false);
        navigate('/dashboard');
      }, 1000);

    } else if (selectedRole === 'EMPLEADOR') {
      const { company_name, ruc, email: regEmail, contact_name, rubro, telefono, password: regPassword } = empresaForm;
      const cleanEmail = regEmail.trim().toLowerCase();

      if (!company_name || !ruc || !regEmail || !contact_name || !rubro || !telefono || !regPassword) {
        setError('Por favor, complete todos los campos');
        return;
      }
      if (!emailRegex.test(cleanEmail)) {
        setError('Ingrese un correo corporativo válido');
        return;
      }
      if (!/^\d{11}$/.test(ruc.trim())) {
        setError('El RUC debe tener exactamente 11 dígitos numéricos');
        return;
      }
      if (!/^\d{9}$/.test(telefono.trim())) {
        setError('El número de teléfono debe tener 9 dígitos');
        return;
      }
      if (regPassword.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres');
        return;
      }

      setLoading(true);
      setTimeout(() => {
        const newUser: User = {
          id: `empresa_${Date.now()}`,
          email: cleanEmail,
          name: company_name.trim(),
          role: 'EMPLEADOR',
          ruc: ruc.trim(),
          contact_name: contact_name.trim(),
          rubro: rubro.trim(),
          telefono: telefono.trim()
        };

        saveLocalUser(newUser);

        const mockToken = `mock-token-${cleanEmail}-EMPLEADOR`;
        localStorage.setItem('user', JSON.stringify(newUser));
        localStorage.setItem('token', mockToken);
        onLogin(newUser, mockToken);
        setLoading(false);
        navigate('/dashboard');
      }, 1000);
    }
  };

  const saveLocalUser = (userToSave: User) => {
    const raw = localStorage.getItem('mock_registered_users') || '[]';
    try {
      const list = JSON.parse(raw);
      list.push(userToSave);
      localStorage.setItem('mock_registered_users', JSON.stringify(list));
    } catch {
      localStorage.setItem('mock_registered_users', JSON.stringify([userToSave]));
    }
  };

  // Google Simulation popup submit
  const handleGooglePopupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGooglePopupError('');

    const cleanEmail = googleEmail.trim().toLowerCase();
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setGooglePopupError('Ingrese un correo electrónico de Google válido');
      return;
    }

    if (selectedRole === 'EGRESADO') {
      if (!cleanEmail.endsWith('@unsa.edu.pe')) {
        setGooglePopupError('Los egresados de la UNSA deben autenticarse con su correo institucional (@unsa.edu.pe)');
        return;
      }
      if (!googleCarrera) {
        setGooglePopupError('Debe seleccionar su carrera profesional');
        return;
      }
    }

    setShowGooglePopup(false);
    setLoading(true);

    // If it's a new register or login via Google
    // Check if user exists. If not, create a shell/new user profile.
    const localRaw = localStorage.getItem('mock_registered_users') || '[]';
    let userExists = false;
    try {
      const localUsers = JSON.parse(localRaw);
      userExists = localUsers.some((u: any) => u.email.toLowerCase() === cleanEmail && u.role === selectedRole);
    } catch {}

    // Predefined emails also count as existing
    if (
      cleanEmail === 'juan.perez@unsa.edu.pe' ||
      cleanEmail === 'maria.alarcon@unsa.edu.pe' ||
      cleanEmail === 'carlos.mendoza@unsa.edu.pe' ||
      cleanEmail === 'reclutamiento@techsolutions.com' ||
      cleanEmail === 'odeeg@unsa.edu.pe'
    ) {
      userExists = true;
    }

    if (!userExists) {
      // Create a shell profile
      let nameFromEmail = cleanEmail.split('@')[0].replace('.', ' ');
      // Capitalize name words
      nameFromEmail = nameFromEmail.replace(/\b\w/g, c => c.toUpperCase());

      const newUser: User = {
        id: `${selectedRole.toLowerCase()}_google_${Date.now()}`,
        email: cleanEmail,
        name: selectedRole === 'EGRESADO' 
          ? nameFromEmail 
          : (selectedRole === 'ADMIN' ? 'Administrador ODEEG' : 'Empresa por Completar'),
        role: selectedRole,
        carrera: selectedRole === 'EGRESADO' ? googleCarrera : undefined,
        // For Empresa, these fields remain blank (incomplete) so the dashboard forces completion!
        ruc: undefined,
        contact_name: undefined,
        rubro: undefined,
        telefono: undefined,
        skills: selectedRole === 'EGRESADO' ? ['TypeScript'] : []
      };

      saveLocalUser(newUser);
      simulateLogin(cleanEmail, selectedRole, googleCarrera);
    } else {
      simulateLogin(cleanEmail, selectedRole);
    }
  };

  const handleEgresadoFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEgresadoForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEmpresaFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEmpresaForm(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-gray-50 font-sans">
      {/* Left Banner: Marketing details */}
      <div className="hidden lg:flex lg:col-span-7 bg-gradient-to-br from-red-950 via-red-900 to-amber-950 text-white flex-col justify-between p-12 relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-800 rounded-full filter blur-3xl opacity-20 transform translate-x-12 -translate-y-12"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-800 rounded-full filter blur-3xl opacity-20 transform -translate-x-12 translate-y-12"></div>

        {/* Branding Header */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
            <GraduationCap className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <span className="font-extrabold tracking-wider text-lg">CONECTA UNSA</span>
            <span className="text-xs block text-amber-300 font-medium tracking-widest uppercase -mt-1">Vinculación Profesional</span>
          </div>
        </div>

        {/* App Pitch */}
        <div className="max-w-xl my-auto relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs text-amber-300 font-semibold tracking-wide">
            ✨ Plataforma Oficial de Empleabilidad
          </div>
          <h1 className="text-5xl font-black tracking-tight leading-none">
            Conectamos el talento de la UNSA con el sector empresarial.
          </h1>
          <p className="text-lg text-gray-300 leading-relaxed">
            Una plataforma inteligente diseñada para reducir el ruido informativo en convocatorias laborales y garantizar la total transparencia en las ofertas salariales.
          </p>

          {/* Pillars */}
          <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/10">
            <div>
              <p className="text-lg font-bold text-amber-400">Match por Competencias</p>
              <p className="text-xs text-gray-400">Notificaciones automáticas basadas exclusivamente en tu perfil profesional y habilidades.</p>
            </div>
            <div>
              <p className="text-lg font-bold text-amber-400">Salario Transparente</p>
              <p className="text-xs text-gray-400">Filtro obligatorio de rangos salariales para erradicar la opacidad laboral.</p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-xs text-gray-400 relative z-10 flex justify-between items-center">
          <span>Universidad Nacional de San Agustín de Arequipa</span>
          <span>Bolsa de Trabajo & Seguimiento del Egresado</span>
        </div>
      </div>

      {/* Right Content: Clean Login / Register Card */}
      <div className="lg:col-span-5 flex flex-col justify-center items-center p-6 sm:p-12 bg-white relative overflow-y-auto">
        <div className="w-full max-w-md space-y-6 py-8">
          
          {/* Header Description */}
          <div className="text-center lg:text-left space-y-2">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Acceso al Portal</h2>
            <p className="text-xs text-gray-500">
              {activeTab === 'LOGIN' 
                ? 'Ingresa tus credenciales para acceder a tu panel de control.'
                : 'Crea tu cuenta corporativa o académica en nuestra red institucional.'}
            </p>
          </div>

          {/* Clean Card containing Tabs and Forms */}
          <Card className="border border-gray-100 shadow-lg overflow-hidden">
            {/* Tabs Selector */}
            <div className="grid grid-cols-2 border-b border-gray-100 bg-gray-50/50">
              <button
                type="button"
                onClick={() => { setActiveTab('LOGIN'); setError(''); }}
                className={`py-3 text-xs font-bold text-center border-b-2 transition-all ${
                  activeTab === 'LOGIN'
                    ? 'border-red-700 text-red-800 bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('REGISTER'); setSelectedRole('EGRESADO'); setError(''); }}
                className={`py-3 text-xs font-bold text-center border-b-2 transition-all ${
                  activeTab === 'REGISTER'
                    ? 'border-red-700 text-red-800 bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Crear Cuenta
              </button>
            </div>

            <CardContent className="p-6">
              {/* Error Alert */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-150 rounded-xl text-red-800 text-xs flex items-start gap-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Roles Toggle */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">
                    Selecciona tu rol de acceso
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => { setSelectedRole('EGRESADO'); setError(''); }}
                      className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center transition-all ${
                        selectedRole === 'EGRESADO'
                          ? 'border-red-600 bg-red-50/50 text-red-800 font-bold'
                          : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      <GraduationCap className="w-5 h-5" />
                      <span className="text-[10px] font-bold">Egresado</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setSelectedRole('EMPLEADOR'); setError(''); }}
                      className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center transition-all ${
                        selectedRole === 'EMPLEADOR'
                          ? 'border-red-600 bg-red-50/50 text-red-800 font-bold'
                          : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      <Building2 className="w-5 h-5" />
                      <span className="text-[10px] font-bold">Empresa</span>
                    </button>

                    {activeTab === 'LOGIN' ? (
                      <button
                        type="button"
                        onClick={() => { setSelectedRole('ADMIN'); setError(''); }}
                        className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center transition-all ${
                          selectedRole === 'ADMIN'
                            ? 'border-red-600 bg-red-50/50 text-red-800 font-bold'
                            : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        <Shield className="w-5 h-5" />
                        <span className="text-[10px] font-bold">Admin UDEG</span>
                      </button>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-gray-50 border border-dashed border-gray-200 text-gray-400">
                        <Lock className="w-4 h-4" />
                        <span className="text-[8px] mt-0.5 leading-none text-center">Admin Privado</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  {/* Form 1: LOGIN */}
                  {activeTab === 'LOGIN' && (
                    <form onSubmit={handleLogin} className="space-y-4">
                      {/* Email Input */}
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-gray-700">
                          {selectedRole === 'EGRESADO' ? 'Correo Institucional UNSA' : 'Correo electrónico'}
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                          <input
                            type="email"
                            placeholder={selectedRole === 'EGRESADO' ? 'ejemplo@unsa.edu.pe' : 'ejemplo@empresa.com'}
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="pl-9 block w-full rounded-xl border border-gray-300 px-3 py-2 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors h-10 bg-white"
                          />
                        </div>
                      </div>

                      {/* Password Input */}
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-gray-700">Contraseña</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                          <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="pl-9 block w-full rounded-xl border border-gray-300 px-3 py-2 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors h-10 bg-white"
                          />
                        </div>
                      </div>

                      <div className="space-y-3 pt-2">
                        <Button
                          type="submit"
                          loading={loading}
                          className="w-full justify-center bg-red-800 hover:bg-red-900 text-white font-bold py-2.5 rounded-xl transition-all shadow-xs text-xs"
                        >
                          Iniciar Sesión
                        </Button>
                        
                        <div className="relative flex py-1 items-center">
                          <div className="flex-grow border-t border-gray-150"></div>
                          <span className="flex-shrink mx-3 text-[10px] text-gray-400 font-semibold uppercase">O CONECTA CON</span>
                          <div className="flex-grow border-t border-gray-150"></div>
                        </div>

                        <button
                          type="button"
                          onClick={() => { setShowGooglePopup(true); setGooglePopupError(''); setGoogleEmail(''); }}
                          className="w-full flex items-center justify-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-2 rounded-xl text-xs transition-colors h-10 shadow-3xs bg-white"
                        >
                          <svg className="w-4 h-4 fill-current mr-1" viewBox="0 0 24 24">
                            <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 6.033 1 12.24 6.033 12.24 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.985 0-.74-.08-1.302-.178-1.86H12.24z"/>
                          </svg>
                          Continuar con Google
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Form 2: REGISTER */}
                  {activeTab === 'REGISTER' && (
                    <div className="space-y-4">
                      {/* Egresado Register Form */}
                      {selectedRole === 'EGRESADO' && (
                        <form onSubmit={handleRegister} className="space-y-3">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre Completo</label>
                            <div className="relative">
                              <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                              <input
                                type="text"
                                name="name"
                                placeholder="Nombres y Apellidos"
                                value={egresadoForm.name}
                                onChange={handleEgresadoFormChange}
                                className="pl-9 block w-full rounded-xl border border-gray-300 px-3 py-2 text-xs shadow-sm focus:outline-none h-10 bg-white"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Correo Institucional (@unsa.edu.pe)</label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                              <input
                                type="email"
                                name="email"
                                placeholder="usuario@unsa.edu.pe"
                                value={egresadoForm.email}
                                onChange={handleEgresadoFormChange}
                                className="pl-9 block w-full rounded-xl border border-gray-300 px-3 py-2 text-xs shadow-sm focus:outline-none h-10 bg-white"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Escuela Profesional (Carrera)</label>
                            <select
                              name="carrera"
                              value={egresadoForm.carrera}
                              onChange={handleEgresadoFormChange}
                              className="block w-full rounded-xl border border-gray-300 px-3 py-2 text-xs shadow-sm focus:outline-none h-10 bg-white"
                            >
                              <option value="">Seleccione su carrera</option>
                              {CARRERAS.map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Celular de Contacto</label>
                            <div className="relative">
                              <Phone className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                              <input
                                type="text"
                                name="telefono"
                                placeholder="999888777"
                                maxLength={9}
                                value={egresadoForm.telefono}
                                onChange={handleEgresadoFormChange}
                                className="pl-9 block w-full rounded-xl border border-gray-300 px-3 py-2 text-xs shadow-sm focus:outline-none h-10 bg-white"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Contraseña</label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                              <input
                                type="password"
                                name="password"
                                placeholder="Mínimo 6 caracteres"
                                value={egresadoForm.password}
                                onChange={handleEgresadoFormChange}
                                className="pl-9 block w-full rounded-xl border border-gray-300 px-3 py-2 text-xs shadow-sm focus:outline-none h-10 bg-white"
                              />
                            </div>
                          </div>

                          <div className="space-y-3 pt-2">
                            <Button
                              type="submit"
                              loading={loading}
                              className="w-full justify-center bg-red-800 hover:bg-red-900 text-white font-bold py-2.5 rounded-xl transition-all shadow-xs text-xs"
                            >
                              Crear Cuenta Egresado
                            </Button>
                            
                            <div className="relative flex py-1 items-center">
                              <div className="flex-grow border-t border-gray-150"></div>
                              <span className="flex-shrink mx-3 text-[10px] text-gray-400 font-semibold uppercase">O</span>
                              <div className="flex-grow border-t border-gray-150"></div>
                            </div>

                            <button
                              type="button"
                              onClick={() => { setShowGooglePopup(true); setGooglePopupError(''); setGoogleEmail(''); }}
                              className="w-full flex items-center justify-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-2 rounded-xl text-xs transition-colors h-10 shadow-3xs bg-white"
                            >
                              <svg className="w-4 h-4 fill-current mr-1" viewBox="0 0 24 24">
                                <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 6.033 1 12.24 6.033 12.24 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.985 0-.74-.08-1.302-.178-1.86H12.24z"/>
                              </svg>
                              Registrarse con Google
                            </button>
                          </div>
                        </form>
                      )}

                      {/* Empresa Register Form */}
                      {selectedRole === 'EMPLEADOR' && (
                        <form onSubmit={handleRegister} className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">Razón Social</label>
                              <input
                                type="text"
                                name="company_name"
                                placeholder="Nombre comercial"
                                value={empresaForm.company_name}
                                onChange={handleEmpresaFormChange}
                                className="block w-full rounded-xl border border-gray-300 px-3 py-2 text-xs shadow-sm focus:outline-none h-10 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">RUC</label>
                              <input
                                type="text"
                                name="ruc"
                                placeholder="11 dígitos"
                                maxLength={11}
                                value={empresaForm.ruc}
                                onChange={handleEmpresaFormChange}
                                className="block w-full rounded-xl border border-gray-300 px-3 py-2 text-xs shadow-sm focus:outline-none h-10 bg-white"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Correo Corporativo de Contacto</label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                              <input
                                type="email"
                                name="email"
                                placeholder="empleo@empresa.com"
                                value={empresaForm.email}
                                onChange={handleEmpresaFormChange}
                                className="pl-9 block w-full rounded-xl border border-gray-300 px-3 py-2 text-xs shadow-sm focus:outline-none h-10 bg-white"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">Contacto Corporativo</label>
                              <input
                                type="text"
                                name="contact_name"
                                placeholder="Nombre completo"
                                value={empresaForm.contact_name}
                                onChange={handleEmpresaFormChange}
                                className="block w-full rounded-xl border border-gray-300 px-3 py-2 text-xs shadow-sm focus:outline-none h-10 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">Rubro Comercial</label>
                              <input
                                type="text"
                                name="rubro"
                                placeholder="Ej: Tecnología, Minería"
                                value={empresaForm.rubro}
                                onChange={handleEmpresaFormChange}
                                className="block w-full rounded-xl border border-gray-300 px-3 py-2 text-xs shadow-sm focus:outline-none h-10 bg-white"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">Teléfono</label>
                              <input
                                type="text"
                                name="telefono"
                                placeholder="999888777"
                                maxLength={9}
                                value={empresaForm.telefono}
                                onChange={handleEmpresaFormChange}
                                className="block w-full rounded-xl border border-gray-300 px-3 py-2 text-xs shadow-sm focus:outline-none h-10 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">Contraseña</label>
                              <input
                                type="password"
                                name="password"
                                placeholder="Mínimo 6 caracteres"
                                value={empresaForm.password}
                                onChange={handleEmpresaFormChange}
                                className="block w-full rounded-xl border border-gray-300 px-3 py-2 text-xs shadow-sm focus:outline-none h-10 bg-white"
                              />
                            </div>
                          </div>

                          <div className="space-y-3 pt-2">
                            <Button
                              type="submit"
                              loading={loading}
                              className="w-full justify-center bg-red-800 hover:bg-red-900 text-white font-bold py-2.5 rounded-xl transition-all shadow-xs text-xs"
                            >
                              Registrar Empresa
                            </Button>
                            
                            <div className="relative flex py-1 items-center">
                              <div className="flex-grow border-t border-gray-150"></div>
                              <span className="flex-shrink mx-3 text-[10px] text-gray-400 font-semibold uppercase">O</span>
                              <div className="flex-grow border-t border-gray-150"></div>
                            </div>

                            <button
                              type="button"
                              onClick={() => { setShowGooglePopup(true); setGooglePopupError(''); setGoogleEmail(''); }}
                              className="w-full flex items-center justify-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-2 rounded-xl text-xs transition-colors h-10 shadow-3xs bg-white"
                            >
                              <svg className="w-4 h-4 fill-current mr-1" viewBox="0 0 24 24">
                                <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 6.033 1 12.24 6.033 12.24 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.985 0-.74-.08-1.302-.178-1.86H12.24z"/>
                              </svg>
                              Registrarse con Google
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Floating simulation drawer fallback on Login screen */}
          <DemoSimulationDrawer onLogin={onLogin} />
        </div>
      </div>

      {/* MOCK GOOGLE LOGIN POPUP DIALOG */}
      {showGooglePopup && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col p-6 space-y-4">
            
            {/* Google Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0112 4.909c1.69 0 3.218.6 4.418 1.582l3.51-3.51C17.746.945 14.99 0 12 0 7.354 0 3.307 2.67 1.342 6.558l3.924 3.207z"/>
                  <path fill="#4285F4" d="M23.49 12.275c0-.825-.075-1.62-.21-2.385H12v4.51h6.46a5.525 5.525 0 01-2.4 3.625l3.725 2.89c2.18-2.01 3.705-4.975 3.705-8.64z"/>
                  <path fill="#FBBC05" d="M5.266 14.235l-3.924 3.207A11.96 11.96 0 0012 24c3.08 0 5.67-1.02 7.56-2.775l-3.725-2.89a7.127 7.127 0 01-3.835 1.015 7.077 7.077 0 01-6.734-4.855z"/>
                  <path fill="#34A853" d="M1.342 6.558A11.977 11.977 0 000 12c0 1.99.49 3.86 1.342 5.442l5.266-4.27v-2.337L1.342 6.558z"/>
                </svg>
                <span className="font-bold text-gray-700 text-sm tracking-tight">Google Accounts</span>
              </div>
              <button 
                onClick={() => setShowGooglePopup(false)}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-50 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <h3 className="font-extrabold text-gray-900 text-base">Inicia sesión con Google</h3>
              <p className="text-[11px] text-gray-500">Elige o escribe una cuenta de Google para continuar con la aplicación.</p>
            </div>

            {/* Error Message inside popup */}
            {googlePopupError && (
              <div className="p-2.5 bg-red-50 border border-red-100 rounded-xl text-[10px] text-red-800 flex items-start gap-1.5 leading-normal">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>{googlePopupError}</span>
              </div>
            )}

            <form onSubmit={handleGooglePopupSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Correo electrónico de Google</label>
                <input
                  type="email"
                  placeholder="ejemplo@unsa.edu.pe o cuenta@gmail.com"
                  value={googleEmail}
                  onChange={e => setGoogleEmail(e.target.value)}
                  className="block w-full rounded-xl border border-gray-300 px-3 py-2 text-xs shadow-sm focus:outline-none h-10 bg-white"
                  required
                />
              </div>

              {/* If registering/login as Egresado, we must ask for Carrera since Google OAuth doesn't have it */}
              {selectedRole === 'EGRESADO' && (
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Tu Carrera Profesional</label>
                  <select
                    value={googleCarrera}
                    onChange={e => setGoogleCarrera(e.target.value as any)}
                    className="block w-full rounded-xl border border-gray-300 px-3 py-2 text-xs shadow-sm focus:outline-none h-10 bg-white"
                    required
                  >
                    <option value="">Selecciona tu carrera</option>
                    {CARRERAS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={() => setShowGooglePopup(false)}
                  className="rounded-xl text-xs py-1.5 px-3"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs py-1.5 px-4 shadow-sm"
                >
                  Iniciar Sesión
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
