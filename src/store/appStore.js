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

  // Courses: ratings and tee time bookings, mirrored from the private db so
  // screens can render synchronously. The db stays the source of truth.
  reviews: [],
  bookings: [],
  setCourseData: ({ reviews, bookings }) => set({
    reviews: reviews ?? [],
    bookings: bookings ?? [],
  }),
  upsertReview: (review) => set((state) => ({
    reviews: [
      ...state.reviews.filter((existing) => existing.id !== review.id),
      review,
    ],
  })),
  removeReview: (reviewId) => set((state) => ({
    reviews: state.reviews.filter((review) => review.id !== reviewId),
  })),
  addBooking: (booking) => set((state) => ({ bookings: [...state.bookings, booking] })),
  replaceBooking: (booking) => set((state) => ({
    bookings: state.bookings.map((existing) => (existing.id === booking.id ? booking : existing)),
  })),
  clearCourseData: () => set({ reviews: [], bookings: [] }),

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
