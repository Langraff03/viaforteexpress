import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X, Mail, Users, Clock, TrendingUp, AlertTriangle, BarChart3 } from 'lucide-react';
import Button from './Button';

interface CampaignStats {
  totalEmails: number;
  successEmails: number;
  failedEmails: number;
  processingTime: string;
  campaignType: 'pequena' | 'enterprise';
  campaignId?: string;
}

interface CampaignSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignStats: CampaignStats;
  onViewProgress?: () => void;
  onCreateNew: () => void;
}

const CampaignSuccessModal: React.FC<CampaignSuccessModalProps> = ({
  isOpen,
  onClose,
  campaignStats,
  onViewProgress,
  onCreateNew,
}) => {
  // Verificação de segurança - não renderizar se não há dados
  if (!campaignStats) {
    return null;
  }

  const successRate = Math.round((campaignStats.successEmails / campaignStats.totalEmails) * 100);
  const isHighSuccessRate = successRate >= 95;

  const formatNumber = (num: number) => {
    return num.toLocaleString('pt-BR');
  };

  const handleViewProgress = () => {
    onViewProgress?.();
  };

  const handleCreateNew = () => {
    onClose();
    onCreateNew();
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
            className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Header */}
            <div className={`p-6 text-white relative ${
              isHighSuccessRate 
                ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                : 'bg-gradient-to-r from-blue-500 to-indigo-600'
            }`}>
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
                  <h2 className="text-xl font-bold">Campanha Enviada!</h2>
                  <p className={`text-sm ${
                    isHighSuccessRate ? 'text-green-100' : 'text-blue-100'
                  }`}>
                    {campaignStats.campaignType === 'enterprise' ? 'Campanha Enterprise' : 'Campanha Pequena'} processada com sucesso
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Estatísticas Principais */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Mail className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-blue-800">
                      Total Enviados
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-blue-900">
                    {formatNumber(campaignStats.totalEmails)}
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <span className="text-sm font-medium text-green-800">
                      Taxa de Sucesso
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-green-900">
                    {successRate}%
                  </div>
                </div>
              </div>

              {/* Detalhes Estatísticos */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">
                      Emails Entregues
                    </span>
                  </div>
                  <span className="text-sm font-bold text-green-800">
                    {formatNumber(campaignStats.successEmails)}
                  </span>
                </div>

                {campaignStats.failedEmails > 0 && (
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-medium text-gray-700">
                        Falhas de Entrega
                      </span>
                    </div>
                    <span className="text-sm font-bold text-red-800">
                      {formatNumber(campaignStats.failedEmails)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">
                      Tempo de Processamento
                    </span>
                  </div>
                  <span className="text-sm font-bold text-blue-800">
                    {campaignStats.processingTime}
                  </span>
                </div>
              </div>

              {/* Performance Feedback */}
              <div className={`p-4 rounded-lg ${
                isHighSuccessRate
                  ? 'bg-green-50 border border-green-200'
                  : successRate >= 80
                  ? 'bg-yellow-50 border border-yellow-200'
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center mb-2">
                  <TrendingUp className={`w-4 h-4 mr-2 ${
                    isHighSuccessRate ? 'text-green-600' :
                    successRate >= 80 ? 'text-yellow-600' : 'text-red-600'
                  }`} />
                  <span className={`text-sm font-medium ${
                    isHighSuccessRate ? 'text-green-800' :
                    successRate >= 80 ? 'text-yellow-800' : 'text-red-800'
                  }`}>
                    {isHighSuccessRate 
                      ? 'Excelente Performance!' 
                      : successRate >= 80 
                      ? 'Boa Performance' 
                      : 'Performance Pode Melhorar'
                    }
                  </span>
                </div>
                <p className={`text-xs ${
                  isHighSuccessRate ? 'text-green-700' :
                  successRate >= 80 ? 'text-yellow-700' : 'text-red-700'
                }`}>
                  {isHighSuccessRate
                    ? 'Sua campanha teve uma taxa de entrega excelente! Continue assim.'
                    : successRate >= 80
                    ? 'Boa taxa de entrega. Considere revisar a lista de emails para melhorar ainda mais.'
                    : 'Taxa de entrega baixa. Verifique a qualidade da lista de emails e templates.'
                  }
                </p>
              </div>

              {/* Próximos Passos */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Próximos Passos
                </h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Monitore as estatísticas de abertura e clique</li>
                  <li>• Acompanhe as respostas dos clientes</li>
                  <li>• Considere segmentar melhor sua próxima campanha</li>
                  {campaignStats.failedEmails > 0 && (
                    <li>• Revise os emails que falharam na entrega</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row gap-3">
              {onViewProgress && campaignStats.campaignType === 'enterprise' && (
                <Button
                  variant="outline"
                  onClick={handleViewProgress}
                  leftIcon={<BarChart3 className="w-4 h-4" />}
                  className="flex-1"
                >
                  Ver Progresso Detalhado
                </Button>
              )}
              <Button
                variant="primary"
                onClick={handleCreateNew}
                leftIcon={<Mail className="w-4 h-4" />}
                className="flex-1"
              >
                Nova Campanha
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CampaignSuccessModal;