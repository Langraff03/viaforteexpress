import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo } from 'react';
import { Search, Eye, Check, Star, Tag, FileText, Palette, Zap, Home, GraduationCap, Stethoscope } from 'lucide-react';
import { TEMPLATE_CATEGORIES, getTemplatesByCategory, searchTemplates } from '../../lib/emailTemplates';
const TemplateSelector = ({ onTemplateSelect, selectedTemplateId, className = '' }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todos');
    const [previewTemplate, setPreviewTemplate] = useState(null);
    // Filtrar templates baseado na busca e categoria
    const filteredTemplates = useMemo(() => {
        let templates = getTemplatesByCategory(selectedCategory);
        if (searchQuery.trim()) {
            templates = searchTemplates(searchQuery);
        }
        return templates;
    }, [selectedCategory, searchQuery]);
    const handleTemplateClick = (template) => {
        onTemplateSelect(template);
    };
    const handlePreview = (template, e) => {
        e.stopPropagation();
        setPreviewTemplate(template);
    };
    const getCategoryIcon = (category) => {
        switch (category) {
            case 'Ofertas': return _jsx(Tag, { className: "w-4 h-4" });
            case 'Lançamentos': return _jsx(Zap, { className: "w-4 h-4" });
            case 'Saúde': return _jsx(Stethoscope, { className: "w-4 h-4" });
            case 'Imóveis': return _jsx(Home, { className: "w-4 h-4" });
            case 'Educação': return _jsx(GraduationCap, { className: "w-4 h-4" });
            default: return _jsx(FileText, { className: "w-4 h-4" });
        }
    };
    const getCategoryColor = (category) => {
        switch (category) {
            case 'Ofertas': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'Lançamentos': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'Saúde': return 'bg-green-100 text-green-800 border-green-200';
            case 'Imóveis': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'Educação': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };
    return (_jsxs("div", { className: `w-full ${className}`, children: [_jsxs("div", { className: "mb-6", children: [_jsxs("div", { className: "flex flex-col sm:flex-row gap-4 mb-4", children: [_jsxs("div", { className: "relative flex-1", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" }), _jsx("input", { type: "text", placeholder: "Buscar templates...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" })] }), previewTemplate && (_jsxs("button", { onClick: () => setPreviewTemplate(null), className: "px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center", children: [_jsx(Eye, { className: "w-4 h-4 mr-2" }), "Fechar Preview"] }))] }), _jsx("div", { className: "flex flex-wrap gap-2", children: TEMPLATE_CATEGORIES.map((category) => (_jsxs("button", { onClick: () => setSelectedCategory(category), className: `px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center ${selectedCategory === category
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`, children: [getCategoryIcon(category), _jsx("span", { className: "ml-2", children: category })] }, category))) })] }), searchQuery && (_jsxs("div", { className: "mb-4 text-sm text-gray-600", children: [filteredTemplates.length, " template(s) encontrado(s) para \"", searchQuery, "\""] })), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: filteredTemplates.map((template) => (_jsxs("div", { onClick: () => handleTemplateClick(template), className: `relative bg-white border-2 rounded-xl p-6 cursor-pointer transition-all duration-200 hover:shadow-lg transform hover:-translate-y-1 ${selectedTemplateId === template.id
                        ? 'border-indigo-500 bg-indigo-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'}`, children: [selectedTemplateId === template.id && (_jsx("div", { className: "absolute -top-2 -right-2 bg-indigo-600 text-white rounded-full p-1", children: _jsx(Check, { className: "w-4 h-4" }) })), _jsxs("div", { className: "flex items-start justify-between mb-4", children: [_jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "font-semibold text-gray-900 mb-1", children: template.name }), _jsxs("div", { className: `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(template.category)}`, children: [getCategoryIcon(template.category), _jsx("span", { className: "ml-1", children: template.category })] })] }), _jsx("button", { onClick: (e) => handlePreview(template, e), className: "p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors", title: "Visualizar template", children: _jsx(Eye, { className: "w-4 h-4" }) })] }), _jsx("p", { className: "text-sm text-gray-600 mb-4 line-clamp-2", children: template.description }), _jsxs("div", { className: "flex flex-wrap gap-1 mb-4", children: [template.tags.slice(0, 3).map((tag) => (_jsx("span", { className: "px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full", children: tag }, tag))), template.tags.length > 3 && (_jsxs("span", { className: "px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full", children: ["+", template.tags.length - 3] }))] }), _jsxs("div", { className: "text-xs text-gray-500", children: [_jsx("span", { className: "font-medium", children: "Vari\u00E1veis:" }), " ", template.variables.join(', ')] }), _jsxs("div", { className: "mt-4 flex justify-between items-center", children: [_jsxs("div", { className: "flex items-center text-xs text-gray-500", children: [_jsx(Star, { className: "w-3 h-3 mr-1 text-yellow-400" }), _jsx("span", { children: "Popular" })] }), _jsx("button", { onClick: (e) => {
                                        e.stopPropagation();
                                        handleTemplateClick(template);
                                    }, className: `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedTemplateId === template.id
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`, children: selectedTemplateId === template.id ? 'Selecionado' : 'Selecionar' })] })] }, template.id))) }), filteredTemplates.length === 0 && (_jsxs("div", { className: "text-center py-12", children: [_jsx(Palette, { className: "w-16 h-16 text-gray-300 mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: "Nenhum template encontrado" }), _jsx("p", { className: "text-gray-600", children: searchQuery
                            ? `Tente ajustar sua busca para "${searchQuery}"`
                            : 'Selecione uma categoria diferente' })] })), previewTemplate && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50", children: _jsxs("div", { className: "bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden", children: [_jsxs("div", { className: "flex items-center justify-between p-6 border-b border-gray-200", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900", children: previewTemplate.name }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: previewTemplate.description })] }), _jsx("button", { onClick: () => setPreviewTemplate(null), className: "p-2 hover:bg-gray-100 rounded-lg transition-colors", children: _jsx(Eye, { className: "w-5 h-5 text-gray-400" }) })] }), _jsx("div", { className: "p-6 max-h-96 overflow-y-auto", children: _jsx("div", { className: "bg-gray-50 rounded-lg p-4 border", children: _jsx("div", { dangerouslySetInnerHTML: {
                                        __html: previewTemplate.html
                                            .replace(/{{nome}}/g, 'João Silva')
                                            .replace(/{{oferta}}/g, previewTemplate.subject.replace('{{oferta}}', 'Produto Exemplo'))
                                            .replace(/{{desconto}}/g, '30% OFF')
                                            .replace(/{{link}}/g, '#')
                                            .replace(/{{descricao}}/g, 'Descrição do produto ou serviço oferecido')
                                    }, className: "text-sm" }) }) }), _jsxs("div", { className: "flex justify-end gap-3 p-6 border-t border-gray-200", children: [_jsx("button", { onClick: () => setPreviewTemplate(null), className: "px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors", children: "Fechar" }), _jsx("button", { onClick: () => {
                                        handleTemplateClick(previewTemplate);
                                        setPreviewTemplate(null);
                                    }, className: "px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors", children: "Usar este Template" })] })] }) }))] }));
};
export default TemplateSelector;
