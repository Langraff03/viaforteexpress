import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Package } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { Card, CardContent, Input, Button, Alert } from '../components/ui';
import { useAuth } from '../lib/auth';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoginSuccessful, setIsLoginSuccessful] = useState(false);

  // Redirecionamento após login bem-sucedido
  useEffect(() => {
    console.log('🔍 DEBUG Login useEffect:', {
      isLoginSuccessful,
      isAuthenticated,
      hasUser: !!user,
      userRole: user?.role,
      locationFrom: location.state?.from?.pathname
    });
    
    if (isLoginSuccessful && isAuthenticated && user) {
      console.log('✅ DEBUG Login: Login confirmado, preparando redirecionamento...');
      console.log(`👤 DEBUG Login: Usuário autenticado - Email: ${user.email}, Role: ${user.role}`);
      
      const from = location.state?.from?.pathname || '/';
      console.log(`➡️ DEBUG Login: Redirecionando para: ${from}`);
      
      navigate(from, { replace: true });
    }
  }, [isLoginSuccessful, isAuthenticated, user, navigate, location.state]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return; // Previne múltiplos cliques

    console.log('🔐 DEBUG Login: Iniciando processo de login...');
    console.log('📧 DEBUG Login: Email:', email);
    console.log('🔄 DEBUG Login: Estado atual - isAuthenticated:', isAuthenticated, 'user:', user);

    setError('');
    setLoading(true);

    try {
      console.log('🚀 DEBUG Login: Chamando supabase.auth.signInWithPassword...');
      const { error: signInError, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('📦 DEBUG Login: Resposta do signInWithPassword:', {
        hasError: !!signInError,
        hasSession: !!data?.session,
        hasUser: !!data?.user,
        userId: data?.user?.id
      });

      if (signInError) {
        console.error('❌ DEBUG Login: Erro no signInWithPassword:', signInError);
        throw signInError;
      }
      
      console.log('✅ DEBUG Login: Login bem-sucedido! Aguardando AuthProvider...');
      
      // Marcar login como bem-sucedido para ativar o redirecionamento
      setIsLoginSuccessful(true);
      
      // Aguardar um pouco para o AuthProvider processar antes de resetar loading
      setTimeout(() => {
        console.log('🔍 DEBUG Login: Verificando estado após 1 segundo...');
        console.log('📊 DEBUG Login: isAuthenticated:', isAuthenticated, 'user:', user);
        
        // Se após 1 segundo ainda não redirecionou, resetar loading
        // Isso evita que o botão fique travado indefinidamente
        if (!isAuthenticated || !user) {
          console.log('⚠️ DEBUG Login: AuthProvider ainda não processou, resetando loading...');
          setLoading(false);
        }
      }, 1000);

    } catch (err: any) {
      console.error("❌ DEBUG Login: Erro capturado:", err.message);
      setError(err.message || 'Ocorreu um erro inesperado.');
      setLoading(false); // Resetar loading em caso de erro
      setIsLoginSuccessful(false); // Resetar flag de sucesso
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-50 py-12 px-6">
      <Card className="w-full max-w-md shadow-xl border border-gray-100">
        <CardContent className="space-y-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg">
                <Package className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Via Forte Express
            </h1>
            <p className="mt-3 text-sm text-gray-500">
              Sistema Multi-Gateway de Pagamentos
            </p>
          </div>

          {error && (
            <Alert variant="error">
              {error}
            </Alert>
          )}

          <form className="space-y-6 pt-2" onSubmit={handleSubmit}>
            <Input
              label="Email"
              placeholder="Seu email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="bg-gray-50"
            />

            <Input
              label="Senha"
              placeholder="Sua senha"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="bg-gray-50"
            />

            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200 py-2.5"
              leftIcon={<Package className="w-5 h-5" />}
              isLoading={loading}
              disabled={loading}
            >
              {loading ? 'Aguarde...' : 'Acessar Sistema'}
            </Button>

            <div className="text-center text-sm text-gray-500 mt-6 bg-gray-50 py-3 px-4 rounded-lg">
              <p className="text-xs">
                Acesso restrito para usuários autorizados
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
