import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Building2, Shield, Mail, LogIn } from 'lucide-react';
import { loginSchema } from '../schemas';
import { api } from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import type { User } from '../types';

interface LoginProps {
  onLogin: (user: User, token: string) => void;
}

type RoleOption = 'EGRESADO' | 'EMPLEADOR' | 'ADMIN';

const roles: { key: RoleOption; label: string; icon: typeof GraduationCap; desc: string }[] = [
  { key: 'EGRESADO', label: 'Egresado', icon: GraduationCap, desc: 'Busco oportunidades laborales' },
  { key: 'EMPLEADOR', label: 'Empleador', icon: Building2, desc: 'Publico ofertas de trabajo' },
  { key: 'ADMIN', label: 'Admin UDEG', icon: Shield, desc: 'Modero y gestiono la plataforma' },
];

export default function Login({ onLogin }: LoginProps) {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<RoleOption>('EGRESADO');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setError('');
    const result = loginSchema.safeParse({ email });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
      const mockGoogleToken = `mock-google-token-${email}-${selectedRole}`;
      const data = await api.auth.googleLogin(mockGoogleToken);
      onLogin(data.user, data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-unsa-900 via-unsa-800 to-unsa-950 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-unsa-100 mb-3">
              <GraduationCap className="w-7 h-7 text-unsa-700" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">CONECTA-UNSA</h1>
            <p className="text-sm text-gray-500 mt-1">
              Plataforma de vinculación laboral universitaria
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Selecciona tu rol
              </label>
              <div className="grid grid-cols-3 gap-3">
                {roles.map(({ key, label, icon: Icon, desc }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedRole(key)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition-all ${
                      selectedRole === key
                        ? 'border-unsa-500 bg-unsa-50 text-unsa-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-xs font-semibold">{label}</span>
                    <span className="text-[10px] leading-tight text-gray-400">{desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2 text-gray-400">
                  {selectedRole === 'EGRESADO'
                    ? 'Inicia con tu correo institucional'
                    : 'Ingresa tu correo electrónico'}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <Input
                label="Correo electrónico"
                type="email"
                placeholder={
                  selectedRole === 'EGRESADO'
                    ? 'ejemplo@unsa.edu.pe'
                    : 'ejemplo@gmail.com'
                }
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={error}
              />

              <Button
                onClick={handleGoogleLogin}
                loading={loading}
                className="w-full"
                size="lg"
              >
                <LogIn className="w-5 h-5" />
                Iniciar sesión con Google
              </Button>
            </div>

            <p className="text-xs text-center text-gray-400">
              Al iniciar sesión aceptas los términos y condiciones de CONECTA-UNSA
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
