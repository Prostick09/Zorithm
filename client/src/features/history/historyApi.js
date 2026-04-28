const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const historyApi = {
  getSessions: async () => {
    const response = await fetch(`${API_URL}/history`);
    if (!response.ok) throw new Error('Failed to fetch sessions');
    const data = await response.json();
    return data.data || data; 
  },
  
  getSessionDetails: async (sessionId) => {
    const response = await fetch(`${API_URL}/history/${sessionId}`);
    if (!response.ok) throw new Error('Failed to fetch session details');
    const data = await response.json();
    return data.data || data;
  },
  
  deleteSession: async (sessionId) => {
    const response = await fetch(`${API_URL}/history/${sessionId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete session');
    const data = await response.json();
    return data;
  }
};
