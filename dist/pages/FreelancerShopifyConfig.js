import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Store, Copy, Eye, EyeOff, Save, CheckCircle2, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabaseClient';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
export default function FreelancerShopifyConfig() {
    const { user } = useAuth();
    const [webhookSecret, setWebhookSecret] = useState('');
    const [showSecret, setShowSecret] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const webhookUrl = `${import.meta.env.VITE_WEBHOOK_SERVER_URL || 'http://localhost:3001'}/webhook/shopify?client_id=${user?.id}`;
    useEffect(() => {
        if (!user?.id)
            return;
        // Buscar configuração salva do webhook Shopify
        const loadConfig = async () => {
            try {
                const { data, error } = await supabase
                    .from('shopify_configs')
                    .select('webhook_secret, shop_domain')
                    .eq('user_id', user.id)
                    .eq('is_active', true)
                    .maybeSingle();
                if (!error && data) {
                    setWebhookSecret(data.webhook_secret || '');
                }
            }
            catch (error) {
                console.error('Erro ao carregar configuração Shopify:', error);
            }
            finally {
                setIsLoaded(true);
            }
        };
        loadConfig();
    }, [user?.id]);
    const handleSaveConfig = async () => {
        if (!user?.id || !webhookSecret.trim())
            return;
        setIsSaving(true);
        setSaveSuccess(false);
        try {
            const { error } = await supabase
                .from('shopify_configs')
                .upsert({
                user_id: user.id,
                webhook_secret: webhookSecret.trim(),
                shop_domain: null, // Pode ser preenchido futuramente se necessário
                is_active: true,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id' // ✅ Especificar coluna de conflito
            });
            if (error)
                throw error;
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        }
        catch (error) {
            console.error('Erro ao salvar configuração:', error);
            alert('Erro ao salvar configuração. Tente novamente.');
        }
        finally {
            setIsSaving(false);
        }
    };
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
    };
    if (!isLoaded) {
        return (_jsxs("div", { className: "flex items-center justify-center h-64", children: [_jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600" }), _jsx("span", { className: "ml-3 text-emerald-600", children: "Carregando configura\u00E7\u00F5es..." })] }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "flex items-center justify-between", children: _jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs(Link, { to: "/freelancer/dashboard", className: "flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50", children: [_jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }), "Voltar ao Dashboard"] }), _jsxs("div", { children: [_jsxs("h1", { className: "text-2xl font-bold text-gray-900 flex items-center", children: [_jsx(Store, { className: "w-8 h-8 text-green-600 mr-3" }), "Configura\u00E7\u00F5es Shopify"] }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Configure webhook para receber pedidos automaticamente da sua loja Shopify" })] })] }) }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "flex-shrink-0 p-3 bg-green-100 rounded-lg", children: _jsx(Store, { className: "w-6 h-6 text-green-600" }) }), _jsxs("div", { children: [_jsx("h2", { className: "text-xl font-medium text-gray-900", children: "Integra\u00E7\u00E3o com Shopify" }), _jsx("p", { className: "text-sm text-gray-500", children: "Conecte sua loja Shopify para automatizar o processo de rastreamento" })] })] }) }), _jsxs(CardContent, { className: "space-y-8", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-base font-medium text-gray-900 mb-3", children: "1. URL do Webhook" }), _jsxs("div", { className: "flex space-x-3", children: [_jsx("input", { type: "text", value: webhookUrl, readOnly: true, className: "flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 font-mono" }), _jsxs("button", { onClick: () => copyToClipboard(webhookUrl), className: "px-4 py-3 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center", children: [_jsx(Copy, { className: "w-4 h-4 mr-2" }), "Copiar"] })] }), _jsx("p", { className: "mt-2 text-sm text-gray-600", children: "\uD83D\uDCCB Cole esta URL na configura\u00E7\u00E3o de webhook da sua loja Shopify" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-base font-medium text-gray-900 mb-3", children: "2. Webhook Secret da Shopify" }), _jsxs("div", { className: "flex space-x-3", children: [_jsxs("div", { className: "flex-1 relative", children: [_jsx("input", { type: showSecret ? 'text' : 'password', value: webhookSecret, onChange: (e) => setWebhookSecret(e.target.value), placeholder: "Cole aqui o webhook secret da sua loja Shopify", className: "w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" }), _jsx("button", { type: "button", onClick: () => setShowSecret(!showSecret), className: "absolute inset-y-0 right-0 pr-3 flex items-center", children: showSecret ? (_jsx(EyeOff, { className: "h-5 w-5 text-gray-400" })) : (_jsx(Eye, { className: "h-5 w-5 text-gray-400" })) })] }), _jsx("button", { onClick: handleSaveConfig, disabled: isSaving || !webhookSecret.trim(), className: "px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center min-w-[120px] justify-center", children: isSaving ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "w-4 h-4 mr-2 animate-spin rounded-full border-t-2 border-b-2 border-white" }), "Salvando..."] })) : saveSuccess ? (_jsxs(_Fragment, { children: [_jsx(CheckCircle2, { className: "w-4 h-4 mr-2" }), "Salvo!"] })) : (_jsxs(_Fragment, { children: [_jsx(Save, { className: "w-4 h-4 mr-2" }), "Salvar"] })) })] }), _jsx("p", { className: "mt-2 text-sm text-gray-600", children: "\uD83D\uDD11 Copie o webhook secret do painel da Shopify e cole aqui" })] }), _jsxs("div", { className: "bg-blue-50 border border-blue-200 rounded-xl p-6", children: [_jsxs("h3", { className: "text-lg font-medium text-blue-900 mb-4 flex items-center", children: [_jsx(AlertCircle, { className: "w-5 h-5 mr-2" }), "\uD83D\uDCCB Como configurar na Shopify:"] }), _jsxs("ol", { className: "text-sm text-blue-800 space-y-3 list-decimal list-inside", children: [_jsxs("li", { children: [_jsx("strong", { children: "Acesse o painel admin" }), " da sua loja Shopify"] }), _jsxs("li", { children: ["V\u00E1 em ", _jsx("strong", { children: "Configura\u00E7\u00F5es \u2192 Notifica\u00E7\u00F5es" })] }), _jsxs("li", { children: ["Na se\u00E7\u00E3o ", _jsx("strong", { children: "Webhooks" }), ", clique em ", _jsx("strong", { children: "Criar webhook" })] }), _jsxs("li", { children: [_jsx("strong", { children: "Evento:" }), " Selecione \"Pagamento de pedido\" (orders/paid)"] }), _jsxs("li", { children: [_jsx("strong", { children: "Formato:" }), " JSON"] }), _jsxs("li", { children: [_jsx("strong", { children: "URL:" }), " Cole a URL acima"] }), _jsxs("li", { children: ["Salve o webhook e ", _jsx("strong", { children: "copie o Webhook signing secret" })] }), _jsxs("li", { children: ["Cole o secret no campo acima e clique em ", _jsx("strong", { children: "Salvar" })] })] })] }), webhookSecret ? (_jsx("div", { className: "bg-green-50 border border-green-200 rounded-xl p-4", children: _jsxs("div", { className: "flex items-center", children: [_jsx(CheckCircle, { className: "w-6 h-6 text-green-600 mr-3" }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-medium text-green-800", children: "\u2705 Configura\u00E7\u00E3o Shopify ativa" }), _jsx("p", { className: "text-sm text-green-700 mt-1", children: "Seu sistema est\u00E1 pronto para receber pedidos da Shopify automaticamente! Os pedidos aparecer\u00E3o na sua lista de \"Pedidos Recentes\" no dashboard." })] })] }) })) : (_jsx("div", { className: "bg-yellow-50 border border-yellow-200 rounded-xl p-4", children: _jsxs("div", { className: "flex items-center", children: [_jsx(AlertCircle, { className: "w-6 h-6 text-yellow-600 mr-3" }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-medium text-yellow-800", children: "\u26A0\uFE0F Configura\u00E7\u00E3o pendente" }), _jsx("p", { className: "text-sm text-yellow-700 mt-1", children: "Configure o webhook secret acima para ativar a integra\u00E7\u00E3o com Shopify." })] })] }) })), _jsxs("div", { className: "bg-gray-50 border border-gray-200 rounded-xl p-4", children: [_jsx("h3", { className: "text-sm font-medium text-gray-900 mb-2", children: "\uD83D\uDD27 Informa\u00E7\u00F5es T\u00E9cnicas:" }), _jsxs("ul", { className: "text-xs text-gray-600 space-y-1", children: [_jsxs("li", { children: ["\u2022 ", _jsx("strong", { children: "Evento suportado:" }), " orders/paid (Pagamento de pedido)"] }), _jsxs("li", { children: ["\u2022 ", _jsx("strong", { children: "Formato:" }), " JSON"] }), _jsxs("li", { children: ["\u2022 ", _jsx("strong", { children: "Valida\u00E7\u00E3o:" }), " HMAC SHA256 obrigat\u00F3ria"] }), _jsxs("li", { children: ["\u2022 ", _jsx("strong", { children: "Processamento:" }), " Apenas pedidos com endere\u00E7o de entrega"] }), _jsxs("li", { children: ["\u2022 ", _jsx("strong", { children: "Integra\u00E7\u00E3o:" }), " Funciona junto com gateways existentes (Asset, etc.)"] })] })] })] })] })] }));
}
