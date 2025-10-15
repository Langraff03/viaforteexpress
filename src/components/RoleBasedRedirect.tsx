import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

const RoleBasedRedirect = () => {
  const { user, loading } = useAuth();

  // Aguardar carregamento completo
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3">Carregando...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redireciona baseado no papel do usuário
  switch (user.role) {
    case 'admin':
      return <Navigate to="/admin" replace />;
    case 'gateway_user':
      return <Navigate to="/gateway/dashboard" replace />;
    case 'freelancer':
      return <Navigate to="/freelancer/dashboard" replace />;
    case 'cliente':
      return <Navigate to="/client/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

export default RoleBasedRedirect;