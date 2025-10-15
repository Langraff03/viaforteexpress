export function validateEmailTemplate(template) {
    const result = {
        isValid: true,
        errors: [],
        warnings: [],
        suggestions: []
    };
    // Se não há template, retorna inválido
    if (!template || template.trim().length === 0) {
        result.isValid = false;
        result.errors.push('Template não pode estar vazio');
        return result;
    }
    // Verifica se é HTML válido básico
    if (!template.includes('<html>') && !template.includes('<!DOCTYPE')) {
        result.warnings.push('Template não parece ter estrutura HTML completa');
        result.suggestions.push('Adicione <!DOCTYPE html> e tags <html>, <head>, <body>');
    }
    // Encontrar todas as variáveis no template
    const variableRegex = /\{\{(\w+)\}\}/g;
    const foundVariables = new Set();
    let match;
    while ((match = variableRegex.exec(template)) !== null) {
        foundVariables.add(match[1]);
    }
    // Variáveis conhecidas do sistema
    const knownVariables = {
        nome: foundVariables.has('nome'),
        oferta: foundVariables.has('oferta'),
        desconto: foundVariables.has('desconto'),
        link: foundVariables.has('link'),
        descricao: foundVariables.has('descricao'),
        empresa: foundVariables.has('empresa')
    };
    // Verificações obrigatórias
    if (!knownVariables.nome) {
        result.isValid = false;
        result.errors.push('Variável {{nome}} é obrigatória para personalização');
    }
    if (!knownVariables.oferta) {
        result.warnings.push('Recomendado incluir {{oferta}} para mostrar o nome da campanha');
    }
    // Verificar variáveis desconhecidas
    const unknownVariables = Array.from(foundVariables).filter(variable => !Object.keys(knownVariables).includes(variable));
    if (unknownVariables.length > 0) {
        result.warnings.push(`Variáveis não reconhecidas encontradas: ${unknownVariables.map(v => `{{${v}}}`).join(', ')}`);
        result.suggestions.push('Verifique se os nomes das variáveis estão corretos');
    }
    // Verificações de boas práticas
    if (!template.includes('href=') && knownVariables.link) {
        result.warnings.push('Variável {{link}} encontrada mas nenhum link HTML detectado');
        result.suggestions.push('Use <a href="{{link}}">Texto do Link</a> para criar links clicáveis');
    }
    // Verificar se há CSS inline
    if (!template.includes('style=') && !template.includes('<style>')) {
        result.suggestions.push('Considere adicionar CSS inline para melhor compatibilidade com clientes de email');
    }
    // Verificar largura responsiva
    if (template.includes('width="') && !template.includes('max-width')) {
        result.suggestions.push('Use max-width ao invés de width fixo para responsividade');
    }
    // Verificar se há alt text em imagens
    const imgTags = template.match(/<img[^>]*>/g);
    if (imgTags) {
        const imgsWithoutAlt = imgTags.filter(img => !img.includes('alt='));
        if (imgsWithoutAlt.length > 0) {
            result.suggestions.push('Adicione texto alternativo (alt) nas imagens para acessibilidade');
        }
    }
    // Verificar codificação de caracteres
    if (!template.includes('charset=') && !template.includes('UTF-8')) {
        result.suggestions.push('Inclua <meta charset="utf-8"> no cabeçalho para suporte a acentos');
    }
    // Estatísticas do template
    const variableCount = foundVariables.size;
    const templateLength = template.length;
    if (variableCount === 0) {
        result.warnings.push('Nenhuma variável de personalização encontrada');
        result.suggestions.push('Adicione pelo menos {{nome}} para personalizar o email');
    }
    if (templateLength < 100) {
        result.warnings.push('Template muito curto - pode não ser efetivo');
    }
    else if (templateLength > 50000) {
        result.warnings.push('Template muito longo - pode ser cortado por alguns clientes de email');
    }
    return result;
}
export function getTemplateVariables(template) {
    const variableRegex = /\{\{(\w+)\}\}/g;
    const variables = [];
    let match;
    while ((match = variableRegex.exec(template)) !== null) {
        if (!variables.includes(match[1])) {
            variables.push(match[1]);
        }
    }
    return variables;
}
export function replaceTemplateVariables(template, variables) {
    let result = template;
    Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        result = result.replace(regex, value || '');
    });
    return result;
}
export function getValidationSummary(validation) {
    const { isValid, errors, warnings, suggestions } = validation;
    let summary = '';
    if (isValid) {
        summary += '✅ Template válido\n\n';
    }
    else {
        summary += '❌ Template com problemas\n\n';
    }
    if (errors.length > 0) {
        summary += `🚫 ERROS (${errors.length}):\n`;
        errors.forEach(error => summary += `• ${error}\n`);
        summary += '\n';
    }
    if (warnings.length > 0) {
        summary += `⚠️ AVISOS (${warnings.length}):\n`;
        warnings.forEach(warning => summary += `• ${warning}\n`);
        summary += '\n';
    }
    if (suggestions.length > 0) {
        summary += `💡 SUGESTÕES (${suggestions.length}):\n`;
        suggestions.forEach(suggestion => summary += `• ${suggestion}\n`);
    }
    return summary.trim();
}
