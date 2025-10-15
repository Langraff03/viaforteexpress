import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, LogOut, Package, CreditCard, Menu, Bell, Clock } from 'lucide-react';
import { useAuth } from '../lib/auth';
const GatewayUserLayout = ({ children }) => {
    const location = useLocation();
    const { user, signOut } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    // Atualiza o horário a cada minuto
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);
        return () => clearInterval(timer);
    }, []);
    const navigation = [
        {
            name: 'Painel',
            href: '/gateway/dashboard',
            icon: LayoutDashboard,
            description: 'Visão geral e estatísticas'
        },
        {
            name: 'Pedidos',
            href: '/gateway/orders',
            icon: Package,
            description: 'Gerenciar pedidos e pagamentos'
        }
    ];
    // Determina o caminho atual para breadcrumbs
    const getBreadcrumbs = () => {
        const path = location.pathname;
        const parts = path.split('/').filter(Boolean);
        if (parts.length < 2)
            return [];
        const breadcrumbs = [];
        let currentPath = '';
        for (let i = 0; i < parts.length; i++) {
            currentPath += `/${parts[i]}`;
            const name = parts[i].charAt(0).toUpperCase() + parts[i].slice(1);
            breadcrumbs.push({ name, href: currentPath });
        }
        return breadcrumbs;
    };
    const breadcrumbs = getBreadcrumbs();
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx("nav", { className: "bg-white shadow-sm border-b border-gray-200", children: _jsx("div", { className: "px-4 mx-auto max-w-7xl sm:px-6 lg:px-8", children: _jsxs("div", { className: "flex justify-between h-16", children: [_jsxs("div", { className: "flex items-center", children: [_jsx("button", { type: "button", className: "inline-flex items-center justify-center p-2 rounded-md text-gray-400 lg:hidden hover:text-gray-500 hover:bg-gray-100 focus:outline-none", onClick: () => setIsMobileMenuOpen(!isMobileMenuOpen), children: _jsx(Menu, { className: "block h-6 w-6", "aria-hidden": "true" }) }), _jsxs("div", { className: "flex items-center flex-shrink-0", children: [_jsx(CreditCard, { className: "w-8 h-8 text-indigo-600" }), _jsxs("span", { className: "ml-2 text-xl font-bold text-gray-900", children: ["Gateway ", user?.gatewayType?.toUpperCase() || 'PAGAMENTOS'] })] })] }), _jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs("div", { className: "hidden md:flex items-center text-sm text-gray-500", children: [_jsx(Clock, { className: "w-4 h-4 mr-1" }), currentTime.toLocaleDateString('pt-BR'), " ", currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })] }), _jsxs("div", { className: "relative", children: [_jsx("button", { className: "p-1 text-gray-400 rounded-full hover:bg-gray-100 hover:text-gray-500 focus:outline-none", children: _jsx(Bell, { className: "w-6 h-6" }) }), _jsx("span", { className: "absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full", children: "2" })] }), _jsx("div", { className: "relative flex-shrink-0", children: _jsxs("div", { className: "flex items-center", children: [_jsxs("div", { className: "relative", children: [_jsx("div", { className: "w-10 h-10 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center", children: _jsx("span", { className: "text-sm font-medium text-white", children: user?.email?.charAt(0).toUpperCase() }) }), _jsx("span", { className: "absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-400 border-2 border-white" })] }), _jsxs("div", { className: "ml-3 hidden md:block", children: [_jsx("div", { className: "text-sm font-medium text-gray-700", children: user?.email }), _jsx("div", { className: "text-xs text-gray-500", children: user?.clientName || 'Via Forte Express' })] })] }) }), _jsx("button", { onClick: () => signOut(), className: "p-1 text-gray-400 rounded-full hover:bg-gray-100 hover:text-gray-500 focus:outline-none", title: "Sair", children: _jsx(LogOut, { className: "w-6 h-6" }) })] })] }) }) }), _jsx("div", { className: `lg:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`, children: _jsx("div", { className: "pt-2 pb-3 space-y-1", children: navigation.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.href;
                        return (_jsxs(Link, { to: item.href, className: `flex items-center px-4 py-2 text-base font-medium ${isActive
                                ? 'bg-indigo-50 text-indigo-600 border-l-4 border-indigo-500'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`, onClick: () => setIsMobileMenuOpen(false), children: [_jsx(Icon, { className: "w-5 h-5 mr-3" }), item.name] }, item.name));
                    }) }) }), _jsxs("div", { className: "flex", children: [_jsxs("div", { className: "hidden lg:block w-64 min-h-screen bg-white shadow-lg border-r border-gray-200", children: [_jsxs("div", { className: "p-4 border-b border-gray-200", children: [_jsx("h2", { className: "text-lg font-medium text-gray-900", children: "Painel de Controle" }), _jsx("p", { className: "text-sm text-gray-500", children: "Gerencie seu gateway" })] }), _jsx("nav", { className: "mt-4", children: _jsx("div", { className: "px-2 space-y-1", children: navigation.map((item) => {
                                        const Icon = item.icon;
                                        const isActive = location.pathname === item.href;
                                        return (_jsxs(Link, { to: item.href, className: `group flex items-center px-3 py-3 text-sm font-medium rounded-md transition-all ${isActive
                                                ? 'bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-700 border-r-4 border-indigo-500'
                                                : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600'}`, children: [_jsx(Icon, { className: `w-5 h-5 mr-3 ${isActive ? 'text-indigo-500' : 'text-gray-400 group-hover:text-indigo-500'}` }), _jsxs("div", { children: [_jsx("div", { children: item.name }), _jsx("p", { className: `text-xs ${isActive ? 'text-indigo-500' : 'text-gray-400'}`, children: item.description })] })] }, item.name));
                                    }) }) }), _jsx("div", { className: "absolute bottom-0 w-64 p-4 border-t border-gray-200", children: _jsx("div", { className: "flex items-center", children: _jsx("div", { className: "flex-shrink-0", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "h-2.5 w-2.5 rounded-full bg-green-400 mr-2" }), _jsx("p", { className: "text-sm text-gray-500", children: "Sistema operacional" })] }) }) }) })] }), _jsx("main", { className: "flex-1 overflow-auto", children: _jsx("div", { className: "p-6", children: children }) })] })] }));
};
export default GatewayUserLayout;
