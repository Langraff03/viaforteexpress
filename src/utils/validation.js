/**
 * Utilitário para validação de dados
 * Ajuda a garantir que os dados estejam no formato correto antes de serem processados
 */

/**
 * Verifica se um valor é uma string não vazia
 * @param {any} value - Valor a ser verificado
 * @returns {boolean} - True se for uma string não vazia, false caso contrário
 */
export function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Verifica se um valor é um número
 * @param {any} value - Valor a ser verificado
 * @returns {boolean} - True se for um número, false caso contrário
 */
export function isNumber(value) {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Verifica se um valor é um número inteiro
 * @param {any} value - Valor a ser verificado
 * @returns {boolean} - True se for um número inteiro, false caso contrário
 */
export function isInteger(value) {
  return Number.isInteger(value);
}

/**
 * Verifica se um valor é um número positivo
 * @param {any} value - Valor a ser verificado
 * @returns {boolean} - True se for um número positivo, false caso contrário
 */
export function isPositiveNumber(value) {
  return isNumber(value) && value > 0;
}

/**
 * Verifica se um valor é um email válido
 * @param {string} value - Valor a ser verificado
 * @returns {boolean} - True se for um email válido, false caso contrário
 */
export function isValidEmail(value) {
  if (!isNonEmptyString(value)) return false;
  
  // Regex para validação básica de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

/**
 * Verifica se um valor é um UUID válido
 * @param {string} value - Valor a ser verificado
 * @returns {boolean} - True se for um UUID válido, false caso contrário
 */
export function isValidUUID(value) {
  if (!isNonEmptyString(value)) return false;
  
  // Regex para validação de UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Verifica se um valor é uma data válida
 * @param {any} value - Valor a ser verificado
 * @returns {boolean} - True se for uma data válida, false caso contrário
 */
export function isValidDate(value) {
  if (value instanceof Date) return !isNaN(value.getTime());
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return !isNaN(date.getTime());
  }
  return false;
}

/**
 * Valida um objeto de pedido
 * @param {Object} order - Objeto de pedido a ser validado
 * @returns {Object} - Objeto com propriedades isValid e errors
 */
export function validateOrder(order) {
  const errors = [];
  
  // Validar ID do pedido
  if (!order.id) {
    errors.push('ID do pedido é obrigatório');
  } else if (!isValidUUID(order.id)) {
    errors.push('ID do pedido deve ser um UUID válido');
  }
  
  // Validar nome do cliente
  if (!isNonEmptyString(order.customer_name)) {
    errors.push('Nome do cliente é obrigatório');
  }
  
  // Validar email do cliente
  if (!isValidEmail(order.customer_email)) {
    errors.push('Email do cliente é inválido');
  }
  
  // Validar valor do pedido
  if (!isInteger(order.amount) || order.amount <= 0) {
    errors.push('Valor do pedido deve ser um número inteiro positivo (em centavos)');
  }
  
  // Validar código de rastreio
  if (!isNonEmptyString(order.tracking_code)) {
    errors.push('Código de rastreio é obrigatório');
  }
  
  // Validar ID do gateway
  if (!isValidUUID(order.gateway_id)) {
    errors.push('ID do gateway deve ser um UUID válido');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valida um objeto de email
 * @param {Object} email - Objeto de email a ser validado
 * @returns {Object} - Objeto com propriedades isValid e errors
 */
export function validateEmail(email) {
  const errors = [];
  
  // Validar remetente
  if (!isNonEmptyString(email.from)) {
    errors.push('Remetente é obrigatório');
  }
  
  // Validar destinatário
  if (!Array.isArray(email.to) || email.to.length === 0) {
    errors.push('Destinatário é obrigatório');
  } else {
    for (const recipient of email.to) {
      if (!isValidEmail(recipient)) {
        errors.push(`Destinatário inválido: ${recipient}`);
      }
    }
  }
  
  // Validar assunto
  if (!isNonEmptyString(email.subject)) {
    errors.push('Assunto é obrigatório');
  }
  
  // Validar conteúdo
  if (!isNonEmptyString(email.html) && !isNonEmptyString(email.text)) {
    errors.push('Conteúdo do email é obrigatório (HTML ou texto)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}