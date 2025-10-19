import * as React from 'react';
import { supabaseAdmin } from './server/supabaseAdmin'; // ✅ Uso seguro do backend
import InvoiceTemplate, { InvoiceData, InvoiceItem } from '../emails/InvoiceTemplate';
import { generatePdfFromComponent } from '../utils/pdfGenerator';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Interface para os dados do pedido necessários para gerar a nota fiscal
 */
interface OrderData {
  id: string;
  customer_name: string;
  customer_email: string;
  amount: number;
  tracking_code: string;
  payment_id: string;
  city?: string;
  state?: string;
  client_id?: string;
  gateway_id?: string;
}

/**
 * Interface para os dados do cliente
 */
interface CustomerData {
  name: string;
  email: string;
  cpf?: string;
  cnpj?: string;
  address?: {
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
}

/**
 * Interface para os dados do item do pedido
 */
interface OrderItemData {
  title: string;
  quantity: number;
  unitPrice: number;
}

/**
 * Gera um número de nota fiscal único baseado no ID do pedido
 */
function generateInvoiceNumber(orderId: string): string {
  // Usar os últimos 6 caracteres do ID do pedido + timestamp atual
  const timestamp = Date.now().toString().slice(-6);
  const orderIdPart = orderId.replace(/[^a-zA-Z0-9]/g, '').slice(-6);
  return `${timestamp}${orderIdPart}`.slice(0, 9);
}

/**
 * Gera uma nota fiscal para um pedido
 * @param orderId ID do pedido
 * @param customerData Dados do cliente (opcional, será buscado no banco se não fornecido)
 * @param items Itens do pedido (opcional, será simulado se não fornecido)
 * @returns Caminho do arquivo PDF gerado
 */
export async function generateInvoice(
  orderId: string,
  customerData?: CustomerData,
  items?: OrderItemData[]
): Promise<string> {
  try {
    console.log(`🧾 Gerando nota fiscal para pedido ${orderId}`);
    
    // 1. Buscar dados do pedido no banco
    const { data: orderData, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();
      
    if (orderError || !orderData) {
      console.error(`❌ Erro ao buscar pedido ${orderId}:`, orderError);
      throw new Error(`Pedido não encontrado: ${orderId}`);
    }
    
    const order = orderData as OrderData;
    
    // 2. Buscar dados do cliente no gateway (se não fornecido)
    let customer = customerData;
    if (!customer) {
      // Buscar dados do cliente na tabela 'customers' ou 'profiles' se existir
      // Por enquanto, vamos usar os dados básicos do pedido e deixar o resto para ser preenchido
      const { data: customerProfile, error: customerError } = await supabaseAdmin
        .from('customers') // Supondo que exista uma tabela 'customers'
        .select('*')
        .eq('email', order.customer_email)
        .single();

      if (customerError && customerError.code !== 'PGRST116') { // Ignora erro de "não encontrado"
        console.warn(`Aviso ao buscar cliente: ${customerError.message}`);
      }

      customer = {
        name: order.customer_name,
        email: order.customer_email,
        cpf: customerProfile?.cpf || 'N/A', // Usar CPF do perfil se existir
        address: {
          street: customerProfile?.address_street || 'Endereço não informado',
          number: customerProfile?.address_number || '',
          complement: customerProfile?.address_complement || '',
          neighborhood: customerProfile?.address_neighborhood || '',
          city: customerProfile?.address_city || order.city || 'Cidade não informada',
          state: customerProfile?.address_state || order.state || 'UF',
          zipCode: customerProfile?.address_zip_code || 'CEP não informado',
          country: 'Brasil'
        }
      };
    }
    
    // 3. Buscar dados da loja (cliente) no banco
    const { data: clientData, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('name')
      .eq('id', order.client_id)
      .single();
      
    const storeName = clientData?.name || 'Via Forte Express';
    
    // 4. Buscar itens reais do pedido
    let orderItems = items;
    if (!orderItems) {
      const { data: dbItems, error: itemsError } = await supabaseAdmin
        .from('order_items') // Supondo que exista uma tabela 'order_items'
        .select('product_name, quantity, unit_price')
        .eq('order_id', orderId);

      if (itemsError) {
        console.error(`❌ Erro ao buscar itens do pedido ${orderId}:`, itemsError);
        throw new Error(`Itens do pedido não encontrados: ${orderId}`);
      }

      if (!dbItems || dbItems.length === 0) {
         // Fallback se não houver itens, usar o valor total do pedido
        orderItems = [{ title: 'Produto Principal', quantity: 1, unitPrice: order.amount }];
      } else {
        orderItems = dbItems.map(item => ({
          title: item.product_name,
          quantity: item.quantity,
          unitPrice: item.unit_price
        }));
      }
    }
    
    // 5. Preparar dados para o template da nota fiscal
    const invoiceItems: InvoiceItem[] = orderItems.map(item => ({
      nome_item: item.title,
      quantidade: item.quantity,
      preco_item: item.unitPrice
    }));
    
    // Calcular total
    const total = invoiceItems.reduce((sum, item) => sum + (item.quantidade * item.preco_item), 0);
    
    // Formatar endereço completo
    const endereco = [
      customer.address?.street,
      customer.address?.number,
      customer.address?.complement,
      `${customer.address?.city || ''} - ${customer.address?.state || ''}`,
      `CEP: ${customer.address?.zipCode || ''}`,
      customer.address?.country
    ].filter(Boolean).join(', ');
    
    // Gerar número da nota fiscal
    const numeroNF = generateInvoiceNumber(orderId);
    
    // 6. Gerar a nota fiscal
    const invoiceData: InvoiceData = {
      nome_cliente: customer.name,
      cpf_cliente: customer.cpf || customer.cnpj || '000.000.000-00',
      endereco_cliente: endereco,
      itens: invoiceItems,
      total,
      nome_loja: storeName,
      data_emissao: format(new Date(), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR }),
      numero_pedido: order.payment_id || orderId,
      numero_nf: numeroNF
    };
    
    // 7. Renderizar o template e gerar o PDF
    const pdfPath = await generatePdfFromComponent(
      <InvoiceTemplate {...invoiceData} />
    );
    
    console.log(`✅ Nota fiscal gerada com sucesso: ${pdfPath}`);
    return pdfPath;
  } catch (error) {
    console.error('❌ Erro ao gerar nota fiscal:', error);
    throw error;
  }
}