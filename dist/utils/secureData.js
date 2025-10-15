/**
 * 🔒 SISTEMA DE PROTEÇÃO DE INFRAESTRUTURA ANTI-RASTREAMENTO
 *
 * Este sistema protege informações de infraestrutura enquanto
 * MANTÉM os dados reais dos clientes para máximo engajamento
 * e prevenção de estornos.
 */
import { secureLog } from './secureLogger';
/**
 * Pool de nomes fictícios de transportadoras
 */
const fakeTransportCompanies = [
    'VIA FORTE EXPRESS',
    'Express Logística',
    'Veloz Entregas',
    'Prime Delivery',
    'Flash Transportes',
    'Turbo Logística',
    'Speed Express',
    'Ultra Delivery',
    'Mega Transportes',
    'Super Express',
];
/**
 * Pool de nomes fictícios de entregadores
 */
const fakeDeliveryPersons = [
    'Carlos Silva',
    'João Santos',
    'Maria Oliveira',
    'Pedro Costa',
    'Ana Souza',
    'Lucas Ferreira',
    'Juliana Lima',
    'Rafael Alves',
    'Camila Rocha',
    'Bruno Martins',
    'Fernanda Dias',
    'Rodrigo Pereira',
    'Patrícia Gomes',
    'Thiago Ribeiro',
    'Vanessa Castro',
];
/**
 * Pool de motivos fictícios para falhas de entrega
 */
const fakeFailureReasons = [
    'destinatário ausente',
    'endereço incompleto',
    'portão fechado',
    'chuva forte',
    'trânsito intenso',
    'horário comercial encerrado',
    'acesso restrito',
    'documento necessário',
    'reagendamento solicitado',
    'área de risco',
];
/**
 * Pool de cidades fictícias para hubs
 */
const fakeCities = [
    'São Paulo - SP',
    'Rio de Janeiro - RJ',
    'Belo Horizonte - MG',
    'Brasília - DF',
    'Salvador - BA',
    'Fortaleza - CE',
    'Recife - PE',
    'Porto Alegre - RS',
    'Curitiba - PR',
    'Goiânia - GO',
    'Manaus - AM',
    'Belém - PA',
    'Vitória - ES',
    'Florianópolis - SC',
    'Campo Grande - MS',
];
/**
 * Pool de nomes fictícios de hubs/centros de distribuição
 */
const fakeHubNames = [
    'Centro de Distribuição Regional',
    'Hub Logístico Principal',
    'Terminal de Cargas',
    'Base Operacional',
    'Centro de Triagem',
    'Unidade de Distribuição',
    'Terminal Rodoviário',
    'Centro Logístico',
    'Base de Operações',
    'Hub de Distribuição',
];
/**
 * Gera uma transportadora fictícia aleatória
 */
export const getFakeTransportCompany = () => {
    const randomIndex = Math.floor(Math.random() * fakeTransportCompanies.length);
    return fakeTransportCompanies[randomIndex];
};
/**
 * Gera um nome de entregador fictício aleatório
 */
export const getFakeDeliveryPerson = () => {
    const randomIndex = Math.floor(Math.random() * fakeDeliveryPersons.length);
    return fakeDeliveryPersons[randomIndex];
};
/**
 * Gera um motivo de falha fictício aleatório
 */
export const getFakeFailureReason = () => {
    const randomIndex = Math.floor(Math.random() * fakeFailureReasons.length);
    return fakeFailureReasons[randomIndex];
};
/**
 * Gera uma cidade fictícia aleatória
 */
export const getFakeCity = () => {
    const randomIndex = Math.floor(Math.random() * fakeCities.length);
    return fakeCities[randomIndex];
};
/**
 * Gera um nome de hub fictício aleatório
 */
export const getFakeHubName = () => {
    const randomIndex = Math.floor(Math.random() * fakeHubNames.length);
    return fakeHubNames[randomIndex];
};
/**
 * Gera um código de rastreamento fictício
 */
export const generateFakeTrackingCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};
/**
 * Gera um horário fictício baseado em uma data
 */
