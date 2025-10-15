import React, { useState, useEffect, useCallback } from 'react';
// import { useAdminAuth } from '../../hooks/useAdminAuth'; // Exemplo de importação de hook de autenticação do admin

interface GatewayConfig {
  id?: number;
  client_id: string;
  gateway_provider: string;
  api_key?: string | null;
  secret_key?: string | null;
  webhook_secret?: string | null;
  access_token?: string | null;
  additional_settings?: Record<string, any> | null;
  is_active?: boolean;
}

const AssetSettingsPage = () => {
  // const { user, token } = useAdminAuth(); // Exemplo
  const [config, setConfig] = useState<Partial<GatewayConfig>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientIdForAsset] = useState('cliente-asset'); // Ou torne isso selecionável/dinâmico

  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Substitua pela sua chamada de API real para buscar a configuração para 'asset' e 'clientIdForAsset'
      // Este endpoint consultaria a tabela 'gateway_configs'.
      const response = await fetch(`/api/admin/gateway-configurations?gateway_provider=asset&client_id=${clientIdForAsset}`, {
        // headers: { 'Authorization': `Bearer ${token}` } // Se estiver usando autenticação por token
      });
      if (!response.ok) {
        if (response.status === 404) {
          setConfig({ client_id: clientIdForAsset, gateway_provider: 'asset', is_active: true }); // Padrão para nova configuração
          return;
        }
        const errData = await response.json();
        throw new Error(errData.error || `Failed to fetch Asset settings (${response.status})`);
      }
      const data = await response.json();
      setConfig(data.config || { client_id: clientIdForAsset, gateway_provider: 'asset', is_active: true });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [clientIdForAsset /*, token */]); // A vírgula antes de token é intencional caso o comentário seja removido

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    // @ts-ignore
    const checked = e.target.checked; // Para caixas de seleção
    setConfig(prevConfig => ({
      ...prevConfig,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAdditionalSettingsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      const parsedJson = JSON.parse(e.target.value);
      setConfig(prevConfig => ({
        ...prevConfig,
        additional_settings: parsedJson,
      }));
    } catch (jsonError) {
      // Lidar com erro de parsing de JSON, talvez definir um estado de erro para este campo
      console.warn("Invalid JSON in additional settings");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Substitua pela sua chamada de API real para salvar/atualizar a configuração
      // Este endpoint inseriria ou atualizaria a tabela 'gateway_configs'.
      const method = config.id ? 'PUT' : 'POST';
      const url = config.id 
        ? `/api/admin/gateway-configurations/${config.id}` 
        : '/api/admin/gateway-configurations';

      const response = await fetch(url, {
        method: method,
        headers: { 
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${token}` // Se estiver usando autenticação por token
        },
        body: JSON.stringify({ ...config, gateway_provider: 'asset', client_id: clientIdForAsset }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `Failed to save Asset settings (${response.status})`);
      }
      const savedData = await response.json();
      setConfig(savedData.config || savedData); // Atualizar estado com configuração salva (ex: se o ID foi gerado)
      alert('Asset settings saved successfully!');
    } catch (err: any) {
      setError(err.message);
      alert(`Error saving settings: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !Object.keys(config).length) return <p>Loading Asset settings for client '{clientIdForAsset}'...</p>;
  // if (error) return <p>Erro: {error}</p>; // Pode ser mostrado junto com o formulário

  return (
    <div>
      <h1>Asset Gateway Settings</h1>
      <p>Configure API keys and other settings for the Asset gateway for client: <strong>{clientIdForAsset}</strong>.</p>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
        <div style={formGroupStyle}>
          <label htmlFor="api_key">API Key:</label>
          <input type="password" id="api_key" name="api_key" value={config.api_key || ''} onChange={handleChange} style={inputStyle} />
        </div>
        <div style={formGroupStyle}>
          <label htmlFor="webhook_secret">Webhook Secret/Token:</label>
          <input type="password" id="webhook_secret" name="webhook_secret" value={config.webhook_secret || ''} onChange={handleChange} style={inputStyle} />
          <small> (Este é o token que o Asaas envia no cabeçalho 'asaas-webhook-token', ou seu segredo configurado para validação de assinatura)</small>
        </div>
         {/* Adicione outros campos específicos do Asset do design da sua tabela gateway_configs */}
        <div style={formGroupStyle}>
          <label htmlFor="additional_settings">Additional Settings (JSON):</label>
          <textarea 
            id="additional_settings" 
            name="additional_settings" 
            rows={5}
            value={config.additional_settings ? JSON.stringify(config.additional_settings, null, 2) : ''} 
            onChange={handleAdditionalSettingsChange} 
            style={inputStyle} 
          />
        </div>
        <div style={formGroupStyle}>
          <label htmlFor="is_active">
            <input type="checkbox" id="is_active" name="is_active" checked={config.is_active === undefined ? true : config.is_active} onChange={handleChange} />
            Active Configuration
          </label>
        </div>
        <button type="submit" disabled={isLoading} style={{ padding: '10px 15px', marginTop: '10px' }}>
          {isLoading ? 'Saving...' : 'Save Asset Settings'}
        </button>
      </form>
    </div>
  );
};

const formGroupStyle: React.CSSProperties = {
  marginBottom: '15px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px',
  marginTop: '5px',
  boxSizing: 'border-box',
};

export default AssetSettingsPage;