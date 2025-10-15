// src/routes/invoiceRoutes.ts
import { Router } from 'express';
import { supabaseAdmin } from '../lib/server/supabaseAdmin'; // ✅ Backend seguro
const router = Router();
/**
 * Converte valor para número de forma segura
 * @param value - Valor a ser convertido
 * @returns Número válido ou 0
 */
function safeParseAmount(value) {
    console.log(`[safeParseAmount] Entrada: ${value} (tipo: ${typeof value})`);
    // Tratar null/undefined
    if (value === null || value === undefined) {
        console.warn('[safeParseAmount] ⚠️ Valor null/undefined detectado');
        return 0;
    }
    // Se já é número válido
    if (typeof value === 'number' && !isNaN(value)) {
        console.log(`[safeParseAmount] Número válido: ${value}`);
        // Os valores na tabela order_items agora estão corretos em centavos
        // Sempre dividir por 100 para converter para reais
        const converted = value / 100;
        console.log(`[safeParseAmount] 🔧 Convertendo de centavos para reais: ${value} -> ${converted}`);
        return converted;
    }
    // Se é string, tentar converter
    if (typeof value === 'string') {
        console.log(`[safeParseAmount] String detectada: "${value}"`);
        // Remover espaços e trocar vírgula por ponto
        const cleaned = value.trim().replace(',', '.');
        const parsed = parseFloat(cleaned);
        if (isNaN(parsed)) {
            console.warn(`[safeParseAmount] ⚠️ Não foi possível converter "${value}" para número`);
            return 0;
        }
        console.log(`[safeParseAmount] String convertida para: ${parsed}`);
        // Assumir que strings também estão em centavos
        const converted = parsed / 100;
        console.log(`[safeParseAmount] 🔧 Convertendo string de centavos para reais: ${parsed} -> ${converted}`);
        return converted;
    }
    console.warn(`[safeParseAmount] ⚠️ Tipo inesperado para amount: ${typeof value}`, value);
    return 0;
}
/**
 * Valida se os dados da nota fiscal estão consistentes
 */
function validateInvoiceData(order, items, total) {
    const warnings = [];
    // Verificar se order.amount existe e é válido
    if (!order.amount || order.amount <= 0) {
        warnings.push(`Order amount inválido: ${order.amount}`);
    }
    // Verificar se total calculado é consistente
    if (total === 0 && order.amount > 0) {
        warnings.push(`Total calculado é 0 mas order.amount é ${order.amount}`);
    }
    // Verificar itens
    if (items.length === 0) {
        warnings.push('Nenhum item encontrado para a nota fiscal');
    }
    items.forEach((item, index) => {
        if (item.preco_item <= 0) {
            warnings.push(`Item ${index + 1} tem preço inválido: ${item.preco_item}`);
        }
    });
    if (warnings.length > 0) {
        console.warn('⚠️ PROBLEMAS DETECTADOS NA NOTA FISCAL:');
        warnings.forEach(w => console.warn(`  - ${w}`));
    }
    return warnings;
}
/**
 * GET /api/invoice/:orderId
 * Busca dados da nota fiscal para um pedido específico (acesso público)
 */
