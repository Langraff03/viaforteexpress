// src/lib/domainHelpers.ts
// Funções helper para seleção inteligente de domínios por tipo de oferta
import { supabaseAdmin } from './server/supabaseAdmin';
// Funções locais para substituir as que estavam no emailService
async function getAvailableEmailDomains() {
    const { data } = await supabaseAdmin.from('email_domains').select('*');
    return data || [];
}
async function getDefaultEmailDomain() {
    const { data } = await supabaseAdmin.from('email_domains').select('*').eq('is_default', true).single();
    return data;
}
/**
 * Mapeia palavras-chave para sugestões de domínio
 */
const DOMAIN_KEYWORDS_MAP = {
    farmacia: ['farmacia', 'medicamento', 'remedio', 'saude', 'droga', 'vitamina'],
    imobiliaria: ['casa', 'apartamento', 'imovel', 'terreno', 'aluguel', 'venda'],
    loja: ['produto', 'compra', 'venda', 'shopping', 'store', 'comercio'],
    financeira: ['emprestimo', 'financiamento', 'credito', 'banco', 'cartao'],
    educacao: ['curso', 'escola', 'ensino', 'educacao', 'formacao', 'treinamento'],
    tecnologia: ['software', 'app', 'sistema', 'digital', 'online', 'tech'],
    consultoria: ['consultoria', 'servico', 'assessoria', 'consultante', 'expert'],
    ecommerce: ['ecommerce', 'loja virtual', 'marketplace', 'vendas online']
};
/**
 * Analisa o texto da oferta e sugere domínios baseado em palavras-chave
 * @param offerText Texto da oferta para análise
 * @param description Descrição adicional (opcional)
 * @returns Promise<DomainSelectionOption[]> Lista de domínios sugeridos
 */
export async function suggestDomainByOfferType(offerText, description) {
    console.log(`🤖 [suggestDomainByOfferType] Analisando oferta: "${offerText}"`);
    try {
        // Obter todos os domínios disponíveis
        const domains = await getAvailableEmailDomains();
        if (domains.length === 0) {
            console.warn('❌ Nenhum domínio encontrado');
            return [];
        }
        // Combinar textos para análise
        const fullText = `${offerText} ${description || ''}`.toLowerCase();
        const suggestions = [];
        // Analisar cada categoria de palavra-chave
        for (const [category, keywords] of Object.entries(DOMAIN_KEYWORDS_MAP)) {
            const matchCount = keywords.filter(keyword => fullText.includes(keyword)).length;
            if (matchCount > 0) {
                console.log(`🎯 [suggestDomainByOfferType] Categoria detectada: ${category} (${matchCount} matches)`);
                // Buscar domínios que contenham a categoria no nome
                const categoryDomains = domains.filter(domain => domain.domain_name.toLowerCase().includes(category) ||
                    domain.from_name.toLowerCase().includes(category));
                categoryDomains.forEach(domain => {
                    suggestions.push({
                        id: domain.id,
                        label: `${domain.from_name} (${domain.domain_name})`,
                        description: `Recomendado para ${category} - ${matchCount} palavra(s) relacionada(s)`,
                        domain_name: domain.domain_name,
                        is_default: domain.is_default
                    });
                });
            }
        }
        // Sempre incluir domínio padrão como opção
        const defaultDomain = domains.find(d => d.is_default);
        if (defaultDomain && !suggestions.find(s => s.is_default)) {
            suggestions.unshift({
                id: defaultDomain.id,
                label: `${defaultDomain.from_name} (${defaultDomain.domain_name})`,
                description: 'Domínio padrão do sistema',
                domain_name: defaultDomain.domain_name,
                is_default: true
            });
        }
        // Se não há sugestões específicas, retornar todos os domínios
        if (suggestions.length <= 1) {
            console.log(`💡 [suggestDomainByOfferType] Nenhuma categoria específica detectada, listando todos os domínios`);
            return domains.map(domain => ({
                id: domain.id,
                label: `${domain.from_name} (${domain.domain_name})`,
                description: domain.is_default ? 'Domínio padrão do sistema' : 'Domínio personalizado',
                domain_name: domain.domain_name,
                is_default: domain.is_default
            }));
        }
        // Ordenar sugestões (domínio padrão primeiro, depois por relevância)
        suggestions.sort((a, b) => {
            if (a.is_default)
                return -1;
            if (b.is_default)
                return 1;
            return 0;
        });
        console.log(`✅ [suggestDomainByOfferType] ${suggestions.length} sugestões geradas`);
        return suggestions;
    }
    catch (error) {
        console.error('❌ [suggestDomainByOfferType] Erro ao sugerir domínios:', error);
        return [];
    }
}
/**
 * Obtém o domínio recomendado baseado no tipo de oferta
 * @param offerType Categoria da oferta (farmacia, imobiliaria, etc.)
 * @returns Promise<EmailDomain | null> Domínio recomendado
 */
