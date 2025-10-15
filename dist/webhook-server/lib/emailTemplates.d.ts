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
export declare const EMAIL_TEMPLATES: EmailTemplate[];
export declare const TEMPLATE_CATEGORIES: string[];
export declare const getTemplatesByCategory: (category: string) => EmailTemplate[];
export declare const getTemplateById: (id: string) => EmailTemplate | undefined;
export declare const searchTemplates: (query: string) => EmailTemplate[];
