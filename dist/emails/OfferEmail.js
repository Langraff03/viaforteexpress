import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Html, Head, Body, Container, Text, Link, Preview, Section, Hr } from '@react-email/components';
export default function OfferEmail({ nome = "Cliente", oferta_nome, desconto = "10%", link_da_oferta, descricao_adicional = "" }) {
    return (_jsxs(Html, { children: [_jsx(Head, {}), _jsxs(Preview, { children: ["\uD83D\uDD25 Oferta especial para voc\u00EA: ", oferta_nome, " com ", desconto, " de desconto!"] }), _jsx(Body, { style: {
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
                                    fontSize: '24px',
                                    color: '#475569',
                                    margin: '0',
                                    textAlign: 'center',
                                    fontWeight: 'bold'
                                }, children: ["Oferta Especial:", _jsx("br", {}), _jsx("span", { style: {
                                            color: '#4f46e5',
                                            fontSize: '28px',
                                            fontWeight: 'bold',
                                            display: 'block',
                                            marginTop: '8px'
                                        }, children: oferta_nome }), desconto && (_jsxs("span", { style: {
                                            color: '#ef4444',
                                            fontSize: '22px',
                                            fontWeight: 'bold',
                                            display: 'block',
                                            marginTop: '8px'
                                        }, children: [desconto, " de desconto!"] }))] }) }), _jsxs(Text, { style: {
                                fontSize: '24px',
                                fontWeight: 'bold',
                                color: '#1f2937',
                                marginBottom: '24px',
                                textAlign: 'center'
                            }, children: ["Ol\u00E1, ", nome, "! \uD83D\uDC4B"] }), _jsxs(Text, { style: {
                                fontSize: '16px',
                                color: '#4b5563',
                                lineHeight: '24px',
                                marginBottom: '24px',
                                textAlign: 'center'
                            }, children: ["Temos uma oferta especial para voc\u00EA! Aproveite agora ", oferta_nome, " com ", desconto, " de desconto.", descricao_adicional && (_jsx("span", { style: { display: 'block', marginTop: '12px' }, children: descricao_adicional }))] }), _jsx(Section, { style: {
                                textAlign: 'center',
                                margin: '40px 0'
                            }, children: _jsx(Link, { href: link_da_oferta, target: "_blank", style: {
                                    backgroundColor: '#4f46e5',
                                    color: '#ffffff',
                                    padding: '12px 20px',
                                    borderRadius: '8px',
                                    textDecoration: 'none',
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    display: 'inline-block',
                                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                                }, children: "Aproveitar Oferta" }) }), _jsx(Section, { style: {
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
                                }, children: "\u23F0 Aten\u00E7\u00E3o: Esta oferta \u00E9 por tempo limitado! N\u00E3o perca a oportunidade de aproveitar este desconto exclusivo." }) }), _jsxs(Text, { style: {
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
                            }, children: ["\u00A9 ", new Date().getFullYear(), " VIA FORTE EXPRESS \u2022 Todos os direitos reservados", _jsx("br", {}), _jsx("span", { style: { display: 'block', marginTop: '4px' }, children: "Av. Goi\u00E1s, 1234 \u2022 Goi\u00E2nia, GO \u2022 74000-000" }), _jsxs("span", { style: { display: 'block', marginTop: '8px' }, children: ["Para cancelar o recebimento de ofertas, ", _jsx(Link, { href: "#", style: { color: '#4f46e5', textDecoration: 'none' }, children: "clique aqui" }), "."] })] })] }) })] }));
}
