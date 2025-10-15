import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo } from 'react';
import { AlertTriangle, CheckCircle, X, Zap, Target, Eye, TrendingUp } from 'lucide-react';
const SubjectOptimizer = ({ subject, onSubjectChange, className = '' }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    // Análise do assunto
    const analysis = useMemo(() => {
        const issues = [];
        const suggestions = [];
        const warnings = [];
        const strengths = [];
        const subjectLower = subject.toLowerCase();
        // Palavras que trigger spam (críticas)
        const spamWords = ['gratuito', 'grátis', 'urgente', 'garantia', '100%', '$$$'];
        spamWords.forEach(word => {
            if (subjectLower.includes(word)) {
                issues.push(`Palavra "${word}" pode trigger filtros de spam`);
            }
        });
        // Comprimento ideal
        if (subject.length < 10) {
            warnings.push('Assunto muito curto (menos de 10 caracteres)');
        }
        else if (subject.length > 78) {
            warnings.push('Assunto muito longo (mais de 78 caracteres)');
        }
        else {
            strengths.push('Comprimento ideal para visualização');
        }
        // Personalização
        if (subject.includes('{{nome}}') || subject.includes('[Nome]')) {
            strengths.push('Personalização aumenta engajamento');
        }
        else {
            suggestions.push('Considere personalizar com o nome do destinatário');
        }
        // Pontuação e maiúsculas
        const exclamationCount = (subject.match(/!/g) || []).length;
        if (exclamationCount > 2) {
            warnings.push('Muitas exclamações podem parecer spam');
        }
        const uppercaseRatio = subject.replace(/[^A-Z]/g, '').length / subject.length;
        if (uppercaseRatio > 0.5) {
            warnings.push('Muitas maiúsculas podem parecer spam');
        }
        // Símbolos especiais
        const specialChars = subject.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g);
        if (specialChars && specialChars.length > 3) {
            warnings.push('Muitos símbolos especiais podem parecer spam');
        }
        // Palavras de ação positivas
        const actionWords = ['descubra', 'veja', 'conheça', 'aproveite', 'saiba'];
        actionWords.forEach(word => {
            if (subjectLower.includes(word)) {
                strengths.push(`Palavra de ação "${word}" incentiva abertura`);
            }
        });
        // Cálculo do score
        let score = 100;
        // Penalidades
        score -= issues.length * 25;
        score -= warnings.length * 10;
        score = Math.max(0, Math.min(100, score));
        // Bônus
        score += strengths.length * 5;
        score = Math.min(100, score);
        return { score, issues, suggestions, warnings, strengths };
    }, [subject]);
    const getScoreColor = (score) => {
        if (score >= 80)
            return 'text-green-600 bg-green-100';
        if (score >= 60)
            return 'text-yellow-600 bg-yellow-100';
        return 'text-red-600 bg-red-100';
    };
    const getScoreLabel = (score) => {
        if (score >= 80)
            return 'Excelente';
        if (score >= 60)
            return 'Bom';
        if (score >= 40)
            return 'Regular';
        return 'Ruim';
    };
    return (_jsxs("div", { className: `bg-white border border-gray-200 rounded-lg ${className}`, children: [_jsx("div", { className: "p-4 border-b border-gray-200", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsxs("div", { className: `px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(analysis.score)}`, children: [_jsx(Target, { className: "w-4 h-4 inline mr-1" }), analysis.score, "/100 - ", getScoreLabel(analysis.score)] }), _jsx("span", { className: "text-sm text-gray-600", children: "Otimiza\u00E7\u00E3o de Assunto" })] }), _jsx("button", { onClick: () => setIsExpanded(!isExpanded), className: "text-gray-400 hover:text-gray-600 transition-colors", children: isExpanded ? _jsx(X, { className: "w-5 h-5" }) : _jsx(Eye, { className: "w-5 h-5" }) })] }) }), isExpanded && (_jsxs("div", { className: "p-4 space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Assunto do Email" }), _jsx("input", { type: "text", value: subject, onChange: (e) => onSubjectChange(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500", placeholder: "Digite o assunto do email...", maxLength: 100 }), _jsxs("div", { className: "mt-1 text-xs text-gray-500 text-right", children: [subject.length, "/100 caracteres"] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [(analysis.issues.length > 0 || analysis.warnings.length > 0) && (_jsxs("div", { className: "space-y-3", children: [analysis.issues.length > 0 && (_jsxs("div", { children: [_jsxs("h4", { className: "font-medium text-red-800 mb-2 flex items-center", children: [_jsx(AlertTriangle, { className: "w-4 h-4 mr-2" }), "Problemas Cr\u00EDticos"] }), _jsx("ul", { className: "space-y-1", children: analysis.issues.map((issue, index) => (_jsxs("li", { className: "text-sm text-red-700 flex items-start", children: [_jsx(X, { className: "w-3 h-3 mr-2 mt-0.5 flex-shrink-0" }), issue] }, index))) })] })), analysis.warnings.length > 0 && (_jsxs("div", { children: [_jsxs("h4", { className: "font-medium text-yellow-800 mb-2 flex items-center", children: [_jsx(AlertTriangle, { className: "w-4 h-4 mr-2" }), "Avisos"] }), _jsx("ul", { className: "space-y-1", children: analysis.warnings.map((warning, index) => (_jsxs("li", { className: "text-sm text-yellow-700 flex items-start", children: [_jsx(AlertTriangle, { className: "w-3 h-3 mr-2 mt-0.5 flex-shrink-0" }), warning] }, warning))) })] }))] })), _jsxs("div", { className: "space-y-3", children: [analysis.strengths.length > 0 && (_jsxs("div", { children: [_jsxs("h4", { className: "font-medium text-green-800 mb-2 flex items-center", children: [_jsx(CheckCircle, { className: "w-4 h-4 mr-2" }), "Pontos Positivos"] }), _jsx("ul", { className: "space-y-1", children: analysis.strengths.map((strength, index) => (_jsxs("li", { className: "text-sm text-green-700 flex items-start", children: [_jsx(CheckCircle, { className: "w-3 h-3 mr-2 mt-0.5 flex-shrink-0" }), strength] }, index))) })] })), analysis.suggestions.length > 0 && (_jsxs("div", { children: [_jsxs("h4", { className: "font-medium text-blue-800 mb-2 flex items-center", children: [_jsx(Zap, { className: "w-4 h-4 mr-2" }), "Sugest\u00F5es"] }), _jsx("ul", { className: "space-y-1", children: analysis.suggestions.map((suggestion, index) => (_jsxs("li", { className: "text-sm text-blue-700 flex items-start", children: [_jsx(Target, { className: "w-3 h-3 mr-2 mt-0.5 flex-shrink-0" }), suggestion] }, index))) })] }))] })] }), _jsxs("div", { className: "bg-gray-50 border border-gray-200 rounded-lg p-4", children: [_jsxs("h4", { className: "font-medium text-gray-900 mb-3 flex items-center", children: [_jsx(TrendingUp, { className: "w-4 h-4 mr-2" }), "Exemplos de Assuntos Otimizados"] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: [_jsxs("div", { className: "text-sm", children: [_jsx("div", { className: "font-medium text-green-800 mb-1", children: "\u2705 Bom:" }), _jsx("div", { className: "text-gray-700 bg-white p-2 rounded border", children: "\"Jo\u00E3o, veja nossa nova cole\u00E7\u00E3o\"" })] }), _jsxs("div", { className: "text-sm", children: [_jsx("div", { className: "font-medium text-red-800 mb-1", children: "\u274C Evitar:" }), _jsx("div", { className: "text-gray-700 bg-white p-2 rounded border", children: "\"GR\u00C1TIS!!! URGENTE!!!\"" })] })] })] })] }))] }));
};
export default SubjectOptimizer;
