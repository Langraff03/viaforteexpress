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
 * Gera uma nota fiscal para um pedido
 * @param orderId ID do pedido
 * @param customerData Dados do cliente (opcional, será buscado no banco se não fornecido)
 * @param items Itens do pedido (opcional, será simulado se não fornecido)
 * @returns Caminho do arquivo PDF gerado
 */
export declare function generateInvoice(orderId: string, customerData?: CustomerData, items?: OrderItemData[]): Promise<string>;
export {};
