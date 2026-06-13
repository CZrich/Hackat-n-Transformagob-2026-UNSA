import { useState, useCallback } from 'react';
import { api } from '../services/api';
import type { Job } from '../types';

export function useJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMatched = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.jobs.getMatched();
      setJobs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar ofertas');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.jobs.getPending();
      setJobs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar ofertas pendientes');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMyHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.jobs.getMyHistory();
      setJobs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar historial');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStatus = useCallback(async (id: string, status: string) => {
    setError(null);
    try {
      const updated = await api.jobs.updateStatus(id, status);
      setJobs((prev) => prev.map((j) => (j.id === id ? updated : j)));
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar estado');
      throw err;
    }
  }, []);

  const createJob = useCallback(async (data: Record<string, unknown>) => {
    setError(null);
    try {
      const created = await api.jobs.create(data);
      setJobs((prev) => [created, ...prev]);
      return created;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear oferta');
      throw err;
    }
  }, []);

  return {
    jobs,
    loading,
    error,
    fetchMatched,
    fetchPending,
    fetchMyHistory,
    updateStatus,
    createJob,
  };
}
