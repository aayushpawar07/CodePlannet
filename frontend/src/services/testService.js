import api from './api';

export const testService = {
  getAssignedTests: () => api.get('/tests'),
  getTestById: (id) => api.get(`/tests/${id}`),
  submitTest: (id, data) => api.post(`/tests/${id}/submit`, data),
  getResults: () => api.get('/results'),
};
