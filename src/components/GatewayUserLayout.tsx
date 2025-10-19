import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  LogOut,
  Package,
  CreditCard,
  Settings,
  BarChart,
  Menu,
  Bell,
  Clock,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../lib/auth';

const GatewayUserLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
    
    if (parts.length < 2) return [];
    
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navegação Superior */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              {/* Botão de menu mobile */}
              <button
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 lg:hidden hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <Menu className="block h-6 w-6" aria-hidden="true" />
              </button>
              
              <div className="flex items-center flex-shrink-0">
                <CreditCard className="w-8 h-8 text-indigo-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">
                  Gateway {user?.gatewayType?.toUpperCase() || 'PAGAMENTOS'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Data e hora atual */}
              <div className="hidden md:flex items-center text-sm text-gray-500">
                <Clock className="w-4 h-4 mr-1" />
                {currentTime.toLocaleDateString('pt-BR')} {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
              
              {/* Notificações */}
              <div className="relative">
                <button className="p-1 text-gray-400 rounded-full hover:bg-gray-100 hover:text-gray-500 focus:outline-none">
                  <Bell className="w-6 h-6" />
                </button>
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
                  2
                </span>
              </div>
              
              {/* Perfil do usuário */}
              <div className="relative flex-shrink-0">
                <div className="flex items-center">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {user?.email?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-400 border-2 border-white"></span>
                  </div>
                  <div className="ml-3 hidden md:block">
                    <div className="text-sm font-medium text-gray-700">{user?.email}</div>
                    <div className="text-xs text-gray-500">
                      {user?.clientName || 'Via Forte Express'}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Botão de logout */}
              <button
                onClick={() => signOut()}
                className="p-1 text-gray-400 rounded-full hover:bg-gray-100 hover:text-gray-500 focus:outline-none"
                title="Sair"
              >
                <LogOut className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Menu mobile */}
      <div className={`lg:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="pt-2 pb-3 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-4 py-2 text-base font-medium ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600 border-l-4 border-indigo-500'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex">
        {/* Menu Lateral */}
        <div className="hidden lg:block w-64 min-h-screen bg-white shadow-lg border-r border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Painel de Controle</h2>
            <p className="text-sm text-gray-500">Gerencie seu gateway</p>
          </div>
          <nav className="mt-4">
            <div className="px-2 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-3 py-3 text-sm font-medium rounded-md transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-700 border-r-4 border-indigo-500'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-indigo-500' : 'text-gray-400 group-hover:text-indigo-500'}`} />
                    <div>
                      <div>{item.name}</div>
                      <p className={`text-xs ${isActive ? 'text-indigo-500' : 'text-gray-400'}`}>{item.description}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </nav>
          
          {/* Status do sistema */}
          <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center">
                  <div className="h-2.5 w-2.5 rounded-full bg-green-400 mr-2"></div>
                  <p className="text-sm text-gray-500">Sistema operacional</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo Principal */}
        {/* Conteúdo Principal */}
        <main className="flex-1 overflow-auto">
          {/* Removida a navegação por breadcrumbs para simplificar a interface e evitar problemas de carregamento */}
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default GatewayUserLayout;