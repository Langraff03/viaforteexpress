import * as React from 'react';
import { Html, Head, Body, Container, Text, Link, Preview, Section, Hr, Img, Button } from '@react-email/components';

interface OrderConfirmationEmailProps {
  customerName: string;
  orderNumber: string;
  trackingCode: string;
  orderAmount: string;
  city: string;
  state: string;
  companyName: string;
  supportEmail: string;
  fromName: string;
}

export default function OrderConfirmationEmail({
  customerName,
  orderNumber,
  trackingCode,
  orderAmount,
  city,
  state,
  companyName,
  supportEmail,
  fromName
}: OrderConfirmationEmailProps) {
  // Função helper para obter a URL base
  function getBaseUrl(): string {
    if (typeof window !== 'undefined' && import.meta?.env) {
      return import.meta.env.VITE_APP_URL || 'https://rastreio.viaforteexpress.com';
    }
    return process.env.VITE_APP_URL || process.env.APP_URL || 'https://rastreio.viaforteexpress.com';
  }
  
  const baseUrl = getBaseUrl();
  const trackingUrl = `${baseUrl}/tracking/${trackingCode}`;

  return (
    <Html>
      <Head />
      <Preview>✅ Seu pedido foi confirmado! Acompanhe a entrega com {companyName}</Preview>
      <Body style={{ 
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
        backgroundColor: '#f8fafc',
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
          {/* Header com logo/nome da empresa */}
          <Section style={{ textAlign: 'center', marginBottom: '32px' }}>
            <Text style={{ 
              fontSize: '32px',
              color: '#059669',
              fontWeight: 'bold',
              margin: '0',
              letterSpacing: '-0.025em',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              lineHeight: '1'
            }}>
              {companyName || fromName}
            </Text>
            <Text style={{
              fontSize: '14px',
              color: '#6b7280',
              margin: '8px 0 0 0'
            }}>
              Confirmação de Pedido
            </Text>
          </Section>
          
          {/* Ícone de sucesso */}
          <Section style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{
              display: 'inline-block',
              backgroundColor: '#d1fae5',
              borderRadius: '50%',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <Text style={{
                fontSize: '32px',
                margin: '0',
                lineHeight: '1'
              }}>✅</Text>
            </div>
          </Section>
          
          {/* Saudação */}
          <Text style={{ 
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            Olá, {customerName}! 🎉
          </Text>
          
          <Text style={{ 
            fontSize: '16px',
            color: '#4b5563',
            lineHeight: '24px',
            marginBottom: '32px',
            textAlign: 'center'
          }}>
            Ótimas notícias! Seu pedido foi <strong>confirmado com sucesso</strong> e já está sendo preparado 
            para envio. Em breve você receberá as atualizações de rastreamento.
          </Text>
          
          {/* Detalhes do pedido */}
          <Section style={{
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            padding: '24px',
            marginBottom: '24px',
            border: '1px solid #e5e7eb'
          }}>
            <Text style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              📋 Detalhes do Pedido
            </Text>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <Text style={{ fontSize: '14px', color: '#6b7280', margin: '0' }}>
                Número do Pedido:
              </Text>
              <Text style={{ fontSize: '14px', color: '#1f2937', fontWeight: '600', margin: '0' }}>
                #{orderNumber}
              </Text>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <Text style={{ fontSize: '14px', color: '#6b7280', margin: '0' }}>
                Valor Total:
              </Text>
              <Text style={{ fontSize: '14px', color: '#059669', fontWeight: 'bold', margin: '0' }}>
                {orderAmount}
              </Text>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <Text style={{ fontSize: '14px', color: '#6b7280', margin: '0' }}>
                Destino:
              </Text>
              <Text style={{ fontSize: '14px', color: '#1f2937', fontWeight: '600', margin: '0' }}>
                {city} - {state}
              </Text>
            </div>
            
            {trackingCode && (
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                <Text style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px 0', textAlign: 'center' }}>
                  Código de Rastreamento:
                </Text>
                <Text style={{
                  fontSize: '18px',
                  color: '#059669',
                  fontWeight: 'bold',
                  fontFamily: 'monospace',
                  textAlign: 'center',
                  backgroundColor: '#f0fdf4',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #bbf7d0',
                  margin: '0'
                }}>
                  {trackingCode}
                </Text>
              </div>
            )}
          </Section>

          {/* Botão de rastreamento */}
          {trackingCode && (
            <Section style={{
              textAlign: 'center',
              margin: '32px 0'
            }}>
              <Link
                href={trackingUrl}
                target="_blank"
                style={{
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  padding: '14px 28px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  display: 'inline-block',
                  boxShadow: '0 2px 4px rgba(5, 150, 105, 0.2)'
                }}
              >
                🚚 Rastrear Meu Pedido
              </Link>
            </Section>
          )}
          
          {/* Próximos passos */}
          <Section style={{
            backgroundColor: '#eff6ff',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '24px',
            border: '1px solid #bfdbfe'
          }}>
            <Text style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#1e40af',
              marginBottom: '12px',
              textAlign: 'center'
            }}>
              📦 Próximos Passos
            </Text>
            
            <ul style={{ padding: '0 0 0 20px', margin: '0' }}>
              <li style={{ fontSize: '14px', color: '#3730a3', marginBottom: '8px' }}>
                Seu pedido está sendo preparado para envio
              </li>
              <li style={{ fontSize: '14px', color: '#3730a3', marginBottom: '8px' }}>
                Você receberá atualizações automáticas por email
              </li>
              <li style={{ fontSize: '14px', color: '#3730a3', marginBottom: '8px' }}>
                Use o código de rastreamento para acompanhar a entrega
              </li>
              <li style={{ fontSize: '14px', color: '#3730a3', marginBottom: '0' }}>
                Fique de olho no seu email e telefone para atualizações
              </li>
            </ul>
          </Section>
          
          {/* Suporte */}
          <Text style={{ 
            fontSize: '14px',
            color: '#6b7280',
            lineHeight: '20px',
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            Dúvidas? Nossa equipe está pronta para ajudar! Entre em contato: 
            <Link href={`mailto:${supportEmail}`} style={{ color: '#059669', textDecoration: 'none' }}>
              {supportEmail}
            </Link>
          </Text>
          
          {/* Dica importante */}
          <Section style={{
            backgroundColor: '#fef3c7',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
            border: '1px solid #f59e0b'
          }}>
            <Text style={{
              fontSize: '14px',
              color: '#92400e',
              margin: '0',
              textAlign: 'center',
              lineHeight: '20px'
            }}>
              💡 <strong>Dica:</strong> Salve este email! Você pode precisar do código de rastreamento 
              e das informações do pedido para acompanhamento futuro.
            </Text>
          </Section>
          
          <Hr style={{
            borderTop: '1px solid #e5e7eb',
            margin: '32px 0'
          }} />
          
          {/* Footer */}
          <Text style={{ 
            fontSize: '12px',
            color: '#9ca3af',
            textAlign: 'center',
            margin: '0',
            lineHeight: '16px'
          }}>
            © {new Date().getFullYear()} {companyName || fromName} • Todos os direitos reservados
            <br />
            <span style={{ display: 'block', marginTop: '8px' }}>
              Este email foi enviado porque você fez uma compra conosco.
            </span>
            <span style={{ display: 'block', marginTop: '4px' }}>
              Para dúvidas, responda este email ou entre em contato via {supportEmail}
            </span>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}