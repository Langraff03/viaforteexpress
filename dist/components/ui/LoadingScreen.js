import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Loader } from 'lucide-react';
const LoadingScreen = () => {
    return (_jsxs("div", { className: "fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50/30", children: [_jsx(Loader, { className: "h-16 w-16 animate-spin text-blue-600 mb-6" }), _jsx("p", { className: "text-xl font-medium text-gray-700", children: "Carregando informa\u00E7\u00F5es do pedido..." }), _jsx("p", { className: "text-gray-500 mt-2", children: "S\u00F3 um instante, estamos buscando os detalhes para voc\u00EA." })] }));
};
export default LoadingScreen;
