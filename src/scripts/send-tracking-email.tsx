import * as React from 'react';
import { Resend } from 'resend';
import dotenv from 'dotenv';
import { render } from '@react-email/render';
import TrackingEmail from '../emails/TrackingEmail';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY!);

async function sendTrackingEmail() {
  const emailHtml = await render(
    <TrackingEmail
      name="João da Silva"
      trackingCode="ABC123"
      orderId="exemplo-order-id"
    />
  );

  try {
    const response = await resend.emails.send({
      from: 'VIA FORTE EXPRESS <contato@viaforteexpress.com>',
      to: ['lucaslangrafff@gmail.com'],
      subject: '🔔 Atualização do seu pedido',
      html: emailHtml,
    });

    console.log('✅ Email enviado:', response);
  } catch (error: any) {
    console.error('❌ Falha ao enviar email:', error.message);
  }
}

sendTrackingEmail();
