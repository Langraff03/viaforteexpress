import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
const RoleBasedRedirect = () => {
    const { user, loading } = useAuth();
    // Aguardar carregamento completo
    if (loading) {
        return (_jsxs("div", { className: "flex items-center justify-center min-h-screen", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" }), _jsx("span", { className: "ml-3", children: "Carregando..." })] }));
    }
    if (!user) {
        return _jsx(Navigate, { to: "/login", replace: true });
    }
    // Redireciona baseado no papel do usuário
    switch (user.role) {
        case 'admin':
            return _jsx(Navigate, { to: "/admin", replace: true });
        case 'gateway_user':
            return _jsx(Navigate, { to: "/gateway/dashboard", replace: true });
        case 'freelancer':
            return _jsx(Navigate, { to: "/freelancer/dashboard", replace: true });
        case 'cliente':
            return _jsx(Navigate, { to: "/client/dashboard", replace: true });
        default:
            return _jsx(Navigate, { to: "/login", replace: true });
    }
};
export default RoleBasedRedirect;
