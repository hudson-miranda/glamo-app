'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';

interface UseAsyncDataOptions<T> {
  /** Função que busca os dados */
  fetcher: () => Promise<T>;
  /** Dados iniciais/fallback */
  initialData?: T;
  /** Se deve buscar automaticamente ao montar */
  fetchOnMount?: boolean;
  /** Tempo mínimo de loading em ms (para evitar flash) */
  minLoadingTime?: number;
  /** Cache key para revalidação */
  cacheKey?: string;
}

interface UseAsyncDataReturn<T> {
  /** Dados retornados */
  data: T | undefined;
  /** Se está carregando */
  isLoading: boolean;
  /** Erro se houver */
  error: Error | null;
  /** Função para refetch manual */
  refetch: () => Promise<void>;
  /** Se os dados foram carregados pelo menos uma vez */
  isInitialized: boolean;
}

// Cache simples em memória
const dataCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Hook para gerenciar dados assíncronos com loading state real
 */
export function useAsyncData<T>({
  fetcher,
  initialData,
  fetchOnMount = true,
  minLoadingTime = 0,
  cacheKey,
}: UseAsyncDataOptions<T>): UseAsyncDataReturn<T> {
  const [data, setData] = useState<T | undefined>(() => {
    // Verificar cache
    if (cacheKey) {
      const cached = dataCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data as T;
      }
    }
    return initialData;
  });
  const [isLoading, setIsLoading] = useState(() => {
    // Se já tem dados em cache, não precisa loading
    if (cacheKey) {
      const cached = dataCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return false;
      }
    }
    return fetchOnMount;
  });
  const [error, setError] = useState<Error | null>(null);
  const [isInitialized, setIsInitialized] = useState(() => {
    if (cacheKey) {
      const cached = dataCache.get(cacheKey);
      return cached !== undefined && Date.now() - cached.timestamp < CACHE_TTL;
    }
    return false;
  });

  const refetch = useCallback(async () => {
    const startTime = Date.now();
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      
      // Garantir tempo mínimo de loading para evitar flash
      const elapsed = Date.now() - startTime;
      if (minLoadingTime > 0 && elapsed < minLoadingTime) {
        await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsed));
      }

      setData(result);
      setIsInitialized(true);

      // Salvar em cache
      if (cacheKey) {
        dataCache.set(cacheKey, { data: result, timestamp: Date.now() });
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [fetcher, minLoadingTime, cacheKey]);

  useEffect(() => {
    if (fetchOnMount && !isInitialized) {
      refetch();
    }
  }, [fetchOnMount, isInitialized, refetch]);

  return { data, isLoading, error, refetch, isInitialized };
}

/**
 * Hook simplificado para páginas - gerencia loading baseado em dados reais
 */
export function usePageData<T>(
  fetcher: () => Promise<T>,
  options?: {
    initialData?: T;
    cacheKey?: string;
    minLoadingTime?: number;
  }
) {
  return useAsyncData({
    fetcher,
    initialData: options?.initialData,
    fetchOnMount: true,
    minLoadingTime: options?.minLoadingTime ?? 0, // Sem delay - loading.tsx cuida da transição
    cacheKey: options?.cacheKey,
  });
}

/**
 * Hook para simular carregamento de página (para páginas sem API ainda)
 * Usa um delay que simula busca de dados
 */
export function usePageLoading(simulatedDelay = 0) {
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Se já foi inicializado (navegação de volta), não mostra loading
    if (isInitialized) {
      setIsLoading(false);
      return;
    }

    // Simular carregamento
    const timer = setTimeout(() => {
      setIsLoading(false);
      setIsInitialized(true);
    }, simulatedDelay);

    return () => clearTimeout(timer);
  }, [simulatedDelay, isInitialized]);

  return { isLoading, isInitialized };
}

/**
 * Limpar cache específico ou todo o cache
 */
export function clearDataCache(key?: string) {
  if (key) {
    dataCache.delete(key);
  } else {
    dataCache.clear();
  }
}
