import { create } from 'zustand';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

const useAnalysisStore = create((set) => ({
    inputText: '',
    status: 'idle', // idle, analyzing, completed, error
    result: null,
    error: null,
    history: [],
    publicHistory: [],
    stats: { total: 0, suspect: 0 },

    setInputText: (text) => set({ inputText: text }),

    analyzeText: async (text) => {
        set({ status: 'analyzing', error: null, result: null });
        try {
            const response = await axios.post(`${API_URL}/analyses`, { text });
            set({
                status: 'completed',
                result: response.data,
                history: [response.data, ...useAnalysisStore.getState().history]
            });
            // Refresh global stats/history
            useAnalysisStore.getState().fetchHistory();
            useAnalysisStore.getState().fetchStats();
        } catch (error) {
            set({
                status: 'error',
                error: error.response?.data?.error || 'Erro ao conectar com o servidor.'
            });
        }
    },

    fetchHistory: async () => {
        try {
            const response = await axios.get(`${API_URL}/analyses`);
            set({ publicHistory: response.data });
        } catch (e) { console.error(e); }
    },

    fetchStats: async () => {
        try {
            const response = await axios.get(`${API_URL}/stats`);
            set({ stats: response.data });
        } catch (e) { console.error(e); }
    },

    reset: () => set({ status: 'idle', result: null, error: null, inputText: '' })
}));

export default useAnalysisStore;
