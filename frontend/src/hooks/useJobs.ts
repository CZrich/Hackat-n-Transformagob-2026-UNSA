import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
// types not needed anymore as useQuery handles it via api

import { useAuth } from './useAuth';

export function useJobs() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = user?.role;

  const matchedQuery = useQuery({
    queryKey: ['jobs', 'matched'],
    queryFn: () => api.jobs.getMatched(),
    enabled: role === 'EGRESADO',
  });

  const pendingQuery = useQuery({
    queryKey: ['jobs', 'pending'],
    queryFn: () => api.jobs.getPending(),
    enabled: role === 'ADMIN',
  });

  const historyQuery = useQuery({
    queryKey: ['jobs', 'history'],
    queryFn: () => api.jobs.getMyHistory(),
    enabled: role === 'EMPLEADOR',
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.jobs.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  const createJobMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.jobs.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  const applyJobMutation = useMutation({
    mutationFn: (jobId: string) => api.jobs.apply(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  return {
    matchedQuery,
    pendingQuery,
    historyQuery,
    updateStatus: updateStatusMutation.mutateAsync,
    createJob: createJobMutation.mutateAsync,
    applyJob: applyJobMutation.mutateAsync,
  };
}

