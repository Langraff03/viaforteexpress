export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
}
export declare function validateEmailTemplate(template: string): ValidationResult;
export declare function getTemplateVariables(template: string): string[];
export declare function replaceTemplateVariables(template: string, variables: Record<string, string>): string;
export declare function getValidationSummary(validation: ValidationResult): string;
