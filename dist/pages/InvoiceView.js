import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { AlertCircle, Download, Printer } from 'lucide-react';
import { Button } from '../components/ui';
import InvoiceTemplate from '../emails/InvoiceTemplate';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { safeAwait } from '../utils/errorHandling';
import { secureLog } from '../utils/secureLogger';
// Estilos CSS para impressão
const printStyles = `
  @media print {
    @page {
      size: A4 landscape;
      margin: 0;
    }
    body {
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .no-print {
      display: none !important;
    }
    .invoice-content {
      width: 100%;
      height: 100%;
    }
  }
`;
export default function InvoiceView() {
    const { token } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [invoiceData, setInvoiceData] = useState(null);
    useEffect(() => {
        async function fetchInvoiceData() {
            try {
                if (!token) {
                    throw new Error('Token de nota fiscal não fornecido');
                }
                secureLog.debug('Iniciando busca de dados da nota fiscal');
                // Adiciona delay aleatório para evitar detecção de padrões
                const delay = Math.floor(Math.random() * 600) + 200;
                await new Promise(resolve => setTimeout(resolve, delay));
                const orderId = token;
                // Sistema seguro de URLs ofuscadas
                const getSecureUrl = () => {
                    // URLs codificadas em Base64 para ofuscação
                    const encoded = 'aHR0cHM6Ly9mYXN0bG9nZXhwcmVzcy5uZ3Jvay5hcHAvYXBp';
                    return import.meta.env.VITE_API_URL || atob(encoded);
                };
                const apiUrl = getSecureUrl();
                // Log ofuscado para segurança
                if (import.meta.env.DEV) {
                    secureLog.debug('Buscando dados da nota fiscal...');
                }
                const response = await fetch(`${apiUrl}/invoice/${orderId}`);
                if (!response.ok) {
                    // Verificar se a resposta é HTML (erro de proxy/roteamento)
                    if (response) {
                        const contentType = response.headers.get('content-type');
                        if (contentType && contentType.includes('text/html')) {
                            throw new Error('Erro de configuração: API não encontrada. Verifique se o backend está rodando na porta 3001.');
                        }
                        try {
                            const errorData = await response.json();
                            throw new Error(errorData.error || `Erro HTTP ${response.status}: ${response.statusText}`);
                        }
                        catch (parseError) {
                            throw new Error(`Erro ao buscar nota fiscal (${response.status}): ${response.statusText}`);
                        }
                    }
                    else {
                        throw new Error('Erro ao carregar dados da nota fiscal: Falha na conexão');
                    }
                }
                const result = await response.json();
                if (!result.success || !result.data) {
                    throw new Error('Dados da nota fiscal não encontrados');
                }
                secureLog.debug('Dados da nota fiscal carregados com sucesso');
                setInvoiceData(result.data);
            }
            catch (err) {
                secureLog.error('Erro ao carregar nota fiscal', err);
                setError(err.message || 'Erro ao carregar nota fiscal');
            }
            finally {
                setLoading(false);
            }
        }
        fetchInvoiceData();
    }, [token]);
    // Referência para o conteúdo da nota fiscal
    const invoiceRef = useRef(null);
    // Função para imprimir a nota fiscal
    const handlePrint = () => {
        window.print();
    };
    // Função para baixar a nota fiscal como PDF
    const handleDownload = async () => {
        if (!invoiceRef.current || !invoiceData)
            return;
        // Mostrar mensagem de carregamento
        setLoading(true);
        setError(null);
        try {
            // Capturar o conteúdo da nota fiscal como uma imagem com retry em caso de falha
            const [canvasError, canvas] = await safeAwait(html2canvas(invoiceRef.current, {
                scale: 2, // Melhor qualidade
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            }));
            if (canvasError) {
                throw new Error('Não foi possível capturar o conteúdo da nota fiscal');
            }
            // Criar um novo documento PDF no formato paisagem (landscape)
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });
            // Dimensões do PDF
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            // Dimensões da imagem capturada
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            // Calcular a proporção para ajustar a imagem ao PDF
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
            // Calcular as dimensões finais da imagem no PDF
            const imgWidthPdf = imgWidth * ratio;
            const imgHeightPdf = imgHeight * ratio;
            // Calcular a posição para centralizar a imagem no PDF
            const x = (pdfWidth - imgWidthPdf) / 2;
            const y = (pdfHeight - imgHeightPdf) / 2;
            // Adicionar a imagem ao PDF
            const imgData = canvas.toDataURL('image/png');
            pdf.addImage(imgData, 'PNG', x, y, imgWidthPdf, imgHeightPdf);
            // Salvar o PDF com nome padronizado
            const fileName = `Nota_Fiscal_${invoiceData.numero_nf}.pdf`;
            pdf.save(fileName);
        }
        catch (error) {
            secureLog.error('Erro ao gerar PDF', error);
            setError(`Erro ao gerar o PDF: ${error.message || 'Tente novamente mais tarde.'}`);
        }
        finally {
            setLoading(false);
        }
    };
    if (loading) {
        return (_jsxs("div", { className: "flex flex-col justify-center items-center h-64", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4" }), _jsx("p", { className: "text-indigo-600", children: "Carregando nota fiscal..." })] }));
    }
    if (error) {
        return (_jsx("div", { className: "bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4", children: _jsxs("div", { className: "flex", children: [_jsx(AlertCircle, { className: "w-5 h-5 mr-2" }), _jsx("span", { children: error })] }) }));
    }
    return (_jsxs("div", { children: [_jsx("style", { dangerouslySetInnerHTML: { __html: printStyles } }), _jsx("div", { className: "max-w-4xl mx-auto p-4 mb-4 bg-white rounded-lg shadow-lg no-print", children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-800", children: "Nota Fiscal" }), _jsxs("div", { className: "flex space-x-2", children: [_jsxs(Button, { onClick: handlePrint, className: "flex items-center space-x-1 bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100", title: "Imprimir nota fiscal", children: [_jsx(Printer, { className: "w-4 h-4" }), _jsx("span", { children: "Imprimir" })] }), _jsxs(Button, { onClick: handleDownload, className: "flex items-center space-x-1 bg-green-50 border-green-200 text-green-700 hover:bg-green-100", title: "Baixar nota fiscal como PDF", disabled: loading, children: [_jsx(Download, { className: "w-4 h-4" }), _jsx("span", { children: loading ? 'Gerando PDF...' : 'Baixar PDF' })] })] })] }) }), invoiceData && (_jsx("div", { className: "max-w-4xl mx-auto bg-white shadow-lg", children: _jsx("div", { id: "invoice-content", className: "invoice-content", ref: invoiceRef, children: _jsx(InvoiceTemplate, { ...invoiceData }) }) }))] }));
}
