import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { GraduationCap, Building2, Shield, Mail, Lock, Phone, User as UserIcon, AlertCircle, X } from 'lucide-react';
import { CARRERAS, GOOGLE_CLIENT_ID } from '../config';
import { api } from '../services/api';
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

  const handleGoogleSuccess = useCallback(async (tokenResponse: any) => {
    const idToken = tokenResponse.id_token || tokenResponse.access_token;
    if (!idToken) {
      setError('No se recibió el token de Google');
      return;
    }
    setLoading(true);
    try {
      const result = await api.auth.googleLogin(idToken);
      localStorage.setItem('user', JSON.stringify(result.user));
      localStorage.setItem('token', result.token);
      onLogin(result.user, result.token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error al autenticar con Google');
    } finally {
      setLoading(false);
    }
  }, [onLogin, navigate]);

  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => setError('Error al iniciar sesión con Google'),
    scope: 'openid email profile',
  });

  const handleGoogleClick = () => {
    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.includes('dummy') || GOOGLE_CLIENT_ID === '') {
      setShowGooglePopup(true);
      setGooglePopupError('');
      setGoogleEmail('');
      setGoogleCarrera('');
    } else {
      try {
        googleLogin();
      } catch (err) {
        setShowGooglePopup(true);
        setGooglePopupError('');
        setGoogleEmail('');
        setGoogleCarrera('');
      }
    }
  };

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
    simulateGoogleLogin(cleanEmail, selectedRole, googleCarrera);
  };

  const simulateGoogleLogin = (cleanEmail: string, role: RoleOption, carreraOverride?: string) => {
    setTimeout(() => {
      const localRaw = localStorage.getItem('mock_registered_users') || '[]';
      let userExists = false;
      let loggedUser: User | null = null;
      try {
        const localUsers = JSON.parse(localRaw);
        loggedUser = localUsers.find((u: any) => u.email.toLowerCase() === cleanEmail && u.role === role);
        if (loggedUser) userExists = true;
      } catch {}

      if (!userExists) {
        let nameFromEmail = cleanEmail.split('@')[0].replace('.', ' ');
        nameFromEmail = nameFromEmail.replace(/\b\w/g, c => c.toUpperCase());

        loggedUser = {
          id: `${role.toLowerCase()}_google_${Date.now()}`,
          email: cleanEmail,
          name: role === 'EGRESADO' 
            ? nameFromEmail 
            : (role === 'ADMIN' ? 'Administrador ODEEG' : 'Empresa por Completar'),
          role: role,
          carrera: role === 'EGRESADO' ? (carreraOverride || CARRERAS[0]) : undefined,
          ruc: undefined,
          contact_name: undefined,
          rubro: undefined,
          telefono: undefined,
          es_verificada: false,
          es_baneada: false
        };

        try {
          const list = JSON.parse(localRaw);
          list.push(loggedUser);
          localStorage.setItem('mock_registered_users', JSON.stringify(list));
        } catch {}
      }

      const mockToken = `mock-token-${cleanEmail}-${role}`;
      localStorage.setItem('user', JSON.stringify(loggedUser));
      localStorage.setItem('token', mockToken);
      onLogin(loggedUser!, mockToken);
      setLoading(false);
      navigate('/dashboard');
    }, 1000);
  };





  // Handle standard login form submit
  const handleLogin = async (e: React.FormEvent) => {
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
      if (!emailRegex.test(emailClean)) {
        setError('Ingrese un correo electrónico válido');
        return;
      }
    }

    setLoading(true);
    try {
      const result = await api.auth.login(emailClean, password);
      localStorage.setItem('user', JSON.stringify(result.user));
      localStorage.setItem('token', result.token);
      onLogin(result.user, result.token);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('API Error:', err);
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  // Handle standard registration form submit
  const handleRegister = async (e: React.FormEvent) => {
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
      try {
        const result = await api.auth.register({
          email: cleanEmail,
          password: regPassword,
          name: name.trim(),
          role: 'EGRESADO',
          carrera,
          telefono: telefono.trim(),
        });
        localStorage.setItem('user', JSON.stringify(result.user));
        localStorage.setItem('token', result.token);
        onLogin(result.user, result.token);
        navigate('/dashboard');
      } catch (err: any) {
        console.error('API Error:', err);
        setError(err.message || 'Error al registrar usuario');
      } finally {
        setLoading(false);
      }

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
      try {
        const result = await api.auth.register({
          email: cleanEmail,
          password: regPassword,
          name: company_name.trim(),
          role: 'EMPLEADOR',
          telefono: telefono.trim(),
          ruc: ruc.trim(),
          contact_name: contact_name.trim(),
          rubro: rubro.trim(),
        });
        localStorage.setItem('user', JSON.stringify(result.user));
        localStorage.setItem('token', result.token);
        onLogin(result.user, result.token);
        navigate('/dashboard');
      } catch (err: any) {
        console.error('API Error:', err);
        setError(err.message || 'Error al registrar empresa');
      } finally {
        setLoading(false);
      }
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
                          onClick={handleGoogleClick}
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
                              onClick={handleGoogleClick}
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
                              onClick={handleGoogleClick}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span className="font-bold text-gray-800 text-sm">Iniciar sesión con Google (Simulación)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowGooglePopup(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-150 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGooglePopupSubmit} className="p-5 space-y-4">
              {googlePopupError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-start gap-2 border border-red-100">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{googlePopupError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Correo de Google
                </label>
                <input
                  type="email"
                  placeholder={selectedRole === 'EGRESADO' ? 'usuario@unsa.edu.pe' : 'usuario@gmail.com'}
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  className="block w-full rounded-xl border border-gray-300 px-3 py-2 text-xs shadow-sm focus:outline-none h-10 bg-white"
                  required
                />
                {selectedRole === 'EGRESADO' && (
                  <p className="mt-1 text-[10px] text-gray-500">
                    * Debe terminar en @unsa.edu.pe
                  </p>
                )}
              </div>

              {selectedRole === 'EGRESADO' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Carrera Profesional
                  </label>
                  <select
                    value={googleCarrera}
                    onChange={(e) => setGoogleCarrera(e.target.value as any)}
                    className="block w-full rounded-xl border border-gray-300 px-3 py-2 text-xs shadow-sm focus:outline-none h-10 bg-white"
                    required
                  >
                    <option value="">Seleccione su carrera...</option>
                    {CARRERAS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowGooglePopup(false)}
                  className="h-10 text-xs px-4"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="h-10 text-xs px-4 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Confirmar Acceso
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
