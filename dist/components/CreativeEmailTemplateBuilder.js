import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// src/components/CreativeEmailTemplateBuilder.tsx
import { useState, useCallback } from 'react';
import { Plus, Eye, Code, Palette, Type, Image, MousePointer, Layers, Move, Trash2, Copy, Smartphone, Monitor, AlignLeft, MoreVertical } from 'lucide-react';
const CreativeEmailTemplateBuilder = ({ onSave, onPreview }) => {
    const [template, setTemplate] = useState({
        id: Date.now().toString(),
        name: 'Meu Template',
        blocks: [],
        globalStyles: {
            backgroundColor: '#f6f9fc',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            primaryColor: '#4f46e5',
            secondaryColor: '#6366f1',
            containerWidth: '600px'
        }
    });
    const [selectedBlock, setSelectedBlock] = useState(null);
    const [previewMode, setPreviewMode] = useState('desktop');
    const [showCode, setShowCode] = useState(false);
    const blockTypes = [
        { type: 'header', icon: Type, label: 'Cabeçalho', color: 'bg-blue-500' },
        { type: 'text', icon: AlignLeft, label: 'Texto', color: 'bg-green-500' },
        { type: 'button', icon: MousePointer, label: 'Botão', color: 'bg-purple-500' },
        { type: 'image', icon: Image, label: 'Imagem', color: 'bg-pink-500' },
        { type: 'spacer', icon: Move, label: 'Espaço', color: 'bg-gray-500' },
        { type: 'divider', icon: MoreVertical, label: 'Divisor', color: 'bg-yellow-500' },
        { type: 'columns', icon: Layers, label: 'Colunas', color: 'bg-indigo-500' }
    ];
    const addBlock = (type) => {
        const newBlock = {
            id: Date.now().toString(),
            type,
            content: getDefaultContent(type),
            styles: getDefaultStyles(type)
        };
        setTemplate(prev => ({
            ...prev,
            blocks: [...prev.blocks, newBlock]
        }));
    };
    const getDefaultContent = (type) => {
        switch (type) {
            case 'header':
                return { text: 'VIA FORTE EXPRESS', subtitle: 'Oferta Especial' };
            case 'text':
                return { text: 'Olá {{nome}}, temos uma oferta especial para você!' };
            case 'button':
                return { text: 'Aproveitar Oferta', url: '{{link_da_oferta}}' };
            case 'image':
                return { src: '', alt: 'Imagem', url: '' };
            case 'spacer':
                return { height: '30px' };
            case 'divider':
                return { thickness: '1px', color: '#e5e7eb' };
            case 'columns':
                return { columns: [{ text: 'Coluna 1' }, { text: 'Coluna 2' }] };
            default:
                return {};
        }
    };
    const getDefaultStyles = (type) => {
        switch (type) {
            case 'header':
                return {
                    backgroundColor: 'linear-gradient(135deg, {{primaryColor}}, {{secondaryColor}})',
                    textAlign: 'center',
                    padding: '40px 20px',
                    color: '#ffffff',
                    fontSize: '32px',
                    fontWeight: 'bold'
                };
            case 'text':
                return {
                    padding: '20px',
                    fontSize: '16px',
                    lineHeight: '1.6',
                    color: '#4b5563'
                };
            case 'button':
                return {
                    textAlign: 'center',
                    padding: '30px',
                    buttonBackground: '{{primaryColor}}',
                    buttonColor: '#ffffff',
                    buttonRadius: '8px',
                    buttonPadding: '12px 24px'
                };
            default:
                return { padding: '10px' };
        }
    };
    const updateBlock = (blockId, updates) => {
        setTemplate(prev => ({
            ...prev,
            blocks: prev.blocks.map(block => block.id === blockId ? { ...block, ...updates } : block)
        }));
    };
    const deleteBlock = (blockId) => {
        setTemplate(prev => ({
            ...prev,
            blocks: prev.blocks.filter(block => block.id !== blockId)
        }));
    };
    const duplicateBlock = (blockId) => {
        const block = template.blocks.find(b => b.id === blockId);
        if (block) {
            const newBlock = { ...block, id: Date.now().toString() };
            setTemplate(prev => ({
                ...prev,
                blocks: [...prev.blocks, newBlock]
            }));
        }
    };
    const moveBlock = (blockId, direction) => {
        const blocks = [...template.blocks];
        const index = blocks.findIndex(b => b.id === blockId);
        if (direction === 'up' && index > 0) {
            [blocks[index], blocks[index - 1]] = [blocks[index - 1], blocks[index]];
        }
        else if (direction === 'down' && index < blocks.length - 1) {
            [blocks[index], blocks[index + 1]] = [blocks[index + 1], blocks[index]];
        }
        setTemplate(prev => ({ ...prev, blocks }));
    };
    const generateHTML = useCallback(() => {
        let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Template</title>
</head>
<body style="margin:0;padding:0;background:${template.globalStyles.backgroundColor};font-family:${template.globalStyles.fontFamily};">
  <div style="max-width:${template.globalStyles.containerWidth};margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
`;
        template.blocks.forEach(block => {
            html += generateBlockHTML(block);
        });
        html += `
  </div>
</body>
</html>`;
        return html.replace(/\{\{primaryColor\}\}/g, template.globalStyles.primaryColor)
            .replace(/\{\{secondaryColor\}\}/g, template.globalStyles.secondaryColor);
    }, [template]);
    const generateBlockHTML = (block) => {
        switch (block.type) {
            case 'header':
                return `
<div style="background:${block.styles.backgroundColor};padding:${block.styles.padding};text-align:${block.styles.textAlign};">
  <h1 style="color:${block.styles.color};font-size:${block.styles.fontSize};font-weight:${block.styles.fontWeight};margin:0;">${block.content.text}</h1>
  ${block.content.subtitle ? `<p style="color:rgba(255,255,255,0.9);margin:10px 0 0;font-size:16px;">${block.content.subtitle}</p>` : ''}
</div>`;
            case 'text':
                return `
<div style="padding:${block.styles.padding};">
  <p style="font-size:${block.styles.fontSize};line-height:${block.styles.lineHeight};color:${block.styles.color};margin:0;">${block.content.text}</p>
</div>`;
            case 'button':
                return `
<div style="text-align:${block.styles.textAlign};padding:${block.styles.padding};">
  <a href="${block.content.url}" style="display:inline-block;background:${block.styles.buttonBackground};color:${block.styles.buttonColor};padding:${block.styles.buttonPadding};border-radius:${block.styles.buttonRadius};text-decoration:none;font-weight:600;">${block.content.text}</a>
</div>`;
            case 'image':
                return `
<div style="text-align:center;padding:${block.styles.padding};">
  ${block.content.url ? `<a href="${block.content.url}">` : ''}
  <img src="${block.content.src}" alt="${block.content.alt}" style="max-width:100%;height:auto;" />
  ${block.content.url ? '</a>' : ''}
</div>`;
            case 'spacer':
                return `<div style="height:${block.content.height};"></div>`;
            case 'divider':
                return `<hr style="border:none;border-top:${block.content.thickness} solid ${block.content.color};margin:20px 0;" />`;
            case 'columns':
                return `
<div style="display:table;width:100%;padding:${block.styles.padding};">
  ${block.content.columns.map((col) => `
    <div style="display:table-cell;width:${100 / block.content.columns.length}%;padding:10px;vertical-align:top;">
      <p style="margin:0;font-size:16px;color:#4b5563;">${col.text}</p>
    </div>
  `).join('')}
</div>`;
            default:
                return '';
        }
    };
    return (_jsxs("div", { className: "bg-white rounded-lg shadow-lg border border-gray-200", children: [_jsxs("div", { className: "flex items-center justify-between p-6 border-b border-gray-200", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Palette, { className: "w-6 h-6 text-purple-600" }), _jsxs("div", { children: [_jsx("h3", { className: "text-xl font-semibold text-gray-900", children: "Editor de Template Criativo" }), _jsx("p", { className: "text-sm text-gray-500", children: "Arraste e solte elementos para criar seu email" })] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("div", { className: "flex bg-gray-100 rounded-lg p-1", children: [_jsx("button", { onClick: () => setPreviewMode('desktop'), className: `p-2 rounded ${previewMode === 'desktop' ? 'bg-white shadow' : ''}`, children: _jsx(Monitor, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => setPreviewMode('mobile'), className: `p-2 rounded ${previewMode === 'mobile' ? 'bg-white shadow' : ''}`, children: _jsx(Smartphone, { className: "w-4 h-4" }) })] }), _jsxs("button", { onClick: () => setShowCode(!showCode), className: "flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700", children: [_jsx(Code, { className: "w-4 h-4" }), showCode ? 'Visual' : 'Código'] }), _jsxs("button", { onClick: () => onPreview(generateHTML()), className: "flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700", children: [_jsx(Eye, { className: "w-4 h-4" }), "Preview"] })] })] }), _jsxs("div", { className: "flex", children: [_jsxs("div", { className: "w-64 border-r border-gray-200 p-4", children: [_jsxs("div", { className: "mb-6", children: [_jsx("h4", { className: "text-sm font-medium text-gray-700 mb-3", children: "Configura\u00E7\u00F5es Globais" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-xs text-gray-600 mb-1", children: "Nome do Template" }), _jsx("input", { type: "text", value: template.name, onChange: (e) => setTemplate(prev => ({ ...prev, name: e.target.value })), className: "w-full px-2 py-1 text-sm border border-gray-300 rounded" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs text-gray-600 mb-1", children: "Cor Principal" }), _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "color", value: template.globalStyles.primaryColor, onChange: (e) => setTemplate(prev => ({
                                                                    ...prev,
                                                                    globalStyles: { ...prev.globalStyles, primaryColor: e.target.value }
                                                                })), className: "w-8 h-6 rounded border" }), _jsx("input", { type: "text", value: template.globalStyles.primaryColor, onChange: (e) => setTemplate(prev => ({
                                                                    ...prev,
                                                                    globalStyles: { ...prev.globalStyles, primaryColor: e.target.value }
                                                                })), className: "flex-1 px-2 py-1 text-xs border border-gray-300 rounded" })] })] })] })] }), _jsxs("div", { children: [_jsx("h4", { className: "text-sm font-medium text-gray-700 mb-3", children: "Adicionar Elementos" }), _jsx("div", { className: "grid grid-cols-2 gap-2", children: blockTypes.map((blockType) => {
                                            const Icon = blockType.icon;
                                            return (_jsxs("button", { onClick: () => addBlock(blockType.type), className: `flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gray-50 border border-gray-200 hover:border-gray-300 transition-colors`, children: [_jsx("div", { className: `w-8 h-8 rounded-lg ${blockType.color} flex items-center justify-center`, children: _jsx(Icon, { className: "w-4 h-4 text-white" }) }), _jsx("span", { className: "text-xs text-gray-600", children: blockType.label })] }, blockType.type));
                                        }) })] }), _jsxs("div", { className: "mt-6", children: [_jsx("h4", { className: "text-sm font-medium text-gray-700 mb-3", children: "Templates Prontos" }), _jsxs("div", { className: "space-y-2", children: [_jsx("button", { onClick: () => loadTemplate('modern'), className: "w-full p-2 text-left text-sm bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded hover:from-blue-600 hover:to-purple-700", children: "\uD83D\uDE80 Moderno" }), _jsx("button", { onClick: () => loadTemplate('minimal'), className: "w-full p-2 text-left text-sm bg-gray-100 hover:bg-gray-200 rounded", children: "\u2728 Minimalista" }), _jsx("button", { onClick: () => loadTemplate('promotional'), className: "w-full p-2 text-left text-sm bg-gradient-to-r from-red-500 to-pink-600 text-white rounded hover:from-red-600 hover:to-pink-700", children: "\uD83D\uDD25 Promocional" })] })] })] }), _jsx("div", { className: "flex-1 p-6", children: showCode ? (_jsx("textarea", { value: generateHTML(), onChange: () => { }, className: "w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm", readOnly: true })) : (_jsx("div", { className: `${previewMode === 'mobile' ? 'max-w-xs' : 'max-w-2xl'} mx-auto`, children: _jsxs("div", { className: "border border-gray-300 rounded-lg overflow-hidden bg-white shadow-lg", children: [template.blocks.map((block, index) => (_jsxs("div", { className: `relative group ${selectedBlock === block.id ? 'ring-2 ring-purple-500' : ''}`, onClick: () => setSelectedBlock(block.id), children: [_jsxs("div", { className: "absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1 z-10", children: [_jsx("button", { onClick: (e) => { e.stopPropagation(); moveBlock(block.id, 'up'); }, disabled: index === 0, className: "p-1 bg-white rounded shadow border disabled:opacity-50", children: "\u2191" }), _jsx("button", { onClick: (e) => { e.stopPropagation(); moveBlock(block.id, 'down'); }, disabled: index === template.blocks.length - 1, className: "p-1 bg-white rounded shadow border disabled:opacity-50", children: "\u2193" }), _jsx("button", { onClick: (e) => { e.stopPropagation(); duplicateBlock(block.id); }, className: "p-1 bg-white rounded shadow border", children: _jsx(Copy, { className: "w-3 h-3" }) }), _jsx("button", { onClick: (e) => { e.stopPropagation(); deleteBlock(block.id); }, className: "p-1 bg-white rounded shadow border text-red-600", children: _jsx(Trash2, { className: "w-3 h-3" }) })] }), _jsx("div", { dangerouslySetInnerHTML: { __html: generateBlockHTML(block) } })] }, block.id))), template.blocks.length === 0 && (_jsxs("div", { className: "p-12 text-center text-gray-500", children: [_jsx(Plus, { className: "w-12 h-12 mx-auto mb-4 text-gray-300" }), _jsx("p", { children: "Comece adicionando elementos do painel lateral" })] }))] }) })) }), selectedBlock && (_jsx("div", { className: "w-64 border-l border-gray-200 p-4", children: _jsx(BlockEditor, { block: template.blocks.find(b => b.id === selectedBlock), onUpdate: (updates) => updateBlock(selectedBlock, updates) }) }))] }), _jsxs("div", { className: "flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50", children: [_jsxs("div", { className: "text-sm text-gray-500", children: [template.blocks.length, " elementos \u2022 Template: ", template.name] }), _jsx("div", { className: "flex gap-3", children: _jsx("button", { onClick: () => onSave(template), className: "px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700", children: "Salvar Template" }) })] })] }));
    function loadTemplate(templateType) {
        // Templates pré-definidos mais elaborados
        const templates = {
            modern: {
                ...template,
                name: 'Template Moderno',
                blocks: [
                    {
                        id: '1',
                        type: 'header',
                        content: { text: 'VIA FORTE EXPRESS', subtitle: '🚀 Sua parceira em logística' },
                        styles: getDefaultStyles('header')
                    },
                    {
                        id: '2',
                        type: 'text',
                        content: { text: 'Olá {{nome}}! 👋\n\nTemos uma oferta imperdível especialmente para você!' },
                        styles: getDefaultStyles('text')
                    },
                    {
                        id: '3',
                        type: 'button',
                        content: { text: '🎯 Aproveitar Agora', url: '{{link_da_oferta}}' },
                        styles: getDefaultStyles('button')
                    }
                ]
            },
            // Outros templates...
        };
        if (templates[templateType]) {
            setTemplate(templates[templateType]);
        }
    }
};
// Componente para editar propriedades do bloco selecionado
const BlockEditor = ({ block, onUpdate }) => {
    return (_jsxs("div", { children: [_jsxs("h4", { className: "text-sm font-medium text-gray-700 mb-3", children: ["Propriedades - ", block.type] }), _jsxs("div", { className: "space-y-3", children: [block.type === 'text' && (_jsxs("div", { children: [_jsx("label", { className: "block text-xs text-gray-600 mb-1", children: "Texto" }), _jsx("textarea", { value: block.content.text, onChange: (e) => onUpdate({ content: { ...block.content, text: e.target.value } }), className: "w-full px-2 py-1 text-sm border border-gray-300 rounded", rows: 3 })] })), block.type === 'button' && (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx("label", { className: "block text-xs text-gray-600 mb-1", children: "Texto do Bot\u00E3o" }), _jsx("input", { type: "text", value: block.content.text, onChange: (e) => onUpdate({ content: { ...block.content, text: e.target.value } }), className: "w-full px-2 py-1 text-sm border border-gray-300 rounded" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs text-gray-600 mb-1", children: "URL" }), _jsx("input", { type: "text", value: block.content.url, onChange: (e) => onUpdate({ content: { ...block.content, url: e.target.value } }), className: "w-full px-2 py-1 text-sm border border-gray-300 rounded" })] })] })), _jsxs("div", { children: [_jsx("label", { className: "block text-xs text-gray-600 mb-1", children: "Padding" }), _jsx("input", { type: "text", value: block.styles.padding, onChange: (e) => onUpdate({ styles: { ...block.styles, padding: e.target.value } }), className: "w-full px-2 py-1 text-sm border border-gray-300 rounded", placeholder: "20px" })] })] })] }));
};
export default CreativeEmailTemplateBuilder;
