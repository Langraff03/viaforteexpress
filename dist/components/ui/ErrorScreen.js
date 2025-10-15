import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AlertTriangle, RefreshCw } from 'lucide-react';
const ErrorScreen = ({ error, onRetry }) => {
    const errorMessage = error?.message || 'Ocorreu um erro inesperado.';
    const isNotFound = errorMessage.includes('Pedido não encontrado');
    return (_jsxs("div", { className: "fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-red-50 via-white to-rose-50/30 p-8 text-center", children: [_jsx(AlertTriangle, { className: "h-16 w-16 text-red-500 mb-6" }), _jsx("h2", { className: "text-2xl font-semibold text-red-800 mb-3", children: isNotFound ? 'Ops! Pedido não encontrado' : 'Ocorreu um Erro' }), _jsx("p", { className: "text-red-600 max-w-md mb-8", children: isNotFound
                    ? 'Não conseguimos localizar um pedido com o código fornecido. Por favor, verifique o código e tente novamente.'
                    : `Não foi possível carregar as informações do pedido. Detalhes: ${errorMessage}` }), onRetry && !isNotFound && (_jsxs("button", { onClick: onRetry, className: "flex items-center justify-center px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:from-red-600 hover:to-rose-700 transition-all duration-300 ease-in-out transform hover:-translate-y-0.5", children: [_jsx(RefreshCw, { className: "h-5 w-5 mr-2" }), "Tentar Novamente"] }))] }));
};
export default ErrorScreen;
