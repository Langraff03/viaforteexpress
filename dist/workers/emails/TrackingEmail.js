import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Html, Head, Body, Container, Text, Link, Preview, Section, Hr } from '@react-email/components';
export default function TrackingEmail({ name, trackingCode, orderId }) {
    // Função helper para obter a URL base de forma compatível
    function getBaseUrl() {
        // Se estivermos no browser (frontend)
        if (typeof window !== 'undefined' && import.meta?.env) {
            return import.meta.env.VITE_APP_URL || 'https://rastreio.viaforteexpress.com';
        }
        // Se estivermos no Node.js (backend/workers)
        return process.env.VITE_APP_URL || process.env.APP_URL || 'https://rastreio.viaforteexpress.com';
    }
    const baseUrl = getBaseUrl();
    const trackingUrl = `${baseUrl}/tracking/${trackingCode}`;
    return (_jsxs(Html, { children: [_jsx(Head, {}), _jsx(Preview, { children: "\uD83D\uDE9A Seu pedido est\u00E1 a caminho! Acompanhe o rastreamento na VIA FORTE EXPRESS" }), _jsx(Body, { style: {
                    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
                    backgroundColor: '#f6f9fc',
                    padding: '40px 0',
                    margin: '0'
                }, children: _jsxs(Container, { style: {
                        backgroundColor: '#ffffff',
                        padding: '40px',
                        borderRadius: '12px',
                        maxWidth: '600px',
                        margin: 'auto',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                        border: '1px solid #e5e7eb'
                    }, children: [_jsx(Section, { style: { textAlign: 'center', marginBottom: '32px' }, children: _jsx(Text, { style: {
                                    fontSize: '42px',
                                    color: '#4f46e5',
                                    fontWeight: 'bold',
                                    margin: '0',
                                    letterSpacing: '-0.025em',
                                    fontFamily: 'system-ui, -apple-system, sans-serif',
                                    textTransform: 'uppercase',
                                    lineHeight: '1'
                                }, children: "VIA FORTE EXPRESS" }) }), _jsx(Section, { style: {
                                backgroundColor: '#f8fafc',
                                borderRadius: '8px',
                                padding: '24px',
                                marginBottom: '32px'
                            }, children: _jsxs(Text, { style: {
                                    fontSize: '18px',
                                    color: '#475569',
                                    margin: '0',
                                    textAlign: 'center'
                                }, children: ["C\u00F3digo de Rastreio:", _jsx("br", {}), _jsx("span", { style: {
                                            color: '#4f46e5',
                                            fontSize: '24px',
                                            fontWeight: 'bold',
                                            letterSpacing: '0.1em',
                                            display: 'block',
                                            marginTop: '8px'
                                        }, children: trackingCode })] }) }), _jsxs(Text, { style: {
                                fontSize: '24px',
                                fontWeight: 'bold',
                                color: '#1f2937',
                                marginBottom: '24px',
                                textAlign: 'center'
                            }, children: ["Ol\u00E1, ", name, "! \uD83D\uDC4B"] }), _jsx(Text, { style: {
                                fontSize: '16px',
                                color: '#4b5563',
                                lineHeight: '24px',
                                marginBottom: '24px',
                                textAlign: 'center'
                            }, children: "\u00D3timas not\u00EDcias! \uD83C\uDF89 Seu pedido foi recebido e est\u00E1 sendo processado com todo cuidado pela nossa equipe. Clique no bot\u00E3o abaixo para acompanhar cada etapa da sua entrega em tempo real:" }), _jsx(Section, { style: {
                                textAlign: 'center',
                                margin: '40px 0'
                            }, children: _jsx(Link, { href: trackingUrl, target: "_blank", style: {
                                    backgroundColor: '#4f46e5',
                                    color: '#ffffff',
                                    padding: '14px 24px',
                                    borderRadius: '8px',
                                    textDecoration: 'none',
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    display: 'inline-block',
                                    boxShadow: '0 2px 4px rgba(79, 70, 229, 0.2)'
                                }, children: "\uD83D\uDE9A Rastrear Pedido" }) }), _jsx(Section, { style: {
                                backgroundColor: '#f8fafc',
                                borderRadius: '8px',
                                padding: '24px',
                                marginTop: '32px',
                                marginBottom: '32px'
                            }, children: _jsx(Text, { style: {
                                    fontSize: '14px',
                                    color: '#475569',
                                    margin: '0',
                                    textAlign: 'center',
                                    lineHeight: '20px'
                                }, children: "\u26A1\uFE0F Dica: Salve o link de rastreamento nos favoritos do seu navegador para acessar rapidamente as atualiza\u00E7\u00F5es do seu pedido." }) }), _jsxs(Text, { style: {
                                fontSize: '14px',
                                color: '#6b7280',
                                lineHeight: '20px',
                                marginBottom: '24px',
                                textAlign: 'center'
                            }, children: ["Precisa de ajuda? Nossa equipe est\u00E1 dispon\u00EDvel 24/7 em ", _jsx(Link, { href: "mailto:suporte@viaforteexpress.com", style: { color: '#4f46e5', textDecoration: 'none' }, children: "suporte@viaforteexpress.com" })] }), _jsx(Hr, { style: {
                                borderTop: '1px solid #e5e7eb',
                                margin: '32px 0'
                            } }), _jsxs(Text, { style: {
                                fontSize: '12px',
                                color: '#9ca3af',
                                textAlign: 'center',
                                margin: '0',
                                lineHeight: '16px'
                            }, children: ["\u00A9 ", new Date().getFullYear(), " VIA FORTE EXPRESS \u2022 Todos os direitos reservados", _jsx("br", {}), _jsx("span", { style: { display: 'block', marginTop: '4px' }, children: "Av. Goi\u00E1s, 1356 \u2022 S\u00E3o Paulo, SP \u2022 74000-000" })] })] }) })] }));
}
//# sourceMappingURL=TrackingEmail.js.map