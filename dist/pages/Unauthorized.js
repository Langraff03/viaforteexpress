import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
export function Unauthorized() {
    const navigate = useNavigate();
    const { user } = useAuth();
    console.log('🚫 DEBUG [Unauthorized] Página de acesso negado renderizada para:', user?.email);
    const handleGoBack = () => {
        if (user?.role === 'admin') {
            navigate('/admin/dashboard');
        }
        else if (user?.role === 'gateway_user') {
            navigate('/gateway/dashboard');
        }
        else if (user?.role === 'freelancer') {
            navigate('/freelancer/dashboard');
        }
        else {
            navigate('/');
        }
    };
    return (_jsx("div", { className: "flex items-center justify-center min-h-screen bg-gray-100", children: _jsxs("div", { className: "max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center", children: [_jsx("div", { className: "mb-6", children: _jsx("svg", { className: "mx-auto h-16 w-16 text-red-500", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" }) }) }), _jsx("h1", { className: "text-2xl font-bold text-gray-900 mb-2", children: "Acesso Negado" }), _jsx("p", { className: "text-gray-600 mb-6", children: "Voc\u00EA n\u00E3o tem permiss\u00E3o para acessar esta p\u00E1gina." }), _jsx("button", { onClick: handleGoBack, className: "w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition duration-200", children: "Voltar para o Dashboard" })] }) }));
}
