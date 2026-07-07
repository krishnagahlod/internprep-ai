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
  isGuest: boolean;
  user: any | null; // Replace with proper Supabase User type later
  resumeText: string | null;
  targetCompany: string | null;
  currentSessionId: string | null;
  currentPhase: string;
  
  // Actions
  setGuestMode: () => void;
  setUser: (user: any | null) => void;
  setResumeText: (text: string) => void;
  setTargetCompany: (company: string) => void;
  setCurrentSessionId: (id: string | null) => void;
  setCurrentPhase: (phase: string) => void;
  clearState: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isGuest: false,
      user: null,
      resumeText: null,
      targetCompany: null,
      currentSessionId: null,
      currentPhase: 'introduction',
      
      setGuestMode: () => set({ isGuest: true, user: null }),
      setUser: (user) => set({ user, isGuest: false }),
      setResumeText: (resumeText) => set({ resumeText }),
      setTargetCompany: (targetCompany) => set({ targetCompany }),
      setCurrentSessionId: (currentSessionId) => set({ currentSessionId }),
      setCurrentPhase: (currentPhase) => set({ currentPhase }),
      clearState: () => set({ isGuest: false, user: null, resumeText: null, targetCompany: null, currentSessionId: null, currentPhase: 'introduction' }),
    }),
    {
      name: 'internprep-auth-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localForageStorage),
    }
  )
);
