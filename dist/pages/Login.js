import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Package } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { Card, CardContent, Input, Button, Alert } from '../components/ui';
import { useAuth } from '../lib/auth';
// Hook para desabilitar clique direito e atalhos de desenvolvedor
const useDisableRightClick = () => {
    useEffect(() => {
        const handleContextMenu = (e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
        };
        const handleKeyDown = (e) => {
            // Desabilitar F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U, Ctrl+S
            if (e.key === 'F12' ||
                (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
                (e.ctrlKey && (e.key === 'u' || e.key === 's'))) {
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
    async function handleSubmit(e) {
        e.preventDefault();
        if (loading)
            return; // Previne múltiplos cliques
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
        }
        catch (err) {
            console.error("❌ Erro no login:", err.message);
            setError(err.message || 'Ocorreu um erro inesperado.');
            setLoading(false); // Resetar loading em caso de erro
            setIsLoginSuccessful(false); // Resetar flag de sucesso
        }
    }
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-50 py-12 px-6", children: _jsx(Card, { className: "w-full max-w-md shadow-xl border border-gray-100", children: _jsxs(CardContent, { className: "space-y-8", children: [_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "flex justify-center mb-6", children: _jsx("div", { className: "p-3 bg-indigo-600 rounded-2xl shadow-lg", children: _jsx(Package, { className: "w-12 h-12 text-white" }) }) }), _jsx("h1", { className: "text-3xl font-bold text-gray-900 tracking-tight", children: "Via Forte Express" }), _jsx("p", { className: "mt-3 text-sm text-gray-500", children: "Sistema Multi-Gateway de Pagamentos" })] }), error && (_jsx(Alert, { variant: "error", children: error })), _jsxs("form", { className: "space-y-6 pt-2", onSubmit: handleSubmit, children: [_jsx(Input, { label: "Email", placeholder: "Seu email", type: "email", autoComplete: "email", value: email, onChange: (e) => setEmail(e.target.value), required: true, disabled: loading, className: "bg-gray-50" }), _jsx(Input, { label: "Senha", placeholder: "Sua senha", type: "password", autoComplete: "current-password", value: password, onChange: (e) => setPassword(e.target.value), required: true, disabled: loading, className: "bg-gray-50" }), _jsx(Button, { type: "submit", className: "w-full bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200 py-2.5", leftIcon: _jsx(Package, { className: "w-5 h-5" }), isLoading: loading, disabled: loading, children: loading ? 'Aguarde...' : 'Acessar Sistema' }), _jsx("div", { className: "text-center text-sm text-gray-500 mt-6 bg-gray-50 py-3 px-4 rounded-lg", children: _jsx("p", { className: "text-xs", children: "Acesso restrito para usu\u00E1rios autorizados" }) })] })] }) }) }));
}
