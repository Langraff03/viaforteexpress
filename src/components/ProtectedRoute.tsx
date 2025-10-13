import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'gateway_user' | 'freelancer' | 'cliente' | 'any';
}

export function ProtectedRoute({
  children,
  requiredRole = 'any'
}: ProtectedRouteProps) {
  const { user, loading, isAdmin, isGatewayUser, isFreelancer } = useAuth();
  const location = useLocation();
  
  // Helper local para verificar se é cliente
  const isCliente = user?.role === 'cliente';
  
  
  // 🔧 CORREÇÃO CRÍTICA: Aguardar carregamento antes de redirecionar
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirecionar para login se não estiver autenticado (após carregamento)
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // VERIFICAÇÃO CRÍTICA: Se o usuário existe mas o role ainda não carregou, aguardar
  if (user && !user.role) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Verificar permissões baseadas em papel
  if (requiredRole !== 'any') {
    if (requiredRole === 'admin' && !isAdmin) {
      // Redireciona para a dashboard apropriada do usuário
      if (isGatewayUser) return <Navigate to="/gateway/dashboard" replace />;
      if (isFreelancer) return <Navigate to="/freelancer/dashboard" replace />;
      if (isCliente) return <Navigate to="/client/dashboard" replace />;
      return <Navigate to="/" replace />;
    }

    if (requiredRole === 'gateway_user' && !isGatewayUser) {
      // Redireciona para a dashboard apropriada do usuário
      if (isAdmin) return <Navigate to="/admin/dashboard" replace />;
      if (isFreelancer) return <Navigate to="/freelancer/dashboard" replace />;
      if (isCliente) return <Navigate to="/client/dashboard" replace />;
      return <Navigate to="/" replace />;
    }

    if (requiredRole === 'freelancer' && !isFreelancer) {
      // Redireciona para a dashboard apropriada do usuário
      if (isAdmin) return <Navigate to="/admin/dashboard" replace />;
      if (isGatewayUser) return <Navigate to="/gateway/dashboard" replace />;
      if (isCliente) return <Navigate to="/client/dashboard" replace />;
      return <Navigate to="/" replace />;
    }

    if (requiredRole === 'cliente' && !isCliente) {
      // Redireciona para a dashboard apropriada do usuário
      if (isAdmin) return <Navigate to="/admin/dashboard" replace />;
      if (isGatewayUser) return <Navigate to="/gateway/dashboard" replace />;
      if (isFreelancer) return <Navigate to="/freelancer/dashboard" replace />;
      return <Navigate to="/" replace />;
    }
  }

  // Usuário autenticado e com permissões corretas - renderiza diretamente sem verificações adicionais
  return <>{children}</>;
}