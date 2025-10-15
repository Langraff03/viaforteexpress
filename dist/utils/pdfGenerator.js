import { renderAsync } from '@react-email/render';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
// Importar html-pdf-node em vez de puppeteer diretamente
const htmlPdf = require('html-pdf-node');
/**
 * Gera um arquivo PDF a partir de um componente React
 * @param component Componente React a ser renderizado como PDF
 * @returns Caminho do arquivo PDF gerado
 */
export async function generatePdfFromComponent(component) {
    try {
        console.log('🔄 Iniciando geração de PDF...');
        // Renderiza o componente React para HTML
        const html = await renderAsync(component);
        console.log('✅ HTML renderizado com sucesso');
        // Cria um arquivo temporário para o PDF
        const tempDir = path.join(os.tmpdir(), 'fastlog-invoices');
        // Garante que o diretório existe
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
            console.log(`✅ Diretório temporário criado: ${tempDir}`);
        }
        const pdfFilePath = path.join(tempDir, `invoice-${uuidv4()}.pdf`);
        // Opções para a geração do PDF
        const options = {
            format: 'A4',
            printBackground: true,
            margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
        };
        // Conteúdo HTML para converter em PDF
        const file = { content: html };
        console.log('🔄 Convertendo HTML para PDF...');
        // Gerar o PDF usando html-pdf-node
        return new Promise((resolve, reject) => {
            htmlPdf.generatePdf(file, options).then((pdfBuffer) => {
                // Salvar o buffer do PDF em um arquivo
                fs.writeFileSync(pdfFilePath, pdfBuffer);
                console.log(`✅ PDF gerado com sucesso: ${pdfFilePath}`);
                resolve(pdfFilePath);
            }).catch((error) => {
                console.error('❌ Erro ao gerar PDF com html-pdf-node:', error);
                reject(error);
            });
        });
    }
    catch (error) {
        console.error('❌ Erro ao gerar PDF:', error);
        throw error;
    }
}
/**
 * Limpa arquivos PDF temporários mais antigos que o período especificado
 /**
  * Limpa arquivos PDF temporários mais antigos que o período especificado
  * @param maxAgeHours Idade máxima dos arquivos em horas (padrão: 24)
  */
export function cleanupTempPdfFiles(maxAgeHours = 24) {
    try {
        console.log('🧹 Iniciando limpeza de arquivos PDF temporários...');
        const tempDir = path.join(os.tmpdir(), 'fastlog-invoices');
        if (!fs.existsSync(tempDir)) {
            console.log('⚠️ Diretório temporário não existe, nada para limpar');
            return;
        }
        const files = fs.readdirSync(tempDir);
        const now = new Date().getTime();
        const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
        let removedCount = 0;
        for (const file of files) {
            if (file.endsWith('.pdf') || file.endsWith('.html')) {
                const filePath = path.join(tempDir, file);
                const stats = fs.statSync(filePath);
                const fileAgeMs = now - stats.mtimeMs;
                if (fileAgeMs > maxAgeMs) {
                    fs.unlinkSync(filePath);
                    removedCount++;
                    console.log(`🧹 Arquivo temporário removido: ${filePath}`);
                }
            }
        }
        console.log(`✅ Limpeza concluída. ${removedCount} arquivos removidos.`);
    }
    catch (error) {
        console.error('❌ Erro ao limpar arquivos temporários:', error);
    }
}
