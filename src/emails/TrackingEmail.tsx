import * as React from 'react';
import { Html, Head, Body, Container, Text, Link, Preview, Section, Hr, Img } from '@react-email/components';

export default function TrackingEmail({ name, trackingCode, orderId }: { name: string; trackingCode: string; orderId: string }) {
  // Função helper para obter a URL base de forma compatível
  function getBaseUrl(): string {
    // Se estivermos no Node.js (backend/workers) - sempre primeiro
    if (typeof process !== 'undefined' && process.env) {
      return process.env.VITE_APP_URL || process.env.APP_URL || 'https://rastreio.viaforteexpress.com';
    }
    // Se estivermos no browser (frontend) - fallback
    if (typeof window !== 'undefined' && import.meta?.env) {
      return import.meta.env.VITE_APP_URL || 'https://rastreio.viaforteexpress.com';
    }
    return 'https://rastreio.viaforteexpress.com';
  }
  
  const baseUrl = getBaseUrl();
  const trackingUrl = `${baseUrl}/tracking/${trackingCode}`;

  return (
    <Html>
      <Head />
      <Preview>🚚 Seu pedido está a caminho! Acompanhe o rastreamento na VIA FORTE EXPRESS</Preview>
      <Body style={{ 
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
        backgroundColor: '#f6f9fc',
        padding: '40px 0',
        margin: '0'
      }}>
        <Container style={{
          backgroundColor: '#ffffff',
          padding: '40px',
          borderRadius: '12px',
          maxWidth: '600px',
          margin: 'auto',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e5e7eb'
        }}>
          <Section style={{ textAlign: 'center', marginBottom: '32px' }}>
            <Text style={{ 
              fontSize: '42px',
              color: '#4f46e5',
              fontWeight: 'bold',
              margin: '0',
              letterSpacing: '-0.025em',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              textTransform: 'uppercase',
              lineHeight: '1'
            }}>
              VIA FORTE EXPRESS
            </Text>
          </Section>
          
          <Section style={{
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            padding: '24px',
            marginBottom: '32px'
          }}>
            <Text style={{
              fontSize: '18px',
              color: '#475569',
              margin: '0',
              textAlign: 'center'
            }}>
              Código de Rastreio:
              <br />
              <span style={{
                color: '#4f46e5',
                fontSize: '24px',
                fontWeight: 'bold',
                letterSpacing: '0.1em',
                display: 'block',
                marginTop: '8px'
              }}>
                {trackingCode}
              </span>
            </Text>
          </Section>
          
          <Text style={{ 
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            Olá, {name}! 👋
          </Text>
          
          <Text style={{ 
            fontSize: '16px',
            color: '#4b5563',
            lineHeight: '24px',
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            Ótimas notícias! 🎉 Seu pedido foi recebido e está sendo processado com todo cuidado pela nossa equipe. 
            Clique no botão abaixo para acompanhar cada etapa da sua entrega em tempo real:
          </Text>
          
          <Section style={{
            textAlign: 'center',
            margin: '40px 0'
          }}>
            <Link
              href={trackingUrl}
              target="_blank"
              style={{
                backgroundColor: '#4f46e5',
                color: '#ffffff',
                padding: '14px 24px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: 'bold',
                display: 'inline-block',
                boxShadow: '0 2px 4px rgba(79, 70, 229, 0.2)'
              }}
            >
              🚚 Rastrear Pedido
            </Link>
          </Section>
         
         <Section style={{
           backgroundColor: '#f8fafc',
            borderRadius: '8px',
            padding: '24px',
            marginTop: '32px',
            marginBottom: '32px'
          }}>
            <Text style={{
              fontSize: '14px',
              color: '#475569',
              margin: '0',
              textAlign: 'center',
              lineHeight: '20px'
            }}>
              ⚡️ Dica: Salve o link de rastreamento nos favoritos do seu navegador para
              acessar rapidamente as atualizações do seu pedido.
            </Text>
          </Section>
          
          <Text style={{ 
            fontSize: '14px',
            color: '#6b7280',
            lineHeight: '20px',
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            Precisa de ajuda? Nossa equipe está disponível 24/7 em <Link href="mailto:suporte@viaforteexpress.com" style={{ color: '#4f46e5', textDecoration: 'none' }}>suporte@viaforteexpress.com</Link>
          </Text>
          
          <Hr style={{
            borderTop: '1px solid #e5e7eb',
            margin: '32px 0'
          }} />
          
          <Text style={{ 
            fontSize: '12px',
            color: '#9ca3af',
            textAlign: 'center',
            margin: '0',
            lineHeight: '16px'
          }}>
            © {new Date().getFullYear()} VIA FORTE EXPRESS • Todos os direitos reservados
            <br />
            <span style={{ display: 'block', marginTop: '4px' }}>
              Av. Goiás, 1356 • São Paulo, SP • 74000-000
            </span>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
