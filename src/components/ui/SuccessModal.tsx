import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Copy, ExternalLink, X, Package, Check, AlertCircle } from 'lucide-react';
import Button from './Button';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackingCode: string;
  trackingLink: string;
  customerName: string;
  onViewOrders: () => void;
  emailSent?: boolean;
  emailError?: string | null;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  trackingCode,
  trackingLink,
  customerName,
  onViewOrders,
  emailSent = false,
  emailError = null,
}) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(trackingLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar link:', err);
    }
  };

  const openTrackingPage = () => {
    window.open(trackingLink, '_blank');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black bg-opacity-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-2 rounded-full">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Pedido Criado!</h2>
                  <p className="text-green-100 text-sm">
                    Pedido para {customerName} foi criado com sucesso
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Tracking Code */}
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Package className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-600">
                    Código de Rastreio
                  </span>
                </div>
                <div className="bg-gray-100 rounded-lg p-4">
                  <span className="text-2xl font-mono font-bold text-gray-800 tracking-wider">
                    {trackingCode}
                  </span>
                </div>
              </div>

              {/* Status do Email */}
              <div className={`p-3 rounded-lg ${
                emailSent
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center justify-center mb-1">
                  {emailSent ? (
                    <Check className="w-4 h-4 text-green-600 mr-2" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                  )}
                  <span className={`text-sm font-medium ${
                    emailSent ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {emailSent ? 'Email Enviado' : 'Erro no Email'}
                  </span>
                </div>
                {emailError && (
                  <p className="text-xs text-red-600 text-center">{emailError}</p>
                )}
              </div>

              {/* Tracking Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link de Rastreamento
                </label>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <span className="text-sm text-gray-600 break-all">
                      {trackingLink}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                    className="flex-shrink-0"
                  >
                    {copied ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                {copied && (
                  <motion.p
                    className="text-sm text-green-600 mt-1"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    Link copiado para a área de transferência!
                  </motion.p>
                )}
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-800 mb-2">
                  Próximos Passos
                </h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Envie o link de rastreamento para o cliente</li>
                  <li>• O cliente poderá acompanhar o pedido em tempo real</li>
                  <li>• O pedido aparecerá na sua lista de pedidos</li>
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={openTrackingPage}
                leftIcon={<ExternalLink className="w-4 h-4" />}
                className="flex-1"
              >
                Ver Rastreamento
              </Button>
              <Button
                variant="primary"
                onClick={onViewOrders}
                className="flex-1"
              >
                Ver Lista de Pedidos
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SuccessModal;