import { useState, useCallback } from 'react';
import { api } from '../services/api';
import type { Job } from '../types';
import {
  getMatchedJobsLocal,
  getPendingJobsLocal,
  getMyJobsLocal,
  createJobLocal,
  updateJobStatusLocal
} from '../services/mockDb';

export function useJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMatched = useCallback(async (careerOverride?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.jobs.getMatched();
      // Even if API works, if we pass a careerOverride (for switching identities), we can filter or use it
      if (careerOverride) {
        setJobs(data.filter(j => j.carrera_destino.toLowerCase() === careerOverride.toLowerCase()));
      } else {
        setJobs(data);
      }
    } catch (err) {
      console.warn('API Error, cayendo a base de datos simulada local:', err);
      const userRaw = localStorage.getItem('user');
      if (userRaw) {
        try {
          const user = JSON.parse(userRaw);
          const targetCareer = careerOverride || user.carrera || 'Ingeniería de Sistemas';
          const userSkills = user.skills || [];
          const data = getMatchedJobsLocal(targetCareer, userSkills);
          setJobs(data);
        } catch {
          setJobs([]);
        }
      } else {
        setJobs([]);
      }
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
      console.warn('API Error, cayendo a base de datos simulada local:', err);
      const data = getPendingJobsLocal();
      setJobs(data);
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
      console.warn('API Error, cayendo a base de datos simulada local:', err);
      const userRaw = localStorage.getItem('user');
      if (userRaw) {
        try {
          const user = JSON.parse(userRaw);
          const data = getMyJobsLocal(user.id || 'company_tech_solutions');
          setJobs(data);
        } catch {
          setJobs([]);
        }
      } else {
        setJobs([]);
      }
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
      console.warn('API Error, actualizando oferta en base local:', err);
      const updated = updateJobStatusLocal(id, status as any);
      setJobs((prev) => prev.map((j) => (j.id === id ? updated : j)));
      return updated;
    }
  }, []);

  const createJob = useCallback(async (data: Record<string, unknown>) => {
    setError(null);
    try {
      const created = await api.jobs.create(data);
      setJobs((prev) => [created, ...prev]);
      return created;
    } catch (err) {
      console.warn('API Error, creando oferta en base local:', err);
      const userRaw = localStorage.getItem('user');
      if (userRaw) {
        try {
          const currentUser = JSON.parse(userRaw);
          const created = createJobLocal(data as any, currentUser);
          setJobs((prev) => [created, ...prev]);
          return created;
        } catch {
          throw err;
        }
      }
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

