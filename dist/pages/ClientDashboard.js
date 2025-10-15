import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useAuth } from '../lib/auth';
import { useNavigate } from 'react-router-dom';
import { LogOut, Package, FileText } from 'lucide-react';
export function ClientDashboard() {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    console.log('👤 DEBUG [ClientDashboard] Dashboard do cliente renderizado para:', user?.email);
    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };
    return (_jsxs("div", { className: "min-h-screen bg-gray-100", children: [_jsx("div", { className: "bg-white shadow", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "flex justify-between items-center py-6", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Portal do Cliente" }), _jsxs("button", { onClick: handleLogout, className: "flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md", children: [_jsx(LogOut, { className: "h-4 w-4" }), "Sair"] })] }) }) }), _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [_jsxs("div", { className: "bg-white rounded-lg shadow p-6 mb-6", children: [_jsxs("h2", { className: "text-lg font-semibold mb-2", children: ["Bem-vindo, ", user?.name || user?.email, "!"] }), _jsx("p", { className: "text-gray-600", children: "Aqui voc\u00EA pode acompanhar seus pedidos e gerenciar suas informa\u00E7\u00F5es." })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Meus Pedidos" }), _jsx(Package, { className: "h-6 w-6 text-blue-600" })] }), _jsx("p", { className: "text-gray-600 mb-4", children: "Visualize e acompanhe todos os seus pedidos" }), _jsx("button", { onClick: () => navigate('/client/orders'), className: "w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition", children: "Ver Pedidos" })] }), _jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Minhas Faturas" }), _jsx(FileText, { className: "h-6 w-6 text-green-600" })] }), _jsx("p", { className: "text-gray-600 mb-4", children: "Acesse suas faturas e comprovantes" }), _jsx("button", { onClick: () => navigate('/client/invoices'), className: "w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition", children: "Ver Faturas" })] })] })] })] }));
}
