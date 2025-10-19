export interface EmailTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  subject: string;
  html: string;
  thumbnail?: string;
  tags: string[];
  variables: string[];
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  // ===========================================
  // 🏪 TEMPLATES DE OFERTAS COMERCIAIS
  // ===========================================

  {
    id: 'black-friday-basic',
    name: 'Black Friday Básica',
    category: 'Ofertas',
    description: 'Template clássico para promoções de Black Friday',
    subject: '{{nome}}, confira nossa oferta especial',
    tags: ['black friday', 'desconto', 'promoção'],
    variables: ['nome', 'oferta', 'desconto', 'link', 'descricao'],
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>{{oferta}}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f8f9fa; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #1a1a1a 0%, #333 100%); color: white; padding: 40px 30px; text-align: center; }
    .content { padding: 40px 30px; }
    .offer-box { background: #fff3cd; border: 2px solid #ffc107; border-radius: 10px; padding: 30px; margin: 20px 0; text-align: center; }
    .cta-button { background: #dc3545; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin: 20px 0; box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3); }
    .footer { background: #f8f9fa; padding: 30px; text-align: center; color: #666; font-size: 14px; }
    .urgent { color: #dc3545; font-weight: bold; font-size: 18px; }
    .discount { font-size: 48px; font-weight: bold; color: #28a745; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔥 BLACK FRIDAY É HOJE!</h1>
      <p>Olá {{nome}}, prepare-se para as melhores ofertas do ano!</p>
    </div>

    <div class="content">
      <div class="offer-box">
        <h2>{{oferta}}</h2>
        <div class="discount">{{desconto}}</div>
        <p class="urgent">⚡ OFERTA LIMITADA - TERMINA HOJE!</p>
        <p>{{descricao}}</p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="{{link}}" class="cta-button">GARANTIR DESCONTO AGORA</a>
      </div>

      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>💡 Por que comprar agora?</h3>
        <ul style="text-align: left;">
          <li>✅ Preços imperdíveis</li>
          <li>✅ Estoque limitado</li>
          <li>✅ Entrega rápida</li>
          <li>✅ Garantia total</li>
        </ul>
      </div>
    </div>

    <div class="footer">
      <p>Esta é uma oferta exclusiva para você!</p>
      <p>Equipe Marketing • Black Friday 2024</p>
    </div>
  </div>
</body>
</html>`
  },

  {
    id: 'product-launch',
    name: 'Lançamento de Produto',
    category: 'Lançamentos',
    description: 'Template para apresentar novos produtos ou serviços',
    subject: '{{nome}}, conheça nossa novidade',
    tags: ['lançamento', 'novo', 'produto', 'inovação'],
    variables: ['nome', 'oferta', 'desconto', 'link', 'descricao'],
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Novo Lançamento</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f8f9fa; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
    .content { padding: 40px 30px; }
    .feature-box { background: #f8f9fa; border-radius: 10px; padding: 25px; margin: 20px 0; border-left: 4px solid #667eea; }
    .cta-button { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin: 20px 0; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3); }
    .footer { background: #f8f9fa; padding: 30px; text-align: center; color: #666; font-size: 14px; }
    .highlight { background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 NOVO LANÇAMENTO</h1>
      <p>Olá {{nome}}, temos uma novidade incrível para você!</p>
    </div>

    <div class="content">
      <div class="highlight">
        <h2 style="color: #333; margin-top: 0;">{{oferta}}</h2>
        <p style="font-size: 18px; color: #28a745; font-weight: bold;">{{desconto}}</p>
        <p>{{descricao}}</p>
      </div>

      <div class="feature-box">
        <h3>✨ Principais Características</h3>
        <ul>
          <li>🔹 Tecnologia de ponta</li>
          <li>🔹 Design inovador</li>
          <li>🔹 Qualidade superior</li>
          <li>🔹 Suporte completo</li>
        </ul>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="{{link}}" class="cta-button">SAIBA MAIS E COMPRE AGORA</a>
      </div>

      <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>🎯 Por que escolher este produto?</h3>
        <p>Este é o resultado de meses de pesquisa e desenvolvimento, criado especialmente para atender às suas necessidades.</p>
      </div>
    </div>

    <div class="footer">
      <p>Seja um dos primeiros a experimentar!</p>
      <p>Equipe de Produto • Inovação que transforma</p>
    </div>
  </div>
</body>
</html>`
  },

  // ===========================================
  // 🏥 TEMPLATES DE SAÚDE E BEM-ESTAR
  // ===========================================

  {
    id: 'health-consultation',
    name: 'Consulta de Saúde',
    category: 'Saúde',
    description: 'Template para agendamento de consultas médicas',
    subject: '{{nome}}, agende sua consulta',
    tags: ['saúde', 'consulta', 'médico', 'bem-estar'],
    variables: ['nome', 'oferta', 'desconto', 'link', 'descricao'],
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Consulta de Saúde</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f8f9fa; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 30px; text-align: center; }
    .content { padding: 40px 30px; }
    .info-box { background: #ecfdf5; border: 2px solid #10b981; border-radius: 10px; padding: 25px; margin: 20px 0; }
    .cta-button { background: #10b981; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin: 20px 0; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3); }
    .footer { background: #f8f9fa; padding: 30px; text-align: center; color: #666; font-size: 14px; }
    .benefit { background: #f0fdf4; padding: 15px; border-radius: 6px; margin: 10px 0; border-left: 3px solid #10b981; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏥 CUIDE DA SUA SAÚDE</h1>
      <p>Olá {{nome}}, sua saúde é nossa prioridade!</p>
    </div>

    <div class="content">
      <div class="info-box">
        <h2>{{oferta}}</h2>
        <p style="font-size: 18px; color: #059669; font-weight: bold;">{{desconto}}</p>
        <p>{{descricao}}</p>
      </div>

      <div class="benefit">
        <h4>💚 Benefícios do Tratamento</h4>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Profissionais qualificados</li>
          <li>Tecnologia de ponta</li>
          <li>Ambiente acolhedor</li>
          <li>Acompanhamento personalizado</li>
        </ul>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="{{link}}" class="cta-button">AGENDAR CONSULTA AGORA</a>
      </div>

      <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>⏰ Horários Disponíveis</h3>
        <p>Agende sua consulta nos melhores horários disponíveis.</p>
        <p style="font-weight: bold; color: #92400e;">Atendimento de Segunda a Sábado</p>
      </div>
    </div>

    <div class="footer">
      <p>Cuide da sua saúde com quem entende do assunto!</p>
      <p>Equipe Médica • Cuidado que transforma</p>
    </div>
  </div>
</body>
</html>`
  },

  // ===========================================
  // 🏠 TEMPLATES IMOBILIÁRIOS
  // ===========================================

  {
    id: 'property-viewing',
    name: 'Visita Imóvel',
    category: 'Imóveis',
    description: 'Template para agendamento de visitas a imóveis',
    subject: '{{nome}}, visite este imóvel incrível',
    tags: ['imóvel', 'visita', 'casa', 'apartamento'],
    variables: ['nome', 'oferta', 'desconto', 'link', 'descricao'],
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Visita Imóvel</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f8f9fa; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 40px 30px; text-align: center; }
    .content { padding: 40px 30px; }
    .property-box { background: #fffbeb; border: 2px solid #f59e0b; border-radius: 10px; padding: 25px; margin: 20px 0; }
    .cta-button { background: #f59e0b; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin: 20px 0; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3); }
    .footer { background: #f8f9fa; padding: 30px; text-align: center; color: #666; font-size: 14px; }
    .feature { display: inline-block; background: #fef3c7; padding: 8px 12px; border-radius: 20px; margin: 5px; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏠 OPORTUNIDADE IMOBILIÁRIA</h1>
      <p>Olá {{nome}}, encontramos o imóvel ideal para você!</p>
    </div>

    <div class="content">
      <div class="property-box">
        <h2>{{oferta}}</h2>
        <p style="font-size: 18px; color: #d97706; font-weight: bold;">{{desconto}}</p>
        <p>{{descricao}}</p>

        <div style="margin: 20px 0;">
          <span class="feature">📍 Localização Privilegiada</span>
          <span class="feature">🏢 Acabamento Superior</span>
          <span class="feature">🚗 2 Vagas</span>
          <span class="feature">🌳 Área Verde</span>
        </div>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="{{link}}" class="cta-button">AGENDAR VISITA AGORA</a>
      </div>

      <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>✅ Por que escolher este imóvel?</h3>
        <ul style="text-align: left; margin: 10px 0; padding-left: 20px;">
          <li>Localização estratégica</li>
          <li>Qualidade de construção</li>
          <li>Condomínio completo</li>
          <li>Valorização garantida</li>
        </ul>
      </div>
    </div>

    <div class="footer">
      <p>Não perca esta oportunidade única!</p>
      <p>Equipe Imobiliária • Sonhos que se realizam</p>
    </div>
  </div>
</body>
</html>`
  },

  // ===========================================
  // 🎓 TEMPLATES EDUCACIONAIS
  // ===========================================

  {
    id: 'course-enrollment',
    name: 'Matrícula em Curso',
    category: 'Educação',
    description: 'Template para inscrições em cursos e treinamentos',
    subject: '{{nome}}, transforme sua carreira',
    tags: ['curso', 'educação', 'treinamento', 'carreira'],
    variables: ['nome', 'oferta', 'desconto', 'link', 'descricao'],
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Matrícula em Curso</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f8f9fa; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 40px 30px; text-align: center; }
    .content { padding: 40px 30px; }
    .course-box { background: #f3e8ff; border: 2px solid #8b5cf6; border-radius: 10px; padding: 25px; margin: 20px 0; }
    .cta-button { background: #8b5cf6; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin: 20px 0; box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3); }
    .footer { background: #f8f9fa; padding: 30px; text-align: center; color: #666; font-size: 14px; }
    .benefit { background: #f8f9ff; padding: 15px; border-radius: 6px; margin: 10px 0; border-left: 3px solid #8b5cf6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎓 ELEVE SEU CONHECIMENTO</h1>
      <p>Olá {{nome}}, invista no seu futuro profissional!</p>
    </div>

    <div class="content">
      <div class="course-box">
        <h2>{{oferta}}</h2>
        <p style="font-size: 18px; color: #7c3aed; font-weight: bold;">{{desconto}}</p>
        <p>{{descricao}}</p>
      </div>

      <div class="benefit">
        <h4>🚀 O que você vai aprender</h4>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Conhecimentos atualizados</li>
          <li>Metodologia prática</li>
          <li>Certificado reconhecido</li>
          <li>Suporte completo</li>
        </ul>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="{{link}}" class="cta-button">GARANTIR VAGA AGORA</a>
      </div>

      <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>⏰ Turmas Limitadas</h3>
        <p>Inscrições abertas! Vagas preenchidas rapidamente.</p>
        <p style="font-weight: bold; color: #92400e;">Próxima turma: Este mês</p>
      </div>
    </div>

    <div class="footer">
      <p>Invista em você mesmo!</p>
      <p>Equipe Educacional • Conhecimento que transforma</p>
    </div>
  </div>
</body>
</html>`
  }
];

export const TEMPLATE_CATEGORIES = [
  'Todos',
  'Ofertas',
  'Lançamentos',
  'Saúde',
  'Imóveis',
  'Educação'
];

export const getTemplatesByCategory = (category: string): EmailTemplate[] => {
  if (category === 'Todos') return EMAIL_TEMPLATES;
  return EMAIL_TEMPLATES.filter(template => template.category === category);
};

export const getTemplateById = (id: string): EmailTemplate | undefined => {
  return EMAIL_TEMPLATES.find(template => template.id === id);
};

export const searchTemplates = (query: string): EmailTemplate[] => {
  const lowercaseQuery = query.toLowerCase();
  return EMAIL_TEMPLATES.filter(template =>
    template.name.toLowerCase().includes(lowercaseQuery) ||
    template.description.toLowerCase().includes(lowercaseQuery) ||
    template.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
    template.category.toLowerCase().includes(lowercaseQuery)
  );
};