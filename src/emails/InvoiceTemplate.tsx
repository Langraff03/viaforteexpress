import * as React from 'react';

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

export default function InvoiceTemplate(props: InvoiceData) {
  const {
    nome_cliente,
    cpf_cliente,
    endereco_cliente,
    itens,
    total,
    nome_loja,
    data_emissao,
    numero_pedido,
    numero_nf
  } = props;

  // Função para formatar valores monetários no padrão brasileiro
  const formatCurrency = (value: number): string => {
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

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <title>Nota Fiscal Eletrônica - {nome_loja}</title>
        <style>
          {`
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
          `}
        </style>
      </head>
      <body>
        <div className="invoice-container">
          {/* Cabeçalho */}
          <div className="header">
            <div className="header-left">
              <div>LEI FEDERAL DO PROCESSO ELETRÔNICO 11.419/2006 - LEI DA TRANSPARÊNCIA 12.527/2011 - LEI ANTICORRUPÇÃO 12.846/2013</div>
            </div>
            <div className="header-right">
              <div className="nfe-number">NF-e</div>
              <div className="nfe-serie">Nº {numero_nf}</div>
              <div className="nfe-serie">Série 50</div>
            </div>
          </div>

          {/* Informações da Empresa */}
          <div className="company-info">
            <div className="company-name">{COMPANY_DATA.name}</div>
            <div>{COMPANY_DATA.address}</div>
            <div>{COMPANY_DATA.neighborhood} - {COMPANY_DATA.city}/{COMPANY_DATA.state}</div>
            <div>CEP {COMPANY_DATA.zipCode}</div>
            <div>FONE {COMPANY_DATA.phone}</div>
          </div>

          {/* Código de Barras */}
          <div className="barcode-container">
            <div className="barcode-img"></div>
            <div className="barcode">{chaveAcessoFormatada}</div>
            <div style={{ fontSize: '10px', marginTop: '5px' }}>Chave de Acesso: {chaveAcesso}</div>
          </div>

          {/* Natureza da Operação */}
          <table>
            <tbody>
              <tr>
                <td width="50%">
                  <div className="field-label">NATUREZA DA OPERAÇÃO</div>
                  <div className="field-value">VENDA DE MERC. ADQ. DE TERCEIROS</div>
                </td>
                <td width="25%">
                  <div className="field-label">PROTOCOLO DE AUTORIZAÇÃO</div>
                  <div className="field-value">{protocolo}</div>
                </td>
                <td width="25%">
                  <div className="field-label">DATA/HORA DE AUTORIZAÇÃO</div>
                  <div className="field-value">{dataAutorizacao} {horaAutorizacao}</div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Destinatário */}
          <table>
            <tbody>
              <tr>
                <td colSpan={3} className="section-title">DESTINATÁRIO / REMETENTE</td>
              </tr>
              <tr>
                <td colSpan={2}>
                  <div className="field-label">NOME / RAZÃO SOCIAL</div>
                  <div className="field-value">{nome_cliente}</div>
                </td>
                <td>
                  <div className="field-label">CPF / CNPJ</div>
                  <div className="field-value">{cpf_cliente}</div>
                </td>
              </tr>
              <tr>
                <td colSpan={3}>
                  <div className="field-label">ENDEREÇO</div>
                  <div className="field-value">{endereco_cliente}</div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Itens */}
          <table className="items-table">
            <thead>
              <tr>
                <th>CÓDIGO</th>
                <th>DESCRIÇÃO DOS PRODUTOS / SERVIÇOS</th>
                <th>QTDE</th>
                <th>UNID</th>
                <th>VALOR UNIT.</th>
                <th>VALOR TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((item, index) => (
                <tr key={index}>
                  <td className="text-center">{index + 1}</td>
                  <td>{item.nome_item}</td>
                  <td className="text-center">{item.quantidade}</td>
                  <td className="text-center">UN</td>
                  <td className="text-right">{formatCurrency(item.preco_item)}</td>
                  <td className="text-right">{formatCurrency(item.quantidade * item.preco_item)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Cálculo de Impostos */}
          <table>
            <tbody>
              <tr>
                <td colSpan={6} className="section-title">CÁLCULO DO IMPOSTO</td>
              </tr>
              <tr>
                <td width="16%">
                  <div className="field-label">BASE DE CÁLC. ICMS</div>
                  <div className="field-value text-right">{formatCurrency(baseCalculo)}</div>
                </td>
                <td width="16%">
                  <div className="field-label">VALOR DO ICMS</div>
                  <div className="field-value text-right">{formatCurrency(valorICMS)}</div>
                </td>
                <td width="16%">
                  <div className="field-label">VALOR TOTAL DOS PRODUTOS</div>
                  <div className="field-value text-right">{formatCurrency(valorProdutos)}</div>
                </td>
                <td width="16%">
                  <div className="field-label">VALOR DO FRETE</div>
                  <div className="field-value text-right">{formatCurrency(valorFrete)}</div>
                </td>
                <td width="16%">
                  <div className="field-label">VALOR DO SEGURO</div>
                  <div className="field-value text-right">{formatCurrency(valorSeguro)}</div>
                </td>
                <td width="20%">
                  <div className="field-label">VALOR TOTAL DA NOTA</div>
                  <div className="field-value text-right">{formatCurrency(valorTotalNota)}</div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Transportadora */}
          <table className="transport-info">
            <tbody>
              <tr>
                <td colSpan={4} className="section-title">TRANSPORTADOR / VOLUMES TRANSPORTADOS</td>
              </tr>
              <tr>
                <td width="50%">
                  <div className="field-label">RAZÃO SOCIAL</div>
                  <div className="field-value">{COMPANY_DATA.name}</div>
                </td>
                <td width="15%">
                  <div className="field-label">FRETE</div>
                  <div className="field-value">0 - Emitente</div>
                </td>
                <td width="15%">
                  <div className="field-label">PLACA DO VEÍCULO</div>
                  <div className="field-value">-</div>
                </td>
                <td width="20%">
                  <div className="field-label">CNPJ / CPF</div>
                  <div className="field-value">{COMPANY_DATA.cnpj}</div>
                </td>
              </tr>
              <tr>
                <td>
                  <div className="field-label">ENDEREÇO</div>
                  <div className="field-value">{COMPANY_DATA.address}</div>
                </td>
                <td>
                  <div className="field-label">MUNICÍPIO</div>
                  <div className="field-value">{COMPANY_DATA.city}</div>
                </td>
                <td>
                  <div className="field-label">UF</div>
                  <div className="field-value">{COMPANY_DATA.state}</div>
                </td>
                <td>
                  <div className="field-label">INSCRIÇÃO ESTADUAL</div>
                  <div className="field-value">{COMPANY_DATA.stateRegistration}</div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Informações Fiscais */}
          <div className="fiscal-info">
            <p>Documento emitido por ME ou EPP optante pelo Simples Nacional</p>
            <p>Não gera direito a crédito fiscal de IPI</p>
            <p>CHAVE DE ACESSO: {chaveAcesso}</p>
            <p>Consulta de autenticidade no portal nacional da NF-e www.nfe.fazenda.gov.br/portal ou no site da Sefaz Autorizadora</p>
          </div>
        </div>
      </body>
    </html>
  );
}