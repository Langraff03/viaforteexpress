import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number; // em MB
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  accept = '.json',
  maxSize = 10,
  className = '',
  disabled = false,
  placeholder = 'Arraste e solte seu arquivo aqui ou clique para selecionar'
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string>('');
  const [isValidating, setIsValidating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): FileValidationResult => {
    // Verificar tipo do arquivo
    if (accept && !file.name.toLowerCase().endsWith(accept.replace('.', ''))) {
      return {
        isValid: false,
        error: `Tipo de arquivo inválido. Use apenas arquivos ${accept.toUpperCase()}`
      };
    }

    // Verificar tamanho do arquivo
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      return {
        isValid: false,
        error: `Arquivo muito grande. Máximo permitido: ${maxSize}MB`
      };
    }

    return { isValid: true };
  }, [accept, maxSize]);

  const handleFileSelect = useCallback(async (file: File) => {
    setIsValidating(true);
    setValidationError('');

    try {
      const validation = validateFile(file);

      if (validation.isValid) {
        setSelectedFile(file);
        onFileSelect(file);
      } else {
        setValidationError(validation.error || 'Erro na validação do arquivo');
        setSelectedFile(null);
      }
    } catch (error) {
      setValidationError('Erro ao processar o arquivo');
      setSelectedFile(null);
    } finally {
      setIsValidating(false);
    }
  }, [validateFile, onFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [disabled, handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const clearFile = useCallback(() => {
    setSelectedFile(null);
    setValidationError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const getFileSizeDisplay = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return mb < 1 ? `${(bytes / 1024).toFixed(1)} KB` : `${mb.toFixed(1)} MB`;
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Área de Upload */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
          ${isDragOver && !disabled
            ? 'border-indigo-400 bg-indigo-50 scale-105'
            : 'border-gray-300 hover:border-gray-400'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}
          ${validationError ? 'border-red-300 bg-red-50' : ''}
          ${selectedFile && !validationError ? 'border-green-300 bg-green-50' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />

        {/* Ícone e Conteúdo */}
        <div className="flex flex-col items-center space-y-4">
          {isValidating ? (
            <Loader className="w-12 h-12 text-indigo-600 animate-spin" />
          ) : selectedFile && !validationError ? (
            <CheckCircle className="w-12 h-12 text-green-600" />
          ) : validationError ? (
            <AlertCircle className="w-12 h-12 text-red-600" />
          ) : (
            <Upload className={`w-12 h-12 ${isDragOver ? 'text-indigo-600' : 'text-gray-400'}`} />
          )}

          <div>
            {selectedFile && !validationError ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center space-x-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">{selectedFile.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearFile();
                    }}
                    className="p-1 hover:bg-red-100 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-red-600" />
                  </button>
                </div>
                <p className="text-sm text-green-600">
                  {getFileSizeDisplay(selectedFile.size)} • Pronto para processar
                </p>
              </div>
            ) : validationError ? (
              <div className="space-y-2">
                <p className="font-medium text-red-800">Erro no arquivo</p>
                <p className="text-sm text-red-600">{validationError}</p>
                <button
                  onClick={clearFile}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Tentar novamente
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="font-medium text-gray-900">
                  {isDragOver ? 'Solte o arquivo aqui' : placeholder}
                </p>
                <p className="text-sm text-gray-500">
                  {accept.toUpperCase()} até {maxSize}MB
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Overlay de Drag */}
        {isDragOver && (
          <div className="absolute inset-0 bg-indigo-100 bg-opacity-90 rounded-xl flex items-center justify-center">
            <div className="text-center">
              <Upload className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
              <p className="text-lg font-medium text-indigo-800">Solte o arquivo aqui</p>
            </div>
          </div>
        )}
      </div>

      {/* Informações Adicionais */}
      {!selectedFile && !validationError && (
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            💡 Dica: Você também pode clicar na área acima para selecionar o arquivo
          </p>
        </div>
      )}
    </div>
  );
};

export default FileUpload;