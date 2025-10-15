import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback, useRef } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader } from 'lucide-react';
const FileUpload = ({ onFileSelect, accept = '.json', maxSize = 10, className = '', disabled = false, placeholder = 'Arraste e solte seu arquivo aqui ou clique para selecionar' }) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [validationError, setValidationError] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const fileInputRef = useRef(null);
    const validateFile = useCallback((file) => {
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
    const handleFileSelect = useCallback(async (file) => {
        setIsValidating(true);
        setValidationError('');
        try {
            const validation = validateFile(file);
            if (validation.isValid) {
                setSelectedFile(file);
                onFileSelect(file);
            }
            else {
                setValidationError(validation.error || 'Erro na validação do arquivo');
                setSelectedFile(null);
            }
        }
        catch (error) {
            setValidationError('Erro ao processar o arquivo');
            setSelectedFile(null);
        }
        finally {
            setIsValidating(false);
        }
    }, [validateFile, onFileSelect]);
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragOver(false);
        if (disabled)
            return;
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    }, [disabled, handleFileSelect]);
    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        if (!disabled) {
            setIsDragOver(true);
        }
    }, [disabled]);
    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);
    const handleClick = useCallback(() => {
        if (!disabled && fileInputRef.current) {
            fileInputRef.current.click();
        }
    }, [disabled]);
    const handleInputChange = useCallback((e) => {
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
    const getFileSizeDisplay = (bytes) => {
        const mb = bytes / (1024 * 1024);
        return mb < 1 ? `${(bytes / 1024).toFixed(1)} KB` : `${mb.toFixed(1)} MB`;
    };
    return (_jsxs("div", { className: `w-full ${className}`, children: [_jsxs("div", { onDrop: handleDrop, onDragOver: handleDragOver, onDragLeave: handleDragLeave, onClick: handleClick, className: `
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
          ${isDragOver && !disabled
                    ? 'border-indigo-400 bg-indigo-50 scale-105'
                    : 'border-gray-300 hover:border-gray-400'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}
          ${validationError ? 'border-red-300 bg-red-50' : ''}
          ${selectedFile && !validationError ? 'border-green-300 bg-green-50' : ''}
        `, children: [_jsx("input", { ref: fileInputRef, type: "file", accept: accept, onChange: handleInputChange, className: "hidden", disabled: disabled }), _jsxs("div", { className: "flex flex-col items-center space-y-4", children: [isValidating ? (_jsx(Loader, { className: "w-12 h-12 text-indigo-600 animate-spin" })) : selectedFile && !validationError ? (_jsx(CheckCircle, { className: "w-12 h-12 text-green-600" })) : validationError ? (_jsx(AlertCircle, { className: "w-12 h-12 text-red-600" })) : (_jsx(Upload, { className: `w-12 h-12 ${isDragOver ? 'text-indigo-600' : 'text-gray-400'}` })), _jsx("div", { children: selectedFile && !validationError ? (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-center space-x-2", children: [_jsx(FileText, { className: "w-5 h-5 text-green-600" }), _jsx("span", { className: "font-medium text-green-800", children: selectedFile.name }), _jsx("button", { onClick: (e) => {
                                                        e.stopPropagation();
                                                        clearFile();
                                                    }, className: "p-1 hover:bg-red-100 rounded-full transition-colors", children: _jsx(X, { className: "w-4 h-4 text-red-600" }) })] }), _jsxs("p", { className: "text-sm text-green-600", children: [getFileSizeDisplay(selectedFile.size), " \u2022 Pronto para processar"] })] })) : validationError ? (_jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "font-medium text-red-800", children: "Erro no arquivo" }), _jsx("p", { className: "text-sm text-red-600", children: validationError }), _jsx("button", { onClick: clearFile, className: "text-sm text-indigo-600 hover:text-indigo-800 font-medium", children: "Tentar novamente" })] })) : (_jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "font-medium text-gray-900", children: isDragOver ? 'Solte o arquivo aqui' : placeholder }), _jsxs("p", { className: "text-sm text-gray-500", children: [accept.toUpperCase(), " at\u00E9 ", maxSize, "MB"] })] })) })] }), isDragOver && (_jsx("div", { className: "absolute inset-0 bg-indigo-100 bg-opacity-90 rounded-xl flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx(Upload, { className: "w-16 h-16 text-indigo-600 mx-auto mb-4" }), _jsx("p", { className: "text-lg font-medium text-indigo-800", children: "Solte o arquivo aqui" })] }) }))] }), !selectedFile && !validationError && (_jsx("div", { className: "mt-4 text-center", children: _jsx("p", { className: "text-xs text-gray-500", children: "\uD83D\uDCA1 Dica: Voc\u00EA tamb\u00E9m pode clicar na \u00E1rea acima para selecionar o arquivo" }) }))] }));
};
export default FileUpload;
