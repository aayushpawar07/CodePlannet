import api from './api';

export const adminService = {
  createTest: (data) => api.post('/admin/tests', data),
  getAllTests: () => api.get('/admin/tests'),
  getSubmissions: (testId) => api.get(`/admin/tests/${testId}/submissions`),
  releaseResults: (testId) => api.post(`/admin/tests/${testId}/release`),
  changeUserRole: (userId, data) => api.put(`/admin/users/${userId}/role`, data),
  getAllUsers: () => api.get('/admin/users'),
  getAllTeams: () => api.get('/admin/teams'),
  generateAiQuestions: (data) => api.post('/admin/ai-questions', data),
  downloadScoresCSV: (testId) => api.get(`/admin/tests/${testId}/scores-csv`, { responseType: 'blob' }),
};
