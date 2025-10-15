import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Html, Head, Body, Container, Text, Link, Preview, Section, Hr, Img } from '@react-email/components';
export default function MelatoninaOfferEmail({ nome = "Cliente", desconto = "30%" }) {
    return (_jsxs(Html, { children: [_jsx(Head, {}), _jsxs(Preview, { children: ["\uD83C\uDF19 Oferta especial: Melatonina Fini Dr. Good com ", desconto, " de desconto! Melhore seu sono hoje mesmo."] }), _jsx(Body, { style: {
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
                    }, children: [_jsxs(Section, { style: { textAlign: 'center', marginBottom: '32px' }, children: [_jsx(Text, { style: {
                                        fontSize: '42px',
                                        color: '#10b981', // Verde farmácia
                                        fontWeight: 'bold',
                                        margin: '0',
                                        letterSpacing: '-0.025em',
                                        fontFamily: 'system-ui, -apple-system, sans-serif',
                                        textTransform: 'uppercase',
                                        lineHeight: '1'
                                    }, children: "Pague Menos Farma" }), _jsx(Text, { style: {
                                        fontSize: '16px',
                                        color: '#6b7280',
                                        margin: '8px 0 0'
                                    }, children: "Ofertas exclusivas para voc\u00EA" })] }), _jsxs(Section, { style: {
                                backgroundColor: '#f0f4ff',
                                borderRadius: '8px',
                                padding: '24px',
                                marginBottom: '32px',
                                textAlign: 'center'
                            }, children: [_jsx(Text, { style: {
                                        fontSize: '24px',
                                        color: '#10b981', // Verde farmácia
                                        margin: '0 0 16px',
                                        fontWeight: 'bold'
                                    }, children: "\uD83C\uDF19 Durma Melhor, Viva Melhor! \uD83C\uDF19" }), _jsxs(Text, { style: {
                                        fontSize: '18px',
                                        color: '#1f2937',
                                        margin: '0',
                                        fontWeight: 'bold'
                                    }, children: ["Melatonina Fini Dr. Good", _jsx("br", {}), _jsx("span", { style: { fontSize: '16px', fontWeight: 'normal' }, children: "60 unidades \u2022 Sabor Morango" })] })] }), _jsx(Section, { style: { textAlign: 'center' }, children: _jsx(Img, { src: "https://paguemenosfarma.com/produto/melatonina-fini-60un/imagem-principal.jpg", alt: "Melatonina Fini Dr. Good 60 Unidades", width: "300", height: "300", style: {
                                    borderRadius: '8px',
                                    marginBottom: '24px'
                                } }) }), _jsxs(Text, { style: {
                                fontSize: '24px',
                                fontWeight: 'bold',
                                color: '#1f2937',
                                marginBottom: '16px',
                                textAlign: 'center'
                            }, children: ["Ol\u00E1, ", nome, "! \uD83D\uDC4B"] }), _jsx(Text, { style: {
                                fontSize: '16px',
                                color: '#4b5563',
                                lineHeight: '24px',
                                marginBottom: '24px',
                                textAlign: 'center'
                            }, children: "Voc\u00EA sabia que uma boa noite de sono \u00E9 essencial para sua sa\u00FAde e bem-estar? Estamos com uma oferta especial para ajudar voc\u00EA a melhorar a qualidade do seu sono!" }), _jsxs(Section, { style: {
                                backgroundColor: '#f8fafc',
                                borderRadius: '8px',
                                padding: '24px',
                                marginBottom: '32px',
                                textAlign: 'center'
                            }, children: [_jsx(Text, { style: {
                                        fontSize: '18px',
                                        color: '#475569',
                                        margin: '0 0 16px',
                                        fontWeight: 'bold'
                                    }, children: "Benef\u00EDcios da Melatonina Fini:" }), _jsx(Text, { style: {
                                        fontSize: '16px',
                                        color: '#4b5563',
                                        margin: '0 0 8px',
                                        lineHeight: '24px'
                                    }, children: "\u2705 Ajuda a regular o ciclo de sono" }), _jsx(Text, { style: {
                                        fontSize: '16px',
                                        color: '#4b5563',
                                        margin: '0 0 8px',
                                        lineHeight: '24px'
                                    }, children: "\u2705 Formato de goma mastig\u00E1vel deliciosa" }), _jsx(Text, { style: {
                                        fontSize: '16px',
                                        color: '#4b5563',
                                        margin: '0 0 8px',
                                        lineHeight: '24px'
                                    }, children: "\u2705 Sem a\u00E7\u00FAcares adicionados" }), _jsx(Text, { style: {
                                        fontSize: '16px',
                                        color: '#4b5563',
                                        margin: '0 0 8px',
                                        lineHeight: '24px'
                                    }, children: "\u2705 Sabor morango irresist\u00EDvel" })] }), _jsxs(Section, { style: {
                                textAlign: 'center',
                                marginBottom: '32px'
                            }, children: [_jsx(Text, { style: {
                                        fontSize: '32px',
                                        color: '#ef4444',
                                        fontWeight: 'bold',
                                        margin: '0 0 8px',
                                        textDecoration: 'line-through'
                                    }, children: "R$ 67,99" }), _jsx(Text, { style: {
                                        fontSize: '42px',
                                        color: '#10b981', // Verde farmácia
                                        fontWeight: 'bold',
                                        margin: '0 0 16px'
                                    }, children: "R$ 44,99" }), _jsxs(Text, { style: {
                                        fontSize: '18px',
                                        color: '#10b981',
                                        fontWeight: 'bold',
                                        margin: '0 0 24px'
                                    }, children: [desconto, " OFF no carrinho!"] }), _jsx(Link, { href: "https://paguemenosfarma.com/produto/melatonina-fini-60un", target: "_blank", style: {
                                        backgroundColor: '#10b981', // Verde farmácia
                                        color: '#ffffff',
                                        padding: '16px 32px',
                                        borderRadius: '8px',
                                        textDecoration: 'none',
                                        fontSize: '18px',
                                        fontWeight: 'bold',
                                        display: 'inline-block',
                                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                                    }, children: "Comprar Agora" })] }), _jsx(Section, { style: {
                                backgroundColor: '#f0f9ff',
                                borderRadius: '8px',
                                padding: '24px',
                                marginTop: '32px',
                                marginBottom: '32px'
                            }, children: _jsxs(Text, { style: {
                                    fontSize: '16px',
                                    color: '#0369a1',
                                    margin: '0',
                                    textAlign: 'center',
                                    lineHeight: '24px'
                                }, children: [_jsx("span", { style: { fontWeight: 'bold' }, children: "\u23F0 Oferta por tempo limitado!" }), " Aproveite enquanto durar o estoque. Produto sujeito \u00E0 disponibilidade."] }) }), _jsx(Hr, { style: {
                                borderTop: '1px solid #e5e7eb',
                                margin: '32px 0'
                            } }), _jsxs(Text, { style: {
                                fontSize: '14px',
                                color: '#6b7280',
                                lineHeight: '20px',
                                marginBottom: '24px',
                                textAlign: 'center'
                            }, children: ["Precisa de ajuda? Nossa equipe est\u00E1 dispon\u00EDvel 24/7 em ", _jsx(Link, { href: "mailto:suporte@paguemenosfarma.com", style: { color: '#10b981', textDecoration: 'none' }, children: "suporte@paguemenosfarma.com" })] }), _jsxs(Text, { style: {
                                fontSize: '12px',
                                color: '#9ca3af',
                                textAlign: 'center',
                                margin: '0',
                                lineHeight: '16px'
                            }, children: ["\u00A9 ", new Date().getFullYear(), " Pague Menos Farma \u2022 Todos os direitos reservados", _jsx("br", {}), _jsx("span", { style: { display: 'block', marginTop: '4px' }, children: "Av. Goi\u00E1s, 1234 \u2022 Goi\u00E2nia, GO \u2022 74000-000" }), _jsxs("span", { style: { display: 'block', marginTop: '8px' }, children: ["Para cancelar o recebimento de ofertas, ", _jsx(Link, { href: "#", style: { color: '#10b981', textDecoration: 'none' }, children: "clique aqui" }), "."] })] })] }) })] }));
}
