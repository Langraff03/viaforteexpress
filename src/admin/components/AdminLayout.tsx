import React, { ReactNode } from 'react';
// import AdminNavbar from './AdminNavbar'; // Exemplo: se você tiver uma barra de navegação de administrador específica
// import AdminSidebar from './AdminSidebar'; // Exemplo: se você tiver uma barra lateral de administrador
// import { useAuth } from '../../hooks/useAuth'; // Supondo que seu hook de autenticação principal possa ser usado ou adaptado

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  // const { user, loading } = useAuth(); // Ou autenticação específica do administrador

  // if (loading) return <p>Loading admin session...</p>;
  // if (!user) { // Ou !isAdminUser (se houver uma verificação específica para usuário administrador)
  //   // Redirecionar para o login ou mostrar uma mensagem de não autorizado
  //   // Isso pode ser melhor tratado pelo AuthGuard
  //   return <p>Unauthorized. Please log in as an admin.</p>;
  // }

  return (
    <div className="admin-layout">
      {/* <AdminSidebar /> */}
      <div className="admin-main-content">
        {/* <AdminNavbar /> */}
        <main className="admin-page-content p-4">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;