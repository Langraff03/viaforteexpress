/**
 * Gera um arquivo PDF a partir de um componente React
 * @param component Componente React a ser renderizado como PDF
 * @returns Caminho do arquivo PDF gerado
 */
export declare function generatePdfFromComponent(component: React.ReactElement): Promise<string>;
/**
 * Limpa arquivos PDF temporários mais antigos que o período especificado
 /**
  * Limpa arquivos PDF temporários mais antigos que o período especificado
  * @param maxAgeHours Idade máxima dos arquivos em horas (padrão: 24)
  */
export declare function cleanupTempPdfFiles(maxAgeHours?: number): void;
