// Placeholder para chamadas de serviço da API de Administração do Asset
/**
 * Busca pedidos relacionados ao gateway Asset para um cliente específico.
 * Isso normalmente chamaria um endpoint de backend.
 */
export const fetchAssetOrdersForClient = async (clientId, authToken) => {
    console.log(`Simulating API call: fetchAssetOrdersForClient for clientId: ${clientId}`);
    // const response = await fetch(`/api/admin/orders?gateway=asset&clientId=${clientId}`, {
    //   headers: {
    //     // 'Authorization': `Bearer ${authToken}`,
    //     'Content-Type': 'application/json',
    //   },
    // });
    // if (!response.ok) {
    //   const errorData = await response.json().catch(() => ({ message: 'Failed to fetch Asset orders' }));
    //   throw new Error(errorData.message || 'Failed to fetch Asset orders');
    // }
    // return response.json();
    // Resposta mockada:
    await new Promise(resolve => setTimeout(resolve, 500)); // Simular atraso de rede
    if (clientId === 'cliente-asset-error')
        throw new Error("Simulated API error for Asset orders.");
    return {
        orders: [
            { id: 'order_asset_1', payment_id: 'asset_pay_123', client_id: clientId, gateway: 'asset', customer_name: 'Asset Customer 1', customer_email: 'asset1@example.com', amount: 10000, payment_status: 'PAID', created_at: new Date().toISOString() },
            { id: 'order_asset_2', payment_id: 'asset_pay_456', client_id: clientId, gateway: 'asset', customer_name: 'Asset Customer 2', customer_email: 'asset2@example.com', amount: 7500, payment_status: 'PENDING', created_at: new Date().toISOString() },
        ]
    };
};
/**
 * Inicia o cancelamento de um pagamento Asset através do backend.
 */
export const cancelAssetPaymentAdmin = async (paymentId, clientId, authToken) => {
    console.log(`Simulating API call: cancelAssetPaymentAdmin for paymentId: ${paymentId}, clientId: ${clientId}`);
    // const response = await fetch(`/api/admin/payments/${paymentId}/cancel`, {
    //   method: 'POST',
    //   headers: {
    //     // 'Authorization': `Bearer ${authToken}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({ clientId }), // Backend needs clientId to select correct gateway instance
    // });
    // if (!response.ok) {
    //   const errorData = await response.json().catch(() => ({ message: 'Failed to cancel Asset payment' }));
    //   throw new Error(errorData.message || 'Failed to cancel Asset payment');
    // }
    // return response.json();
    await new Promise(resolve => setTimeout(resolve, 300));
    return { success: true, message: `Asset payment ${paymentId} cancellation initiated.` };
};
/**
 * Busca a configuração do gateway para o Asset para um cliente específico.
 */
export const getAssetGatewayConfig = async (clientId, authToken) => {
    console.log(`Simulating API call: getAssetGatewayConfig for clientId: ${clientId}`);
    // const response = await fetch(`/api/admin/gateway-configurations?gateway_provider=asset&client_id=${clientId}`, {
    //   headers: { /* 'Authorization': `Bearer ${authToken}` */ },
    // });
    // if (!response.ok) { 
    //   if(response.status === 404) return { config: null }; // No config found is not an error for fetching
    //   throw new Error('Failed to fetch Asset gateway config'); 
    // }
    // return response.json();
    await new Promise(resolve => setTimeout(resolve, 200));
    if (clientId === 'cliente-asset-no-config')
        return { config: null };
    return {
        config: {
            id: 1,
            client_id: clientId,
            gateway_provider: 'asset',
            api_key: '****_mock_key',
            webhook_secret: '****_mock_secret',
            is_active: true
        }
    };
};
/**
 * Salva (cria ou atualiza) a configuração do gateway para o Asset para um cliente específico.
 */
export const saveAssetGatewayConfig = async (configData, authToken) => {
    const { id, ...payload } = configData;
    console.log(`Simulating API call: saveAssetGatewayConfig with id: ${id}`, payload);
    // const url = id ? `/api/admin/gateway-configurations/${id}` : '/api/admin/gateway-configurations';
    // const method = id ? 'PUT' : 'POST';
    // const response = await fetch(url, {
    //   method: method,
    //   headers: {
    //     'Content-Type': 'application/json',
    //     // 'Authorization': `Bearer ${authToken}`,
    //   },
    //   body: JSON.stringify(payload),
    // });
    // if (!response.ok) { throw new Error('Failed to save Asset gateway config'); }
    // return response.json();
    await new Promise(resolve => setTimeout(resolve, 400));
    return { config: { ...payload, id: id || Math.floor(Math.random() * 1000) } };
};
