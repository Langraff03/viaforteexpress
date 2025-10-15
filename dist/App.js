import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './components/AuthProvider';
import { ProtectedRoute } from './components/ProtectedRoute';
import RoleBasedRedirect from './components/RoleBasedRedirect';
// Layouts
import Layout from './components/Layout';
import GatewayUserLayout from './components/GatewayUserLayout';
import FreelancerLayout from './components/FreelancerLayout';
// Public Pages
import Login from './pages/Login';
import TrackingPage from './pages/TrackingPage';
import PublicInvoiceView from './pages/PublicInvoiceView';
// Admin Pages
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import EmailLogs from './pages/EmailLogs';
import DisparoEmMassa from './pages/DisparoEmMassa';
import EmailDomains from './pages/EmailDomains';
// Gateway User Pages
import GatewayDashboard from './pages/GatewayDashboard';
import GatewayOrders from './pages/GatewayOrders';
// Freelancer Pages
import FreelancerDashboard from './pages/FreelancerDashboard';
import FreelancerOrders from './pages/FreelancerOrders';
import FreelancerNewOrder from './pages/FreelancerNewOrder';
import FreelancerShopifyConfig from './pages/FreelancerShopifyConfig';
// Client Pages
import { ClientDashboard } from './pages/ClientDashboard';
const queryClient = new QueryClient();
// Componentes wrapper específicos para cada role
const AdminRoutesWrapper = () => {
    console.log('🔐 DEBUG [AdminRoutesWrapper] Verificando acesso admin');
    return (_jsx(ProtectedRoute, { requiredRole: "admin", children: _jsx(Outlet, {}) }));
};
const GatewayRoutesWrapper = () => {
    console.log('🔐 DEBUG [GatewayRoutesWrapper] Verificando acesso gateway');
    return (_jsx(ProtectedRoute, { requiredRole: "gateway_user", children: _jsx(Outlet, {}) }));
};
const FreelancerRoutesWrapper = () => {
    console.log('🔐 DEBUG [FreelancerRoutesWrapper] Verificando acesso freelancer');
    return (_jsx(ProtectedRoute, { requiredRole: "freelancer", children: _jsx(Outlet, {}) }));
};
const ClientRoutesWrapper = () => {
    console.log('🔐 DEBUG [ClientRoutesWrapper] Verificando acesso cliente');
    return (_jsx(ProtectedRoute, { requiredRole: "cliente", children: _jsx(Outlet, {}) }));
};
// Wrapper genérico para rotas que aceitam qualquer usuário autenticado
const AuthenticatedRoutesWrapper = () => (_jsx(ProtectedRoute, { requiredRole: "any", children: _jsx(Outlet, {}) }));
function App() {
    return (_jsx(AuthProvider, { children: _jsx(QueryClientProvider, { client: queryClient, children: _jsx(Router, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(Login, {}) }), _jsx(Route, { path: "/tracking/:code", element: _jsx(TrackingPage, {}) }), _jsx(Route, { path: "/invoice/:token", element: _jsx(PublicInvoiceView, {}) }), _jsx(Route, { path: "/", element: _jsx(AuthenticatedRoutesWrapper, {}), children: _jsx(Route, { index: true, element: _jsx(RoleBasedRedirect, {}) }) }), _jsx(Route, { path: "/admin", element: _jsx(AdminRoutesWrapper, {}), children: _jsxs(Route, { element: _jsx(Layout, { children: _jsx(Outlet, {}) }), children: [_jsx(Route, { index: true, element: _jsx(Navigate, { to: "/admin/dashboard", replace: true }) }), _jsx(Route, { path: "dashboard", element: _jsx(Dashboard, {}) }), _jsx(Route, { path: "orders", element: _jsx(Orders, {}) }), _jsx(Route, { path: "disparo-massa", element: _jsx(DisparoEmMassa, {}) }), _jsx(Route, { path: "email-domains", element: _jsx(EmailDomains, {}) }), _jsx(Route, { path: "email-logs", element: _jsx(EmailLogs, {}) })] }) }), _jsx(Route, { path: "/gateway", element: _jsx(GatewayRoutesWrapper, {}), children: _jsxs(Route, { element: _jsx(GatewayUserLayout, { children: _jsx(Outlet, {}) }), children: [_jsx(Route, { index: true, element: _jsx(Navigate, { to: "/gateway/dashboard", replace: true }) }), _jsx(Route, { path: "dashboard", element: _jsx(GatewayDashboard, {}) }), _jsx(Route, { path: "orders", element: _jsx(GatewayOrders, {}) })] }) }), _jsx(Route, { path: "/freelancer", element: _jsx(FreelancerRoutesWrapper, {}), children: _jsxs(Route, { element: _jsx(FreelancerLayout, { children: _jsx(Outlet, {}) }), children: [_jsx(Route, { index: true, element: _jsx(Navigate, { to: "/freelancer/dashboard", replace: true }) }), _jsx(Route, { path: "dashboard", element: _jsx(FreelancerDashboard, {}) }), _jsx(Route, { path: "orders", element: _jsx(FreelancerOrders, {}) }), _jsx(Route, { path: "new-order", element: _jsx(FreelancerNewOrder, {}) }), _jsx(Route, { path: "shopify-config", element: _jsx(FreelancerShopifyConfig, {}) })] }) }), _jsxs(Route, { path: "/client", element: _jsx(ClientRoutesWrapper, {}), children: [_jsx(Route, { index: true, element: _jsx(Navigate, { to: "/client/dashboard", replace: true }) }), _jsx(Route, { path: "dashboard", element: _jsx(ClientDashboard, {}) })] }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] }) }) }) }));
}
export default App;
