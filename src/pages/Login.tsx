import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Package } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { Card, CardContent, Input, Button, Alert } from '../components/ui';
import { useAuth } from '../lib/auth';

// Hook para desabilitar clique direito e atalhos de desenvolvedor
const useDisableRightClick = () => {
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Desabilitar F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U, Ctrl+S
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && (e.key === 'u' || e.key === 's'))
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // Adicionar listeners com capture para garantir que sejam executados primeiro
    document.addEventListener('contextmenu', handleContextMenu, true);
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu, true);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  // Desabilitar clique direito e atalhos de desenvolvedor
  useDisableRightClick();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoginSuccessful, setIsLoginSuccessful] = useState(false);

  // Redirecionamento após login bem-sucedido
  useEffect(() => {
    if (isLoginSuccessful && isAuthenticated && user) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isLoginSuccessful, isAuthenticated, user, navigate, location.state]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return; // Previne múltiplos cliques

    // Iniciar processo de login

    setError('');
    setLoading(true);

    try {
      const { error: signInError, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('❌ Erro no login:', signInError.message);
        throw signInError;
      }
      
      // Marcar login como bem-sucedido para ativar o redirecionamento
      setIsLoginSuccessful(true);
      
      // Aguardar um pouco para o AuthProvider processar antes de resetar loading
      setTimeout(() => {
        // Se após 1 segundo ainda não redirecionou, resetar loading
        // Isso evita que o botão fique travado indefinidamente
        if (!isAuthenticated || !user) {
          setLoading(false);
        }
      }, 1000);

    } catch (err: any) {
      console.error("❌ Erro no login:", err.message);
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
