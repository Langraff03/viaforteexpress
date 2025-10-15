import { addDays, addHours, addMinutes, format, setHours, setMinutes, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
// --- Dados Fictícios e Rotas Simuladas --- 
// Mapeamento de Estado (UF) para Região (usado como fallback se rota específica não existir)
const stateToRegionMap = {
    AC: 'Norte', AL: 'Nordeste', AP: 'Norte', AM: 'Norte',
    BA: 'Nordeste', CE: 'Nordeste', DF: 'Centro-Oeste', ES: 'Sudeste',
    GO: 'Centro-Oeste', MA: 'Nordeste', MT: 'Centro-Oeste', MS: 'Centro-Oeste',
    MG: 'Sudeste', PA: 'Norte', PB: 'Nordeste', PR: 'Sul',
    PE: 'Nordeste', PI: 'Nordeste', RJ: 'Sudeste', RN: 'Nordeste',
    RS: 'Sul', RO: 'Norte', RR: 'Norte', SC: 'Sul',
    SP: 'Sudeste', SE: 'Nordeste', TO: 'Norte',
};
// Mapa de Rotas Simuladas Progressivas por Estado de Destino
const simulatedRoutes = {
    // Sudeste
    SP: ["Centro de Triagem Goiânia, GO", "Hub Logístico Belo Horizonte, MG", "Centro de Distribuição Campinas, SP"],
    RJ: ["Hub Logístico Campinas, SP", "Centro de Distribuição Belo Horizonte, MG", "Base Operacional Rio de Janeiro, RJ"],
    MG: ["Centro de Distribuição Campinas, SP", "Base Operacional Rio de Janeiro, RJ", "Hub Logístico Belo Horizonte, MG"],
    ES: ["Hub Logístico Belo Horizonte, MG", "Base Operacional Rio de Janeiro, RJ", "Centro de Distribuição Vitória, ES"],
    // Sul
    PR: ["Centro de Distribuição Belo Horizonte, MG", "Hub Logístico Campinas, SP", "Base Operacional Curitiba, PR"],
    SC: ["Hub Logístico Campinas, SP", "Base Operacional Curitiba, PR", "Ponto de Apoio Florianópolis, SC"],
    RS: ["Base Operacional Curitiba, PR", "Ponto de Apoio Florianópolis, SC", "Centro de Distribuição Porto Alegre, RS"],
    // Nordeste
    BA: ["Hub Logístico São Paulo, SP", "Centro de Distribuição Rio de Janeiro, RJ", "Base Operacional Salvador, BA"],
    PE: ["Base Operacional Salvador, BA", "Hub Logístico Aracaju, SE", "Ponto de Apoio Recife, PE"],
    CE: ["Ponto de Apoio Recife, PE", "Centro de Distribuição Natal, RN", "Hub Logístico Fortaleza, CE"],
    // Adicionar mais rotas para outros estados do Nordeste...
    // Centro-Oeste
    GO: ["Hub Logístico Belo Horizonte, MG", "Centro de Triagem Uberlândia, MG", "Hub Logístico Goiânia, GO"],
    DF: ["Hub Logístico Goiânia, GO", "Ponto de Apoio Anápolis, GO", "Centro de Distribuição Brasília, DF"],
    MS: ["Hub Logístico Campinas, SP", "Centro de Distribuição Londrina, PR", "Ponto de Apoio Campo Grande, MS"],
    MT: ["Hub Logístico Goiânia, GO", "Base Operacional Rondonópolis, MT", "Base Operacional Cuiabá, MT"],
    // Norte
    AM: ["Centro Nacional de Distribuição Brasília, DF", "Centro de Distribuição Belém, PA", "Hub Logístico Manaus, AM"],
    PA: ["Centro Nacional de Distribuição Brasília, DF", "Hub Logístico Imperatriz, MA", "Centro de Distribuição Belém, PA"],
    // Adicionar mais rotas para outros estados do Norte...
};
export const fakeNames = [
    "Carlos Silva",
    "Mariana Costa",
    "João Pereira",
    "Ana Souza",
    "Rafael Oliveira",
];
export const fakeReasons = [
    "Destinatário ausente",
    "Endereço não localizado",
    "Acesso restrito ao local",
    "Recusado pelo destinatário",
    "Problema operacional",
];
// --- Funções Auxiliares --- 
// Função para obter um item aleatório de uma lista, mas de forma determinística por ID/seed
export function getRandomItem(array, seed) {
    if (!array || array.length === 0) {
        if (typeof array[0] === 'string')
            return '';
        return undefined;
    }
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        const char = seed.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    const index = Math.abs(hash) % array.length;
    return array[index];
}
// Função para obter a rota simulada com base no estado de destino
export function getSimulatedRoute(destinationState) {
    const defaultRoute = ["Centro Nacional de Distribuição", "Hub Logístico Central", `Destino Final`];
    if (!destinationState) {
        defaultRoute[2] = "Destino Final (Estado não informado)";
        return defaultRoute;
    }
    const upperCaseState = destinationState.toUpperCase();
    const route = simulatedRoutes[upperCaseState];
    if (route && route.length >= 3) {
        return route;
    }
    else {
        // Fallback: Usa uma rota genérica baseada na região
        const region = stateToRegionMap[upperCaseState] || 'Indefinida';
        defaultRoute[2] = `Destino Final (${region})`;
        return defaultRoute;
    }
}
// Função para obter a data base SIMULADA para cálculo do timestamp relativo de cada etapa
export function getBaseDateForStatus(statusKey, order) {
    if (!order || !order.created_at)
        return null;
    const createdAt = new Date(order.created_at);
    if (isNaN(createdAt.getTime()))
        return null;
    const shippedAt = order.shipped_at ? new Date(order.shipped_at) : null;
    if (shippedAt && isNaN(shippedAt.getTime()))
        return null;
    const redeliveryDate = order.redelivery_date ? new Date(order.redelivery_date) : null;
    if (redeliveryDate && isNaN(redeliveryDate.getTime()))
        return null;
    // Dias relativos à criação para início de cada etapa (ajustados para progressão)
    const startDays = {
        confirmed: 0,
        processing: 1, // 1 dia após criação
        packed: 3, // 2 dias após início do processamento
        shipped: 5, // 2 dias após embalado
        out_for_delivery: 11, // 6 dias após envio (considera trânsito)
        not_delivered: 15, // 4 dias após sair para entrega (limite total)
    };
    // Dias relativos à data de reagendamento
    const redeliveryStartDays = {
        redelivery_scheduled: 0, // No dia do agendamento
        out_for_redelivery: 2, // 2 dias após agendamento
        // not_delivered (reentrega) é tratado como 10 dias após redelivery_date na lógica principal
    };
    let baseDate = null;
    // Lógica de Reentrega
    if (redeliveryDate && (statusKey === 'redelivery_scheduled' || statusKey === 'out_for_redelivery')) {
        const daysToAdd = redeliveryStartDays[statusKey] ?? 0;
        baseDate = addDays(redeliveryDate, daysToAdd);
    }
    // Lógica de Entrega Inicial
    else {
        const daysToAdd = startDays[statusKey] ?? 0;
        baseDate = addDays(createdAt, daysToAdd);
        // Ajusta 'shipped' se houver data real e for posterior à simulada
        if (statusKey === 'shipped' && shippedAt && shippedAt > baseDate) {
            baseDate = shippedAt;
        }
        // Ajusta 'out_for_delivery' baseado na data de 'shipped' (real ou simulada)
        if (statusKey === 'out_for_delivery') {
            const shippedBaseDate = getBaseDateForStatus('shipped', order);
            if (shippedBaseDate) {
                const calculatedOutDate = addDays(shippedBaseDate, 6); // 6 dias após envio
                // Usa a data calculada a partir do envio, mas não antes da data simulada baseada na criação
                baseDate = calculatedOutDate > baseDate ? calculatedOutDate : baseDate;
            }
        }
        // Ajusta 'not_delivered' (primeira tentativa) baseado na data de 'out_for_delivery'
        if (statusKey === 'not_delivered' && !redeliveryDate) {
            const outForDeliveryBaseDate = getBaseDateForStatus('out_for_delivery', order);
            if (outForDeliveryBaseDate) {
                const calculatedFailDate = addDays(outForDeliveryBaseDate, 4); // 4 dias após sair
                baseDate = calculatedFailDate > baseDate ? calculatedFailDate : baseDate;
            }
            // Garante que a falha não ocorra antes de 15 dias da criação
            const minNotDeliveredDate = addDays(createdAt, 15);
            if (baseDate < minNotDeliveredDate) {
                baseDate = minNotDeliveredDate;
            }
        }
    }
    return baseDate && !isNaN(baseDate.getTime()) ? baseDate : null;
}
// Função para calcular o timestamp absoluto de um sub-evento
// Retorna um objeto com a data calculada e a string formatada
export function calculateSubEventTimestamp(subEvent, baseDate, order) {
    const fallbackResult = { date: null, formatted: null };
    if (!baseDate || isNaN(baseDate.getTime()))
        return fallbackResult;
    const relative = subEvent.relativeTimestamp;
    let calculatedDate = null;
    try {
        if (relative === 'created_at') {
            calculatedDate = new Date(order.created_at);
        }
        // Usa a data base do status 'shipped' para o primeiro evento de trânsito
        else if (relative === 'shipped_at_or_start') {
            calculatedDate = getBaseDateForStatus('shipped', order);
        }
        else if (relative === 'redelivery_date') {
            calculatedDate = getBaseDateForStatus('redelivery_scheduled', order);
            // Se for redelivery_date, formatamos diferente (só dia/mês)
            if (calculatedDate && !isNaN(calculatedDate.getTime())) {
                return { date: calculatedDate, formatted: format(calculatedDate, "dd/MM", { locale: ptBR }) };
            }
        }
        else if (relative === 'start') {
            calculatedDate = baseDate;
        }
        else {
            // Calcula offsets de tempo (ex: +1h, +24h, +5m)
            const timeMatch = relative.match(/^\+(\d+)([hm])$/);
            if (timeMatch) {
                const value = parseInt(timeMatch[1], 10);
                const unit = timeMatch[2];
                calculatedDate = baseDate;
                if (unit === 'h') {
                    calculatedDate = addHours(baseDate, value);
                }
                else if (unit === 'm') {
                    calculatedDate = addMinutes(baseDate, value);
                }
            }
            else {
                // Calcula horários fixos (ex: start_07:00, +1h_08:00)
                const fixedTimeMatch = relative.match(/^(start|\+(\d+)h)?_?(\d{2}):(\d{2})$/);
                if (fixedTimeMatch) {
                    calculatedDate = baseDate;
                    const hoursOffset = fixedTimeMatch[2] ? parseInt(fixedTimeMatch[2], 10) : 0;
                    const targetHour = parseInt(fixedTimeMatch[3], 10);
                    const targetMinute = parseInt(fixedTimeMatch[4], 10);
                    if (hoursOffset > 0) {
                        calculatedDate = addHours(baseDate, hoursOffset);
                    }
                    // Define a hora no dia da data base (ou data base + offset)
                    calculatedDate = setHours(startOfDay(calculatedDate), targetHour);
                    // Não definimos os minutos aqui, pois serão randomizados no final da função
                }
                else {
                    console.warn("Formato de relativeTimestamp não reconhecido:", relative);
                    calculatedDate = baseDate; // Fallback para a data base do status
                }
            }
        }
        // Se a data foi calculada com sucesso, randomiza os minutos e formata
        if (calculatedDate && !isNaN(calculatedDate.getTime())) {
            // Não randomizamos minutos para redelivery_date, que já foi tratado acima
            if (relative !== 'redelivery_date') {
                // Gera minutos aleatórios baseados no ID do pedido para consistência
                // Usa o ID do pedido + a hora como seed para garantir variação entre diferentes horários do mesmo pedido
                const hour = calculatedDate.getHours();
                const minuteSeed = order.id + hour.toString();
                let hash = 0;
                for (let i = 0; i < minuteSeed.length; i++) {
                    const char = minuteSeed.charCodeAt(i);
                    hash = ((hash << 5) - hash) + char;
                    hash |= 0;
                }
                const randomMinute = Math.abs(hash) % 60; // Gera um valor entre 0 e 59
                calculatedDate = setMinutes(calculatedDate, randomMinute);
            }
            return { date: calculatedDate, formatted: format(calculatedDate, "d MMM, HH:mm", { locale: ptBR }) };
        }
        else {
            return fallbackResult;
        }
    }
    catch (error) {
        console.error("Erro ao calcular timestamp do sub-evento:", error);
        return fallbackResult;
    }
}
// Função para gerar estimativa de horário (ex: 13h - 17h)
export function getEstimatedDeliveryWindow(baseDate) {
    if (!baseDate || isNaN(baseDate.getTime()))
        return null;
    try {
        // Gera uma janela de 4 horas, começando entre 5 e 6 horas após a baseDate
        const startOffset = 5 + Math.random();
        const endOffset = startOffset + 4;
        const startHour = format(addHours(baseDate, startOffset), "HH:mm");
        const endHour = format(addHours(baseDate, endOffset), "HH:mm");
        // Garante que o horário final seja depois do inicial
        if (addHours(baseDate, endOffset) > addHours(baseDate, startOffset)) {
            return `${startHour} - ${endHour}`;
        }
        else {
            // Fallback simples se algo der errado
            return format(addHours(baseDate, 6), "HH:mm") + " - " + format(addHours(baseDate, 10), "HH:mm");
        }
    }
    catch (error) {
        console.error("Erro ao calcular janela de entrega estimada:", error);
        return null;
    }
}
// REMOVIDO: getRegionalHubsForTimeline não é mais necessário
// export function getRegionalHubsForTimeline(...) { ... }
// REMOVIDO: getCustomerRegion não é mais usado diretamente fora daqui
// export function getCustomerRegion(...) { ... }
