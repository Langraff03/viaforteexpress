import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X, Mail, Users, Clock, TrendingUp, AlertTriangle, BarChart3 } from 'lucide-react';
import Button from './Button';
const CampaignSuccessModal = ({ isOpen, onClose, campaignStats, onViewProgress, onCreateNew, }) => {
    // Verificação de segurança - não renderizar se não há dados
    if (!campaignStats) {
        return null;
    }
    const successRate = Math.round((campaignStats.successEmails / campaignStats.totalEmails) * 100);
    const isHighSuccessRate = successRate >= 95;
    const formatNumber = (num) => {
        return num.toLocaleString('pt-BR');
    };
    const handleViewProgress = () => {
        onViewProgress?.();
    };
    const handleCreateNew = () => {
        onClose();
        onCreateNew();
    };
    return (_jsx(AnimatePresence, { children: isOpen && (_jsxs("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4", children: [_jsx(motion.div, { className: "absolute inset-0 bg-black bg-opacity-50", initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, onClick: onClose }), _jsxs(motion.div, { className: "relative bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden", initial: { opacity: 0, scale: 0.9, y: 20 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.9, y: 20 }, transition: { type: "spring", stiffness: 300, damping: 30 }, children: [_jsxs("div", { className: `p-6 text-white relative ${isHighSuccessRate
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                                : 'bg-gradient-to-r from-blue-500 to-indigo-600'}`, children: [_jsx("button", { onClick: onClose, className: "absolute top-4 right-4 text-white/80 hover:text-white transition-colors", children: _jsx(X, { className: "w-5 h-5" }) }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "bg-white/20 p-2 rounded-full", children: _jsx(CheckCircle, { className: "w-6 h-6" }) }), _jsxs("div", { children: [_jsx("h2", { className: "text-xl font-bold", children: "Campanha Enviada!" }), _jsxs("p", { className: `text-sm ${isHighSuccessRate ? 'text-green-100' : 'text-blue-100'}`, children: [campaignStats.campaignType === 'enterprise' ? 'Campanha Enterprise' : 'Campanha Pequena', " processada com sucesso"] })] })] })] }), _jsxs("div", { className: "p-6 space-y-6", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-4 text-center", children: [_jsxs("div", { className: "flex items-center justify-center mb-2", children: [_jsx(Mail, { className: "w-5 h-5 text-blue-600 mr-2" }), _jsx("span", { className: "text-sm font-medium text-blue-800", children: "Total Enviados" })] }), _jsx("div", { className: "text-2xl font-bold text-blue-900", children: formatNumber(campaignStats.totalEmails) })] }), _jsxs("div", { className: "bg-green-50 border border-green-200 rounded-lg p-4 text-center", children: [_jsxs("div", { className: "flex items-center justify-center mb-2", children: [_jsx(CheckCircle, { className: "w-5 h-5 text-green-600 mr-2" }), _jsx("span", { className: "text-sm font-medium text-green-800", children: "Taxa de Sucesso" })] }), _jsxs("div", { className: "text-2xl font-bold text-green-900", children: [successRate, "%"] })] })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between p-3 bg-gray-50 rounded-lg", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Users, { className: "w-4 h-4 text-green-600" }), _jsx("span", { className: "text-sm font-medium text-gray-700", children: "Emails Entregues" })] }), _jsx("span", { className: "text-sm font-bold text-green-800", children: formatNumber(campaignStats.successEmails) })] }), campaignStats.failedEmails > 0 && (_jsxs("div", { className: "flex items-center justify-between p-3 bg-red-50 rounded-lg", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(AlertTriangle, { className: "w-4 h-4 text-red-600" }), _jsx("span", { className: "text-sm font-medium text-gray-700", children: "Falhas de Entrega" })] }), _jsx("span", { className: "text-sm font-bold text-red-800", children: formatNumber(campaignStats.failedEmails) })] })), _jsxs("div", { className: "flex items-center justify-between p-3 bg-gray-50 rounded-lg", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Clock, { className: "w-4 h-4 text-blue-600" }), _jsx("span", { className: "text-sm font-medium text-gray-700", children: "Tempo de Processamento" })] }), _jsx("span", { className: "text-sm font-bold text-blue-800", children: campaignStats.processingTime })] })] }), _jsxs("div", { className: `p-4 rounded-lg ${isHighSuccessRate
                                        ? 'bg-green-50 border border-green-200'
                                        : successRate >= 80
                                            ? 'bg-yellow-50 border border-yellow-200'
                                            : 'bg-red-50 border border-red-200'}`, children: [_jsxs("div", { className: "flex items-center mb-2", children: [_jsx(TrendingUp, { className: `w-4 h-4 mr-2 ${isHighSuccessRate ? 'text-green-600' :
                                                        successRate >= 80 ? 'text-yellow-600' : 'text-red-600'}` }), _jsx("span", { className: `text-sm font-medium ${isHighSuccessRate ? 'text-green-800' :
                                                        successRate >= 80 ? 'text-yellow-800' : 'text-red-800'}`, children: isHighSuccessRate
                                                        ? 'Excelente Performance!'
                                                        : successRate >= 80
                                                            ? 'Boa Performance'
                                                            : 'Performance Pode Melhorar' })] }), _jsx("p", { className: `text-xs ${isHighSuccessRate ? 'text-green-700' :
                                                successRate >= 80 ? 'text-yellow-700' : 'text-red-700'}`, children: isHighSuccessRate
                                                ? 'Sua campanha teve uma taxa de entrega excelente! Continue assim.'
                                                : successRate >= 80
                                                    ? 'Boa taxa de entrega. Considere revisar a lista de emails para melhorar ainda mais.'
                                                    : 'Taxa de entrega baixa. Verifique a qualidade da lista de emails e templates.' })] }), _jsxs("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-4", children: [_jsxs("h3", { className: "text-sm font-medium text-blue-800 mb-2 flex items-center", children: [_jsx(BarChart3, { className: "w-4 h-4 mr-2" }), "Pr\u00F3ximos Passos"] }), _jsxs("ul", { className: "text-sm text-blue-700 space-y-1", children: [_jsx("li", { children: "\u2022 Monitore as estat\u00EDsticas de abertura e clique" }), _jsx("li", { children: "\u2022 Acompanhe as respostas dos clientes" }), _jsx("li", { children: "\u2022 Considere segmentar melhor sua pr\u00F3xima campanha" }), campaignStats.failedEmails > 0 && (_jsx("li", { children: "\u2022 Revise os emails que falharam na entrega" }))] })] })] }), _jsxs("div", { className: "bg-gray-50 px-6 py-4 flex flex-col sm:flex-row gap-3", children: [onViewProgress && campaignStats.campaignType === 'enterprise' && (_jsx(Button, { variant: "outline", onClick: handleViewProgress, leftIcon: _jsx(BarChart3, { className: "w-4 h-4" }), className: "flex-1", children: "Ver Progresso Detalhado" })), _jsx(Button, { variant: "primary", onClick: handleCreateNew, leftIcon: _jsx(Mail, { className: "w-4 h-4" }), className: "flex-1", children: "Nova Campanha" })] })] })] })) }));
};
export default CampaignSuccessModal;
