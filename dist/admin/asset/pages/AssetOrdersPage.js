import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState, useCallback } from 'react';
const AssetOrdersPage = () => {
    // const { user, token } = useAdminAuth(); // Exemplo
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [clientIdFilter, setClientIdFilter] = useState('cliente-asset'); // Padrão ou permitir seleção
    const fetchOrders = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // TODO: Substitua pela sua chamada de API real
            // O backend deve filtrar os pedidos por gateway='asset' e opcionalmente por clientIdFilter
            const response = await fetch(`/api/admin/orders?gateway=asset&clientId=${clientIdFilter}`, {
            // headers: { 'Authorization': `Bearer ${token}` } // Se estiver usando autenticação por token
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || `Failed to fetch Asset orders (${response.status})`);
            }
            const data = await response.json();
            setOrders(data.orders || []);
        }
        catch (err) {
            setError(err.message);
            setOrders([]);
        }
        finally {
            setIsLoading(false);
        }
    }, [clientIdFilter /*, token */]); // A vírgula antes de token é intencional caso o comentário seja removido
    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);
    const handleCancelPayment = async (paymentId, orderId) => {
        if (!window.confirm(`Are you sure you want to attempt to cancel payment ${paymentId} for order ${orderId}?`))
            return;
        try {
            // TODO: Substitua pela sua chamada de API real para o backend
            // Este endpoint do backend chamaria gateway.cancelPayment()
            const response = await fetch(`/api/admin/payments/${paymentId}/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' /*, 'Authorization': `Bearer ${token}` */ }, // A vírgula antes de Authorization é intencional
                body: JSON.stringify({ clientId: clientIdFilter }) // Passe o clientId para selecionar a instância correta do gateway
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || `Failed to cancel payment (${response.status})`);
            }
            alert(`Payment ${paymentId} cancellation initiated. Refreshing list...`);
            fetchOrders(); // Atualizar lista
        }
        catch (err) {
            alert(`Error cancelling payment: ${err.message}`);
        }
    };
    if (isLoading)
        return _jsxs("p", { children: ["Loading Asset orders for client '", clientIdFilter, "'..."] });
    if (error)
        return _jsxs("p", { children: ["Error: ", error] });
    return (_jsxs("div", { children: [_jsx("h1", { children: "Asset Gateway Orders" }), _jsxs("div", { children: [_jsx("label", { htmlFor: "clientIdFilter", children: "Client ID Filter: " }), _jsx("input", { type: "text", id: "clientIdFilter", value: clientIdFilter, onChange: (e) => setClientIdFilter(e.target.value), placeholder: "e.g., cliente-asset" }), _jsx("button", { onClick: fetchOrders, style: { marginLeft: '10px' }, children: "Refresh Orders" })] }), orders.length === 0 ? (_jsxs("p", { children: ["No Asset orders found for client '", clientIdFilter, "'."] })) : (_jsxs("table", { style: { width: '100%', marginTop: '20px', borderCollapse: 'collapse' }, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { style: tableHeaderStyle, children: "Order ID" }), _jsx("th", { style: tableHeaderStyle, children: "Payment ID" }), _jsx("th", { style: tableHeaderStyle, children: "Customer" }), _jsx("th", { style: tableHeaderStyle, children: "Amount" }), _jsx("th", { style: tableHeaderStyle, children: "Status" }), _jsx("th", { style: tableHeaderStyle, children: "Created At" }), _jsx("th", { style: tableHeaderStyle, children: "Actions" })] }) }), _jsx("tbody", { children: orders.map((order) => (_jsxs("tr", { children: [_jsx("td", { style: tableCellStyle, children: order.id }), _jsx("td", { style: tableCellStyle, children: order.payment_id || 'N/A' }), _jsxs("td", { style: tableCellStyle, children: [order.customer_name, " (", order.customer_email, ")"] }), _jsxs("td", { style: tableCellStyle, children: [order.amount ? (order.amount / 100).toFixed(2) : 'N/A', " "] }), _jsx("td", { style: tableCellStyle, children: order.payment_status || 'N/A' }), _jsx("td", { style: tableCellStyle, children: new Date(order.created_at).toLocaleString() }), _jsxs("td", { style: tableCellStyle, children: [_jsx("button", { onClick: () => alert('View details for ' + order.id), children: "View" }), (order.payment_status === 'PENDING' || order.payment_status === 'pending' || order.payment_status === 'WAITING_PAYMENT') && order.payment_id && (_jsx("button", { onClick: () => handleCancelPayment(order.payment_id, order.id), style: { marginLeft: '5px' }, children: "Cancel Payment" }))] })] }, order.id))) })] }))] }));
};
const tableHeaderStyle = {
    border: '1px solid #ddd',
    padding: '8px',
    textAlign: 'left',
    backgroundColor: '#f2f2f2',
};
const tableCellStyle = {
    border: '1px solid #ddd',
    padding: '8px',
    textAlign: 'left',
};
export default AssetOrdersPage;
