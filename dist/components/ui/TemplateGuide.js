import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BookOpen, Code, Eye, CheckCircle, AlertTriangle, Lightbulb } from 'lucide-react';
const TemplateGuide = ({ isOpen, onClose }) => {
    if (!isOpen)
        return null;
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
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50", children: _jsxs("div", { className: "bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden", children: [_jsxs("div", { className: "bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white relative", children: [_jsx("button", { onClick: onClose, className: "absolute top-4 right-4 text-white/80 hover:text-white transition-colors", children: "\u00D7" }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "bg-white/20 p-2 rounded-full", children: _jsx(BookOpen, { className: "w-6 h-6" }) }), _jsxs("div", { children: [_jsx("h2", { className: "text-xl font-bold", children: "Manual de Templates" }), _jsx("p", { className: "text-blue-100 text-sm", children: "Guia completo para criar templates de email personalizados" })] })] })] }), _jsxs("div", { className: "p-6 overflow-y-auto max-h-[calc(90vh-140px)]", children: [_jsxs("section", { className: "mb-8", children: [_jsxs("h3", { className: "text-lg font-semibold mb-4 flex items-center", children: [_jsx(Code, { className: "w-5 h-5 mr-2 text-blue-600" }), "Vari\u00E1veis Dispon\u00EDveis"] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "bg-green-50 border border-green-200 rounded-lg p-4", children: [_jsxs("h4", { className: "font-medium text-green-800 mb-2 flex items-center", children: [_jsx(CheckCircle, { className: "w-4 h-4 mr-2" }), "Obrigat\u00F3rias"] }), _jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("div", { children: [_jsx("code", { className: "bg-green-100 px-2 py-1 rounded text-green-800", children: '{{nome}}' }), _jsx("p", { className: "text-green-700 ml-1", children: "Nome do cliente (sempre dispon\u00EDvel)" })] }), _jsxs("div", { children: [_jsx("code", { className: "bg-green-100 px-2 py-1 rounded text-green-800", children: '{{oferta}}' }), _jsx("p", { className: "text-green-700 ml-1", children: "Nome da oferta configurada" })] })] })] }), _jsxs("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-4", children: [_jsxs("h4", { className: "font-medium text-blue-800 mb-2 flex items-center", children: [_jsx(Eye, { className: "w-4 h-4 mr-2" }), "Opcionais"] }), _jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("div", { children: [_jsx("code", { className: "bg-blue-100 px-2 py-1 rounded text-blue-800", children: '{{desconto}}' }), _jsx("p", { className: "text-blue-700 ml-1", children: "Valor do desconto (ex: \"30% OFF\")" })] }), _jsxs("div", { children: [_jsx("code", { className: "bg-blue-100 px-2 py-1 rounded text-blue-800", children: '{{link}}' }), _jsx("p", { className: "text-blue-700 ml-1", children: "Link da oferta para redirecionamento" })] }), _jsxs("div", { children: [_jsx("code", { className: "bg-blue-100 px-2 py-1 rounded text-blue-800", children: '{{descricao}}' }), _jsx("p", { className: "text-blue-700 ml-1", children: "Descri\u00E7\u00E3o adicional da oferta" })] }), _jsxs("div", { children: [_jsx("code", { className: "bg-blue-100 px-2 py-1 rounded text-blue-800", children: '{{empresa}}' }), _jsx("p", { className: "text-blue-700 ml-1", children: "Nome da empresa do cliente (se dispon\u00EDvel)" })] })] })] })] })] }), _jsxs("section", { className: "mb-8", children: [_jsxs("h3", { className: "text-lg font-semibold mb-4 flex items-center", children: [_jsx(Lightbulb, { className: "w-5 h-5 mr-2 text-yellow-600" }), "Boas Pr\u00E1ticas"] }), _jsx("div", { className: "bg-yellow-50 border border-yellow-200 rounded-lg p-4", children: _jsxs("ul", { className: "space-y-2 text-sm text-yellow-800", children: [_jsxs("li", { children: ["\u2022 ", _jsxs("strong", { children: ["Sempre use ", '{{nome}}'] }), " - \u00C9 a vari\u00E1vel mais importante para personaliza\u00E7\u00E3o"] }), _jsxs("li", { children: ["\u2022 ", _jsx("strong", { children: "Inclua CSS inline" }), " - Muitos clientes de email n\u00E3o suportam CSS externo"] }), _jsxs("li", { children: ["\u2022 ", _jsx("strong", { children: "Use tabelas para layout" }), " - Garante melhor compatibilidade"] }), _jsxs("li", { children: ["\u2022 ", _jsx("strong", { children: "Teste em diferentes clientes" }), " - Gmail, Outlook, Apple Mail"] }), _jsxs("li", { children: ["\u2022 ", _jsx("strong", { children: "Mantenha largura m\u00E1xima de 600px" }), " - Otimal para dispositivos m\u00F3veis"] }), _jsxs("li", { children: ["\u2022 ", _jsx("strong", { children: "Use alt text em imagens" }), " - Caso as imagens n\u00E3o carreguem"] })] }) })] }), _jsxs("section", { className: "mb-8", children: [_jsxs("h3", { className: "text-lg font-semibold mb-4 flex items-center", children: [_jsx(Code, { className: "w-5 h-5 mr-2 text-purple-600" }), "Exemplo Completo"] }), _jsx("div", { className: "bg-gray-50 border border-gray-200 rounded-lg p-4", children: _jsx("pre", { className: "text-xs text-gray-700 overflow-x-auto", children: _jsx("code", { children: templateExample }) }) })] }), _jsxs("section", { children: [_jsxs("h3", { className: "text-lg font-semibold mb-4 flex items-center", children: [_jsx(AlertTriangle, { className: "w-5 h-5 mr-2 text-red-600" }), "Avisos Importantes"] }), _jsx("div", { className: "bg-red-50 border border-red-200 rounded-lg p-4", children: _jsxs("ul", { className: "space-y-2 text-sm text-red-800", children: [_jsxs("li", { children: ["\u2022 ", _jsx("strong", { children: "Sintaxe correta:" }), " Use ", '{{variavel}}', " exatamente assim (duas chaves)"] }), _jsxs("li", { children: ["\u2022 ", _jsx("strong", { children: "Case sensitive:" }), " ", '{{Nome}}', " \u00E9 diferente de ", '{{nome}}'] }), _jsxs("li", { children: ["\u2022 ", _jsx("strong", { children: "Vari\u00E1veis n\u00E3o encontradas:" }), " Aparecer\u00E3o como texto literal no email"] }), _jsxs("li", { children: ["\u2022 ", _jsx("strong", { children: "HTML v\u00E1lido:" }), " Use validadores HTML para verificar seu c\u00F3digo"] }), _jsxs("li", { children: ["\u2022 ", _jsx("strong", { children: "Links seguros:" }), " Sempre use HTTPS nos links da oferta"] })] }) })] })] }), _jsx("div", { className: "bg-gray-50 px-6 py-4 flex justify-end", children: _jsx("button", { onClick: onClose, className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors", children: "Fechar Manual" }) })] }) }));
};
export default TemplateGuide;
