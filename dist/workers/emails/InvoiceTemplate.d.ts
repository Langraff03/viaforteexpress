export interface InvoiceItem {
    nome_item: string;
    preco_item: number;
    quantidade: number;
}
export interface InvoiceData {
    nome_cliente: string;
    cpf_cliente: string;
    endereco_cliente: string;
    itens: InvoiceItem[];
    total: number;
    nome_loja: string;
    data_emissao: string;
    numero_pedido: string;
    numero_nf: string;
}
export default function InvoiceTemplate(props: InvoiceData): import("react/jsx-runtime").JSX.Element;
