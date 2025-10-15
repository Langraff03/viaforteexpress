import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Lightbulb, CheckCircle, AlertTriangle, X, ExternalLink } from 'lucide-react';
const DeliverabilityTips = ({ className = '' }) => {
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
    const getImpactColor = (impact) => {
        switch (impact) {
            case 'Crítico': return 'text-red-600 bg-red-100';
            case 'Alto': return 'text-orange-600 bg-orange-100';
            case 'Médio': return 'text-yellow-600 bg-yellow-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };
    if (isMinimized) {
        return (_jsx("div", { className: `bg-indigo-50 border border-indigo-200 rounded-lg p-3 ${className}`, children: _jsxs("button", { onClick: () => setIsMinimized(false), className: "flex items-center text-indigo-700 hover:text-indigo-800 text-sm font-medium", children: [_jsx(Lightbulb, { className: "w-4 h-4 mr-2" }), "Dicas de Deliverability", _jsx(ExternalLink, { className: "w-3 h-3 ml-1" })] }) }));
    }
    return (_jsx("div", { className: `bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg ${className}`, children: _jsxs("div", { className: "p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(Lightbulb, { className: "w-5 h-5 text-indigo-600 mr-2" }), _jsx("h3", { className: "font-semibold text-indigo-900", children: "Dicas para Inbox" })] }), _jsx("button", { onClick: () => setIsMinimized(true), className: "text-gray-400 hover:text-gray-600 transition-colors", children: _jsx(X, { className: "w-4 h-4" }) })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: tips.map((tip, index) => {
                        const Icon = tip.icon;
                        return (_jsx("div", { className: "bg-white rounded-lg p-3 border border-gray-200 hover:shadow-sm transition-shadow", children: _jsxs("div", { className: "flex items-start space-x-3", children: [_jsx("div", { className: `p-1.5 rounded ${getImpactColor(tip.impact)}`, children: _jsx(Icon, { className: "w-3 h-3" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h4", { className: "font-medium text-gray-900 text-sm mb-1", children: tip.title }), _jsx("p", { className: "text-gray-600 text-xs mb-2", children: tip.description }), _jsx("div", { className: "text-xs text-indigo-600 font-medium", children: tip.action })] })] }) }, index));
                    }) }), _jsx("div", { className: "mt-4 pt-3 border-t border-blue-200", children: _jsxs("div", { className: "flex items-center justify-between text-xs", children: [_jsx("span", { className: "text-gray-600", children: "\uD83D\uDCA1 Estas dicas aumentam em at\u00E9 300% a taxa de entrega na caixa principal" }), _jsx("span", { className: "text-indigo-600 font-medium", children: "Ver guia completo \u2192" })] }) })] }) }));
};
export default DeliverabilityTips;
