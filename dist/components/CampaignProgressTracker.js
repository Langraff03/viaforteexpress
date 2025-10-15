import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, AlertCircle, Clock, Mail, TrendingUp, Users } from 'lucide-react';
import { useAuth } from '../lib/auth';
export const CampaignProgressTracker = ({ campaignId, onComplete, onError }) => {
    const { user } = useAuth();
    const [progress, setProgress] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);
    const [startTime, setStartTime] = useState(null);
    const wsRef = useRef(null);
    const webhookServerUrl = (import.meta.env.VITE_WEBHOOK_SERVER_URL || 'http://localhost:3001').replace('http', 'ws');
    // Conectar WebSocket
    useEffect(() => {
        if (!user?.id || !campaignId)
            return;
        const connectWebSocket = () => {
            try {
                // Gerar JWT token simples (em produção, usar token real do Supabase)
                const token = btoa(JSON.stringify({ userId: user.id }));
                const wsUrl = `${webhookServerUrl}/ws/campaign-progress?token=${token}`;
                console.log(`🔌 Conectando WebSocket: ${wsUrl}`);
                wsRef.current = new WebSocket(wsUrl);
                wsRef.current.onopen = () => {
                    console.log('🟢 WebSocket conectado');
                    setIsConnected(true);
                    setError(null);
                    // Inscrever-se na campanha
                    wsRef.current?.send(JSON.stringify({
                        type: 'subscribe_campaign',
                        payload: { campaign_id: campaignId }
                    }));
                };
                wsRef.current.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        console.log('📡 WebSocket message:', data);
                        if (data.type === 'campaign_progress' && data.data.campaign_id === campaignId) {
                            const update = data.data;
                            setProgress(update);
                            // Marcar hora de início
                            if (update.status === 'processing' && !startTime) {
                                setStartTime(new Date());
                            }
                            // Notificar conclusão
                            if (['completed', 'failed', 'cancelled'].includes(update.status)) {
                                onComplete?.(update.status);
                            }
                        }
                        if (data.type === 'pong') {
                            console.log('🏓 WebSocket pong received');
                        }
                    }
                    catch (err) {
                        console.error('❌ Erro ao processar mensagem WebSocket:', err);
                    }
                };
                wsRef.current.onerror = (event) => {
                    console.error('❌ WebSocket error:', event);
                    setError('Erro na conexão WebSocket');
                    setIsConnected(false);
                };
                wsRef.current.onclose = (event) => {
                    console.log('🔴 WebSocket desconectado:', event.code, event.reason);
                    setIsConnected(false);
                    // Reconectar após 3 segundos se não foi intencional
                    if (event.code !== 1000) {
                        setTimeout(connectWebSocket, 3000);
                    }
                };
            }
            catch (err) {
                console.error('❌ Erro ao conectar WebSocket:', err);
                setError('Falha ao conectar WebSocket');
            }
        };
        connectWebSocket();
        // Ping periódico para manter conexão
        const pingInterval = setInterval(() => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ type: 'ping' }));
            }
        }, 30000);
        return () => {
            clearInterval(pingInterval);
            wsRef.current?.close(1000, 'Component unmounted');
        };
    }, [user?.id, campaignId, webhookServerUrl, onComplete]);
    // Funções de controle
    const pauseCampaign = async () => {
        try {
            const webhookUrl = webhookServerUrl.replace('ws', 'http');
            const response = await fetch(`${webhookUrl}/api/mass-email/pause/${campaignId}`, {
                method: 'POST'
            });
            if (!response.ok)
                throw new Error('Falha ao pausar campanha');
        }
        catch (err) {
            console.error('❌ Erro ao pausar campanha:', err);
            onError?.('Erro ao pausar campanha');
        }
    };
    const resumeCampaign = async () => {
        try {
            const webhookUrl = webhookServerUrl.replace('ws', 'http');
            const response = await fetch(`${webhookUrl}/api/mass-email/resume/${campaignId}`, {
                method: 'POST'
            });
            if (!response.ok)
                throw new Error('Falha ao retomar campanha');
        }
        catch (err) {
            console.error('❌ Erro ao retomar campanha:', err);
            onError?.('Erro ao retomar campanha');
        }
    };
    const cancelCampaign = async () => {
        if (!confirm('Tem certeza que deseja cancelar esta campanha?'))
            return;
        try {
            const webhookUrl = webhookServerUrl.replace('ws', 'http');
            const response = await fetch(`${webhookUrl}/api/mass-email/cancel/${campaignId}`, {
                method: 'POST'
            });
            if (!response.ok)
                throw new Error('Falha ao cancelar campanha');
        }
        catch (err) {
            console.error('❌ Erro ao cancelar campanha:', err);
            onError?.('Erro ao cancelar campanha');
        }
    };
    // Calcular estatísticas
    const getElapsedTime = () => {
        if (!startTime)
            return '00:00:00';
        const elapsed = Date.now() - startTime.getTime();
        const hours = Math.floor(elapsed / 3600000);
        const minutes = Math.floor((elapsed % 3600000) / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };
    const getStatusColor = (status) => {
        switch (status) {
            case 'processing': return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'completed': return 'text-green-600 bg-green-50 border-green-200';
            case 'failed': return 'text-red-600 bg-red-50 border-red-200';
            case 'paused': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'cancelled': return 'text-gray-600 bg-gray-50 border-gray-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };
    const getStatusText = (status) => {
        switch (status) {
            case 'pending': return 'Aguardando';
            case 'processing': return 'Processando';
            case 'completed': return 'Concluída';
            case 'failed': return 'Falhou';
            case 'paused': return 'Pausada';
            case 'cancelled': return 'Cancelada';
            default: return status;
        }
    };
    if (error) {
        return (_jsxs("div", { className: "bg-red-50 border border-red-200 rounded-lg p-6", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(AlertCircle, { className: "w-5 h-5 text-red-500 mr-2" }), _jsx("h3", { className: "text-red-800 font-medium", children: "Erro na Conex\u00E3o" })] }), _jsx("p", { className: "text-red-700 mt-1", children: error })] }));
    }
    return (_jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900", children: "Progresso da Campanha" }), _jsxs("p", { className: "text-gray-500 text-sm", children: ["ID: ", campaignId] })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: `w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}` }), _jsx("span", { className: "text-sm text-gray-500", children: isConnected ? 'Conectado' : 'Desconectado' })] })] }), progress && (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: `inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(progress.status)}`, children: getStatusText(progress.status) }), _jsxs("div", { children: [_jsxs("div", { className: "flex justify-between text-sm text-gray-600 mb-2", children: [_jsx("span", { children: "Progresso" }), _jsxs("span", { children: [progress.progress_percent.toFixed(1), "%"] })] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-3", children: _jsx("div", { className: "bg-indigo-600 h-3 rounded-full transition-all duration-500 ease-out", style: { width: `${progress.progress_percent}%` } }) })] }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [_jsx("div", { className: "bg-gray-50 rounded-lg p-4", children: _jsxs("div", { className: "flex items-center", children: [_jsx(Users, { className: "w-5 h-5 text-gray-400 mr-2" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500", children: "Total" }), _jsx("p", { className: "font-semibold text-gray-900", children: progress.total_leads.toLocaleString() })] })] }) }), _jsx("div", { className: "bg-green-50 rounded-lg p-4", children: _jsxs("div", { className: "flex items-center", children: [_jsx(Mail, { className: "w-5 h-5 text-green-500 mr-2" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500", children: "Enviados" }), _jsx("p", { className: "font-semibold text-green-900", children: progress.sent_count.toLocaleString() })] })] }) }), _jsx("div", { className: "bg-red-50 rounded-lg p-4", children: _jsxs("div", { className: "flex items-center", children: [_jsx(AlertCircle, { className: "w-5 h-5 text-red-500 mr-2" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500", children: "Falhas" }), _jsx("p", { className: "font-semibold text-red-900", children: progress.failed_count.toLocaleString() })] })] }) }), _jsx("div", { className: "bg-blue-50 rounded-lg p-4", children: _jsxs("div", { className: "flex items-center", children: [_jsx(Clock, { className: "w-5 h-5 text-blue-500 mr-2" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500", children: "Tempo" }), _jsx("p", { className: "font-semibold text-blue-900", children: getElapsedTime() })] })] }) })] }), progress.current_batch && progress.total_batches && (_jsx("div", { className: "bg-gray-50 rounded-lg p-4", children: _jsxs("div", { className: "flex justify-between text-sm text-gray-600 mb-2", children: [_jsxs("span", { children: ["Lote ", progress.current_batch, " de ", progress.total_batches] }), _jsxs("span", { children: ["Taxa: ", progress.rate_limit_remaining || 'N/A', " req/s"] })] }) })), progress.status !== 'completed' && progress.status !== 'cancelled' && (_jsxs("div", { className: "flex space-x-3", children: [progress.status === 'processing' && (_jsxs("button", { onClick: pauseCampaign, className: "flex items-center px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors", children: [_jsx(Pause, { className: "w-4 h-4 mr-2" }), "Pausar"] })), progress.status === 'paused' && (_jsxs("button", { onClick: resumeCampaign, className: "flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors", children: [_jsx(Play, { className: "w-4 h-4 mr-2" }), "Continuar"] })), _jsxs("button", { onClick: cancelCampaign, className: "flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors", children: [_jsx(Square, { className: "w-4 h-4 mr-2" }), "Cancelar"] })] })), progress.status === 'completed' && (_jsx("div", { className: "bg-green-50 border border-green-200 rounded-lg p-4", children: _jsxs("div", { className: "flex items-center", children: [_jsx(TrendingUp, { className: "w-5 h-5 text-green-500 mr-2" }), _jsxs("div", { children: [_jsx("h3", { className: "text-green-800 font-medium", children: "Campanha Conclu\u00EDda!" }), _jsxs("p", { className: "text-green-700 text-sm", children: [progress.sent_count, " emails enviados com sucesso de ", progress.total_leads, " leads"] })] })] }) }))] })), !progress && (_jsxs("div", { className: "text-center py-8", children: [_jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4" }), _jsx("p", { className: "text-gray-500", children: "Aguardando dados da campanha..." })] }))] }));
};
export default CampaignProgressTracker;
