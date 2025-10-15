import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, LogOut, Bell, Package, Settings, Mail, Send } from 'lucide-react';
import { useAuth } from '../lib/auth';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navegação Superior */}
      <nav className="bg-white border-b border-gray-200">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex items-center flex-shrink-0">
                <Package className="w-8 h-8 text-indigo-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">Via Forte Express</span>
              </div>
            </div>
            <div className="flex items-center">
              <button className="p-1 text-gray-400 hover:text-gray-500">
                <Bell className="w-6 h-6" />
              </button>
              <div className="flex items-center ml-4">
                <div className="relative flex-shrink-0">
                  <div>
                    <div className="flex items-center">
                      <div>
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {user?.email?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-700">{user?.email}</div>
                        <div className="text-xs text-gray-500">
                          {isAdmin ? 'Admin' : isGatewayUser ? 'Gateway User' : 'Usuário'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => signOut()}
                  className="ml-4 text-gray-400 hover:text-gray-500"
                >
                  <LogOut className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Menu Lateral */}
        <div className="w-64 min-h-screen bg-white border-r border-gray-200">
          <nav className="flex flex-col p-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Conteúdo Principal */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;