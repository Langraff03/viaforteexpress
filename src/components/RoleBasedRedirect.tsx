import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

const RoleBasedRedirect = () => {
  const { user, loading } = useAuth();

  console.log('🔄 DEBUG [RoleBasedRedirect] Iniciando...');
  console.log('📊 DEBUG [RoleBasedRedirect] Estado:', {
    loading,
    hasUser: !!user,
    userEmail: user?.email,
    userRole: user?.role
  });

  // Aguardar carregamento completo
  if (loading) {
    console.log('⏳ DEBUG [RoleBasedRedirect] Ainda carregando...');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3">Carregando...</span>
      </div>
    );
  }

  if (!user) {
    console.log('❌ DEBUG [RoleBasedRedirect] Sem usuário, redirecionando para login');
    return <Navigate to="/login" replace />;
  }

  // Log detalhado antes do redirecionamento
  console.log(`🎯 DEBUG [RoleBasedRedirect] Redirecionando usuário com role: ${user.role}`);
  
  // Redireciona baseado no papel do usuário
  switch (user.role) {
    case 'admin':
      console.log('➡️ DEBUG [RoleBasedRedirect] Redirecionando ADMIN para /admin');
      return <Navigate to="/admin" replace />;
    case 'gateway_user':
      console.log('➡️ DEBUG [RoleBasedRedirect] Redirecionando GATEWAY_USER para /gateway/dashboard');
      return <Navigate to="/gateway/dashboard" replace />;
    case 'freelancer':
      console.log('➡️ DEBUG [RoleBasedRedirect] Redirecionando FREELANCER para /freelancer/dashboard');
      return <Navigate to="/freelancer/dashboard" replace />;
    case 'cliente':
      console.log('➡️ DEBUG [RoleBasedRedirect] Redirecionando CLIENTE para /client/dashboard');
      return <Navigate to="/client/dashboard" replace />;
    default:
      console.log(`⚠️ DEBUG [RoleBasedRedirect] Role não reconhecido: ${user.role}, redirecionando para login`);
      return <Navigate to="/login" replace />;
  }
};

export default RoleBasedRedirect;