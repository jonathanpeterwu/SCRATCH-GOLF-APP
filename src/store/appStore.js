import { create } from 'zustand';

export const useAppStore = create((set) => ({
  // User authentication
  user: null,
  setUser: (user) => set({ user }),

  // Golf bag
  golfBag: {
    driver: null,
    woods: [],
    hybrids: [],
    irons: [],
    wedges: [],
    putter: null,
  },
  setGolfBag: (golfBag) => set({ golfBag }),
  addClub: (clubType, club) => set((state) => {
    const newBag = { ...state.golfBag };
    if (clubType === 'driver' || clubType === 'putter') {
      newBag[clubType] = club;
    } else {
      newBag[clubType] = [...newBag[clubType], club];
    }
    return { golfBag: newBag };
  }),
  removeClub: (clubType, index) => set((state) => {
    const newBag = { ...state.golfBag };
    if (clubType === 'driver' || clubType === 'putter') {
      newBag[clubType] = null;
    } else {
      newBag[clubType] = newBag[clubType].filter((_, i) => i !== index);
    }
    return { golfBag: newBag };
  }),

  // GHIN data
  ghinData: null,
  setGhinData: (ghinData) => set({ ghinData }),

  // Theme
  isDarkMode: false,
  toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
  setDarkMode: (isDark) => set({ isDarkMode: isDark }),

  // Chat history
  chatHistory: [],
  addMessage: (message) => set((state) => ({
    chatHistory: [...state.chatHistory, message]
  })),
  clearChat: () => set({ chatHistory: [] }),
}));
