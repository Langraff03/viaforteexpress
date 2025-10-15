import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Eye, Palette } from 'lucide-react';
const EmailTemplateEditor = ({ config, onChange, onPreview }) => {
    const handleChange = (field, value) => {
        onChange({ ...config, [field]: value });
    };
    return (_jsxs("div", { className: "bg-gray-50 rounded-lg p-6 border border-gray-200", children: [_jsxs("div", { className: "flex items-center gap-3 mb-6", children: [_jsx(Palette, { className: "w-5 h-5 text-purple-600" }), _jsx("h4", { className: "text-lg font-medium text-gray-900", children: "3. Personaliza\u00E7\u00E3o Visual" })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsx("h5", { className: "text-sm font-medium text-gray-700 mb-3", children: "Cores" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm text-gray-600 mb-1", children: "Cor Principal" }), _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "color", value: config.primaryColor, onChange: (e) => handleChange('primaryColor', e.target.value), className: "w-12 h-10 rounded border border-gray-300" }), _jsx("input", { type: "text", value: config.primaryColor, onChange: (e) => handleChange('primaryColor', e.target.value), className: "flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm", placeholder: "#4f46e5" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm text-gray-600 mb-1", children: "Cor de Fundo" }), _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "color", value: config.backgroundColor, onChange: (e) => handleChange('backgroundColor', e.target.value), className: "w-12 h-10 rounded border border-gray-300" }), _jsx("input", { type: "text", value: config.backgroundColor, onChange: (e) => handleChange('backgroundColor', e.target.value), className: "flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm", placeholder: "#f6f9fc" })] })] })] })] }), _jsxs("div", { children: [_jsx("h5", { className: "text-sm font-medium text-gray-700 mb-3", children: "Tipografia" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm text-gray-600 mb-1", children: "Fonte" }), _jsxs("select", { value: config.fontFamily, onChange: (e) => handleChange('fontFamily', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-md text-sm", children: [_jsx("option", { value: "system-ui, -apple-system, sans-serif", children: "Sistema (Padr\u00E3o)" }), _jsx("option", { value: "Arial, sans-serif", children: "Arial" }), _jsx("option", { value: "Georgia, serif", children: "Georgia" }), _jsx("option", { value: "'Times New Roman', serif", children: "Times New Roman" }), _jsx("option", { value: "'Courier New', monospace", children: "Courier New" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm text-gray-600 mb-1", children: "Texto do Logo" }), _jsx("input", { type: "text", value: config.logoText, onChange: (e) => handleChange('logoText', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-md text-sm", placeholder: "VIA FORTE EXPRESS" })] })] })] }), _jsxs("div", { children: [_jsx("h5", { className: "text-sm font-medium text-gray-700 mb-3", children: "Estilo" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm text-gray-600 mb-1", children: "Estilo do Cabe\u00E7alho" }), _jsxs("select", { value: config.headerStyle, onChange: (e) => handleChange('headerStyle', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-md text-sm", children: [_jsx("option", { value: "gradient", children: "Gradiente" }), _jsx("option", { value: "solid", children: "Cor S\u00F3lida" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm text-gray-600 mb-1", children: "Estilo dos Bot\u00F5es" }), _jsxs("select", { value: config.buttonStyle, onChange: (e) => handleChange('buttonStyle', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-md text-sm", children: [_jsx("option", { value: "rounded", children: "Arredondado" }), _jsx("option", { value: "square", children: "Quadrado" })] })] })] })] }), _jsxs("div", { children: [_jsx("h5", { className: "text-sm font-medium text-gray-700 mb-3", children: "Rodap\u00E9" }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm text-gray-600 mb-1", children: "Texto do Rodap\u00E9" }), _jsx("textarea", { value: config.footerText, onChange: (e) => handleChange('footerText', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-md text-sm", rows: 2, placeholder: "Av. Goi\u00E1s, 1234 \u2022 Goi\u00E2nia, GO \u2022 74000-000" })] })] })] }), _jsx("div", { className: "mt-6 flex justify-center", children: _jsxs("button", { onClick: onPreview, className: "flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700", children: [_jsx(Eye, { className: "w-4 h-4" }), "Preview com Personaliza\u00E7\u00E3o"] }) }), _jsxs("div", { className: "mt-6 border-t border-gray-200 pt-6", children: [_jsx("h5", { className: "text-sm font-medium text-gray-700 mb-3", children: "Templates Prontos" }), _jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-3", children: [_jsxs("button", { onClick: () => onChange({
                                    primaryColor: '#4f46e5',
                                    secondaryColor: '#6366f1',
                                    backgroundColor: '#f6f9fc',
                                    fontFamily: 'system-ui, -apple-system, sans-serif',
                                    logoText: 'VIA FORTE EXPRESS',
                                    footerText: 'Av. Goiás, 1234 • Goiânia, GO • 74000-000',
                                    buttonStyle: 'rounded',
                                    headerStyle: 'gradient'
                                }), className: "p-3 border border-gray-300 rounded-lg hover:border-indigo-400 text-sm", children: [_jsx("div", { className: "w-full h-8 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded mb-2" }), "Padr\u00E3o"] }), _jsxs("button", { onClick: () => onChange({
                                    primaryColor: '#dc2626',
                                    secondaryColor: '#ef4444',
                                    backgroundColor: '#fef2f2',
                                    fontFamily: 'Arial, sans-serif',
                                    logoText: 'VIA FORTE EXPRESS',
                                    footerText: 'Av. Goiás, 1234 • Goiânia, GO • 74000-000',
                                    buttonStyle: 'square',
                                    headerStyle: 'solid'
                                }), className: "p-3 border border-gray-300 rounded-lg hover:border-red-400 text-sm", children: [_jsx("div", { className: "w-full h-8 bg-red-600 rounded mb-2" }), "Vermelho"] }), _jsxs("button", { onClick: () => onChange({
                                    primaryColor: '#059669',
                                    secondaryColor: '#10b981',
                                    backgroundColor: '#f0fdf4',
                                    fontFamily: 'Georgia, serif',
                                    logoText: 'VIA FORTE EXPRESS',
                                    footerText: 'Av. Goiás, 1234 • Goiânia, GO • 74000-000',
                                    buttonStyle: 'rounded',
                                    headerStyle: 'gradient'
                                }), className: "p-3 border border-gray-300 rounded-lg hover:border-green-400 text-sm", children: [_jsx("div", { className: "w-full h-8 bg-gradient-to-r from-green-600 to-green-500 rounded mb-2" }), "Verde"] }), _jsxs("button", { onClick: () => onChange({
                                    primaryColor: '#1f2937',
                                    secondaryColor: '#374151',
                                    backgroundColor: '#f9fafb',
                                    fontFamily: "'Times New Roman', serif",
                                    logoText: 'VIA FORTE EXPRESS',
                                    footerText: 'Av. Goiás, 1234 • Goiânia, GO • 74000-000',
                                    buttonStyle: 'square',
                                    headerStyle: 'solid'
                                }), className: "p-3 border border-gray-300 rounded-lg hover:border-gray-400 text-sm", children: [_jsx("div", { className: "w-full h-8 bg-gray-800 rounded mb-2" }), "Elegante"] })] })] })] }));
};
export default EmailTemplateEditor;
