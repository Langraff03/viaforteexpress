import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import AuthGuard from './components/AuthGuard';

// Importar páginas reais
import AssetOrdersPage from './asset/pages/AssetOrdersPage';
import AssetSettingsPage from './asset/pages/AssetSettingsPage';

// Página de Dashboard do Asset (implementação inline)
const AssetDashboardPage = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold mb-4">Gateway Asset - Dashboard</h2>
    <p className="mb-6">Painel de controle do gateway Asset para gerenciamento de pedidos e configurações.</p>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
        <h3 className="text-lg font-semibold mb-2">Gerenciar Pedidos</h3>
        <p className="text-gray-600 mb-4">Visualize e gerencie todos os pedidos do gateway Asset.</p>
        <a href="/admin/asset/orders" className="text-indigo-600 hover:text-indigo-800 font-medium">
          Ver Pedidos →
        </a>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
        <h3 className="text-lg font-semibold mb-2">Configurações</h3>
        <p className="text-gray-600 mb-4">Configure as opções do gateway Asset.</p>
        <a href="/admin/asset/settings" className="text-indigo-600 hover:text-indigo-800 font-medium">
          Configurar →
        </a>
      </div>
    </div>
  </div>
);

// Página de Painel de Administração Principal
const AdminDashboardPage = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold mb-4">Painel de Administração</h2>
    <p className="mb-6">Bem-vindo à área administrativa do sistema multi-gateway.</p>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
        <h3 className="text-lg font-semibold mb-2">Gateway Asset</h3>
        <p className="text-gray-600 mb-4">Gerencie configurações e pedidos do gateway Asset.</p>
        <a href="/admin/asset" className="text-indigo-600 hover:text-indigo-800 font-medium">
          Acessar →
        </a>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
        <h3 className="text-lg font-semibold mb-2">Gateway MercadoPago</h3>
        <p className="text-gray-600 mb-4">Gerencie configurações e pedidos do gateway MercadoPago.</p>
        <a href="/admin/mercadopago" className="text-indigo-600 hover:text-indigo-800 font-medium">
          Acessar →
        </a>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
        <h3 className="text-lg font-semibold mb-2">Gateway PagarMe</h3>
        <p className="text-gray-600 mb-4">Gerencie configurações e pedidos do gateway PagarMe.</p>
        <a href="/admin/pagarme" className="text-indigo-600 hover:text-indigo-800 font-medium">
          Acessar →
        </a>
      </div>
    </div>
  </div>
);

// Placeholders para gateways ainda não implementados
const MercadoPagoDashboardPage = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold mb-4">MercadoPago Gateway</h2>
    <p className="text-yellow-600 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
      Este gateway está em desenvolvimento e será implementado em breve.
    </p>
  </div>
);

const MercadoPagoOrdersPage = () => <div className="p-6">MercadoPago Gateway Orders (Em desenvolvimento)</div>;
const MercadoPagoSettingsPage = () => <div className="p-6">MercadoPago Gateway Settings (Em desenvolvimento)</div>;

const PagarMeDashboardPage = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold mb-4">PagarMe Gateway</h2>
    <p className="text-yellow-600 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
      Este gateway está em desenvolvimento e será implementado em breve.
    </p>
  </div>
);
const PagarMeOrdersPage = () => <div className="p-6">PagarMe Gateway Orders (Em desenvolvimento)</div>;
const PagarMeSettingsPage = () => <div className="p-6">PagarMe Gateway Settings (Em desenvolvimento)</div>;

const AdminRoutes = () => {
  return (
    <AuthGuard allowedRoles={['admin']} requireClient={true}>
      <AdminLayout>
        <Routes>
          <Route path="/" element={<AdminDashboardPage />} />
          
          {/* Rotas de Administração do Gateway Asset */}
          <Route path="asset" element={<AssetDashboardPage />} />
          <Route path="asset/orders" element={<AssetOrdersPage />} />
          <Route path="asset/settings" element={<AssetSettingsPage />} />

          {/* Rotas de Administração do Gateway MercadoPago */}
          <Route path="mercadopago" element={<MercadoPagoDashboardPage />} />
          <Route path="mercadopago/orders" element={<MercadoPagoOrdersPage />} />
          <Route path="mercadopago/settings" element={<MercadoPagoSettingsPage />} />

          {/* Rotas de Administração do Gateway Pagar.me */}
          <Route path="pagarme" element={<PagarMeDashboardPage />} />
          <Route path="pagarme/orders" element={<PagarMeOrdersPage />} />
          <Route path="pagarme/settings" element={<PagarMeSettingsPage />} />
          
          {/* Fallback para quaisquer rotas de administração não correspondidas */}
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </AdminLayout>
    </AuthGuard>
  );
};

export default AdminRoutes;