import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { AlertCircle, Download, Printer } from 'lucide-react';
import { Button } from '../components/ui';
import InvoiceTemplate, { InvoiceData, InvoiceItem } from '../emails/InvoiceTemplate';
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

export default function PublicInvoiceView() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);

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
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('text/html')) {
            throw new Error('Erro de configuração: API não encontrada. Verifique se o backend está rodando.');
          }
          
          try {
            const errorData = await response.json();
            throw new Error(errorData.error || `Erro HTTP ${response.status}: ${response.statusText}`);
          } catch (parseError) {
            throw new Error(`Erro ao buscar nota fiscal (${response.status}): ${response.statusText}`);
          }
        }

        const result = await response.json();
        
        if (!result.success || !result.data) {
          throw new Error('Dados da nota fiscal não encontrados');
        }

        secureLog.debug('Dados da nota fiscal carregados com sucesso');
        setInvoiceData(result.data);
      } catch (err: any) {
        secureLog.error('Erro ao carregar nota fiscal', err);
        setError(err.message || 'Erro ao carregar nota fiscal');
      } finally {
        setLoading(false);
      }
    }

    fetchInvoiceData();
  }, [token]);

  // Referência para o conteúdo da nota fiscal
  const invoiceRef = useRef<HTMLDivElement>(null);

  // Função para imprimir a nota fiscal
  const handlePrint = () => {
    window.print();
  };

  // Função para baixar a nota fiscal como PDF
  const handleDownload = async () => {
    if (!invoiceRef.current || !invoiceData) return;

    // Mostrar mensagem de carregamento
    setLoading(true);
    setError(null);
    
    try {
      // Capturar o conteúdo da nota fiscal como uma imagem com retry em caso de falha
      const [canvasError, canvas] = await safeAwait(
        html2canvas(invoiceRef.current, {
          scale: 2, // Melhor qualidade
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        })
      );

      if (canvasError || !canvas) {
        throw new Error('Erro ao capturar conteúdo da nota fiscal');
      }

      // Criar PDF
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 297; // A4 landscape width in mm
      const pageHeight = 210; // A4 landscape height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Baixar o PDF
      pdf.save(`nota_fiscal_${invoiceData.numero_pedido}.pdf`);
    } catch (err: any) {
      secureLog.error('Erro ao gerar PDF', err);
      setError('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Adicionar estilos de impressão ao documento
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = printStyles;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando nota fiscal...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Erro ao carregar nota fiscal
          </h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  if (!invoiceData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900">
            Nota fiscal não encontrada
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cabeçalho com ações */}
      <div className="bg-white shadow-sm border-b no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Nota Fiscal</h1>
              <p className="text-sm text-gray-600">
                Pedido: {invoiceData.numero_pedido}
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={handlePrint}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Printer className="h-4 w-4" />
                <span>Imprimir</span>
              </Button>
              <Button
                onClick={handleDownload}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                <Download className="h-4 w-4" />
                <span>{loading ? 'Gerando...' : 'Baixar PDF'}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo da nota fiscal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div ref={invoiceRef} className="invoice-content">
            <InvoiceTemplate {...invoiceData} />
          </div>
        </div>
      </div>
    </div>
  );
}