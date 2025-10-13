import React, { useState } from 'react';
import { Lightbulb, CheckCircle, AlertTriangle, X, ExternalLink } from 'lucide-react';

interface DeliverabilityTipsProps {
  className?: string;
}

const DeliverabilityTips: React.FC<DeliverabilityTipsProps> = ({ className = '' }) => {
  const [isMinimized, setIsMinimized] = useState(false);

  const tips = [
    {
      icon: CheckCircle,
      title: 'Use seu domínio próprio',
      description: 'Configure emails com @suaempresa.com em vez de @gmail.com',
      impact: 'Alto',
      action: 'Configurar SPF/DKIM'
    },
    {
      icon: AlertTriangle,
      title: 'Evite palavras spam',
      description: 'Não use GRÁTIS, URGENTE, GARANTIA em maiúsculo',
      impact: 'Crítico',
      action: 'Revisar assunto'
    },
    {
      icon: Lightbulb,
      title: 'Personalize o conteúdo',
      description: 'Use o nome do destinatário no assunto e corpo',
      impact: 'Alto',
      action: 'Adicionar {{nome}}'
    },
    {
      icon: CheckCircle,
      title: 'Mantenha frequência baixa',
      description: 'Envie no máximo 1-2 emails por semana',
      impact: 'Médio',
      action: 'Planejar calendário'
    }
  ];

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'Crítico': return 'text-red-600 bg-red-100';
      case 'Alto': return 'text-orange-600 bg-orange-100';
      case 'Médio': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (isMinimized) {
    return (
      <div className={`bg-indigo-50 border border-indigo-200 rounded-lg p-3 ${className}`}>
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center text-indigo-700 hover:text-indigo-800 text-sm font-medium"
        >
          <Lightbulb className="w-4 h-4 mr-2" />
          Dicas de Deliverability
          <ExternalLink className="w-3 h-3 ml-1" />
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg ${className}`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Lightbulb className="w-5 h-5 text-indigo-600 mr-2" />
            <h3 className="font-semibold text-indigo-900">Dicas para Inbox</h3>
          </div>
          <button
            onClick={() => setIsMinimized(true)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {tips.map((tip, index) => {
            const Icon = tip.icon;
            return (
              <div key={index} className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-sm transition-shadow">
                <div className="flex items-start space-x-3">
                  <div className={`p-1.5 rounded ${getImpactColor(tip.impact)}`}>
                    <Icon className="w-3 h-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm mb-1">
                      {tip.title}
                    </h4>
                    <p className="text-gray-600 text-xs mb-2">
                      {tip.description}
                    </p>
                    <div className="text-xs text-indigo-600 font-medium">
                      {tip.action}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-blue-200">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">
              💡 Estas dicas aumentam em até 300% a taxa de entrega na caixa principal
            </span>
            <span className="text-indigo-600 font-medium">
              Ver guia completo →
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliverabilityTips;