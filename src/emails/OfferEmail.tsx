import * as React from 'react';
import { Html, Head, Body, Container, Text, Link, Preview, Section, Hr, Img } from '@react-email/components';

interface OfferEmailProps {
  nome: string;
  oferta_nome: string;
  desconto?: string;
  link_da_oferta: string;
  descricao_adicional?: string;
}

export default function OfferEmail({ 
  nome = "Cliente", 
  oferta_nome, 
  desconto = "10%", 
  link_da_oferta,
  descricao_adicional = ""
}: OfferEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>🔥 Oferta especial para você: {oferta_nome} com {desconto} de desconto!</Preview>
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
              fontSize: '24px',
              color: '#475569',
              margin: '0',
              textAlign: 'center',
              fontWeight: 'bold'
            }}>
              Oferta Especial:
              <br />
              <span style={{
                color: '#4f46e5',
                fontSize: '28px',
                fontWeight: 'bold',
                display: 'block',
                marginTop: '8px'
              }}>
                {oferta_nome}
              </span>
              {desconto && (
                <span style={{
                  color: '#ef4444',
                  fontSize: '22px',
                  fontWeight: 'bold',
                  display: 'block',
                  marginTop: '8px'
                }}>
                  {desconto} de desconto!
                </span>
              )}
            </Text>
          </Section>
          
          <Text style={{ 
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            Olá, {nome}! 👋
          </Text>
          
          <Text style={{ 
            fontSize: '16px',
            color: '#4b5563',
            lineHeight: '24px',
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            Temos uma oferta especial para você! Aproveite agora {oferta_nome} com {desconto} de desconto.
            {descricao_adicional && (
              <span style={{ display: 'block', marginTop: '12px' }}>
                {descricao_adicional}
              </span>
            )}
          </Text>
          
          <Section style={{
            textAlign: 'center',
            margin: '40px 0'
          }}>
            <Link 
              href={link_da_oferta}
              target="_blank"
              style={{
                backgroundColor: '#4f46e5',
                color: '#ffffff',
                padding: '12px 20px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: 'bold',
                display: 'inline-block',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
              }}
            >
              Aproveitar Oferta
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
              ⏰ Atenção: Esta oferta é por tempo limitado! Não perca a oportunidade de aproveitar este desconto exclusivo.
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
              Av. Goiás, 1234 • Goiânia, GO • 74000-000
            </span>
            <span style={{ display: 'block', marginTop: '8px' }}>
              Para cancelar o recebimento de ofertas, <Link href="#" style={{ color: '#4f46e5', textDecoration: 'none' }}>clique aqui</Link>.
            </span>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}