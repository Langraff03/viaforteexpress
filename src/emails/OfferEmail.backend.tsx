// src/emails/OfferEmail.backend.tsx
// VERSÃO BACKEND - Usa apenas process.env (compatível com Node.js)

import * as React from 'react';
import { Html, Head, Body, Container, Text, Link, Preview, Section, Hr, Img, Button } from '@react-email/components';

export default function OfferEmail({
  name,
  productName,
  productDescription,
  price,
  discountPrice,
  productImage,
  ctaUrl,
  unsubscribeUrl
}: {
  name: string;
  productName: string;
  productDescription: string;
  price: string;
  discountPrice: string;
  productImage: string;
  ctaUrl: string;
  unsubscribeUrl: string;
}) {
  // Função helper para obter a URL base de forma compatível com backend
  function getBaseUrl(): string {
    // Sempre usa process.env no backend
    return process.env.VITE_APP_URL || process.env.APP_URL || 'https://viaforteexpress.com';
  }

  const baseUrl = getBaseUrl();

  return (
    <Html>
      <Head>
        <title>Oferta Especial - {productName}</title>
        <Preview>🎉 Oferta imperdível: {productName} com desconto especial!</Preview>
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
            <Text style={greeting}>Olá {name}!</Text>

            <Text style={offerTitle}>🎉 Oferta Especial do Dia!</Text>

            <Section style={productSection}>
              {productImage && (
                <Img
                  src={productImage}
                  width="300"
                  height="200"
                  alt={productName}
                  style={productImageStyle}
                />
              )}

              <Text style={productTitle}>{productName}</Text>
              <Text style={productDescriptionStyle}>{productDescription}</Text>

              <Section style={pricingSection}>
                <Text style={originalPrice}>De: R$ {price}</Text>
                <Text style={discountPriceStyle}>Por: R$ {discountPrice}</Text>
                <Text style={savings}>
                  Economize R$ {(parseFloat(price) - parseFloat(discountPrice)).toFixed(2)}
                </Text>
              </Section>
            </Section>

            <Section style={ctaSection}>
              <Button
                href={ctaUrl}
                style={ctaButton}
              >
                Comprar Agora
              </Button>
            </Section>

            <Text style={urgencyText}>
              ⚡ Esta oferta é por tempo limitado!
            </Text>

            <Hr style={divider} />

            <Text style={footerText}>
              <strong>Via Forte Express</strong><br />
              Qualidade e confiança em cada entrega<br />
              Suporte: contato@viaforteexpress.com
            </Text>

            <Text style={unsubscribeText}>
              <Link href={unsubscribeUrl} style={unsubscribeLink}>
                Cancelar inscrição
              </Link>
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

const greeting = {
  color: '#333',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '30px 0 10px 0',
  padding: '0',
};

const offerTitle = {
  color: '#e74c3c',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '20px 0',
  textAlign: 'center' as const,
};

const productSection = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
  textAlign: 'center' as const,
};

const productImageStyle = {
  margin: '0 auto 20px auto',
  borderRadius: '8px',
};

const productTitle = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '10px 0',
};

const productDescriptionStyle = {
  color: '#555',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '10px 0 20px 0',
};

const pricingSection = {
  margin: '20px 0',
};

const originalPrice = {
  color: '#999',
  fontSize: '18px',
  textDecoration: 'line-through',
  margin: '5px 0',
};

const discountPriceStyle = {
  color: '#e74c3c',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '10px 0',
};

const savings = {
  color: '#27ae60',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '5px 0',
};

const ctaSection = {
  textAlign: 'center' as const,
  margin: '30px 0',
};

const ctaButton = {
  backgroundColor: '#e74c3c',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '18px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '15px 40px',
};

const urgencyText = {
  color: '#e74c3c',
  fontSize: '16px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '20px 0',
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
  margin: '20px 0',
};

const unsubscribeText = {
  color: '#8898aa',
  fontSize: '12px',
  textAlign: 'center' as const,
  margin: '10px 0',
};

const unsubscribeLink = {
  color: '#8898aa',
  textDecoration: 'underline',
};