import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
const AuthGuard = ({ children, allowedRoles = ['admin'], requireClient = false, requireGateway = false }) => {
    const { user, loading, isAdmin, isGatewayUser, clientId, gatewayId } = useAuth();
    const location = useLocation();
    const [loadingTimeout, setLoadingTimeout] = useState(null);
    const [forceRender, setForceRender] = useState(false);
    // Configurar um timeout para garantir que o loading não fique preso
    useEffect(() => {
        if (loading) {
            const timeout = setTimeout(() => {
                console.log('AuthGuard: Timeout de carregamento atingido, forçando renderização');
                setForceRender(true);
            }, 3000); // 3 segundos de timeout
            setLoadingTimeout(timeout);
        }
        else {
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
        return (_jsxs("div", { className: "flex justify-center items-center p-8", children: [_jsx(Loader2, { className: "w-6 h-6 text-indigo-600 animate-spin" }), _jsx("span", { className: "ml-3 text-indigo-600", children: "Verificando permiss\u00F5es..." })] }));
    }
    // Verificar autenticação
    if (!user) {
        console.log('AuthGuard: Usuário não autenticado, redirecionando para login');
        return _jsx(Navigate, { to: "/login", state: { from: location }, replace: true });
    }
    // Verificar papel do usuário
    if (!allowedRoles.some(role => (role === 'admin' && isAdmin) ||
        (role === 'gateway_user' && isGatewayUser))) {
        console.log('AuthGuard: Usuário não tem papel permitido, redirecionando para unauthorized');
        return _jsx(Navigate, { to: "/unauthorized", state: { from: location }, replace: true });
    }
    // Verificar se o usuário tem um cliente associado (se necessário)
    if (requireClient && !clientId) {
        return (_jsxs("div", { className: "p-6 bg-yellow-50 border border-yellow-200 rounded-lg", children: [_jsx("h3", { className: "text-lg font-medium text-yellow-800", children: "Configura\u00E7\u00E3o Incompleta" }), _jsx("p", { className: "mt-2 text-yellow-700", children: "Sua conta n\u00E3o est\u00E1 associada a nenhum cliente. Entre em contato com o administrador do sistema." })] }));
    }
    // Verificar se o usuário tem um gateway associado (se necessário)
    if (requireGateway && !gatewayId) {
        return (_jsxs("div", { className: "p-6 bg-yellow-50 border border-yellow-200 rounded-lg", children: [_jsx("h3", { className: "text-lg font-medium text-yellow-800", children: "Configura\u00E7\u00E3o Incompleta" }), _jsx("p", { className: "mt-2 text-yellow-700", children: "Sua conta n\u00E3o est\u00E1 associada a nenhum gateway de pagamento. Entre em contato com o administrador do sistema." })] }));
    }
    return _jsx(_Fragment, { children: children });
};
export default AuthGuard;
