import { useState, useEffect, useCallback, useRef } from 'react';
export const useAutoSave = (data, options) => {
    const { key, delay = 2000, onSave, onError } = options;
    const [state, setState] = useState({
        isSaving: false,
        lastSaved: null,
        hasUnsavedChanges: false,
        error: null
    });
    const timeoutRef = useRef();
    const lastSavedDataRef = useRef(null);
    // Carregar dados salvos do localStorage
    const getSavedData = useCallback(() => {
        try {
            const saved = localStorage.getItem(key);
            return saved ? JSON.parse(saved) : null;
        }
        catch (error) {
            console.error('Erro ao carregar dados salvos:', error);
            return null;
        }
    }, [key]);
    // Salvar dados no localStorage
    const saveToStorage = useCallback(async (dataToSave) => {
        try {
            setState(prev => ({ ...prev, isSaving: true, error: null }));
            const dataWithTimestamp = {
                data: dataToSave,
                timestamp: new Date().toISOString(),
                version: '1.0'
            };
            localStorage.setItem(key, JSON.stringify(dataWithTimestamp));
            // Chamar callback opcional
            if (onSave) {
                await onSave(dataToSave);
            }
            setState(prev => ({
                ...prev,
                isSaving: false,
                lastSaved: new Date(),
                hasUnsavedChanges: false
            }));
            lastSavedDataRef.current = dataToSave;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            setState(prev => ({
                ...prev,
                isSaving: false,
                error: errorMessage
            }));
            if (onError) {
                onError(error instanceof Error ? error : new Error(errorMessage));
            }
        }
    }, [key, onSave, onError]);
    // Salvar imediatamente
    const saveNow = useCallback(async () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        await saveToStorage(data);
    }, [data, saveToStorage]);
    // Limpar dados salvos
    const clearData = useCallback(() => {
        try {
            localStorage.removeItem(key);
            setState(prev => ({
                ...prev,
                lastSaved: null,
                hasUnsavedChanges: true,
                error: null
            }));
            lastSavedDataRef.current = null;
        }
        catch (error) {
            console.error('Erro ao limpar dados:', error);
        }
    }, [key]);
    // Verificar se há mudanças não salvas
    useEffect(() => {
        const hasChanges = JSON.stringify(data) !== JSON.stringify(lastSavedDataRef.current);
        setState(prev => ({ ...prev, hasUnsavedChanges: hasChanges }));
    }, [data]);
    // Auto-save com debouncing
    useEffect(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            saveToStorage(data);
        }, delay);
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [data, delay, saveToStorage]);
    // Carregar dados na inicialização
    useEffect(() => {
        const saved = getSavedData();
        if (saved) {
            lastSavedDataRef.current = saved;
        }
    }, [getSavedData]);
    return {
        ...state,
        saveNow,
        clearData,
        getSavedData
    };
};
