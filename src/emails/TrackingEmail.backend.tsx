// src/emails/TrackingEmail.backend.tsx
// VERSÃO BACKEND - Usa apenas process.env (compatível com Node.js)

import * as React from 'react';
import { Html, Head, Body, Container, Text, Link, Preview, Section, Hr, Img } from '@react-email/components';

export default function TrackingEmail({ name, trackingCode, orderId }: { name: string; trackingCode: string; orderId: string }) {
  // Função helper para obter a URL base de forma compatível com backend
  function getBaseUrl(): string {
    // Sempre usa process.env no backend
    return process.env.VITE_APP_URL || process.env.APP_URL || 'https://rastreio.viaforteexpress.com';
  }

  const baseUrl = getBaseUrl();

  return (
    <Html>
      <Head>
        <title>Seu pedido foi enviado - Via Forte Express</title>
        <Preview>Seu pedido #{orderId} foi enviado! 📦</Preview>
      </Head>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Img
              src={`${baseUrl}/logo.png`}
              width="200"
              height="50"
              alt="Via Forte Express"
              style={logo}
            />
          </Section>

          <Section style={content}>
            <Text style={heading}>Olá {name}!</Text>

            <Text style={paragraph}>
              Seu pedido <strong>#{orderId}</strong> foi enviado com sucesso! 🎉
            </Text>

            <Section style={trackingBox}>
              <Text style={trackingTitle}>📦 Código de Rastreamento:</Text>
              <Text style={trackingCodeStyle}>{trackingCode}</Text>
            </Section>

            <Text style={paragraph}>
              Você pode acompanhar o status da sua entrega através do nosso site:
            </Text>

            <Section style={buttonContainer}>
              <Link
                href={`${baseUrl}/rastrear/${trackingCode}`}
                style={button}
              >
                Rastrear Pedido
              </Link>
            </Section>

            <Hr style={divider} />

            <Text style={footerText}>
              <strong>Via Forte Express</strong><br />
              Sua encomenda em boas mãos<br />
              Suporte: contato@viaforteexpress.com
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Estilos inline (compatível com React Email)
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const header = {
  padding: '20px',
  textAlign: 'center' as const,
};

const logo = {
  margin: '0 auto',
};

const content = {
  padding: '20px',
};

const heading = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '30px 0',
  padding: '0',
};

const paragraph = {
  color: '#555',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
};

const trackingBox = {
  backgroundColor: '#f8f9fa',
  border: '2px solid #007bff',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
  textAlign: 'center' as const,
};

const trackingTitle = {
  color: '#333',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 10px 0',
};

const trackingCodeStyle = {
  color: '#007bff',
  fontSize: '24px',
  fontWeight: 'bold',
  fontFamily: 'monospace',
  letterSpacing: '2px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '30px 0',
};

const button = {
  backgroundColor: '#007bff',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 30px',
};

const divider = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const footerText = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  textAlign: 'center' as const,
};