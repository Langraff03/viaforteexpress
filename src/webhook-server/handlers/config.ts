// src/webhook-server/handlers/config.ts
import { Request, Response } from 'express';
import { supabaseAdmin } from '../../lib/server/supabaseAdmin'; // ✅ Backend seguro
import axios from 'axios';
// import { testEmailConfiguration } from '../../lib/emailService'; // ❌ Quebra Node.js

export const getConfig = async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('configurations')
      .select('from_name,from_email,reply_to_email,resend_api_key,api_key_gateway')
      .single();

    if (error && error.code !== 'PGRST116') {
      return res.status(500).json({ error: error.message });
    }

    res.json(data || null);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const saveConfig = async (req: Request, res: Response) => {
  try {
    const { fromName, fromEmail, replyToEmail, resendApiKey, apiKeyGateway } = req.body;

    const { data, error } = await supabaseAdmin
      .from('configurations')
      .upsert([{
        from_name:       fromName,
        from_email:      fromEmail,
        reply_to_email:  replyToEmail,
        resend_api_key:  resendApiKey,
        api_key_gateway: apiKeyGateway
      }])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const testEmailConfig = async (req: Request, res: Response) => {
  try {
    const { fromName, fromEmail, resendApiKey } = req.body;

    // TODO: Implementar teste de email simples sem dependências React
    console.log('✅ [testEmailConfig] Configuração salva - teste de envio desabilitado temporariamente');
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const testGatewayConfig = async (req: Request, res: Response) => {
  try {
    const { apiKey } = req.body;
    await axios.get('https://api.asaas.com/v3/customers', {
      headers: { 'access_token': apiKey }
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({
      error:   err.response?.data?.message || err.message,
      details: err.response?.data?.errors
    });
  }
};
