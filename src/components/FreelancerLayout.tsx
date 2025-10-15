import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  LogOut,
  Package,
  Plus,
  Menu,
  Bell,
  Clock,
  User,
  Store,
  Settings
} from 'lucide-react';
import { useAuth } from '../lib/auth';

const FreelancerLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
      name: 'Dashboard',
      href: '/freelancer/dashboard',
      icon: Home,
      description: 'Visão geral dos seus pedidos'
    },
    {
      name: 'Meus Pedidos',
      href: '/freelancer/orders',
      icon: Package,
      description: 'Histórico completo'
    },
    {
      name: 'Criar Pedido',
      href: '/freelancer/new-order',
      icon: Plus,
      description: 'Novo rastreamento'
    },
    {
      name: 'Configurações Shopify',
      href: '/freelancer/shopify-config',
      icon: Store,
      description: 'Integração com Shopify'
    }
  ];

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
                <User className="w-8 h-8 text-emerald-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">
                  Painel Freelancer
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Data e hora atual */}
              <div className="hidden md:flex items-center text-sm text-gray-500">
                <Clock className="w-4 h-4 mr-1" />
                {currentTime.toLocaleDateString('pt-BR')} {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
              
              {/* Perfil do usuário */}
              <div className="relative flex-shrink-0">
                <div className="flex items-center">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-600 to-green-600 flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {user?.email?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-400 border-2 border-white"></span>
                  </div>
                  <div className="ml-3 hidden md:block">
                    <div className="text-sm font-medium text-gray-700">{user?.name || user?.email}</div>
                    <div className="text-xs text-gray-500">
                      Freelancer
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
                    ? 'bg-emerald-50 text-emerald-600 border-l-4 border-emerald-500'
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
            <h2 className="text-lg font-medium text-gray-900">Área do Freelancer</h2>
            <p className="text-sm text-gray-500">Gerencie seus rastreamentos</p>
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
                        ? 'bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 border-r-4 border-emerald-500'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-emerald-600'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-emerald-500' : 'text-gray-400 group-hover:text-emerald-500'}`} />
                    <div>
                      <div>{item.name}</div>
                      <p className={`text-xs ${isActive ? 'text-emerald-500' : 'text-gray-400'}`}>{item.description}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </nav>
          
          {/* Status do usuário */}
          <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 mr-2"></div>
                  <p className="text-sm text-gray-500">Online</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default FreelancerLayout;