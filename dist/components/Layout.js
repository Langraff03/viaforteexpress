import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, LogOut, Bell, Package, Settings, Mail, Send } from 'lucide-react';
import { useAuth } from '../lib/auth';
const Layout = ({ children }) => {
    const location = useLocation();
    const { user, signOut } = useAuth();
    // Determinar os links de navegação com base no papel do usuário
    const { isAdmin, isGatewayUser } = useAuth();
    const navigation = isAdmin
        ? [
            { name: 'Painel', href: '/admin', icon: LayoutDashboard },
            { name: 'Pedidos', href: '/admin/orders', icon: Package },
            { name: 'Disparo em Massa', href: '/admin/disparo-massa', icon: Send },
            { name: 'Domínios de Email', href: '/admin/email-domains', icon: Mail },
            { name: 'Logs de Email', href: '/admin/email-logs', icon: Mail },
            { name: 'Configurações', href: '/admin/settings', icon: Settings }
        ]
        : isGatewayUser
            ? [
                { name: 'Painel', href: '/gateway/dashboard', icon: LayoutDashboard },
                { name: 'Pedidos', href: '/gateway/orders', icon: Package }
            ]
            : [];
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx("nav", { className: "bg-white border-b border-gray-200", children: _jsx("div", { className: "px-4 mx-auto max-w-7xl sm:px-6 lg:px-8", children: _jsxs("div", { className: "flex justify-between h-16", children: [_jsx("div", { className: "flex", children: _jsxs("div", { className: "flex items-center flex-shrink-0", children: [_jsx(Package, { className: "w-8 h-8 text-indigo-600" }), _jsx("span", { className: "ml-2 text-xl font-bold text-gray-900", children: "Via Forte Express" })] }) }), _jsxs("div", { className: "flex items-center", children: [_jsx("button", { className: "p-1 text-gray-400 hover:text-gray-500", children: _jsx(Bell, { className: "w-6 h-6" }) }), _jsxs("div", { className: "flex items-center ml-4", children: [_jsx("div", { className: "relative flex-shrink-0", children: _jsx("div", { children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { children: _jsx("div", { className: "w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center", children: _jsx("span", { className: "text-sm font-medium text-white", children: user?.email?.charAt(0).toUpperCase() }) }) }), _jsxs("div", { className: "ml-3", children: [_jsx("div", { className: "text-sm font-medium text-gray-700", children: user?.email }), _jsx("div", { className: "text-xs text-gray-500", children: isAdmin ? 'Admin' : isGatewayUser ? 'Gateway User' : 'Usuário' })] })] }) }) }), _jsx("button", { onClick: () => signOut(), className: "ml-4 text-gray-400 hover:text-gray-500", children: _jsx(LogOut, { className: "w-6 h-6" }) })] })] })] }) }) }), _jsxs("div", { className: "flex", children: [_jsx("div", { className: "w-64 min-h-screen bg-white border-r border-gray-200", children: _jsx("nav", { className: "flex flex-col p-4 space-y-1", children: navigation.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.href;
                                return (_jsxs(Link, { to: item.href, className: `flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${isActive
                                        ? 'bg-indigo-50 text-indigo-600'
                                        : 'text-gray-600 hover:bg-gray-50'}`, children: [_jsx(Icon, { className: "w-5 h-5 mr-3" }), item.name] }, item.name));
                            }) }) }), _jsx("main", { className: "flex-1 p-8", children: children })] })] }));
};
export default Layout;
