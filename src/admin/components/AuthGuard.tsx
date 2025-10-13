import React, { ReactNode, useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: ReactNode;
  allowedRoles?: Array<'admin' | 'gateway_user'>;
  requireClient?: boolean;
  requireGateway?: boolean;
}

const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  allowedRoles = ['admin'],
  requireClient = false,
  requireGateway = false
}) => {
  const { user, loading, isAdmin, isGatewayUser, clientId, gatewayId } = useAuth();
  const location = useLocation();
  const [loadingTimeout, setLoadingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [forceRender, setForceRender] = useState(false);

  // Configurar um timeout para garantir que o loading não fique preso
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        console.log('AuthGuard: Timeout de carregamento atingido, forçando renderização');
        setForceRender(true);
      }, 3000); // 3 segundos de timeout
      
      setLoadingTimeout(timeout);
    } else {
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        setLoadingTimeout(null);
      }
    }
    
    return () => {
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
    };
  }, [loading]);

  if (loading && !forceRender) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
        <span className="ml-3 text-indigo-600">Verificando permissões...</span>
      </div>
    );
  }

  // Verificar autenticação
  if (!user) {
    console.log('AuthGuard: Usuário não autenticado, redirecionando para login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar papel do usuário
  if (!allowedRoles.some(role =>
      (role === 'admin' && isAdmin) ||
      (role === 'gateway_user' && isGatewayUser)
  )) {
    console.log('AuthGuard: Usuário não tem papel permitido, redirecionando para unauthorized');
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }

  // Verificar se o usuário tem um cliente associado (se necessário)
  if (requireClient && !clientId) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-medium text-yellow-800">Configuração Incompleta</h3>
        <p className="mt-2 text-yellow-700">
          Sua conta não está associada a nenhum cliente.
          Entre em contato com o administrador do sistema.
        </p>
      </div>
    );
  }

  // Verificar se o usuário tem um gateway associado (se necessário)
  if (requireGateway && !gatewayId) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-medium text-yellow-800">Configuração Incompleta</h3>
        <p className="mt-2 text-yellow-700">
          Sua conta não está associada a nenhum gateway de pagamento.
          Entre em contato com o administrador do sistema.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;