export async function getRecommendedDomainByType(offerType) {
    try {
        const domains = await getAvailableEmailDomains();
        // Buscar domínio que corresponde ao tipo
        const matchedDomain = domains.find(domain => domain.domain_name.toLowerCase().includes(offerType.toLowerCase()) ||
            domain.from_name.toLowerCase().includes(offerType.toLowerCase()));
        if (matchedDomain) {
            console.log(`🎯 [getRecommendedDomainByType] Domínio encontrado para ${offerType}: ${matchedDomain.domain_name}`);
            return matchedDomain;
        }
        // Se não encontrou, retornar domínio padrão
        console.log(`💡 [getRecommendedDomainByType] Nenhum domínio específico para ${offerType}, usando padrão`);
        return await getDefaultEmailDomain();
    }
    catch (error) {
        console.error('❌ [getRecommendedDomainByType] Erro:', error);
        return null;
    }
}
/**
 * Valida se um domínio pode ser usado para um tipo específico de oferta
 * @param domainId ID do domínio
 * @param offerType Tipo da oferta
 * @returns Promise<boolean> Se o domínio é adequado
 */
export async function validateDomainForOfferType(domainId, offerType) {
    try {
        const domains = await getAvailableEmailDomains();
        const domain = domains.find(d => d.id === domainId);
        if (!domain) {
            console.warn(`⚠️ [validateDomainForOfferType] Domínio ${domainId} não encontrado`);
            return false;
        }
        if (!domain.is_active) {
            console.warn(`⚠️ [validateDomainForOfferType] Domínio ${domain.domain_name} está inativo`);
            return false;
        }
        // Domínio padrão sempre é válido
        if (domain.is_default) {
            return true;
        }
        // Verificar se o domínio é adequado para o tipo de oferta
        const keywords = DOMAIN_KEYWORDS_MAP[offerType.toLowerCase()] || [];
        const isRelevant = keywords.some(keyword => domain.domain_name.toLowerCase().includes(keyword) ||
            domain.from_name.toLowerCase().includes(keyword));
        console.log(`🔍 [validateDomainForOfferType] Domínio ${domain.domain_name} ${isRelevant ? 'É' : 'NÃO é'} adequado para ${offerType}`);
        return true; // Permitir qualquer domínio ativo, mas logar adequação
    }
    catch (error) {
        console.error('❌ [validateDomainForOfferType] Erro:', error);
        return false;
    }
}
/**
 * Gera opções de seleção formatadas para uso em dropdowns
 * @param includeDefault Se deve incluir opção "usar padrão"
 * @returns Promise<Array<{value: string, label: string, description?: string}>>
 */
export async function getDomainSelectionOptions(includeDefault = true) {
    try {
        const domains = await getAvailableEmailDomains();
        const options = [];
        // Opção para usar domínio padrão automaticamente
        if (includeDefault) {
            options.push({
                value: '',
                label: '🏠 Usar domínio padrão (viaforteexpress.com)',
                description: 'Configuração padrão do sistema',
                isDefault: true
            });
        }
        // Adicionar domínios personalizados
        domains
            .filter(domain => !domain.is_default) // Excluir domínio padrão da lista
            .forEach(domain => {
            options.push({
                value: domain.id,
                label: `📧 ${domain.domain_name} - ${domain.from_name}`,
                description: `Email: ${domain.from_email}`,
                isDefault: false
            });
        });
        return options;
    }
    catch (error) {
        console.error('❌ [getDomainSelectionOptions] Erro:', error);
        return includeDefault ? [{
                value: '',
                label: '🏠 Usar domínio padrão (viaforteexpress.com)',
                description: 'Configuração padrão do sistema',
                isDefault: true
            }] : [];
    }
}
/**
 * Obtém estatísticas de uso de domínios
 * @returns Promise<Array<{domainId: string, domainName: string, usageCount: number}>>
 */
export async function getDomainUsageStats() {
    try {
        // Esta função pode ser expandida para incluir estatísticas reais
        // Por enquanto, retorna dados básicos dos domínios
        const domains = await getAvailableEmailDomains();
        return domains.map(domain => ({
            domainId: domain.id,
            domainName: domain.domain_name,
            usageCount: 0, // TODO: Implementar contagem real de campanhas
            lastUsed: undefined // TODO: Implementar data da última campanha
        }));
    }
    catch (error) {
        console.error('❌ [getDomainUsageStats] Erro:', error);
        return [];
    }
}
/**
 * Função utilitária para log de uso de domínio
 * @param domainId ID do domínio usado
 * @param campaignType Tipo da campanha ('small' | 'large')
 * @param leadCount Número de leads na campanha
 */
export async function logDomainUsage(domainId, campaignType, leadCount) {
    try {
        // Log básico - pode ser expandido para uma tabela específica
        console.log(`📊 [logDomainUsage] Domínio ${domainId} usado em campanha ${campaignType} com ${leadCount} leads`);
        // TODO: Implementar logging em tabela específica se necessário
        // await supabaseAdminAdmin.from('domain_usage_logs').insert({
        //   domain_id: domainId,
        //   campaign_type: campaignType,
        //   lead_count: leadCount,
        //   used_at: new Date().toISOString()
        // });
    }
    catch (error) {
        console.error('❌ [logDomainUsage] Erro ao registrar uso:', error);
    }
}
//# sourceMappingURL=domainHelpers.js.map