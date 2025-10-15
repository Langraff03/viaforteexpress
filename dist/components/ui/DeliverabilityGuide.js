import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Shield, CheckCircle, AlertTriangle, Mail, Users, Target, Zap, BookOpen, TrendingUp } from 'lucide-react';
const DeliverabilityGuide = ({ className = '' }) => {
    const [activeTab, setActiveTab] = useState('basics');
    const tabs = [
        { id: 'basics', label: 'Básico', icon: Shield },
        { id: 'advanced', label: 'Avançado', icon: Zap },
        { id: 'monitoring', label: 'Monitoramento', icon: TrendingUp }
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
    const getStatusColor = (status) => {
        switch (status) {
            case 'critical': return 'text-red-600 bg-red-100';
            case 'important': return 'text-orange-600 bg-orange-100';
            case 'recommended': return 'text-blue-600 bg-blue-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };
    const getImpactColor = (impact) => {
        switch (impact) {
            case 'Crítico': return 'text-red-600';
            case 'Alto': return 'text-orange-600';
            case 'Médio': return 'text-yellow-600';
            case 'Baixo': return 'text-green-600';
            default: return 'text-gray-600';
        }
    };
    return (_jsxs("div", { className: `bg-white rounded-xl shadow-lg border border-gray-200 ${className}`, children: [_jsx("div", { className: "p-6 border-b border-gray-200", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("h2", { className: "text-xl font-semibold text-gray-900 flex items-center", children: [_jsx(Shield, { className: "w-6 h-6 mr-3 text-indigo-600" }), "Guia de Deliverability"] }), _jsx("p", { className: "text-gray-600 mt-1", children: "Dicas para seus emails chegarem na caixa de entrada principal" })] }), _jsxs("div", { className: "text-right", children: [_jsx("div", { className: "text-2xl font-bold text-indigo-600", children: "95%" }), _jsx("div", { className: "text-sm text-gray-500", children: "Taxa estimada de entrega" })] })] }) }), _jsx("div", { className: "px-6 pt-4", children: _jsx("div", { className: "flex space-x-1 bg-gray-100 rounded-lg p-1", children: tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (_jsxs("button", { onClick: () => setActiveTab(tab.id), className: `flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab.id
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-800'}`, children: [_jsx(Icon, { className: "w-4 h-4 mr-2" }), tab.label] }, tab.id));
                    }) }) }), _jsxs("div", { className: "p-6", children: [activeTab === 'basics' && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-4", children: [_jsxs("h3", { className: "font-medium text-blue-900 mb-2 flex items-center", children: [_jsx(AlertTriangle, { className: "w-4 h-4 mr-2" }), "Por que emails caem na aba Promo\u00E7\u00F5es?"] }), _jsx("p", { className: "text-sm text-blue-700", children: "Os provedores de email (Gmail, Outlook, etc.) analisam diversos fatores para classificar seus emails. O objetivo \u00E9 proteger os usu\u00E1rios de spam e garantir que apenas conte\u00FAdo relevante chegue na caixa principal." })] }), basicTips.map((tip, index) => {
                                const Icon = tip.icon;
                                return (_jsx("div", { className: "border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow", children: _jsxs("div", { className: "flex items-start space-x-3", children: [_jsx("div", { className: `p-2 rounded-lg ${getStatusColor(tip.status)}`, children: _jsx(Icon, { className: "w-5 h-5" }) }), _jsxs("div", { className: "flex-1", children: [_jsx("h4", { className: "font-medium text-gray-900", children: tip.title }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: tip.description }), _jsxs("div", { className: "mt-2 p-2 bg-gray-50 rounded text-sm", children: [_jsx("strong", { children: "Solu\u00E7\u00E3o:" }), " ", tip.solution] })] })] }) }, index));
                            })] })), activeTab === 'advanced' && (_jsx("div", { className: "space-y-6", children: advancedTips.map((tip, index) => (_jsxs("div", { className: "border border-gray-200 rounded-lg p-4", children: [_jsxs("div", { className: "flex items-start justify-between mb-3", children: [_jsx("h4", { className: "font-medium text-gray-900", children: tip.title }), _jsxs("span", { className: `text-sm font-medium px-2 py-1 rounded ${getImpactColor(tip.impact)} bg-opacity-10`, children: ["Impacto: ", tip.impact] })] }), _jsx("p", { className: "text-sm text-gray-600 mb-3", children: tip.description }), tip.code && (_jsx("div", { className: "bg-gray-900 text-green-400 p-3 rounded text-sm font-mono mb-3", children: _jsx("pre", { children: tip.code }) })), tip.solution && (_jsxs("div", { className: "bg-blue-50 border border-blue-200 rounded p-3", children: [_jsx("strong", { className: "text-blue-900", children: "Como implementar:" }), _jsx("p", { className: "text-blue-700 text-sm mt-1", children: tip.solution })] })), tip.tips && (_jsxs("div", { className: "space-y-2", children: [_jsx("strong", { children: "Dicas pr\u00E1ticas:" }), _jsx("ul", { className: "text-sm text-gray-600 ml-4", children: tip.tips.map((item, i) => (_jsxs("li", { children: ["\u2022 ", item] }, i))) })] })), tip.avoid && (_jsxs("div", { className: "space-y-2", children: [_jsx("strong", { className: "text-red-700", children: "Evite:" }), _jsx("ul", { className: "text-sm text-red-600 ml-4", children: tip.avoid.map((item, i) => (_jsxs("li", { children: ["\u2022 ", item] }, i))) })] }))] }, index))) })), activeTab === 'monitoring' && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "bg-green-50 border border-green-200 rounded-lg p-4", children: [_jsxs("h3", { className: "font-medium text-green-900 mb-2 flex items-center", children: [_jsx(TrendingUp, { className: "w-4 h-4 mr-2" }), "Monitore suas m\u00E9tricas regularmente"] }), _jsx("p", { className: "text-sm text-green-700", children: "Acompanhe estes indicadores para identificar problemas de deliverability precocemente." })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: monitoringTips.map((metric, index) => (_jsxs("div", { className: "bg-white border border-gray-200 rounded-lg p-4", children: [_jsx("h4", { className: "font-medium text-gray-900 mb-2", children: metric.metric }), _jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "Bom:" }), _jsx("span", { className: "font-medium text-green-600", children: metric.good })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "Excelente:" }), _jsx("span", { className: "font-medium text-blue-600", children: metric.excellent })] })] }), _jsx("div", { className: "mt-3 pt-3 border-t border-gray-100", children: _jsxs("p", { className: "text-xs text-gray-500", children: [_jsx("strong", { children: "A\u00E7\u00E3o:" }), " ", metric.action] }) })] }, index))) }), _jsxs("div", { className: "bg-yellow-50 border border-yellow-200 rounded-lg p-4", children: [_jsx("h3", { className: "font-medium text-yellow-900 mb-2", children: "\u26A0\uFE0F Sinais de Alerta" }), _jsxs("ul", { className: "text-sm text-yellow-700 space-y-1", children: [_jsx("li", { children: "\u2022 Taxa de abertura abaixo de 15%" }), _jsx("li", { children: "\u2022 Taxa de reclama\u00E7\u00E3o acima de 0.1%" }), _jsx("li", { children: "\u2022 Muitos emails indo para spam" }), _jsx("li", { children: "\u2022 Aumento repentino de bounces" })] })] })] }))] }), _jsx("div", { className: "px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center text-sm text-gray-600", children: [_jsx(BookOpen, { className: "w-4 h-4 mr-2" }), _jsx("span", { children: "Precisa de ajuda profissional?" })] }), _jsx("button", { className: "text-indigo-600 hover:text-indigo-800 text-sm font-medium", children: "Contatar Especialista \u2192" })] }) })] }));
};
export default DeliverabilityGuide;
