// src/components/EmailTemplateEditor.tsx

import React, { useState } from 'react';
import { Eye, Palette, Type, Mail } from 'lucide-react';

interface EmailTemplateConfig {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  fontFamily: string;
  logoText: string;
  footerText: string;
  buttonStyle: 'rounded' | 'square';
  headerStyle: 'gradient' | 'solid';
}

interface EmailTemplateEditorProps {
  config: EmailTemplateConfig;
  onChange: (config: EmailTemplateConfig) => void;
  onPreview: () => void;
}

const EmailTemplateEditor: React.FC<EmailTemplateEditorProps> = ({
  config,
  onChange,
  onPreview
}) => {
  const handleChange = (field: keyof EmailTemplateConfig, value: string) => {
    onChange({ ...config, [field]: value });
  };

  return (
    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
      <div className="flex items-center gap-3 mb-6">
        <Palette className="w-5 h-5 text-purple-600" />
        <h4 className="text-lg font-medium text-gray-900">3. Personalização Visual</h4>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cores */}
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-3">Cores</h5>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Cor Principal</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={config.primaryColor}
                  onChange={(e) => handleChange('primaryColor', e.target.value)}
                  className="w-12 h-10 rounded border border-gray-300"
                />
                <input
                  type="text"
                  value={config.primaryColor}
                  onChange={(e) => handleChange('primaryColor', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="#4f46e5"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Cor de Fundo</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={config.backgroundColor}
                  onChange={(e) => handleChange('backgroundColor', e.target.value)}
                  className="w-12 h-10 rounded border border-gray-300"
                />
                <input
                  type="text"
                  value={config.backgroundColor}
                  onChange={(e) => handleChange('backgroundColor', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="#f6f9fc"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tipografia */}
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-3">Tipografia</h5>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Fonte</label>
              <select
                value={config.fontFamily}
                onChange={(e) => handleChange('fontFamily', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="system-ui, -apple-system, sans-serif">Sistema (Padrão)</option>
                <option value="Arial, sans-serif">Arial</option>
                <option value="Georgia, serif">Georgia</option>
                <option value="'Times New Roman', serif">Times New Roman</option>
                <option value="'Courier New', monospace">Courier New</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Texto do Logo</label>
              <input
                type="text"
                value={config.logoText}
                onChange={(e) => handleChange('logoText', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="VIA FORTE EXPRESS"
              />
            </div>
          </div>
        </div>

        {/* Estilo */}
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-3">Estilo</h5>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Estilo do Cabeçalho</label>
              <select
                value={config.headerStyle}
                onChange={(e) => handleChange('headerStyle', e.target.value as 'gradient' | 'solid')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="gradient">Gradiente</option>
                <option value="solid">Cor Sólida</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Estilo dos Botões</label>
              <select
                value={config.buttonStyle}
                onChange={(e) => handleChange('buttonStyle', e.target.value as 'rounded' | 'square')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="rounded">Arredondado</option>
                <option value="square">Quadrado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-3">Rodapé</h5>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Texto do Rodapé</label>
            <textarea
              value={config.footerText}
              onChange={(e) => handleChange('footerText', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              rows={2}
              placeholder="Av. Goiás, 1234 • Goiânia, GO • 74000-000"
            />
          </div>
        </div>
      </div>

      {/* Preview Button */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={onPreview}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
        >
          <Eye className="w-4 h-4" />
          Preview com Personalização
        </button>
      </div>

      {/* Presets */}
      <div className="mt-6 border-t border-gray-200 pt-6">
        <h5 className="text-sm font-medium text-gray-700 mb-3">Templates Prontos</h5>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => onChange({
              primaryColor: '#4f46e5',
              secondaryColor: '#6366f1', 
              backgroundColor: '#f6f9fc',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              logoText: 'VIA FORTE EXPRESS',
              footerText: 'Av. Goiás, 1234 • Goiânia, GO • 74000-000',
              buttonStyle: 'rounded',
              headerStyle: 'gradient'
            })}
            className="p-3 border border-gray-300 rounded-lg hover:border-indigo-400 text-sm"
          >
            <div className="w-full h-8 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded mb-2"></div>
            Padrão
          </button>

          <button
            onClick={() => onChange({
              primaryColor: '#dc2626',
              secondaryColor: '#ef4444',
              backgroundColor: '#fef2f2',
              fontFamily: 'Arial, sans-serif',
              logoText: 'VIA FORTE EXPRESS',
              footerText: 'Av. Goiás, 1234 • Goiânia, GO • 74000-000',
              buttonStyle: 'square',
              headerStyle: 'solid'
            })}
            className="p-3 border border-gray-300 rounded-lg hover:border-red-400 text-sm"
          >
            <div className="w-full h-8 bg-red-600 rounded mb-2"></div>
            Vermelho
          </button>

          <button
            onClick={() => onChange({
              primaryColor: '#059669',
              secondaryColor: '#10b981',
              backgroundColor: '#f0fdf4',
              fontFamily: 'Georgia, serif',
              logoText: 'VIA FORTE EXPRESS',
              footerText: 'Av. Goiás, 1234 • Goiânia, GO • 74000-000',
              buttonStyle: 'rounded',
              headerStyle: 'gradient'
            })}
            className="p-3 border border-gray-300 rounded-lg hover:border-green-400 text-sm"
          >
            <div className="w-full h-8 bg-gradient-to-r from-green-600 to-green-500 rounded mb-2"></div>
            Verde
          </button>

          <button
            onClick={() => onChange({
              primaryColor: '#1f2937',
              secondaryColor: '#374151',
              backgroundColor: '#f9fafb',
              fontFamily: "'Times New Roman', serif",
              logoText: 'VIA FORTE EXPRESS',
              footerText: 'Av. Goiás, 1234 • Goiânia, GO • 74000-000',
              buttonStyle: 'square',
              headerStyle: 'solid'
            })}
            className="p-3 border border-gray-300 rounded-lg hover:border-gray-400 text-sm"
          >
            <div className="w-full h-8 bg-gray-800 rounded mb-2"></div>
            Elegante
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailTemplateEditor;