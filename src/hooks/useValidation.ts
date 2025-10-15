import { useState, useEffect, useCallback, useMemo } from 'react';

export interface ValidationRule {
  field: string;
  validator: (value: any) => boolean;
  message: string;
  required?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: Record<string, string>;
  suggestions: Record<string, string>;
}

export interface ValidationOptions {
  debounceMs?: number;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export const useValidation = (
  data: Record<string, any>,
  rules: ValidationRule[],
  options: ValidationOptions = {}
) => {
  const {
    debounceMs = 300,
    validateOnChange = true,
    validateOnBlur = true
  } = options;

  const [result, setResult] = useState<ValidationResult>({
    isValid: true,
    errors: {},
    warnings: {},
    suggestions: {}
  });

  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [isValidating, setIsValidating] = useState(false);

  // Validações específicas por tipo de campo
  const fieldValidators = useMemo(() => ({
    email: (value: string) => {
      if (!value) return true; // Campo opcional
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    },

    url: (value: string) => {
      if (!value) return true; // Campo opcional
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },

    required: (value: any) => {
      if (typeof value === 'string') return value.trim().length > 0;
      return value !== null && value !== undefined;
    },

    minLength: (value: string, min: number) => {
      return value.length >= min;
    },

    maxLength: (value: string, max: number) => {
      return value.length <= max;
    },

    pattern: (value: string, pattern: RegExp) => {
      return pattern.test(value);
    }
  }), []);

  // Função de validação principal
  const validate = useCallback((dataToValidate: Record<string, any> = data) => {
    setIsValidating(true);

    const errors: Record<string, string> = {};
    const warnings: Record<string, string> = {};
    const suggestions: Record<string, string> = {};

    rules.forEach(rule => {
      const value = dataToValidate[rule.field];
      const isRequired = rule.required || false;

      // Verificar se campo obrigatório está vazio
      if (isRequired && !fieldValidators.required(value)) {
        errors[rule.field] = `${rule.field} é obrigatório`;
        return;
      }

      // Pular validação se campo estiver vazio e não for obrigatório
      if (!isRequired && !fieldValidators.required(value)) {
        return;
      }

      // Executar validação customizada
      const isValid = rule.validator(value);
      if (!isValid) {
        errors[rule.field] = rule.message;
      }

      // Validações adicionais baseadas no tipo de campo
      if (rule.field.toLowerCase().includes('email') && !fieldValidators.email(value)) {
        errors[rule.field] = 'Email inválido';
      }

      if (rule.field.toLowerCase().includes('link') && !fieldValidators.url(value)) {
        errors[rule.field] = 'URL inválida';
      }

      // Avisos e sugestões
      if (rule.field === 'name' && value && value.length < 5) {
        warnings[rule.field] = 'Nome muito curto, considere usar um nome mais descritivo';
      }

      if (rule.field === 'description' && value && value.length < 20) {
        suggestions[rule.field] = 'Adicione mais detalhes na descrição para melhor engajamento';
      }

      if (rule.field === 'discount' && value && !value.includes('%') && !value.includes('OFF')) {
        suggestions[rule.field] = 'Considere adicionar "%" ou "OFF" para deixar mais claro';
      }
    });

    const isValid = Object.keys(errors).length === 0;

    setResult({ isValid, errors, warnings, suggestions });
    setIsValidating(false);

    return { isValid, errors, warnings, suggestions };
  }, [data, rules, fieldValidators]);

  // Validação com debouncing
  useEffect(() => {
    if (!validateOnChange) return;

    const timeoutId = setTimeout(() => {
      validate();
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [data, validateOnChange, debounceMs, validate]);

  // Marcar campo como tocado
  const markFieldAsTouched = useCallback((field: string) => {
    setTouchedFields(prev => new Set([...prev, field]));
    if (validateOnBlur) {
      validate();
    }
  }, [validateOnBlur, validate]);

  // Verificar se campo tem erro e foi tocado
  const getFieldError = useCallback((field: string) => {
    return touchedFields.has(field) ? result.errors[field] : undefined;
  }, [result.errors, touchedFields]);

  // Verificar se campo tem aviso
  const getFieldWarning = useCallback((field: string) => {
    return result.warnings[field];
  }, [result.warnings]);

  // Verificar se campo tem sugestão
  const getFieldSuggestion = useCallback((field: string) => {
    return result.suggestions[field];
  }, [result.suggestions]);

  // Validar campo específico
  const validateField = useCallback((field: string, value: any) => {
    const fieldRules = rules.filter(rule => rule.field === field);
    const fieldErrors: string[] = [];

    fieldRules.forEach(rule => {
      const isRequired = rule.required || false;

      if (isRequired && !fieldValidators.required(value)) {
        fieldErrors.push(`${field} é obrigatório`);
        return;
      }

      if (!isRequired && !fieldValidators.required(value)) {
        return;
      }

      const isValid = rule.validator(value);
      if (!isValid) {
        fieldErrors.push(rule.message);
      }
    });

    return fieldErrors;
  }, [rules, fieldValidators]);

  // Resetar validação
  const resetValidation = useCallback(() => {
    setResult({
      isValid: true,
      errors: {},
      warnings: {},
      suggestions: {}
    });
    setTouchedFields(new Set());
    setIsValidating(false);
  }, []);

  return {
    ...result,
    isValidating,
    touchedFields: Array.from(touchedFields),
    markFieldAsTouched,
    getFieldError,
    getFieldWarning,
    getFieldSuggestion,
    validateField,
    validate,
    resetValidation
  };
};