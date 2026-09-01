import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import localforage from 'localforage';

// Setup localforage for Zustand persistence
const localForageStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await localforage.getItem(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await localforage.setItem(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await localforage.removeItem(name);
  },
};

interface AuthState {
  _hasHydrated: boolean;
  isGuest: boolean;
  user: any | null; // Replace with proper Supabase User type later
  resumeText: string | null;
  targetCompany: string | null;
  currentSessionId: string | null;
  currentPhase: string;
  guestResumeCount: number;
  guestInterviewCount: number;
  
  // Actions
  setHasHydrated: (hasHydrated: boolean) => void;
  setGuestMode: () => void;
  setUser: (user: any | null) => void;
  setResumeText: (text: string) => void;
  setTargetCompany: (company: string) => void;
  setCurrentSessionId: (id: string | null) => void;
  setCurrentPhase: (phase: string) => void;
  incrementGuestResume: () => void;
  incrementGuestInterview: () => void;
  syncGuestDataToAccount: () => Promise<void>;
  clearState: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      isGuest: false,
      user: null,
      resumeText: null,
      targetCompany: null,
      currentSessionId: null,
      currentPhase: 'introduction',
      guestResumeCount: 0,
      guestInterviewCount: 0,
      
      setHasHydrated: (_hasHydrated) => set({ _hasHydrated }),
      setGuestMode: () => set({ isGuest: true, user: null }),
      setUser: (user) => set({ user, isGuest: false }),
      setResumeText: (resumeText) => set({ resumeText }),
      setTargetCompany: (targetCompany) => set({ targetCompany }),
      setCurrentSessionId: (currentSessionId) => set({ currentSessionId }),
      setCurrentPhase: (currentPhase) => set({ currentPhase }),
      incrementGuestResume: () => set((state) => ({ guestResumeCount: state.guestResumeCount + 1 })),
      incrementGuestInterview: () => set((state) => ({ guestInterviewCount: state.guestInterviewCount + 1 })),
      syncGuestDataToAccount: async () => {
        const state = get();
        if (!state.user) return;
        // Reset guest counts once synced to cloud
        set({ isGuest: false, guestResumeCount: 0, guestInterviewCount: 0 });
      },
      clearState: () => set({ _hasHydrated: true, isGuest: false, user: null, resumeText: null, targetCompany: null, currentSessionId: null, currentPhase: 'introduction', guestResumeCount: 0, guestInterviewCount: 0 }),
    }),
    {
      name: 'internprep-auth-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localForageStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

export const useAuthHydrated = () => useAuthStore((state) => state._hasHydrated);

