import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
export function ProtectedRoute({ children, requiredRole = 'any' }) {
    const { user, loading, isAdmin, isGatewayUser, isFreelancer } = useAuth();
    const location = useLocation();
    // Helper local para verificar se é cliente
    const isCliente = user?.role === 'cliente';
    // 🔧 CORREÇÃO CRÍTICA: Aguardar carregamento antes de redirecionar
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center min-h-screen", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" }) }));
    }
    // Redirecionar para login se não estiver autenticado (após carregamento)
    if (!user) {
        return _jsx(Navigate, { to: "/login", state: { from: location }, replace: true });
    }
    // VERIFICAÇÃO CRÍTICA: Se o usuário existe mas o role ainda não carregou, aguardar
    if (user && !user.role) {
        return (_jsx("div", { className: "flex items-center justify-center min-h-screen", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" }) }));
    }
    // Verificar permissões baseadas em papel
    if (requiredRole !== 'any') {
        if (requiredRole === 'admin' && !isAdmin) {
            // Redireciona para a dashboard apropriada do usuário
            if (isGatewayUser)
                return _jsx(Navigate, { to: "/gateway/dashboard", replace: true });
            if (isFreelancer)
                return _jsx(Navigate, { to: "/freelancer/dashboard", replace: true });
            if (isCliente)
                return _jsx(Navigate, { to: "/client/dashboard", replace: true });
            return _jsx(Navigate, { to: "/", replace: true });
        }
        if (requiredRole === 'gateway_user' && !isGatewayUser) {
            // Redireciona para a dashboard apropriada do usuário
            if (isAdmin)
                return _jsx(Navigate, { to: "/admin/dashboard", replace: true });
            if (isFreelancer)
                return _jsx(Navigate, { to: "/freelancer/dashboard", replace: true });
            if (isCliente)
                return _jsx(Navigate, { to: "/client/dashboard", replace: true });
            return _jsx(Navigate, { to: "/", replace: true });
        }
        if (requiredRole === 'freelancer' && !isFreelancer) {
            // Redireciona para a dashboard apropriada do usuário
            if (isAdmin)
                return _jsx(Navigate, { to: "/admin/dashboard", replace: true });
            if (isGatewayUser)
                return _jsx(Navigate, { to: "/gateway/dashboard", replace: true });
            if (isCliente)
                return _jsx(Navigate, { to: "/client/dashboard", replace: true });
            return _jsx(Navigate, { to: "/", replace: true });
        }
        if (requiredRole === 'cliente' && !isCliente) {
            // Redireciona para a dashboard apropriada do usuário
            if (isAdmin)
                return _jsx(Navigate, { to: "/admin/dashboard", replace: true });
            if (isGatewayUser)
                return _jsx(Navigate, { to: "/gateway/dashboard", replace: true });
            if (isFreelancer)
                return _jsx(Navigate, { to: "/freelancer/dashboard", replace: true });
            return _jsx(Navigate, { to: "/", replace: true });
        }
    }
    // Usuário autenticado e com permissões corretas - renderiza diretamente sem verificações adicionais
    return _jsx(_Fragment, { children: children });
}
