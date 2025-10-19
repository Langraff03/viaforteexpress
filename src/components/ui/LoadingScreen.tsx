import React from 'react';
import { Loader } from 'lucide-react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      <Loader className="h-16 w-16 animate-spin text-blue-600 mb-6" />
      <p className="text-xl font-medium text-gray-700">Carregando informações do pedido...</p>
      <p className="text-gray-500 mt-2">Só um instante, estamos buscando os detalhes para você.</p>
    </div>
  );
};

export default LoadingScreen;

