// ================================
// src/lib/hooks/use-api.ts
// ================================
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/utils/api-client';

export function useApi<T>(
  endpoint: string,
  options?: {
    immediate?: boolean;
    dependencies?: any[];
  }
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<T>(endpoint);
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.error || 'Failed to fetch data');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (options?.immediate !== false) {
      fetchData();
    }
  }, options?.dependencies || []);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
