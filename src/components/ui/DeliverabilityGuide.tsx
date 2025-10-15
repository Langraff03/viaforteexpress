import React, { useState } from 'react';
import { Shield, CheckCircle, AlertTriangle, Mail, Users, Target, Zap, BookOpen, Settings, TrendingUp } from 'lucide-react';

interface DeliverabilityGuideProps {
  className?: string;
}

const DeliverabilityGuide: React.FC<DeliverabilityGuideProps> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState<'basics' | 'advanced' | 'monitoring'>('basics');

  const tabs = [
    { id: 'basics' as const, label: 'Básico', icon: Shield },
    { id: 'advanced' as const, label: 'Avançado', icon: Zap },
    { id: 'monitoring' as const, label: 'Monitoramento', icon: TrendingUp }
  ];

  const basicTips = [
    {
      icon: Mail,
      title: 'Use Domínio Próprio',
      description: 'Configure emails com seu próprio domínio (@suaempresa.com) em vez de @gmail.com',
      status: 'critical',
      solution: 'Configure SPF, DKIM e DMARC no seu domínio'
    },
    {
      icon: Users,
      title: 'Lista de Opt-in',
      description: 'Certifique-se que seus leads realmente querem receber emails',
      status: 'important',
      solution: 'Use double opt-in e mantenha listas limpas'
    },
    {
      icon: Target,
      title: 'Segmentação',
      description: 'Envie emails relevantes para grupos específicos de interesse',
      status: 'recommended',
      solution: 'Categorize seus leads por interesse e comportamento'
    },
    {
      icon: CheckCircle,
      title: 'Frequência Adequada',
      description: 'Não envie emails muito frequentemente para evitar reclamações',
      status: 'recommended',
      solution: 'Mantenha 1-2 emails por semana no máximo'
    }
  ];

  const advancedTips = [
    {
      title: 'Configuração SPF/DKIM/DMARC',
      description: 'Essas autenticações provam que você é o dono legítimo do domínio',
      code: `SPF: v=spf1 include:_spf.google.com ~all
DKIM: Configure no painel do seu provedor
DMARC: v=DMARC1; p=quarantine; rua=mailto:admin@suaempresa.com`,
      impact: 'Alto'
    },
    {
      title: 'Reputação do IP',
      description: 'Mantenha IPs limpos evitando spam e bounces altos',
      solution: 'Use provedores de email especializados (SendGrid, Mailgun, etc.)',
      impact: 'Crítico'
    },
    {
      title: 'Engajamento do Usuário',
      description: 'Incentive aberturas, cliques e replies',
      tips: [
        'Personalize o conteúdo',
        'Use assuntos atraentes mas honestos',
        'Inclua CTAs claros',
        'Peça feedback'
      ],
      impact: 'Alto'
    },
    {
      title: 'Conteúdo Anti-Spam',
      description: 'Evite palavras e padrões que trigger filtros de spam',
      avoid: [
        'GRÁTIS!!!',
        'GARANTIA DE DINHEIRO DE VOLTA',
        'URGENTE',
        'Clique aqui',
        'Muito $$$'
      ],
      impact: 'Médio'
    }
  ];

  const monitoringTips = [
    {
      metric: 'Taxa de Abertura',
      good: '> 20%',
      excellent: '> 30%',
      action: 'Melhore assuntos e pré-headers'
    },
    {
      metric: 'Taxa de Clique',
      good: '> 3%',
      excellent: '> 5%',
      action: 'Otimize CTAs e conteúdo'
    },
    {
      metric: 'Taxa de Reclamação',
      good: '< 0.1%',
      excellent: '< 0.05%',
      action: 'Limpe lista e melhore segmentação'
    },
    {
      metric: 'Taxa de Bounce',
      good: '< 2%',
      excellent: '< 1%',
      action: 'Mantenha lista atualizada'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'important': return 'text-orange-600 bg-orange-100';
      case 'recommended': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'Crítico': return 'text-red-600';
      case 'Alto': return 'text-orange-600';
      case 'Médio': return 'text-yellow-600';
      case 'Baixo': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Shield className="w-6 h-6 mr-3 text-indigo-600" />
              Guia de Deliverability
            </h2>
            <p className="text-gray-600 mt-1">
              Dicas para seus emails chegarem na caixa de entrada principal
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-indigo-600">95%</div>
            <div className="text-sm text-gray-500">Taxa estimada de entrega</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 pt-4">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'basics' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Por que emails caem na aba Promoções?
              </h3>
              <p className="text-sm text-blue-700">
                Os provedores de email (Gmail, Outlook, etc.) analisam diversos fatores para classificar seus emails.
                O objetivo é proteger os usuários de spam e garantir que apenas conteúdo relevante chegue na caixa principal.
              </p>
            </div>

            {basicTips.map((tip, index) => {
              const Icon = tip.icon;
              return (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${getStatusColor(tip.status)}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{tip.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{tip.description}</p>
                      <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                        <strong>Solução:</strong> {tip.solution}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="space-y-6">
            {advancedTips.map((tip, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{tip.title}</h4>
                  <span className={`text-sm font-medium px-2 py-1 rounded ${getImpactColor(tip.impact)} bg-opacity-10`}>
                    Impacto: {tip.impact}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-3">{tip.description}</p>

                {tip.code && (
                  <div className="bg-gray-900 text-green-400 p-3 rounded text-sm font-mono mb-3">
                    <pre>{tip.code}</pre>
                  </div>
                )}

                {tip.solution && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <strong className="text-blue-900">Como implementar:</strong>
                    <p className="text-blue-700 text-sm mt-1">{tip.solution}</p>
                  </div>
                )}

                {tip.tips && (
                  <div className="space-y-2">
                    <strong>Dicas práticas:</strong>
                    <ul className="text-sm text-gray-600 ml-4">
                      {tip.tips.map((item, i) => (
                        <li key={i}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {tip.avoid && (
                  <div className="space-y-2">
                    <strong className="text-red-700">Evite:</strong>
                    <ul className="text-sm text-red-600 ml-4">
                      {tip.avoid.map((item, i) => (
                        <li key={i}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'monitoring' && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-900 mb-2 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                Monitore suas métricas regularmente
              </h3>
              <p className="text-sm text-green-700">
                Acompanhe estes indicadores para identificar problemas de deliverability precocemente.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {monitoringTips.map((metric, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">{metric.metric}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bom:</span>
                      <span className="font-medium text-green-600">{metric.good}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Excelente:</span>
                      <span className="font-medium text-blue-600">{metric.excellent}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      <strong>Ação:</strong> {metric.action}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-medium text-yellow-900 mb-2">⚠️ Sinais de Alerta</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Taxa de abertura abaixo de 15%</li>
                <li>• Taxa de reclamação acima de 0.1%</li>
                <li>• Muitos emails indo para spam</li>
                <li>• Aumento repentino de bounces</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-600">
            <BookOpen className="w-4 h-4 mr-2" />
            <span>Precisa de ajuda profissional?</span>
          </div>
          <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
            Contatar Especialista →
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeliverabilityGuide;