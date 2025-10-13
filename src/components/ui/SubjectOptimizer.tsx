import React, { useState, useMemo } from 'react';
import { AlertTriangle, CheckCircle, X, Zap, Target, Eye, TrendingUp } from 'lucide-react';

interface SubjectOptimizerProps {
  subject: string;
  onSubjectChange: (subject: string) => void;
  className?: string;
}

interface SubjectAnalysis {
  score: number;
  issues: string[];
  suggestions: string[];
  warnings: string[];
  strengths: string[];
}

const SubjectOptimizer: React.FC<SubjectOptimizerProps> = ({
  subject,
  onSubjectChange,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Análise do assunto
  const analysis = useMemo((): SubjectAnalysis => {
    const issues: string[] = [];
    const suggestions: string[] = [];
    const warnings: string[] = [];
    const strengths: string[] = [];

    const subjectLower = subject.toLowerCase();

    // Palavras que trigger spam (críticas)
    const spamWords = ['gratuito', 'grátis', 'urgente', 'garantia', '100%', '$$$'];
    spamWords.forEach(word => {
      if (subjectLower.includes(word)) {
        issues.push(`Palavra "${word}" pode trigger filtros de spam`);
      }
    });

    // Comprimento ideal
    if (subject.length < 10) {
      warnings.push('Assunto muito curto (menos de 10 caracteres)');
    } else if (subject.length > 78) {
      warnings.push('Assunto muito longo (mais de 78 caracteres)');
    } else {
      strengths.push('Comprimento ideal para visualização');
    }

    // Personalização
    if (subject.includes('{{nome}}') || subject.includes('[Nome]')) {
      strengths.push('Personalização aumenta engajamento');
    } else {
      suggestions.push('Considere personalizar com o nome do destinatário');
    }

    // Pontuação e maiúsculas
    const exclamationCount = (subject.match(/!/g) || []).length;
    if (exclamationCount > 2) {
      warnings.push('Muitas exclamações podem parecer spam');
    }

    const uppercaseRatio = subject.replace(/[^A-Z]/g, '').length / subject.length;
    if (uppercaseRatio > 0.5) {
      warnings.push('Muitas maiúsculas podem parecer spam');
    }

    // Símbolos especiais
    const specialChars = subject.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g);
    if (specialChars && specialChars.length > 3) {
      warnings.push('Muitos símbolos especiais podem parecer spam');
    }

    // Palavras de ação positivas
    const actionWords = ['descubra', 'veja', 'conheça', 'aproveite', 'saiba'];
    actionWords.forEach(word => {
      if (subjectLower.includes(word)) {
        strengths.push(`Palavra de ação "${word}" incentiva abertura`);
      }
    });

    // Cálculo do score
    let score = 100;

    // Penalidades
    score -= issues.length * 25;
    score -= warnings.length * 10;
    score = Math.max(0, Math.min(100, score));

    // Bônus
    score += strengths.length * 5;
    score = Math.min(100, score);

    return { score, issues, suggestions, warnings, strengths };
  }, [subject]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Bom';
    if (score >= 40) return 'Regular';
    return 'Ruim';
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(analysis.score)}`}>
              <Target className="w-4 h-4 inline mr-1" />
              {analysis.score}/100 - {getScoreLabel(analysis.score)}
            </div>
            <span className="text-sm text-gray-600">
              Otimização de Assunto
            </span>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            {isExpanded ? <X className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Campo do Assunto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assunto do Email
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => onSubjectChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Digite o assunto do email..."
              maxLength={100}
            />
            <div className="mt-1 text-xs text-gray-500 text-right">
              {subject.length}/100 caracteres
            </div>
          </div>

          {/* Análise Detalhada */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Problemas */}
            {(analysis.issues.length > 0 || analysis.warnings.length > 0) && (
              <div className="space-y-3">
                {analysis.issues.length > 0 && (
                  <div>
                    <h4 className="font-medium text-red-800 mb-2 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Problemas Críticos
                    </h4>
                    <ul className="space-y-1">
                      {analysis.issues.map((issue, index) => (
                        <li key={index} className="text-sm text-red-700 flex items-start">
                          <X className="w-3 h-3 mr-2 mt-0.5 flex-shrink-0" />
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.warnings.length > 0 && (
                  <div>
                    <h4 className="font-medium text-yellow-800 mb-2 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Avisos
                    </h4>
                    <ul className="space-y-1">
                      {analysis.warnings.map((warning, index) => (
                        <li key={warning} className="text-sm text-yellow-700 flex items-start">
                          <AlertTriangle className="w-3 h-3 mr-2 mt-0.5 flex-shrink-0" />
                          {warning}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Pontos Positivos e Sugestões */}
            <div className="space-y-3">
              {analysis.strengths.length > 0 && (
                <div>
                  <h4 className="font-medium text-green-800 mb-2 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Pontos Positivos
                  </h4>
                  <ul className="space-y-1">
                    {analysis.strengths.map((strength, index) => (
                      <li key={index} className="text-sm text-green-700 flex items-start">
                        <CheckCircle className="w-3 h-3 mr-2 mt-0.5 flex-shrink-0" />
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.suggestions.length > 0 && (
                <div>
                  <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                    <Zap className="w-4 h-4 mr-2" />
                    Sugestões
                  </h4>
                  <ul className="space-y-1">
                    {analysis.suggestions.map((suggestion, index) => (
                      <li key={index} className="text-sm text-blue-700 flex items-start">
                        <Target className="w-3 h-3 mr-2 mt-0.5 flex-shrink-0" />
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Exemplos de Assuntos Otimizados */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Exemplos de Assuntos Otimizados
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="text-sm">
                <div className="font-medium text-green-800 mb-1">✅ Bom:</div>
                <div className="text-gray-700 bg-white p-2 rounded border">
                  "João, veja nossa nova coleção"
                </div>
              </div>
              <div className="text-sm">
                <div className="font-medium text-red-800 mb-1">❌ Evitar:</div>
                <div className="text-gray-700 bg-white p-2 rounded border">
                  "GRÁTIS!!! URGENTE!!!"
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectOptimizer;