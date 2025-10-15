/**
 * Utilitário para geração e validação de tokens
 * Garante consistência entre backend (Node.js) e frontend (navegador)
 */
// No ambiente do navegador, não precisamos importar Buffer
// Vamos usar apenas as funções nativas do navegador para codificação/decodificação
/**
 * Gera um token a partir de dados, funcionando tanto no Node.js quanto no navegador
 * @param {string} data - Dados a serem codificados
 * @returns {string} - Token codificado em base64
 */
export function generateToken(data) {
    // Simplificando para usar apenas a função do navegador
    // No ambiente Netlify, sempre estaremos no navegador
    return btoa(data);
}
/**
 * Decodifica um token, funcionando tanto no Node.js quanto no navegador
 * @param {string} token - Token codificado em base64
 * @returns {string} - Dados decodificados
 */
export function decodeToken(token) {
    // Simplificando para usar apenas a função do navegador
    // No ambiente Netlify, sempre estaremos no navegador
    return atob(token);
}
/**
 * Gera um token para nota fiscal a partir do ID do pedido e código de rastreio
 * @param {string} orderId - ID do pedido
 * @param {string} trackingCode - Código de rastreio
 * @returns {string} - Token codificado em base64
 */
export function generateInvoiceToken(orderId, trackingCode) {
    return generateToken(`${orderId}-${trackingCode}`);
}
/**
 * Decodifica um token de nota fiscal
 * @param {string} token - Token codificado em base64
 * @returns {Object} - Objeto com orderId e trackingCode
 */
export function decodeInvoiceToken(token) {
    try {
        const decoded = decodeToken(token);
        const [orderId, trackingCode] = decoded.split('-');
        if (!orderId || !trackingCode) {
            throw new Error('Token de nota fiscal inválido');
        }
        return { orderId, trackingCode };
    }
    catch (error) {
        throw new Error(`Erro ao decodificar token: ${error.message}`);
    }
}
/**
 * Verifica se um token é válido
 * @param {string} token - Token a ser verificado
 * @returns {boolean} - True se o token for válido, false caso contrário
 */
export function isValidToken(token) {
    try {
        // Tenta decodificar o token
        decodeToken(token);
        return true;
    }
    catch (error) {
        return false;
    }
}
/**
 * Verifica se um token de nota fiscal é válido
 * @param {string} token - Token a ser verificado
 * @returns {boolean} - True se o token for válido, false caso contrário
 */
export function isValidInvoiceToken(token) {
    try {
        // Tenta decodificar o token de nota fiscal
        decodeInvoiceToken(token);
        return true;
    }
    catch (error) {
        return false;
    }
}
