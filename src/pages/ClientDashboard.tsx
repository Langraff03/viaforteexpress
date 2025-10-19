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

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Portal do Cliente
            </h1>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-2">Bem-vindo, {user?.name || user?.email}!</h2>
          <p className="text-gray-600">
            Aqui você pode acompanhar seus pedidos e gerenciar suas informações.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Meus Pedidos</h3>
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <p className="text-gray-600 mb-4">
              Visualize e acompanhe todos os seus pedidos
            </p>
            <button
              onClick={() => navigate('/client/orders')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
            >
              Ver Pedidos
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Minhas Faturas</h3>
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-gray-600 mb-4">
              Acesse suas faturas e comprovantes
            </p>
            <button
              onClick={() => navigate('/client/invoices')}
              className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition"
            >
              Ver Faturas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}