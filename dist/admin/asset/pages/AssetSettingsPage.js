import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
const AssetSettingsPage = () => {
    // const { user, token } = useAdminAuth(); // Exemplo
    const [config, setConfig] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
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
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setIsLoading(false);
        }
    }, [clientIdForAsset /*, token */]); // A vírgula antes de token é intencional caso o comentário seja removido
    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]);
    const handleChange = (e) => {
        const { name, value, type } = e.target;
        // @ts-ignore
        const checked = e.target.checked; // Para caixas de seleção
        setConfig(prevConfig => ({
            ...prevConfig,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };
    const handleAdditionalSettingsChange = (e) => {
        try {
            const parsedJson = JSON.parse(e.target.value);
            setConfig(prevConfig => ({
                ...prevConfig,
                additional_settings: parsedJson,
            }));
        }
        catch (jsonError) {
            // Lidar com erro de parsing de JSON, talvez definir um estado de erro para este campo
            console.warn("Invalid JSON in additional settings");
        }
    };
    const handleSubmit = async (e) => {
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
        }
        catch (err) {
            setError(err.message);
            alert(`Error saving settings: ${err.message}`);
        }
        finally {
            setIsLoading(false);
        }
    };
    if (isLoading && !Object.keys(config).length)
        return _jsxs("p", { children: ["Loading Asset settings for client '", clientIdForAsset, "'..."] });
    // if (error) return <p>Erro: {error}</p>; // Pode ser mostrado junto com o formulário
    return (_jsxs("div", { children: [_jsx("h1", { children: "Asset Gateway Settings" }), _jsxs("p", { children: ["Configure API keys and other settings for the Asset gateway for client: ", _jsx("strong", { children: clientIdForAsset }), "."] }), error && _jsxs("p", { style: { color: 'red' }, children: ["Error: ", error] }), _jsxs("form", { onSubmit: handleSubmit, style: { marginTop: '20px' }, children: [_jsxs("div", { style: formGroupStyle, children: [_jsx("label", { htmlFor: "api_key", children: "API Key:" }), _jsx("input", { type: "password", id: "api_key", name: "api_key", value: config.api_key || '', onChange: handleChange, style: inputStyle })] }), _jsxs("div", { style: formGroupStyle, children: [_jsx("label", { htmlFor: "webhook_secret", children: "Webhook Secret/Token:" }), _jsx("input", { type: "password", id: "webhook_secret", name: "webhook_secret", value: config.webhook_secret || '', onChange: handleChange, style: inputStyle }), _jsx("small", { children: " (Este \u00E9 o token que o Asaas envia no cabe\u00E7alho 'asaas-webhook-token', ou seu segredo configurado para valida\u00E7\u00E3o de assinatura)" })] }), _jsxs("div", { style: formGroupStyle, children: [_jsx("label", { htmlFor: "additional_settings", children: "Additional Settings (JSON):" }), _jsx("textarea", { id: "additional_settings", name: "additional_settings", rows: 5, value: config.additional_settings ? JSON.stringify(config.additional_settings, null, 2) : '', onChange: handleAdditionalSettingsChange, style: inputStyle })] }), _jsx("div", { style: formGroupStyle, children: _jsxs("label", { htmlFor: "is_active", children: [_jsx("input", { type: "checkbox", id: "is_active", name: "is_active", checked: config.is_active === undefined ? true : config.is_active, onChange: handleChange }), "Active Configuration"] }) }), _jsx("button", { type: "submit", disabled: isLoading, style: { padding: '10px 15px', marginTop: '10px' }, children: isLoading ? 'Saving...' : 'Save Asset Settings' })] })] }));
};
const formGroupStyle = {
    marginBottom: '15px',
};
const inputStyle = {
    width: '100%',
    padding: '8px',
    marginTop: '5px',
    boxSizing: 'border-box',
};
export default AssetSettingsPage;
