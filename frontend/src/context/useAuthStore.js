import { create } from 'zustand';
import axios from 'axios';

export const useAuthStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  fetchUser: async () => {
    try {
      const res = await axios.get('/api/v1/user/me', {
        withCredentials: true, 
      });
      set({ user: res.data });
    } catch (err) {
      console.error('Failed to fetch user:', err);
      set({ user: null }); // optionally clear user
    }
  },
}));

