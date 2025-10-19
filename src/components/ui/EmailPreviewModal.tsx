import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, Mail, User, Calendar } from 'lucide-react';

interface EmailPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: string;
  sampleData: {
    nome: string;
    oferta: string;
    desconto: string;
    link: string;
    descricao: string;
    empresa?: string;
  };
  subject: string;
}

const EmailPreviewModal: React.FC<EmailPreviewModalProps> = ({
  isOpen,
  onClose,
  template,
  sampleData,
  subject
}) => {
  // Função para personalizar o template com os dados de exemplo
  const getPersonalizedTemplate = () => {
    return template
      .replace(/{{nome}}/g, sampleData.nome || 'Cliente')
      .replace(/{{oferta}}/g, sampleData.oferta || 'Oferta Especial')
      .replace(/{{desconto}}/g, sampleData.desconto || '30% OFF')
      .replace(/{{link}}/g, sampleData.link || '#')
      .replace(/{{descricao}}/g, sampleData.descricao || 'Descrição da oferta')
      .replace(/{{empresa}}/g, sampleData.empresa || 'Sua Empresa');
  };

  const personalizedTemplate = getPersonalizedTemplate();
  const currentDate = new Date().toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black bg-opacity-60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 text-white relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors z-10"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-2 rounded-full">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Preview do Template</h2>
                  <p className="text-blue-100 text-sm">
                    Visualize como seu email aparecerá para o cliente
                  </p>
                </div>
              </div>
            </div>

            {/* Email Client Simulator */}
            <div className="p-6 bg-gray-50 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Gmail-style header */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Email Header */}
                <div className="bg-gray-50 border-b border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-5 h-5 text-red-500" />
                      <span className="font-medium text-gray-900">Gmail</span>
                    </div>
                    <span className="text-xs text-gray-500">{currentDate}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <User className="w-4 h-4 text-gray-400" />
                      <div className="flex-1">
                        <div className="text-sm">
                          <span className="font-medium text-gray-900">Via Forte Express</span>
                          <span className="text-gray-500 ml-1">&lt;contato@viaforteexpress.com&gt;</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          para {sampleData.nome} &lt;{sampleData.nome.toLowerCase().replace(' ', '.')}@exemplo.com&gt;
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-100 pt-2">
                      <h3 className="font-medium text-gray-900 text-lg">
                        {subject || `🎯 ${sampleData.oferta} - Oferta Especial para ${sampleData.nome}`}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Email Body */}
                <div className="p-6">
                  <div 
                    dangerouslySetInnerHTML={{ __html: personalizedTemplate }}
                    className="prose prose-sm max-w-none"
                    style={{
                      fontFamily: 'Arial, sans-serif',
                      lineHeight: '1.6',
                      color: '#333'
                    }}
                  />
                </div>

                {/* Email Footer (Gmail style) */}
                <div className="bg-gray-50 border-t border-gray-200 p-4">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-4">
                      <button className="hover:text-gray-700">Responder</button>
                      <button className="hover:text-gray-700">Encaminhar</button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-3 h-3" />
                      <span>Hoje</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Template Info */}
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                  <Eye className="w-4 h-4 mr-2" />
                  Dados do Preview
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium text-blue-800">Nome:</span>
                    <span className="text-blue-700 ml-2">{sampleData.nome}</span>
                  </div>
                  <div>
                    <span className="font-medium text-blue-800">Oferta:</span>
                    <span className="text-blue-700 ml-2">{sampleData.oferta}</span>
                  </div>
                  <div>
                    <span className="font-medium text-blue-800">Desconto:</span>
                    <span className="text-blue-700 ml-2">{sampleData.desconto}</span>
                  </div>
                  <div>
                    <span className="font-medium text-blue-800">Empresa:</span>
                    <span className="text-blue-700 ml-2">{sampleData.empresa || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white border-t border-gray-200 p-4 flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Fechar Preview
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default EmailPreviewModal;