export const generateFakeTime = (baseDate) => {
    const date = baseDate || new Date();
    const randomMinutes = Math.floor(Math.random() * 480) + 480; // Entre 8h e 16h
    const hours = Math.floor(randomMinutes / 60);
    const minutes = randomMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};
/**
 * Gera uma data fictícia próxima à data atual
 */
export const generateFakeDate = (daysOffset = 0) => {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    // Adiciona variação aleatória de algumas horas
    const randomHours = Math.floor(Math.random() * 24);
    const randomMinutes = Math.floor(Math.random() * 60);
    date.setHours(randomHours, randomMinutes, 0, 0);
    return date;
};
/**
 * Gera um endereço fictício
 */
export const generateFakeAddress = () => {
    const streets = [
        'Rua das Flores',
        'Avenida Principal',
        'Rua do Comércio',
        'Avenida Central',
        'Rua São João',
        'Avenida Paulista',
        'Rua da Paz',
        'Avenida Brasil',
        'Rua XV de Novembro',
        'Avenida Getúlio Vargas',
    ];
    const number = Math.floor(Math.random() * 9999) + 1;
    const street = streets[Math.floor(Math.random() * streets.length)];
    return `${street}, ${number}`;
};
/**
 * Gera um CEP fictício
 */
export const generateFakeCEP = () => {
    const firstPart = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
    const secondPart = Math.floor(Math.random() * 999).toString().padStart(3, '0');
    return `${firstPart}-${secondPart}`;
};
/**
 * Gera um telefone fictício
 */
export const generateFakePhone = () => {
    const ddd = Math.floor(Math.random() * 89) + 11; // DDDs de 11 a 99
    const firstPart = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
    const secondPart = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `(${ddd}) ${firstPart}-${secondPart}`;
};
/**
 * Gera apenas dados de infraestrutura fictícios (mantém dados reais do cliente)
 */
export const generateSecureInfrastructureData = () => {
    return {
        // Apenas dados de infraestrutura são fictícios
        transportCompany: getFakeTransportCompany(),
        hubName: getFakeHubName(),
        // Dados do cliente permanecem REAIS vindos do banco de dados
    };
};
/**
 * Ofusca dados sensíveis substituindo por asteriscos
 */
export const obfuscateData = (data, visibleChars = 3) => {
    if (data.length <= visibleChars * 2) {
        return '*'.repeat(data.length);
    }
    const start = data.substring(0, visibleChars);
    const end = data.substring(data.length - visibleChars);
    const middle = '*'.repeat(data.length - (visibleChars * 2));
    return `${start}${middle}${end}`;
};
/**
 * Gera um ID de sessão fictício para logs
 */
export const generateFakeSessionId = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};
/**
 * Protege apenas informações de infraestrutura (mantém dados reais do cliente)
 */
export const protectInfrastructureData = (data) => {
    // Substitui apenas campos relacionados à infraestrutura
    const protectedData = { ...data };
    // Campos de infraestrutura que devem ser ofuscados
    const infrastructureFields = [
        'server_url',
        'api_endpoint',
        'database_host',
        'redis_host',
        'webhook_url',
        'internal_id',
        'system_id'
    ];
    infrastructureFields.forEach(field => {
        if (protectedData[field] && typeof protectedData[field] === 'string') {
            protectedData[field] = obfuscateData(protectedData[field]);
        }
    });
    return protectedData;
};
secureLog.debug('Sistema de proteção de infraestrutura inicializado');
export default {
    // Funções para ofuscar apenas infraestrutura
    getFakeTransportCompany,
    getFakeHubName,
    generateSecureInfrastructureData,
    obfuscateData,
    generateFakeSessionId,
    protectInfrastructureData,
    // Funções auxiliares mantidas para compatibilidade
    getFakeDeliveryPerson,
    getFakeFailureReason,
    getFakeCity,
    generateFakeTrackingCode,
    generateFakeTime,
    generateFakeDate,
    generateFakeAddress,
    generateFakeCEP,
    generateFakePhone,
};