router.get('/invoice/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        if (!orderId) {
            return res.status(400).json({ error: 'ID do pedido é obrigatório' });
        }
        console.log(`[Invoice API] Buscando dados da nota fiscal para pedido: ${orderId}`);
        // 1. Buscar dados do pedido
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();
        if (orderError || !order) {
            console.error(`[Invoice API] Pedido não encontrado: ${orderError?.message}`);
            return res.status(404).json({ error: 'Pedido não encontrado' });
        }
        // Debug: verificar dados completos do pedido
        console.log(`[DEBUG] Pedido completo:`, JSON.stringify(order, null, 2));
        // Diagnóstico avançado do valor
        console.log('=== DIAGNÓSTICO NOTA FISCAL ===');
        console.log('order.amount (raw):', order.amount);
        console.log('typeof order.amount:', typeof order.amount);
        console.log('Number(order.amount):', Number(order.amount));
        console.log('parseFloat(order.amount):', parseFloat(String(order.amount)));
        console.log('isNaN(Number(order.amount)):', isNaN(Number(order.amount)));
        console.log('safeParseAmount(order.amount):', safeParseAmount(order.amount));
        // 2. Buscar dados do cliente (se a tabela existir)
        let customerProfile = null;
        try {
            const { data } = await supabaseAdmin
                .from('customers')
                .select('*')
                .eq('email', order.customer_email)
                .single();
            customerProfile = data;
        }
        catch (err) {
            console.log('[Invoice API] Tabela customers não existe ou erro ao buscar - usando dados do pedido');
        }
        // 3. Buscar itens do pedido (se a tabela existir)
        let items = null;
        try {
            console.log(`[Invoice API] Buscando itens para order_id: ${orderId}`);
            const { data, error } = await supabaseAdmin
                .from('order_items')
                .select('product_name, quantity, unit_price')
                .eq('order_id', orderId);
            if (error) {
                console.error('[Invoice API] Erro ao buscar itens:', error);
            }
            else {
                items = data;
                console.log(`[Invoice API] ${items?.length || 0} itens encontrados na tabela order_items:`, items);
                // Log detalhado de cada item
                items?.forEach((item, index) => {
                    console.log(`[Invoice API] Item ${index + 1}:`, {
                        product_name: item.product_name,
                        quantity: item.quantity,
                        unit_price_raw: item.unit_price,
                        unit_price_type: typeof item.unit_price
                    });
                });
            }
        }
        catch (err) {
            console.error('[Invoice API] Erro ao buscar order_items:', err);
            console.log('[Invoice API] Usando dados padrão devido ao erro');
        }
        // 4. Preparar dados da resposta com conversão segura
        const endereco_cliente = [
            customerProfile?.address_street || 'Rua não informada',
            customerProfile?.address_number,
            customerProfile?.address_complement,
            `${customerProfile?.address_city || order.city || 'Cidade não informada'} - ${customerProfile?.address_state || order.state || 'Estado não informado'}`,
            `CEP: ${customerProfile?.address_zip_code || 'CEP não informado'}`,
            'Brasil'
        ].filter(Boolean).join(', ');
        // Usar conversão segura para os itens
        const invoiceItems = (items && items.length > 0)
            ? items.map((item, index) => {
                console.log(`[DEBUG] Processando item ${index + 1}/${items.length}:`);
                console.log(`[DEBUG]   - Nome: ${item.product_name}`);
                console.log(`[DEBUG]   - Quantidade: ${item.quantity}`);
                console.log(`[DEBUG]   - Preço original: ${item.unit_price} (tipo: ${typeof item.unit_price})`);
                const convertedPrice = safeParseAmount(item.unit_price);
                console.log(`[DEBUG]   - Preço convertido: ${convertedPrice}`);
                console.log(`[DEBUG]   - Valor total do item: ${item.quantity * convertedPrice}`);
                const itemResult = {
                    nome_item: item.product_name,
                    quantidade: item.quantity,
                    preco_item: convertedPrice
                };
                console.log(`[DEBUG]   - Item final:`, itemResult);
                return itemResult;
            })
            : [{
                    nome_item: 'Serviço de Transporte',
                    quantidade: 1,
                    preco_item: safeParseAmount(order.amount)
                }];
        console.log(`[DEBUG] Total de itens processados: ${invoiceItems.length}`);
        // Calcular total com validação
        let total = invoiceItems.reduce((sum, item) => {
            const itemTotal = item.quantidade * item.preco_item;
            console.log(`[DEBUG] Item: ${item.nome_item}, Qtd: ${item.quantidade}, Preço: ${item.preco_item}, Total: ${itemTotal}`);
            return sum + itemTotal;
        }, 0);
        console.log(`[DEBUG] Total inicial calculado: ${total}`);
        // Validar dados antes de retornar
        const validationWarnings = validateInvoiceData(order, invoiceItems, total);
        // Se total ainda for 0, tentar recuperação
        if (total === 0 && safeParseAmount(order.amount) > 0) {
            console.warn('🔧 TENTANDO RECUPERAÇÃO: Total é 0, usando order.amount diretamente');
            const recoveredAmount = safeParseAmount(order.amount);
            // Se há múltiplos itens, distribuir o valor entre eles
            if (invoiceItems.length > 1) {
                const totalQuantity = invoiceItems.reduce((sum, item) => sum + item.quantidade, 0);
                console.log(`[DEBUG] Distribuindo R$ ${recoveredAmount.toFixed(2)} entre ${invoiceItems.length} itens (${totalQuantity} unidades)`);
                invoiceItems.forEach((item, index) => {
                    const proportion = item.quantidade / totalQuantity;
                    item.preco_item = (recoveredAmount * proportion) / item.quantidade;
                    console.log(`[DEBUG] Item ${index + 1}: ${item.quantidade}x R$ ${item.preco_item.toFixed(2)} = R$ ${(item.quantidade * item.preco_item).toFixed(2)}`);
                });
            }
            else {
                // Se há apenas um item, dar todo o valor para ele
                invoiceItems[0].preco_item = recoveredAmount / invoiceItems[0].quantidade;
                console.log(`[DEBUG] Item único: ${invoiceItems[0].quantidade}x R$ ${invoiceItems[0].preco_item.toFixed(2)}`);
            }
            // Recalcular total
            total = invoiceItems.reduce((sum, item) => sum + (item.quantidade * item.preco_item), 0);
            console.log(`[DEBUG] Total após recuperação: ${total}`);
        }
        // Debug final
        console.log(`[DEBUG] Items finais:`, invoiceItems);
        console.log(`[DEBUG] Total final: ${total}`);
        console.log(`[DEBUG] Endereço cliente: ${endereco_cliente}`);
        const invoiceData = {
            nome_cliente: order.customer_name,
            cpf_cliente: order.customer_cpf || customerProfile?.cpf || 'N/A',
            endereco_cliente,
            itens: invoiceItems,
            total,
            nome_loja: 'Via Forte Express',
            data_emissao: new Date(order.created_at).toLocaleString('pt-BR'),
            numero_pedido: order.payment_id || order.id,
            numero_nf: order.invoice_number || Date.now().toString().slice(-9),
        };
        // Validação final antes de retornar
        if (total === 0) {
            console.error('🚨 NOTA FISCAL COM VALORES ZERADOS - DADOS PODEM ESTAR INCORRETOS');
            console.error('Dados do pedido original:', {
                id: order.id,
                amount: order.amount,
                customer_name: order.customer_name,
                payment_id: order.payment_id
            });
        }
        console.log(`[Invoice API] Dados da nota fiscal encontrados para pedido: ${orderId}`);
        console.log(`[Invoice API] Total da nota fiscal: R$ ${total.toFixed(2)}`);
        res.json({
            success: true,
            data: invoiceData,
            debug: {
                originalAmount: order.amount,
                convertedAmount: safeParseAmount(order.amount),
                itemsCount: invoiceItems.length,
                validationWarnings: validationWarnings.length > 0 ? validationWarnings : undefined
            }
        });
    }
    catch (error) {
        console.error('[Invoice API] Erro ao buscar dados da nota fiscal:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            message: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
});
export default router;
