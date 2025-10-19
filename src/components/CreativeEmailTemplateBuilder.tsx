// src/components/CreativeEmailTemplateBuilder.tsx

import React, { useState, useCallback } from 'react';
import { 
  Plus, Eye, Code, Palette, Type, Image, 
  MousePointer, Layers, Move, Trash2, Copy,
  Smartphone, Monitor, AlignCenter, AlignLeft, AlignRight,
  Bold, Italic, Underline, MoreVertical
} from 'lucide-react';

interface EmailBlock {
  id: string;
  type: 'header' | 'text' | 'button' | 'image' | 'spacer' | 'divider' | 'columns';
  content: any;
  styles: any;
}

interface CreativeEmailTemplateBuilderProps {
  onSave: (template: EmailTemplate) => void;
  onPreview: (html: string) => void;
}

interface EmailTemplate {
  id: string;
  name: string;
  blocks: EmailBlock[];
  globalStyles: {
    backgroundColor: string;
    fontFamily: string;
    primaryColor: string;
    secondaryColor: string;
    containerWidth: string;
  };
}

const CreativeEmailTemplateBuilder: React.FC<CreativeEmailTemplateBuilderProps> = ({
  onSave,
  onPreview
}) => {
  const [template, setTemplate] = useState<EmailTemplate>({
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

  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
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

  const addBlock = (type: EmailBlock['type']) => {
    const newBlock: EmailBlock = {
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

  const getDefaultContent = (type: string) => {
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

  const getDefaultStyles = (type: string) => {
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

  const updateBlock = (blockId: string, updates: Partial<EmailBlock>) => {
    setTemplate(prev => ({
      ...prev,
      blocks: prev.blocks.map(block => 
        block.id === blockId ? { ...block, ...updates } : block
      )
    }));
  };

  const deleteBlock = (blockId: string) => {
    setTemplate(prev => ({
      ...prev,
      blocks: prev.blocks.filter(block => block.id !== blockId)
    }));
  };

  const duplicateBlock = (blockId: string) => {
    const block = template.blocks.find(b => b.id === blockId);
    if (block) {
      const newBlock = { ...block, id: Date.now().toString() };
      setTemplate(prev => ({
        ...prev,
        blocks: [...prev.blocks, newBlock]
      }));
    }
  };

  const moveBlock = (blockId: string, direction: 'up' | 'down') => {
    const blocks = [...template.blocks];
    const index = blocks.findIndex(b => b.id === blockId);
    
    if (direction === 'up' && index > 0) {
      [blocks[index], blocks[index - 1]] = [blocks[index - 1], blocks[index]];
    } else if (direction === 'down' && index < blocks.length - 1) {
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

  const generateBlockHTML = (block: EmailBlock) => {
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
  ${block.content.columns.map((col: any) => `
    <div style="display:table-cell;width:${100/block.content.columns.length}%;padding:10px;vertical-align:top;">
      <p style="margin:0;font-size:16px;color:#4b5563;">${col.text}</p>
    </div>
  `).join('')}
</div>`;

      default:
        return '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Palette className="w-6 h-6 text-purple-600" />
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Editor de Template Criativo</h3>
            <p className="text-sm text-gray-500">Arraste e solte elementos para criar seu email</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setPreviewMode('desktop')}
              className={`p-2 rounded ${previewMode === 'desktop' ? 'bg-white shadow' : ''}`}
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPreviewMode('mobile')}
              className={`p-2 rounded ${previewMode === 'mobile' ? 'bg-white shadow' : ''}`}
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>
          
          <button
            onClick={() => setShowCode(!showCode)}
            className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            <Code className="w-4 h-4" />
            {showCode ? 'Visual' : 'Código'}
          </button>
          
          <button
            onClick={() => onPreview(generateHTML())}
            className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar - Elementos */}
        <div className="w-64 border-r border-gray-200 p-4">
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Configurações Globais</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Nome do Template</label>
                <input
                  type="text"
                  value={template.name}
                  onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-600 mb-1">Cor Principal</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={template.globalStyles.primaryColor}
                    onChange={(e) => setTemplate(prev => ({
                      ...prev,
                      globalStyles: { ...prev.globalStyles, primaryColor: e.target.value }
                    }))}
                    className="w-8 h-6 rounded border"
                  />
                  <input
                    type="text"
                    value={template.globalStyles.primaryColor}
                    onChange={(e) => setTemplate(prev => ({
                      ...prev,
                      globalStyles: { ...prev.globalStyles, primaryColor: e.target.value }
                    }))}
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Adicionar Elementos</h4>
            <div className="grid grid-cols-2 gap-2">
              {blockTypes.map((blockType) => {
                const Icon = blockType.icon;
                return (
                  <button
                    key={blockType.type}
                    onClick={() => addBlock(blockType.type as EmailBlock['type'])}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gray-50 border border-gray-200 hover:border-gray-300 transition-colors`}
                  >
                    <div className={`w-8 h-8 rounded-lg ${blockType.color} flex items-center justify-center`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xs text-gray-600">{blockType.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Templates Pré-definidos */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Templates Prontos</h4>
            <div className="space-y-2">
              <button
                onClick={() => loadTemplate('modern')}
                className="w-full p-2 text-left text-sm bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded hover:from-blue-600 hover:to-purple-700"
              >
                🚀 Moderno
              </button>
              <button
                onClick={() => loadTemplate('minimal')}
                className="w-full p-2 text-left text-sm bg-gray-100 hover:bg-gray-200 rounded"
              >
                ✨ Minimalista
              </button>
              <button
                onClick={() => loadTemplate('promotional')}
                className="w-full p-2 text-left text-sm bg-gradient-to-r from-red-500 to-pink-600 text-white rounded hover:from-red-600 hover:to-pink-700"
              >
                🔥 Promocional
              </button>
            </div>
          </div>
        </div>

        {/* Main Editor */}
        <div className="flex-1 p-6">
          {showCode ? (
            <textarea
              value={generateHTML()}
              onChange={() => {}} // Read-only for now
              className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm"
              readOnly
            />
          ) : (
            <div className={`${previewMode === 'mobile' ? 'max-w-xs' : 'max-w-2xl'} mx-auto`}>
              <div className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-lg">
                {template.blocks.map((block, index) => (
                  <div
                    key={block.id}
                    className={`relative group ${selectedBlock === block.id ? 'ring-2 ring-purple-500' : ''}`}
                    onClick={() => setSelectedBlock(block.id)}
                  >
                    {/* Block Controls */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1 z-10">
                      <button
                        onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'up'); }}
                        disabled={index === 0}
                        className="p-1 bg-white rounded shadow border disabled:opacity-50"
                      >
                        ↑
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'down'); }}
                        disabled={index === template.blocks.length - 1}
                        className="p-1 bg-white rounded shadow border disabled:opacity-50"
                      >
                        ↓
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); duplicateBlock(block.id); }}
                        className="p-1 bg-white rounded shadow border"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }}
                        className="p-1 bg-white rounded shadow border text-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Block Content */}
                    <div dangerouslySetInnerHTML={{ __html: generateBlockHTML(block) }} />
                  </div>
                ))}

                {template.blocks.length === 0 && (
                  <div className="p-12 text-center text-gray-500">
                    <Plus className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Comece adicionando elementos do painel lateral</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Properties Panel */}
        {selectedBlock && (
          <div className="w-64 border-l border-gray-200 p-4">
            <BlockEditor
              block={template.blocks.find(b => b.id === selectedBlock)!}
              onUpdate={(updates) => updateBlock(selectedBlock, updates)}
            />
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
        <div className="text-sm text-gray-500">
          {template.blocks.length} elementos • Template: {template.name}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => onSave(template)}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Salvar Template
          </button>
        </div>
      </div>
    </div>
  );

  function loadTemplate(templateType: string) {
    // Templates pré-definidos mais elaborados
    const templates = {
      modern: {
        ...template,
        name: 'Template Moderno',
        blocks: [
          {
            id: '1',
            type: 'header' as const,
            content: { text: 'VIA FORTE EXPRESS', subtitle: '🚀 Sua parceira em logística' },
            styles: getDefaultStyles('header')
          },
          {
            id: '2', 
            type: 'text' as const,
            content: { text: 'Olá {{nome}}! 👋\n\nTemos uma oferta imperdível especialmente para você!' },
            styles: getDefaultStyles('text')
          },
          {
            id: '3',
            type: 'button' as const,
            content: { text: '🎯 Aproveitar Agora', url: '{{link_da_oferta}}' },
            styles: getDefaultStyles('button')
          }
        ]
      },
      // Outros templates...
    };

    if (templates[templateType as keyof typeof templates]) {
      setTemplate(templates[templateType as keyof typeof templates]);
    }
  }
};

// Componente para editar propriedades do bloco selecionado
const BlockEditor: React.FC<{
  block: EmailBlock;
  onUpdate: (updates: Partial<EmailBlock>) => void;
}> = ({ block, onUpdate }) => {
  return (
    <div>
      <h4 className="text-sm font-medium text-gray-700 mb-3">
        Propriedades - {block.type}
      </h4>
      
      <div className="space-y-3">
        {block.type === 'text' && (
          <div>
            <label className="block text-xs text-gray-600 mb-1">Texto</label>
            <textarea
              value={block.content.text}
              onChange={(e) => onUpdate({ content: { ...block.content, text: e.target.value }})}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              rows={3}
            />
          </div>
        )}

        {block.type === 'button' && (
          <>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Texto do Botão</label>
              <input
                type="text"
                value={block.content.text}
                onChange={(e) => onUpdate({ content: { ...block.content, text: e.target.value }})}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">URL</label>
              <input
                type="text"
                value={block.content.url}
                onChange={(e) => onUpdate({ content: { ...block.content, url: e.target.value }})}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
          </>
        )}

        {/* Estilos comuns */}
        <div>
          <label className="block text-xs text-gray-600 mb-1">Padding</label>
          <input
            type="text"
            value={block.styles.padding}
            onChange={(e) => onUpdate({ styles: { ...block.styles, padding: e.target.value }})}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            placeholder="20px"
          />
        </div>
      </div>
    </div>
  );
};

export default CreativeEmailTemplateBuilder;