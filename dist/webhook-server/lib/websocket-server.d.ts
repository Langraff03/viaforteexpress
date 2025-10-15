interface CampaignProgressUpdate {
    campaign_id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'paused' | 'cancelled';
    total_leads: number;
    sent_count: number;
    failed_count: number;
    progress_percent: number;
    estimated_completion?: string;
    current_batch?: number;
    total_batches?: number;
    rate_limit_remaining?: number;
    last_email_sent?: string;
}
declare class CampaignWebSocketServer {
    private wss;
    private clients;
    constructor(server: any);
    private verifyClient;
    private handleConnection;
    private handleMessage;
    private verifyCampaignAccess;
    private sendInitialCampaignStatus;
    broadcastCampaignUpdate(update: CampaignProgressUpdate): void;
    sendToUser(userId: string, message: any): void;
    getStats(): {
        activeUsers: number;
        totalClients: number;
        connectedUsers: string[];
    };
    shutdown(): Promise<void>;
}
export default CampaignWebSocketServer;
export type { CampaignProgressUpdate };
