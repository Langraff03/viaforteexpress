import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/components/LeadCampaignManager.tsx
import React, { useState, useRef, useCallback } from 'react';
import { Upload, Mail, Eye, Play, Loader2, CheckCircle } from 'lucide-react';
import { renderAsync } from '@react-email/render';
import OfferEmail from '../emails/OfferEmail';
const LeadCampaignManager = () => {
    const [leads, setLeads] = useState([]);
    const [fileName, setFileName] = useState('');
    const [validLeads, setValidLeads] = useState([]);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [emailPreview, setEmailPreview] = useState('');
    const [campaignStatus, setCampaignStatus] = useState(null);
    const fileInputRef = useRef(null);
    const [config, setConfig] = useState({
        name: '',
        oferta_nome: '',
        desconto: '',
        link_da_oferta: '',
        descricao_adicional: ''
    });
    // Validação de email
    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };
    // Processar arquivo JSON
    const processJsonFile = useCallback((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result;
                const jsonData = JSON.parse(content);
                if (!Array.isArray(jsonData)) {
                    alert('❌ Arquivo deve conter um array de leads');
                    return;
                }
                setLeads(jsonData);
                setFileName(file.name);
                // Validar leads
                const valid = jsonData.filter((lead) => lead.email && isValidEmail(lead.email));
                setValidLeads(valid);
                console.log(`📊 ${valid.length} leads válidos de ${jsonData.length} totais`);
            }
            catch (error) {
                console.error('Erro ao processar JSON:', error);
                alert('❌ Erro ao processar arquivo JSON. Verifique se o formato está correto.');
            }
        };
        reader.readAsText(file);
    }, []);
    // Handlers de drag & drop
    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);
    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragOver(false);
        const files = Array.from(e.dataTransfer.files);
        const jsonFile = files.find(file => file.type === 'application/json' || file.name.endsWith('.json'));
        if (jsonFile) {
            processJsonFile(jsonFile);
        }
        else {
            alert('❌ Por favor, envie apenas arquivos JSON');
        }
    }, [processJsonFile]);
    const handleFileSelect = useCallback((e) => {
        const file = e.target.files?.[0];
        if (file) {
            processJsonFile(file);
        }
    }, [processJsonFile]);
    // Gerar preview do email
    const generatePreview = useCallback(async () => {
        if (!config.oferta_nome || !config.link_da_oferta || validLeads.length === 0) {
            alert('⚠️ Configure a oferta e carregue os leads primeiro');
            return;
        }
        try {
            const sampleLead = validLeads[0];
            const html = await renderAsync(React.createElement(OfferEmail, {
                nome: sampleLead.nome || 'Cliente',
                oferta_nome: config.oferta_nome,
                desconto: config.desconto,
                link_da_oferta: config.link_da_oferta,
                descricao_adicional: config.descricao_adicional
            }));
            setEmailPreview(html);
            setShowPreview(true);
        }
        catch (error) {
            console.error('Erro ao gerar preview:', error);
            alert('❌ Erro ao gerar preview do email');
        }
    }, [config, validLeads]);
    // Iniciar campanha
    const startCampaign = useCallback(async () => {
        if (!config.name || !config.oferta_nome || !config.link_da_oferta || validLeads.length === 0) {
            alert('⚠️ Preencha todos os campos obrigatórios e carregue os leads');
            return;
        }
        setIsProcessing(true);
        try {
            const response = await fetch('/api/lead-campaigns', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'client-id': 'admin-user' // TODO: Usar ID real do usuário
                },
                body: JSON.stringify({
                    campaign: config,
                    leads: validLeads,
                    fileName
                })
            });
            const result = await response.json();
            if (result.success) {
                setCampaignStatus(result.campaign);
                alert(`✅ Campanha "${config.name}" iniciada com sucesso!\n📧 ${result.campaign.validLeads} emails serão enviados`);
            }
            else {
                throw new Error(result.error || 'Erro desconhecido');
            }
        }
        catch (error) {
            console.error('Erro ao iniciar campanha:', error);
            alert(`❌ Erro ao iniciar campanha: ${error instanceof Error ? error.message : String(error)}`);
        }
        finally {
            setIsProcessing(false);
        }
    }, [config, validLeads, fileName]);
    return (_jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6 border border-gray-200", children: [_jsxs("div", { className: "flex items-center gap-3 mb-6", children: [_jsx(Mail, { className: "w-6 h-6 text-indigo-600" }), _jsx("h3", { className: "text-xl font-semibold text-gray-900", children: "Campanha de Leads" })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-8", children: [_jsxs("div", { children: [_jsx("h4", { className: "text-lg font-medium text-gray-900 mb-4", children: "1. Upload do Arquivo JSON" }), _jsxs("div", { className: `border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragOver
                                    ? 'border-indigo-400 bg-indigo-50'
                                    : 'border-gray-300 hover:border-indigo-400'}`, onDragOver: handleDragOver, onDragLeave: handleDragLeave, onDrop: handleDrop, onClick: () => fileInputRef.current?.click(), children: [_jsx(Upload, { className: "w-12 h-12 text-gray-400 mx-auto mb-4" }), _jsx("p", { className: "text-sm text-gray-600 mb-2", children: "Arraste o arquivo JSON aqui ou clique para selecionar" }), _jsxs("p", { className: "text-xs text-gray-500", children: ["Formato esperado: ", `[{"nome": "João", "email": "joao@email.com"}, ...]`] }), _jsx("input", { ref: fileInputRef, type: "file", accept: ".json,application/json", onChange: handleFileSelect, className: "hidden" })] }), fileName && (_jsx("div", { className: "mt-4 p-4 bg-green-50 border border-green-200 rounded-lg", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(CheckCircle, { className: "w-5 h-5 text-green-600" }), _jsxs("div", { children: [_jsxs("p", { className: "text-sm font-medium text-green-800", children: ["Arquivo carregado: ", fileName] }), _jsxs("p", { className: "text-sm text-green-600", children: [validLeads.length, " leads v\u00E1lidos de ", leads.length, " totais"] })] })] }) }))] }), _jsxs("div", { children: [_jsx("h4", { className: "text-lg font-medium text-gray-900 mb-4", children: "2. Configura\u00E7\u00E3o da Oferta" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Nome da Campanha *" }), _jsx("input", { type: "text", value: config.name, onChange: (e) => setConfig({ ...config, name: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent", placeholder: "Ex: Black Friday 2024" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Nome da Oferta *" }), _jsx("input", { type: "text", value: config.oferta_nome, onChange: (e) => setConfig({ ...config, oferta_nome: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent", placeholder: "Ex: Transporte Express" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Desconto" }), _jsx("input", { type: "text", value: config.desconto, onChange: (e) => setConfig({ ...config, desconto: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent", placeholder: "Ex: 50% OFF" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Link da Oferta *" }), _jsx("input", { type: "url", value: config.link_da_oferta, onChange: (e) => setConfig({ ...config, link_da_oferta: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent", placeholder: "https://exemplo.com/oferta" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Descri\u00E7\u00E3o Adicional" }), _jsx("textarea", { value: config.descricao_adicional, onChange: (e) => setConfig({ ...config, descricao_adicional: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent", rows: 3, placeholder: "Ex: Oferta v\u00E1lida at\u00E9 31/12. Frete gr\u00E1tis para todo Brasil!" })] })] })] })] }), _jsxs("div", { className: "mt-8 flex flex-wrap gap-4", children: [_jsxs("button", { onClick: generatePreview, disabled: !config.oferta_nome || validLeads.length === 0, className: "flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed", children: [_jsx(Eye, { className: "w-4 h-4" }), "Preview do Email"] }), _jsxs("button", { onClick: startCampaign, disabled: isProcessing || !config.name || validLeads.length === 0, className: "flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed", children: [isProcessing ? (_jsx(Loader2, { className: "w-4 h-4 animate-spin" })) : (_jsx(Play, { className: "w-4 h-4" })), isProcessing ? 'Iniciando...' : `Iniciar Campanha (${validLeads.length} emails)`] })] }), campaignStatus && (_jsx("div", { className: "mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Loader2, { className: "w-5 h-5 text-blue-600 animate-spin" }), _jsxs("div", { children: [_jsxs("p", { className: "text-sm font-medium text-blue-800", children: ["Campanha \"", campaignStatus.name, "\" em processamento"] }), _jsxs("p", { className: "text-sm text-blue-600", children: [campaignStatus.validLeads, " emails sendo enviados..."] })] })] }) })), showPreview && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4", children: _jsxs("div", { className: "bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden", children: [_jsxs("div", { className: "p-4 border-b border-gray-200 flex items-center justify-between", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Preview do Email" }), _jsx("button", { onClick: () => setShowPreview(false), className: "text-gray-400 hover:text-gray-600", children: "\u2715" })] }), _jsx("div", { className: "p-4 overflow-y-auto max-h-[calc(90vh-120px)]", children: _jsx("iframe", { srcDoc: emailPreview, className: "w-full h-96 border border-gray-300 rounded", title: "Preview do Email" }) })] }) }))] }));
};
export default LeadCampaignManager;
