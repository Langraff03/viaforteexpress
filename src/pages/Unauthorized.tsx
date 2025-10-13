import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export function Unauthorized() {
  const navigate = useNavigate();
  const { user } = useAuth();

  console.log('🚫 DEBUG [Unauthorized] Página de acesso negado renderizada para:', user?.email);

  const handleGoBack = () => {
    if (user?.role === 'admin') {
      navigate('/admin/dashboard');
    } else if (user?.role === 'gateway_user') {
      navigate('/gateway/dashboard');
    } else if (user?.role === 'freelancer') {
      navigate('/freelancer/dashboard');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <svg
            className="mx-auto h-16 w-16 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Acesso Negado
        </h1>
        
        <p className="text-gray-600 mb-6">
          Você não tem permissão para acessar esta página.
        </p>

        <button
          onClick={handleGoBack}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition duration-200"
        >
          Voltar para o Dashboard
        </button>
      </div>
    </div>
  );
}