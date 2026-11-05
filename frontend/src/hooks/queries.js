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

export const bookKeys = {
  subjects: ['book-subjects'],
  books: (subject) => ['books', subject ?? 'all'],
};

export function useBookSubjects() {
  return useQuery({
    queryKey: bookKeys.subjects,
    queryFn: async () => (await api.get('/books/subjects')).data,
    staleTime: 60_000,
  });
}

export function useBooks(subjectSlug) {
  return useQuery({
    queryKey: bookKeys.books(subjectSlug),
    queryFn: () => api.get(`/books${subjectSlug ? `?subject=${subjectSlug}` : ''}`),
    enabled: Boolean(subjectSlug),
    placeholderData: (prev) => prev,
  });
}

/* ----------------------------- Library (CMS) ----------------------------- */

export const LIBRARY_SECTIONS = {
  mbbs: { label: 'MBBS', home: '/mbbs', publicRoot: 'library', adminRoot: 'library' },
  mdcat: { label: 'MDCAT RES', home: '/mdcat-res', publicRoot: 'mdcat-res', adminRoot: 'mdcat-res' },
};

export const libraryKeys = {
  browse: (section = 'mbbs') => ['library-browse', section],
  topic: (section, slug) => ['library-topic', section, slug],
  post: (section, id) => ['library-post', section, id],
  recent: (section = 'mbbs') => ['library-recent', section],
  adminCategories: (section = 'mbbs') => ['admin-categories', section],
  adminItems: (section, params) => ['admin-items', section, params ?? {}],
  adminPosts: (section, params) => ['admin-posts', section, params ?? {}],
};

export function useLibraryBrowse(section = 'mbbs') {
  return useQuery({
    queryKey: libraryKeys.browse(section),
    queryFn: async () => (await api.get(`/${LIBRARY_SECTIONS[section].publicRoot}/browse`)).data,
    staleTime: 30_000,
  });
}

export function useLibraryTopic(slug, section = 'mbbs') {
  return useQuery({
    queryKey: libraryKeys.topic(section, slug),
    queryFn: async () => (await api.get(`/${LIBRARY_SECTIONS[section].publicRoot}/topic/${slug}`)).data,
    enabled: Boolean(slug),
    placeholderData: (prev) => prev,
  });
}

export function useLibraryPost(id, section = 'mbbs') {
  return useQuery({
    queryKey: libraryKeys.post(section, id),
    queryFn: async () => (await api.get(`/${LIBRARY_SECTIONS[section].publicRoot}/post/${id}`)).data,
    enabled: Boolean(id),
  });
}

export function useLibraryRecent(section = 'mbbs') {
  return useQuery({
    queryKey: libraryKeys.recent(section),
    queryFn: async () => (await api.get(`/${LIBRARY_SECTIONS[section].publicRoot}/recent`)).data,
    staleTime: 60_000,
  });
}

function invalidateLibrary(qc, section = 'mbbs') {
  qc.invalidateQueries({ queryKey: libraryKeys.browse(section) });
  qc.invalidateQueries({ queryKey: ['library-topic', section] });
  qc.invalidateQueries({ queryKey: libraryKeys.recent(section) });
  qc.invalidateQueries({ queryKey: libraryKeys.adminCategories(section) });
  qc.invalidateQueries({ queryKey: ['admin-items', section] });
  qc.invalidateQueries({ queryKey: ['admin-posts', section] });
  qc.invalidateQueries({ queryKey: queryKeys.adminStats });
}

/* -------- Admin: categories -------- */

export function useAdminCategories(enabled, section = 'mbbs') {
  return useQuery({
    queryKey: libraryKeys.adminCategories(section),
    queryFn: async () => (await api.get(`/admin/${LIBRARY_SECTIONS[section].adminRoot}/categories`)).data,
    enabled,
    placeholderData: (prev) => prev,
  });
}

export function useCreateCategory(section = 'mbbs') {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.post(`/admin/${LIBRARY_SECTIONS[section].adminRoot}/categories`, body),
    onSuccess: () => invalidateLibrary(qc, section),
  });
}

export function useUpdateCategory(section = 'mbbs') {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) => api.put(`/admin/${LIBRARY_SECTIONS[section].adminRoot}/categories/${id}`, body),
    onSuccess: () => invalidateLibrary(qc, section),
  });
}

export function useDeleteCategory(section = 'mbbs') {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.del(`/admin/${LIBRARY_SECTIONS[section].adminRoot}/categories/${id}`),
    onSuccess: () => invalidateLibrary(qc, section),
  });
}

/* -------- Admin: items -------- */

export function useAdminItems(params, enabled, section = 'mbbs') {
  const clean = Object.fromEntries(
    Object.entries(params ?? {}).filter(([, v]) => v !== '' && v !== undefined && v !== null)
  );
  return useQuery({
    queryKey: libraryKeys.adminItems(section, clean),
    queryFn: async () =>
      (await api.get(`/admin/${LIBRARY_SECTIONS[section].adminRoot}/items?${new URLSearchParams({ limit: 100, ...clean })}`)).data,
    enabled,
    staleTime: 0,
    refetchOnMount: 'always',
    placeholderData: (prev) => prev,
  });
}

export function useCreateItem(section = 'mbbs') {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.post(`/admin/${LIBRARY_SECTIONS[section].adminRoot}/items`, body),
    onSuccess: () => invalidateLibrary(qc, section),
  });
}

export function useUpdateItem(section = 'mbbs') {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) => api.put(`/admin/${LIBRARY_SECTIONS[section].adminRoot}/items/${id}`, body),
    onSuccess: () => invalidateLibrary(qc, section),
  });
}

export function useDeleteItem(section = 'mbbs') {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.del(`/admin/${LIBRARY_SECTIONS[section].adminRoot}/items/${id}`),
    onSuccess: () => invalidateLibrary(qc, section),
  });
}

export function useUploadFile(section = 'mbbs') {
  const base = `/admin/${LIBRARY_SECTIONS[section].adminRoot}`;
  return useMutation({
    mutationFn: ({ file, onProgress }) => api.uploadFile(base, file, onProgress),
  });
}

/* -------- Admin: blog posts -------- */

export function useAdminPosts(params, enabled, section = 'mbbs') {
  const clean = Object.fromEntries(
    Object.entries(params ?? {}).filter(([, v]) => v !== '' && v !== undefined && v !== null)
  );
  return useQuery({
    queryKey: libraryKeys.adminPosts(section, clean),
    queryFn: async () =>
      (await api.get(`/admin/${LIBRARY_SECTIONS[section].adminRoot}/posts?${new URLSearchParams({ limit: 100, ...clean })}`)).data,
    enabled,
    staleTime: 0,
    refetchOnMount: 'always',
    placeholderData: (prev) => prev,
  });
}

export function useCreatePost(section = 'mbbs') {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.post(`/admin/${LIBRARY_SECTIONS[section].adminRoot}/posts`, body),
    onSuccess: () => invalidateLibrary(qc, section),
  });
}

export function useUpdatePost(section = 'mbbs') {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) => api.put(`/admin/${LIBRARY_SECTIONS[section].adminRoot}/posts/${id}`, body),
    onSuccess: () => invalidateLibrary(qc, section),
  });
}

export function useDeletePost(section = 'mbbs') {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.del(`/admin/${LIBRARY_SECTIONS[section].adminRoot}/posts/${id}`),
    onSuccess: () => invalidateLibrary(qc, section),
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
