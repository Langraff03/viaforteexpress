import React from 'react';
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
  return (
    <ProtectedRoute requiredRole="admin">
      <Outlet />
    </ProtectedRoute>
  );
};

const GatewayRoutesWrapper = () => {
  console.log('🔐 DEBUG [GatewayRoutesWrapper] Verificando acesso gateway');
  return (
    <ProtectedRoute requiredRole="gateway_user">
      <Outlet />
    </ProtectedRoute>
  );
};

const FreelancerRoutesWrapper = () => {
  console.log('🔐 DEBUG [FreelancerRoutesWrapper] Verificando acesso freelancer');
  return (
    <ProtectedRoute requiredRole="freelancer">
      <Outlet />
    </ProtectedRoute>
  );
};
const ClientRoutesWrapper = () => {
  console.log('🔐 DEBUG [ClientRoutesWrapper] Verificando acesso cliente');
  return (
    <ProtectedRoute requiredRole="cliente">
      <Outlet />
    </ProtectedRoute>
  );
};

// Wrapper genérico para rotas que aceitam qualquer usuário autenticado
const AuthenticatedRoutesWrapper = () => (
  <ProtectedRoute requiredRole="any">
    <Outlet />
  </ProtectedRoute>
);

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            {/* 1. Rotas Públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/tracking/:code" element={<TrackingPage />} />
            <Route path="/invoice/:token" element={<PublicInvoiceView />} />

            {/* 2. Rota raiz que redireciona usuários logados */}
             <Route path="/" element={<AuthenticatedRoutesWrapper />}>
              <Route index element={<RoleBasedRedirect />} />
            </Route>

            {/* 3. Rotas de Admin - REQUER ROLE ADMIN */}
            <Route path="/admin" element={<AdminRoutesWrapper />}>
              <Route element={<Layout><Outlet /></Layout>}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="orders" element={<Orders />} />
                <Route path="disparo-massa" element={<DisparoEmMassa />} />
                <Route path="email-domains" element={<EmailDomains />} />
                <Route path="email-logs" element={<EmailLogs />} />
              </Route>
            </Route>
            
            {/* 4. Rotas do Gateway User - REQUER ROLE GATEWAY_USER */}
            <Route path="/gateway" element={<GatewayRoutesWrapper />}>
              <Route element={<GatewayUserLayout><Outlet /></GatewayUserLayout>}>
                 <Route index element={<Navigate to="/gateway/dashboard" replace />} />
                <Route path="dashboard" element={<GatewayDashboard />} />
                <Route path="orders" element={<GatewayOrders />} />
              </Route>
            </Route>

            {/* 5. Rotas do Freelancer - REQUER ROLE FREELANCER */}
             <Route path="/freelancer" element={<FreelancerRoutesWrapper />}>
              <Route element={<FreelancerLayout><Outlet /></FreelancerLayout>}>
                 <Route index element={<Navigate to="/freelancer/dashboard" replace />} />
                <Route path="dashboard" element={<FreelancerDashboard />} />
                <Route path="orders" element={<FreelancerOrders />} />
                <Route path="new-order" element={<FreelancerNewOrder />} />
                <Route path="shopify-config" element={<FreelancerShopifyConfig />} />
              </Route>
            </Route>

            {/* 6. Rotas do Cliente - REQUER ROLE CLIENTE */}
            <Route path="/client" element={<ClientRoutesWrapper />}>
              <Route index element={<Navigate to="/client/dashboard" replace />} />
              <Route path="dashboard" element={<ClientDashboard />} />
            </Route>

            {/* Fallback para rotas não encontradas */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
