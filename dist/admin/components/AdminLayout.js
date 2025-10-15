import { jsx as _jsx } from "react/jsx-runtime";
const AdminLayout = ({ children }) => {
    // const { user, loading } = useAuth(); // Ou autenticação específica do administrador
    // if (loading) return <p>Loading admin session...</p>;
    // if (!user) { // Ou !isAdminUser (se houver uma verificação específica para usuário administrador)
    //   // Redirecionar para o login ou mostrar uma mensagem de não autorizado
    //   // Isso pode ser melhor tratado pelo AuthGuard
    //   return <p>Unauthorized. Please log in as an admin.</p>;
    // }
    return (_jsx("div", { className: "admin-layout", children: _jsx("div", { className: "admin-main-content", children: _jsx("main", { className: "admin-page-content p-4", children: children }) }) }));
};
export default AdminLayout;
