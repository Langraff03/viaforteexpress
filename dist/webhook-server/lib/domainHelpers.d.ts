import type { EmailDomain, DomainSelectionOption } from '../types';
/**
 * Analisa o texto da oferta e sugere domínios baseado em palavras-chave
 * @param offerText Texto da oferta para análise
 * @param description Descrição adicional (opcional)
 * @returns Promise<DomainSelectionOption[]> Lista de domínios sugeridos
 */
export declare function suggestDomainByOfferType(offerText: string, description?: string): Promise<DomainSelectionOption[]>;
/**
 * Obtém o domínio recomendado baseado no tipo de oferta
 * @param offerType Categoria da oferta (farmacia, imobiliaria, etc.)
 * @returns Promise<EmailDomain | null> Domínio recomendado
 */
export declare function getRecommendedDomainByType(offerType: string): Promise<EmailDomain | null>;
/**
 * Valida se um domínio pode ser usado para um tipo específico de oferta
 * @param domainId ID do domínio
 * @param offerType Tipo da oferta
 * @returns Promise<boolean> Se o domínio é adequado
 */
export declare function validateDomainForOfferType(domainId: string, offerType: string): Promise<boolean>;
/**
 * Gera opções de seleção formatadas para uso em dropdowns
 * @param includeDefault Se deve incluir opção "usar padrão"
 * @returns Promise<Array<{value: string, label: string, description?: string}>>
 */
export declare function getDomainSelectionOptions(includeDefault?: boolean): Promise<Array<{
    value: string;
    label: string;
    description?: string;
    isDefault?: boolean;
}>>;
/**
 * Obtém estatísticas de uso de domínios
 * @returns Promise<Array<{domainId: string, domainName: string, usageCount: number}>>
 */
export declare function getDomainUsageStats(): Promise<Array<{
    domainId: string;
    domainName: string;
    usageCount: number;
    lastUsed?: string;
}>>;
/**
 * Função utilitária para log de uso de domínio
 * @param domainId ID do domínio usado
 * @param campaignType Tipo da campanha ('small' | 'large')
 * @param leadCount Número de leads na campanha
 */
export declare function logDomainUsage(domainId: string, campaignType: 'small' | 'large', leadCount: number): Promise<void>;
