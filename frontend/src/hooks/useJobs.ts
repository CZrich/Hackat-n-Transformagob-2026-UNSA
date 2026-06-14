import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

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

  const myApplicationsQuery = useQuery({
    queryKey: ['jobs', 'my-applications'],
    queryFn: () => api.jobs.getMyApplications(),
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

  const updateEmployerJobStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.jobs.updateEmployerJobStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  const deleteJobMutation = useMutation({
    mutationFn: (id: string) => api.jobs.deleteJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  const updateApplicationStatusMutation = useMutation({
    mutationFn: ({ applicationId, status }: { applicationId: string; status: string }) =>
      api.jobs.updateApplicationStatus(applicationId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  return {
    matchedQuery,
    myApplicationsQuery,
    pendingQuery,
    historyQuery,
    updateStatus: updateStatusMutation.mutateAsync,
    createJob: createJobMutation.mutateAsync,
    applyJob: applyJobMutation.mutateAsync,
    updateEmployerJobStatus: updateEmployerJobStatusMutation.mutateAsync,
    deleteJob: deleteJobMutation.mutateAsync,
    updateApplicationStatus: updateApplicationStatusMutation.mutateAsync,
  };
}

