import * as React from 'react';
import { Html, Head, Body, Container, Text, Link, Preview, Section, Hr, Img } from '@react-email/components';

interface MelatoninaOfferEmailProps {
  nome: string;
  desconto?: string;
}

export default function MelatoninaOfferEmail({ 
  nome = "Cliente", 
  desconto = "30%"
}: MelatoninaOfferEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>🌙 Oferta especial: Melatonina Fini Dr. Good com {desconto} de desconto! Melhore seu sono hoje mesmo.</Preview>
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
              color: '#10b981', // Verde farmácia
              fontWeight: 'bold',
              margin: '0',
              letterSpacing: '-0.025em',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              textTransform: 'uppercase',
              lineHeight: '1'
            }}>
              Pague Menos Farma
            </Text>
            <Text style={{
              fontSize: '16px',
              color: '#6b7280',
              margin: '8px 0 0'
            }}>
              Ofertas exclusivas para você
            </Text>
          </Section>
          
          <Section style={{
            backgroundColor: '#f0f4ff',
            borderRadius: '8px',
            padding: '24px',
            marginBottom: '32px',
            textAlign: 'center'
          }}>
            <Text style={{
              fontSize: '24px',
              color: '#10b981', // Verde farmácia
              margin: '0 0 16px',
              fontWeight: 'bold'
            }}>
              🌙 Durma Melhor, Viva Melhor! 🌙
            </Text>
            <Text style={{
              fontSize: '18px',
              color: '#1f2937',
              margin: '0',
              fontWeight: 'bold'
            }}>
              Melatonina Fini Dr. Good
              <br />
              <span style={{ fontSize: '16px', fontWeight: 'normal' }}>60 unidades • Sabor Morango</span>
            </Text>
          </Section>
          
          <Section style={{ textAlign: 'center' }}>
            <Img
              src="https://paguemenosfarma.com/produto/melatonina-fini-60un/imagem-principal.jpg"
              alt="Melatonina Fini Dr. Good 60 Unidades"
              width="300"
              height="300"
              style={{
                borderRadius: '8px',
                marginBottom: '24px'
              }}
            />
          </Section>
          
          <Text style={{ 
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '16px',
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
            Você sabia que uma boa noite de sono é essencial para sua saúde e bem-estar? 
            Estamos com uma oferta especial para ajudar você a melhorar a qualidade do seu sono!
          </Text>
          
          <Section style={{
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            padding: '24px',
            marginBottom: '32px',
            textAlign: 'center'
          }}>
            <Text style={{
              fontSize: '18px',
              color: '#475569',
              margin: '0 0 16px',
              fontWeight: 'bold'
            }}>
              Benefícios da Melatonina Fini:
            </Text>
            <Text style={{
              fontSize: '16px',
              color: '#4b5563',
              margin: '0 0 8px',
              lineHeight: '24px'
            }}>
              ✅ Ajuda a regular o ciclo de sono
            </Text>
            <Text style={{
              fontSize: '16px',
              color: '#4b5563',
              margin: '0 0 8px',
              lineHeight: '24px'
            }}>
              ✅ Formato de goma mastigável deliciosa
            </Text>
            <Text style={{
              fontSize: '16px',
              color: '#4b5563',
              margin: '0 0 8px',
              lineHeight: '24px'
            }}>
              ✅ Sem açúcares adicionados
            </Text>
            <Text style={{
              fontSize: '16px',
              color: '#4b5563',
              margin: '0 0 8px',
              lineHeight: '24px'
            }}>
              ✅ Sabor morango irresistível
            </Text>
          </Section>
          
          <Section style={{
            textAlign: 'center',
            marginBottom: '32px'
          }}>
            <Text style={{
              fontSize: '32px',
              color: '#ef4444',
              fontWeight: 'bold',
              margin: '0 0 8px',
              textDecoration: 'line-through'
            }}>
              R$ 67,99
            </Text>
            <Text style={{
              fontSize: '42px',
              color: '#10b981', // Verde farmácia
              fontWeight: 'bold',
              margin: '0 0 16px'
            }}>
              R$ 44,99
            </Text>
            <Text style={{
              fontSize: '18px',
              color: '#10b981',
              fontWeight: 'bold',
              margin: '0 0 24px'
            }}>
              {desconto} OFF no carrinho!
            </Text>
            <Link 
              href="https://paguemenosfarma.com/produto/melatonina-fini-60un"
              target="_blank"
              style={{
                backgroundColor: '#10b981', // Verde farmácia
                color: '#ffffff',
                padding: '16px 32px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '18px',
                fontWeight: 'bold',
                display: 'inline-block',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
              }}
            >
              Comprar Agora
            </Link>
          </Section>
          
          <Section style={{
            backgroundColor: '#f0f9ff',
            borderRadius: '8px',
            padding: '24px',
            marginTop: '32px',
            marginBottom: '32px'
          }}>
            <Text style={{
              fontSize: '16px',
              color: '#0369a1',
              margin: '0',
              textAlign: 'center',
              lineHeight: '24px'
            }}>
              <span style={{ fontWeight: 'bold' }}>⏰ Oferta por tempo limitado!</span> Aproveite enquanto durar o estoque. 
              Produto sujeito à disponibilidade.
            </Text>
          </Section>
          
          <Hr style={{
            borderTop: '1px solid #e5e7eb',
            margin: '32px 0'
          }} />
          
          <Text style={{ 
            fontSize: '14px',
            color: '#6b7280',
            lineHeight: '20px',
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            Precisa de ajuda? Nossa equipe está disponível 24/7 em <Link href="mailto:suporte@paguemenosfarma.com" style={{ color: '#10b981', textDecoration: 'none' }}>suporte@paguemenosfarma.com</Link>
          </Text>
          
          <Text style={{ 
            fontSize: '12px',
            color: '#9ca3af',
            textAlign: 'center',
            margin: '0',
            lineHeight: '16px'
          }}>
            © {new Date().getFullYear()} Pague Menos Farma • Todos os direitos reservados
            <br />
            <span style={{ display: 'block', marginTop: '4px' }}>
              Av. Goiás, 1234 • Goiânia, GO • 74000-000
            </span>
            <span style={{ display: 'block', marginTop: '8px' }}>
              Para cancelar o recebimento de ofertas, <Link href="#" style={{ color: '#10b981', textDecoration: 'none' }}>clique aqui</Link>.
            </span>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}