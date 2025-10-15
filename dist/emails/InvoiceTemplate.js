import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// Dados padronizados da empresa para evitar inconsistências
const COMPANY_DATA = {
    name: 'VIA FORTE EXPRESS',
    address: 'RUA VERBO DIVINO, 1207 - PAV. 2 e 3 - ED SÃO JOSÉ',
    neighborhood: 'CHÁCARA SANTO ANTÔNIO',
    city: 'SÃO PAULO',
    state: 'SP',
    zipCode: '04719-001',
    phone: '1130966597',
    cnpj: '04.884.082/0001-35',
    stateRegistration: '149.641.811'
};
export default function InvoiceTemplate(props) {
    const { nome_cliente, cpf_cliente, endereco_cliente, itens, total, nome_loja, data_emissao, numero_pedido, numero_nf } = props;
    // Função para formatar valores monetários no padrão brasileiro
    const formatCurrency = (value) => {
        // Garantir que value é um número válido
        const safeValue = typeof value === 'number' && !isNaN(value) ? value : 0;
        if (safeValue === 0) {
            console.warn('⚠️ Valor 0 detectado no template da nota fiscal');
        }
        return safeValue.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    };
    // Gerar chave de acesso aleatória para simulação (44 dígitos)
    const chaveAcesso = Array(44).fill(0).map(() => Math.floor(Math.random() * 10)).join('');
    // Formatar a chave de acesso em grupos para melhor legibilidade
    const chaveAcessoFormatada = chaveAcesso.match(/.{1,4}/g)?.join(' ') || chaveAcesso;
    // Gerar número de protocolo de autorização
    const protocolo = Math.floor(Math.random() * 1000000000).toString().padStart(15, '0');
    // Gerar data e hora atuais para autorização
    const dataAutorizacao = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    const horaAutorizacao = new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    // Calcular valores fiscais com validação
    const safeTotal = typeof total === 'number' && !isNaN(total) ? total : 0;
    // Adicionar aviso se valores estão zerados
    if (safeTotal === 0) {
        console.error('🚨 NOTA FISCAL COM VALORES ZERADOS - VERIFICAR DADOS');
        console.error('Props recebidas:', { nome_cliente, total, itens });
    }
    const baseCalculo = safeTotal;
    const valorICMS = safeTotal * 0.18; // 18% de ICMS (exemplo)
    const valorProdutos = safeTotal;
    const valorFrete = 0;
    const valorSeguro = 0;
    const valorDesconto = 0;
    const valorOutrasDespesas = 0;
    const valorIPI = 0;
    const valorTotalNota = safeTotal;
    return (_jsxs("html", { children: [_jsxs("head", { children: [_jsx("meta", { charSet: "utf-8" }), _jsxs("title", { children: ["Nota Fiscal Eletr\u00F4nica - ", nome_loja] }), _jsx("style", { children: `
            @page {
              size: A4 landscape;
              margin: 0;
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              color: #000;
              font-size: 12px;
            }
            .invoice-container {
              width: 100%;
              max-width: 1000px;
              margin: 0 auto;
              border: 1px solid #000;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            table, th, td {
              border: 1px solid #000;
            }
            th, td {
              padding: 6px 8px;
              text-align: left;
            }
            .header {
              display: flex;
              border-bottom: 1px solid #000;
            }
            .header-left {
              width: 70%;
              padding: 8px;
              border-right: 1px solid #000;
            }
            .header-right {
              width: 30%;
              padding: 8px;
              text-align: center;
            }
            .nfe-number {
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .nfe-serie {
              font-size: 12px;
            }
            .company-info {
              padding: 8px;
              border-bottom: 1px solid #000;
            }
            .company-name {
              font-weight: bold;
              font-size: 12px;
              margin-bottom: 5px;
            }
            .barcode-container {
              text-align: center;
              padding: 8px;
              border-bottom: 1px solid #000;
            }
            .barcode {
              font-family: monospace;
              font-size: 12px;
              letter-spacing: 1px;
              word-break: break-all;
            }
            .barcode-img {
              height: 50px;
              width: 100%;
              background: repeating-linear-gradient(90deg, #000, #000 2px, #fff 2px, #fff 4px);
              margin: 5px 0;
            }
            .section-title {
              font-weight: bold;
              background-color: #f0f0f0;
              padding: 4px;
            }
            .grid-2 {
              display: grid;
              grid-template-columns: 1fr 1fr;
            }
            .grid-3 {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
            }
            .grid-4 {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr 1fr;
            }
            .field {
              padding: 4px;
              border-bottom: 1px solid #000;
              border-right: 1px solid #000;
            }
            .field:last-child {
              border-right: none;
            }
            .field-label {
              font-size: 8px;
              color: #666;
              margin-bottom: 2px;
            }
            .field-value {
              font-weight: bold;
            }
            .items-table th {
              background-color: #f0f0f0;
              font-size: 9px;
            }
            .items-table td {
              font-size: 10px;
            }
            .text-right {
              text-align: right;
            }
            .text-center {
              text-align: center;
            }
            .totals {
              font-weight: bold;
            }
            .transport-info {
              margin-top: 10px;
            }
            .fiscal-info {
              margin-top: 10px;
              font-size: 8px;
            }
          ` })] }), _jsx("body", { children: _jsxs("div", { className: "invoice-container", children: [_jsxs("div", { className: "header", children: [_jsx("div", { className: "header-left", children: _jsx("div", { children: "LEI FEDERAL DO PROCESSO ELETR\u00D4NICO 11.419/2006 - LEI DA TRANSPAR\u00CANCIA 12.527/2011 - LEI ANTICORRUP\u00C7\u00C3O 12.846/2013" }) }), _jsxs("div", { className: "header-right", children: [_jsx("div", { className: "nfe-number", children: "NF-e" }), _jsxs("div", { className: "nfe-serie", children: ["N\u00BA ", numero_nf] }), _jsx("div", { className: "nfe-serie", children: "S\u00E9rie 50" })] })] }), _jsxs("div", { className: "company-info", children: [_jsx("div", { className: "company-name", children: COMPANY_DATA.name }), _jsx("div", { children: COMPANY_DATA.address }), _jsxs("div", { children: [COMPANY_DATA.neighborhood, " - ", COMPANY_DATA.city, "/", COMPANY_DATA.state] }), _jsxs("div", { children: ["CEP ", COMPANY_DATA.zipCode] }), _jsxs("div", { children: ["FONE ", COMPANY_DATA.phone] })] }), _jsxs("div", { className: "barcode-container", children: [_jsx("div", { className: "barcode-img" }), _jsx("div", { className: "barcode", children: chaveAcessoFormatada }), _jsxs("div", { style: { fontSize: '10px', marginTop: '5px' }, children: ["Chave de Acesso: ", chaveAcesso] })] }), _jsx("table", { children: _jsx("tbody", { children: _jsxs("tr", { children: [_jsxs("td", { width: "50%", children: [_jsx("div", { className: "field-label", children: "NATUREZA DA OPERA\u00C7\u00C3O" }), _jsx("div", { className: "field-value", children: "VENDA DE MERC. ADQ. DE TERCEIROS" })] }), _jsxs("td", { width: "25%", children: [_jsx("div", { className: "field-label", children: "PROTOCOLO DE AUTORIZA\u00C7\u00C3O" }), _jsx("div", { className: "field-value", children: protocolo })] }), _jsxs("td", { width: "25%", children: [_jsx("div", { className: "field-label", children: "DATA/HORA DE AUTORIZA\u00C7\u00C3O" }), _jsxs("div", { className: "field-value", children: [dataAutorizacao, " ", horaAutorizacao] })] })] }) }) }), _jsx("table", { children: _jsxs("tbody", { children: [_jsx("tr", { children: _jsx("td", { colSpan: 3, className: "section-title", children: "DESTINAT\u00C1RIO / REMETENTE" }) }), _jsxs("tr", { children: [_jsxs("td", { colSpan: 2, children: [_jsx("div", { className: "field-label", children: "NOME / RAZ\u00C3O SOCIAL" }), _jsx("div", { className: "field-value", children: nome_cliente })] }), _jsxs("td", { children: [_jsx("div", { className: "field-label", children: "CPF / CNPJ" }), _jsx("div", { className: "field-value", children: cpf_cliente })] })] }), _jsx("tr", { children: _jsxs("td", { colSpan: 3, children: [_jsx("div", { className: "field-label", children: "ENDERE\u00C7O" }), _jsx("div", { className: "field-value", children: endereco_cliente })] }) })] }) }), _jsxs("table", { className: "items-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "C\u00D3DIGO" }), _jsx("th", { children: "DESCRI\u00C7\u00C3O DOS PRODUTOS / SERVI\u00C7OS" }), _jsx("th", { children: "QTDE" }), _jsx("th", { children: "UNID" }), _jsx("th", { children: "VALOR UNIT." }), _jsx("th", { children: "VALOR TOTAL" })] }) }), _jsx("tbody", { children: itens.map((item, index) => (_jsxs("tr", { children: [_jsx("td", { className: "text-center", children: index + 1 }), _jsx("td", { children: item.nome_item }), _jsx("td", { className: "text-center", children: item.quantidade }), _jsx("td", { className: "text-center", children: "UN" }), _jsx("td", { className: "text-right", children: formatCurrency(item.preco_item) }), _jsx("td", { className: "text-right", children: formatCurrency(item.quantidade * item.preco_item) })] }, index))) })] }), _jsx("table", { children: _jsxs("tbody", { children: [_jsx("tr", { children: _jsx("td", { colSpan: 6, className: "section-title", children: "C\u00C1LCULO DO IMPOSTO" }) }), _jsxs("tr", { children: [_jsxs("td", { width: "16%", children: [_jsx("div", { className: "field-label", children: "BASE DE C\u00C1LC. ICMS" }), _jsx("div", { className: "field-value text-right", children: formatCurrency(baseCalculo) })] }), _jsxs("td", { width: "16%", children: [_jsx("div", { className: "field-label", children: "VALOR DO ICMS" }), _jsx("div", { className: "field-value text-right", children: formatCurrency(valorICMS) })] }), _jsxs("td", { width: "16%", children: [_jsx("div", { className: "field-label", children: "VALOR TOTAL DOS PRODUTOS" }), _jsx("div", { className: "field-value text-right", children: formatCurrency(valorProdutos) })] }), _jsxs("td", { width: "16%", children: [_jsx("div", { className: "field-label", children: "VALOR DO FRETE" }), _jsx("div", { className: "field-value text-right", children: formatCurrency(valorFrete) })] }), _jsxs("td", { width: "16%", children: [_jsx("div", { className: "field-label", children: "VALOR DO SEGURO" }), _jsx("div", { className: "field-value text-right", children: formatCurrency(valorSeguro) })] }), _jsxs("td", { width: "20%", children: [_jsx("div", { className: "field-label", children: "VALOR TOTAL DA NOTA" }), _jsx("div", { className: "field-value text-right", children: formatCurrency(valorTotalNota) })] })] })] }) }), _jsx("table", { className: "transport-info", children: _jsxs("tbody", { children: [_jsx("tr", { children: _jsx("td", { colSpan: 4, className: "section-title", children: "TRANSPORTADOR / VOLUMES TRANSPORTADOS" }) }), _jsxs("tr", { children: [_jsxs("td", { width: "50%", children: [_jsx("div", { className: "field-label", children: "RAZ\u00C3O SOCIAL" }), _jsx("div", { className: "field-value", children: COMPANY_DATA.name })] }), _jsxs("td", { width: "15%", children: [_jsx("div", { className: "field-label", children: "FRETE" }), _jsx("div", { className: "field-value", children: "0 - Emitente" })] }), _jsxs("td", { width: "15%", children: [_jsx("div", { className: "field-label", children: "PLACA DO VE\u00CDCULO" }), _jsx("div", { className: "field-value", children: "-" })] }), _jsxs("td", { width: "20%", children: [_jsx("div", { className: "field-label", children: "CNPJ / CPF" }), _jsx("div", { className: "field-value", children: COMPANY_DATA.cnpj })] })] }), _jsxs("tr", { children: [_jsxs("td", { children: [_jsx("div", { className: "field-label", children: "ENDERE\u00C7O" }), _jsx("div", { className: "field-value", children: COMPANY_DATA.address })] }), _jsxs("td", { children: [_jsx("div", { className: "field-label", children: "MUNIC\u00CDPIO" }), _jsx("div", { className: "field-value", children: COMPANY_DATA.city })] }), _jsxs("td", { children: [_jsx("div", { className: "field-label", children: "UF" }), _jsx("div", { className: "field-value", children: COMPANY_DATA.state })] }), _jsxs("td", { children: [_jsx("div", { className: "field-label", children: "INSCRI\u00C7\u00C3O ESTADUAL" }), _jsx("div", { className: "field-value", children: COMPANY_DATA.stateRegistration })] })] })] }) }), _jsxs("div", { className: "fiscal-info", children: [_jsx("p", { children: "Documento emitido por ME ou EPP optante pelo Simples Nacional" }), _jsx("p", { children: "N\u00E3o gera direito a cr\u00E9dito fiscal de IPI" }), _jsxs("p", { children: ["CHAVE DE ACESSO: ", chaveAcesso] }), _jsx("p", { children: "Consulta de autenticidade no portal nacional da NF-e www.nfe.fazenda.gov.br/portal ou no site da Sefaz Autorizadora" })] })] }) })] }));
}
