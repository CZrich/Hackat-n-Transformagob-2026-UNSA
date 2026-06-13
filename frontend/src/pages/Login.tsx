import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { GraduationCap, Building2, Shield, Mail, Lock, Phone, User as UserIcon, AlertCircle } from 'lucide-react';
import { CARRERAS } from '../config';
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
        setError(err.message || 'Error al registrarse');
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
        setError(err.message || 'Error al registrarse');
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
                          onClick={() => googleLogin()}
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
                              onClick={() => googleLogin()}
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
                              onClick={() => googleLogin()}
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


    </div>
  );
}
