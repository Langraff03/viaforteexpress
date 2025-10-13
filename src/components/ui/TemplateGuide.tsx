import React from 'react';
import { BookOpen, Code, Eye, CheckCircle, AlertTriangle, Lightbulb } from 'lucide-react';

interface TemplateGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

const TemplateGuide: React.FC<TemplateGuideProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const templateExample = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>{{oferta}}</title>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      line-height: 1.6; 
      color: #333; 
      margin: 0; 
      padding: 0; 
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      padding: 20px; 
    }
    .header { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      color: white; 
      padding: 30px; 
      text-align: center; 
      border-radius: 10px 10px 0 0; 
    }
    .content { 
      background: #f9f9f9; 
      padding: 30px; 
      border-radius: 0 0 10px 10px; 
    }
    .cta-button { 
      background: #28a745; 
      color: white; 
      padding: 15px 30px; 
      text-decoration: none; 
      border-radius: 5px; 
      font-weight: bold; 
      display: inline-block; 
      margin: 20px 0; 
    }
    .footer { 
      text-align: center; 
      padding: 20px; 
      color: #666; 
      font-size: 14px; 
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 {{oferta}}</h1>
      <p>Olá {{nome}}, temos uma oferta especial para você!</p>
    </div>
    
    <div class="content">
      <h2>💰 {{desconto}}</h2>
      <p>Esta é uma oferta especial exclusiva para você.</p>
      <p>{{descricao}}</p>
      
      <div style="text-align: center;">
        <a href="{{link}}" class="cta-button">
          Aproveitar Oferta Agora
        </a>
      </div>
    </div>
    
    <div class="footer">
      <p>Obrigado por confiar em nossos serviços!</p>
      <p>Equipe {{empresa}}</p>
    </div>
  </div>
</body>
</html>`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            ×
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-full">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Manual de Templates</h2>
              <p className="text-blue-100 text-sm">
                Guia completo para criar templates de email personalizados
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Variáveis Disponíveis */}
          <section className="mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Code className="w-5 h-5 mr-2 text-blue-600" />
              Variáveis Disponíveis
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-2 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Obrigatórias
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <code className="bg-green-100 px-2 py-1 rounded text-green-800">{'{{nome}}'}</code>
                    <p className="text-green-700 ml-1">Nome do cliente (sempre disponível)</p>
                  </div>
                  <div>
                    <code className="bg-green-100 px-2 py-1 rounded text-green-800">{'{{oferta}}'}</code>
                    <p className="text-green-700 ml-1">Nome da oferta configurada</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                  <Eye className="w-4 h-4 mr-2" />
                  Opcionais
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <code className="bg-blue-100 px-2 py-1 rounded text-blue-800">{'{{desconto}}'}</code>
                    <p className="text-blue-700 ml-1">Valor do desconto (ex: "30% OFF")</p>
                  </div>
                  <div>
                    <code className="bg-blue-100 px-2 py-1 rounded text-blue-800">{'{{link}}'}</code>
                    <p className="text-blue-700 ml-1">Link da oferta para redirecionamento</p>
                  </div>
                  <div>
                    <code className="bg-blue-100 px-2 py-1 rounded text-blue-800">{'{{descricao}}'}</code>
                    <p className="text-blue-700 ml-1">Descrição adicional da oferta</p>
                  </div>
                  <div>
                    <code className="bg-blue-100 px-2 py-1 rounded text-blue-800">{'{{empresa}}'}</code>
                    <p className="text-blue-700 ml-1">Nome da empresa do cliente (se disponível)</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Boas Práticas */}
          <section className="mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Lightbulb className="w-5 h-5 mr-2 text-yellow-600" />
              Boas Práticas
            </h3>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <ul className="space-y-2 text-sm text-yellow-800">
                <li>• <strong>Sempre use {'{{nome}}'}</strong> - É a variável mais importante para personalização</li>
                <li>• <strong>Inclua CSS inline</strong> - Muitos clientes de email não suportam CSS externo</li>
                <li>• <strong>Use tabelas para layout</strong> - Garante melhor compatibilidade</li>
                <li>• <strong>Teste em diferentes clientes</strong> - Gmail, Outlook, Apple Mail</li>
                <li>• <strong>Mantenha largura máxima de 600px</strong> - Otimal para dispositivos móveis</li>
                <li>• <strong>Use alt text em imagens</strong> - Caso as imagens não carreguem</li>
              </ul>
            </div>
          </section>

          {/* Exemplo Completo */}
          <section className="mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Code className="w-5 h-5 mr-2 text-purple-600" />
              Exemplo Completo
            </h3>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <pre className="text-xs text-gray-700 overflow-x-auto">
                <code>{templateExample}</code>
              </pre>
            </div>
          </section>

          {/* Avisos Importantes */}
          <section>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
              Avisos Importantes
            </h3>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <ul className="space-y-2 text-sm text-red-800">
                <li>• <strong>Sintaxe correta:</strong> Use {'{{variavel}}'} exatamente assim (duas chaves)</li>
                <li>• <strong>Case sensitive:</strong> {'{{Nome}}'} é diferente de {'{{nome}}'}</li>
                <li>• <strong>Variáveis não encontradas:</strong> Aparecerão como texto literal no email</li>
                <li>• <strong>HTML válido:</strong> Use validadores HTML para verificar seu código</li>
                <li>• <strong>Links seguros:</strong> Sempre use HTTPS nos links da oferta</li>
              </ul>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Fechar Manual
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateGuide;