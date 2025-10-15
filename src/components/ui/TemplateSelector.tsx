import React, { useState, useMemo } from 'react';
import { Search, Eye, Check, Star, Tag, FileText, Palette, Heart, Zap, Home, GraduationCap, Stethoscope } from 'lucide-react';
import { EMAIL_TEMPLATES, TEMPLATE_CATEGORIES, getTemplatesByCategory, searchTemplates, EmailTemplate } from '../../lib/emailTemplates';

interface TemplateSelectorProps {
  onTemplateSelect: (template: EmailTemplate) => void;
  selectedTemplateId?: string;
  className?: string;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  onTemplateSelect,
  selectedTemplateId,
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);

  // Filtrar templates baseado na busca e categoria
  const filteredTemplates = useMemo(() => {
    let templates = getTemplatesByCategory(selectedCategory);

    if (searchQuery.trim()) {
      templates = searchTemplates(searchQuery);
    }

    return templates;
  }, [selectedCategory, searchQuery]);

  const handleTemplateClick = (template: EmailTemplate) => {
    onTemplateSelect(template);
  };

  const handlePreview = (template: EmailTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewTemplate(template);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Ofertas': return <Tag className="w-4 h-4" />;
      case 'Lançamentos': return <Zap className="w-4 h-4" />;
      case 'Saúde': return <Stethoscope className="w-4 h-4" />;
      case 'Imóveis': return <Home className="w-4 h-4" />;
      case 'Educação': return <GraduationCap className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Ofertas': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Lançamentos': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Saúde': return 'bg-green-100 text-green-800 border-green-200';
      case 'Imóveis': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Educação': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Header com Busca */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          {/* Campo de Busca */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Botão de Preview */}
          {previewTemplate && (
            <button
              onClick={() => setPreviewTemplate(null)}
              className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
            >
              <Eye className="w-4 h-4 mr-2" />
              Fechar Preview
            </button>
          )}
        </div>

        {/* Categorias */}
        <div className="flex flex-wrap gap-2">
          {TEMPLATE_CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center ${
                selectedCategory === category
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {getCategoryIcon(category)}
              <span className="ml-2">{category}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Resultados da Busca */}
      {searchQuery && (
        <div className="mb-4 text-sm text-gray-600">
          {filteredTemplates.length} template(s) encontrado(s) para "{searchQuery}"
        </div>
      )}

      {/* Grid de Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            onClick={() => handleTemplateClick(template)}
            className={`relative bg-white border-2 rounded-xl p-6 cursor-pointer transition-all duration-200 hover:shadow-lg transform hover:-translate-y-1 ${
              selectedTemplateId === template.id
                ? 'border-indigo-500 bg-indigo-50 shadow-md'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {/* Badge de Seleção */}
            {selectedTemplateId === template.id && (
              <div className="absolute -top-2 -right-2 bg-indigo-600 text-white rounded-full p-1">
                <Check className="w-4 h-4" />
              </div>
            )}

            {/* Header do Template */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(template.category)}`}>
                  {getCategoryIcon(template.category)}
                  <span className="ml-1">{template.category}</span>
                </div>
              </div>

              <button
                onClick={(e) => handlePreview(template, e)}
                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Visualizar template"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>

            {/* Descrição */}
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {template.description}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1 mb-4">
              {template.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
              {template.tags.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  +{template.tags.length - 3}
                </span>
              )}
            </div>

            {/* Variáveis */}
            <div className="text-xs text-gray-500">
              <span className="font-medium">Variáveis:</span> {template.variables.join(', ')}
            </div>

            {/* Ações */}
            <div className="mt-4 flex justify-between items-center">
              <div className="flex items-center text-xs text-gray-500">
                <Star className="w-3 h-3 mr-1 text-yellow-400" />
                <span>Popular</span>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleTemplateClick(template);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedTemplateId === template.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                }`}
              >
                {selectedTemplateId === template.id ? 'Selecionado' : 'Selecionar'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Estado Vazio */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <Palette className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum template encontrado
          </h3>
          <p className="text-gray-600">
            {searchQuery
              ? `Tente ajustar sua busca para "${searchQuery}"`
              : 'Selecione uma categoria diferente'
            }
          </p>
        </div>
      )}

      {/* Modal de Preview */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {previewTemplate.name}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {previewTemplate.description}
                </p>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Eye className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="bg-gray-50 rounded-lg p-4 border">
                <div
                  dangerouslySetInnerHTML={{
                    __html: previewTemplate.html
                      .replace(/{{nome}}/g, 'João Silva')
                      .replace(/{{oferta}}/g, previewTemplate.subject.replace('{{oferta}}', 'Produto Exemplo'))
                      .replace(/{{desconto}}/g, '30% OFF')
                      .replace(/{{link}}/g, '#')
                      .replace(/{{descricao}}/g, 'Descrição do produto ou serviço oferecido')
                  }}
                  className="text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  handleTemplateClick(previewTemplate);
                  setPreviewTemplate(null);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Usar este Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateSelector;