import React, { useEffect, useState, useCallback } from 'react';
// import { Link } from 'react-router-dom'; // Se estiver usando o React Router para visualizações de detalhes
// import { useAdminAuth } from '../../hooks/useAdminAuth'; // Seu hook de autenticação específico do administrador

// Placeholder para a interface AdminOrder, defina-a com base nas suas necessidades
interface AdminOrder {
  id: string; // Seu ID de pedido interno
  payment_id: string | null; // ID de pagamento do gateway
  client_id: string | null;
  gateway: string | null;
  customer_name: string | null;
  customer_email: string | null;
  amount: number | null;
  payment_status: string | null;
  created_at: string;
  // Adicione outros campos que você espera da sua tabela 'orders'
}

const AssetOrdersPage = () => {
  // const { user, token } = useAdminAuth(); // Exemplo
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    } catch (err: any) {
      setError(err.message);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [clientIdFilter /*, token */]); // A vírgula antes de token é intencional caso o comentário seja removido

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleCancelPayment = async (paymentId: string, orderId: string) => {
    if (!window.confirm(`Are you sure you want to attempt to cancel payment ${paymentId} for order ${orderId}?`)) return;
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
    } catch (err: any) {
      alert(`Error cancelling payment: ${err.message}`);
    }
  };

  if (isLoading) return <p>Loading Asset orders for client '{clientIdFilter}'...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h1>Asset Gateway Orders</h1>
      <div>
        <label htmlFor="clientIdFilter">Client ID Filter: </label>
        <input 
          type="text" 
          id="clientIdFilter" 
          value={clientIdFilter} 
          onChange={(e) => setClientIdFilter(e.target.value)} 
          placeholder="e.g., cliente-asset"
        />
        <button onClick={fetchOrders} style={{ marginLeft: '10px' }}>Refresh Orders</button>
      </div>
      {orders.length === 0 ? (
        <p>No Asset orders found for client '{clientIdFilter}'.</p>
      ) : (
        <table style={{ width: '100%', marginTop: '20px', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>Order ID</th>
              <th style={tableHeaderStyle}>Payment ID</th>
              <th style={tableHeaderStyle}>Customer</th>
              <th style={tableHeaderStyle}>Amount</th>
              <th style={tableHeaderStyle}>Status</th>
              <th style={tableHeaderStyle}>Created At</th>
              <th style={tableHeaderStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td style={tableCellStyle}>{order.id}</td>
                <td style={tableCellStyle}>{order.payment_id || 'N/A'}</td>
                <td style={tableCellStyle}>{order.customer_name} ({order.customer_email})</td>
                <td style={tableCellStyle}>
                  {order.amount ? (order.amount / 100).toFixed(2) : 'N/A'} {/* Supondo que o valor está em centavos */}
                </td>
                <td style={tableCellStyle}>{order.payment_status || 'N/A'}</td>
                <td style={tableCellStyle}>{new Date(order.created_at).toLocaleString()}</td>
                <td style={tableCellStyle}>
                  {/* <Link to={`/admin/asset/orders/${order.id}`}>Visualizar</Link> */}
                  <button onClick={() => alert('View details for ' + order.id)}>View</button>
                  {(order.payment_status === 'PENDING' || order.payment_status === 'pending' || order.payment_status === 'WAITING_PAYMENT') && order.payment_id && (
                    <button 
                      onClick={() => handleCancelPayment(order.payment_id!, order.id)} 
                      style={{ marginLeft: '5px' }}
                    >
                      Cancel Payment
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

const tableHeaderStyle: React.CSSProperties = {
  border: '1px solid #ddd',
  padding: '8px',
  textAlign: 'left',
  backgroundColor: '#f2f2f2',
};

const tableCellStyle: React.CSSProperties = {
  border: '1px solid #ddd',
  padding: '8px',
  textAlign: 'left',
};

export default AssetOrdersPage;