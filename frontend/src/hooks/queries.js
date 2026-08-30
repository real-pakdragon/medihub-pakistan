import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, getStoredToken, setStoredToken } from '../api/client.js';

export const queryKeys = {
  stats: ['stats'],
  resources: (params) => ['resources', params ?? {}],
  resource: (id) => ['resource', id],
  mdcat: ['mdcat-status'],
  adminMessages: (status) => ['admin-messages', status ?? 'all'],
  adminSubscribers: ['admin-subscribers'],
  adminStats: ['admin-stats'],
};

export function useStats() {
  return useQuery({
    queryKey: queryKeys.stats,
    queryFn: async () => {
      const res = await api.get('/stats');
      return res.data;
    },
    staleTime: 60_000,
  });
}

export function useResources(params) {
  const clean = Object.fromEntries(
    Object.entries(params ?? {}).filter(([, v]) => v !== '' && v !== undefined && v !== null)
  );
  return useQuery({
    queryKey: queryKeys.resources(clean),
    queryFn: () => api.get(`/resources?${new URLSearchParams(clean)}`),
    placeholderData: (prev) => prev,
  });
}

export function useResource(id) {
  return useQuery({
    queryKey: queryKeys.resource(id),
    queryFn: async () => (await api.get(`/resources/${id}`)).data,
    enabled: Boolean(id),
  });
}

export function useMdcatStatus() {
  return useQuery({
    queryKey: queryKeys.mdcat,
    queryFn: () => api.get('/mdcat/status'),
    staleTime: 60_000,
  });
}

/* ----------------------------- Practice ----------------------------- */

export const practiceKeys = {
  papers: ['practice-papers'],
  questions: (params) => ['practice-questions', params ?? {}],
};

export function usePracticePapers() {
  return useQuery({
    queryKey: practiceKeys.papers,
    queryFn: () => api.get('/practice/papers'),
    staleTime: 5 * 60_000,
  });
}

export function usePracticeQuestions(params) {
  const clean = Object.fromEntries(
    Object.entries(params ?? {}).filter(([, v]) => v !== '' && v !== undefined && v !== null)
  );
  return useQuery({
    queryKey: practiceKeys.questions(clean),
    queryFn: () => api.get(`/practice/questions?${new URLSearchParams(clean)}`),
    enabled: Boolean(clean.university),
    staleTime: 0,
  });
}

export function useSubmitPractice() {
  return useMutation({
    mutationFn: async (answers) => (await api.post('/practice/submit', { answers })).data,
  });
}

/* ----------------------------- Public forms ----------------------------- */

export function useSubmitContact() {
  return useMutation({
    mutationFn: (body) => api.post('/contact', body),
  });
}

export function useSubscribe() {
  return useMutation({
    mutationFn: (body) => api.post('/subscribe', body),
  });
}

/* -------------------------------- Admin -------------------------------- */

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.post('/admin/login', body),
    onSuccess: (data) => {
      setStoredToken(data.token);
      qc.invalidateQueries();
    },
  });
}

export function logoutAdmin(qc) {
  setStoredToken(null);
  qc.invalidateQueries();
}

export function useIsAuthenticated() {
  return Boolean(getStoredToken());
}

export function useAdminStats(enabled) {
  return useQuery({
    queryKey: queryKeys.adminStats,
    queryFn: async () => (await api.get('/admin/stats')).data,
    enabled,
  });
}

export function useAdminResources(params, enabled) {
  const clean = Object.fromEntries(
    Object.entries(params ?? {}).filter(([, v]) => v !== '' && v !== undefined && v !== null)
  );
  return useQuery({
    queryKey: ['admin-resources', clean],
    queryFn: () => api.get(`/admin/resources?${new URLSearchParams({ limit: 50, ...clean })}`),
    enabled,
    placeholderData: (prev) => prev,
  });
}

export function invalidateAdminResources(qc) {
  qc.invalidateQueries({ queryKey: ['admin-resources'] });
  qc.invalidateQueries({ queryKey: ['resources'] });
  qc.invalidateQueries({ queryKey: queryKeys.adminStats });
}

export function useCreateResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.post('/admin/resources', body),
    onSuccess: () => invalidateAdminResources(qc),
  });
}

export function useUpdateResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) => api.put(`/admin/resources/${id}`, body),
    onSuccess: () => invalidateAdminResources(qc),
  });
}

export function useDeleteResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.del(`/admin/resources/${id}`),
    onSuccess: () => invalidateAdminResources(qc),
  });
}

export function useAdminMessages(status, enabled) {
  return useQuery({
    queryKey: queryKeys.adminMessages(status),
    queryFn: () =>
      api.get(`/admin/messages?${new URLSearchParams({ limit: 100, ...(status ? { status } : {}) })}`),
    enabled,
  });
}

export function useUpdateMessageStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => api.patch(`/admin/messages/${id}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-messages'] });
      qc.invalidateQueries({ queryKey: queryKeys.adminStats });
    },
  });
}

export function useAdminSubscribers(enabled) {
  return useQuery({
    queryKey: queryKeys.adminSubscribers,
    queryFn: () => api.get('/admin/subscribers'),
    enabled,
  });
}

export function useUpdateMdcatConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.put('/admin/mdcat-config', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.mdcat }),
  });
}
