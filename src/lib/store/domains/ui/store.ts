import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

interface UIState {
  loadingStates: Map<string, boolean>;
  errors: Map<string, Error>;
  modals: Map<string, boolean>;
  selectedTour: string | null;
  selectedTournament: string | null;
  sidebarOpen: boolean;
  theme: "light" | "dark" | "system";
}

interface UIActions {
  setLoading: (key: string, loading: boolean) => void;
  setError: (key: string, error: Error | null) => void;
  clearError: (key: string) => void;
  clearAllErrors: () => void;
  toggleModal: (modalId: string) => void;
  openModal: (modalId: string) => void;
  closeModal: (modalId: string) => void;
  closeAllModals: () => void;
  setSelectedTour: (tourId: string | null) => void;
  setSelectedTournament: (tournamentId: string | null) => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
  reset: () => void;
}

export type UIStore = UIState & UIActions;

const initialState: UIState = {
  loadingStates: new Map(),
  errors: new Map(),
  modals: new Map(),
  selectedTour: null,
  selectedTournament: null,
  sidebarOpen: false,
  theme: "system",
};

export const useUIStore = create<UIStore>()(
  devtools(
    immer((set, get) => ({
      ...initialState,

      setLoading: (key, loading) =>
        set((state) => {
          if (loading) {
            state.loadingStates.set(key, true);
          } else {
            state.loadingStates.delete(key);
          }
        }),

      setError: (key, error) =>
        set((state) => {
          if (error) {
            state.errors.set(key, error);
          } else {
            state.errors.delete(key);
          }
        }),

      clearError: (key) =>
        set((state) => {
          state.errors.delete(key);
        }),

      clearAllErrors: () =>
        set((state) => {
          state.errors.clear();
        }),

      toggleModal: (modalId) =>
        set((state) => {
          const isOpen = state.modals.get(modalId) || false;
          state.modals.set(modalId, !isOpen);
        }),

      openModal: (modalId) =>
        set((state) => {
          state.modals.set(modalId, true);
        }),

      closeModal: (modalId) =>
        set((state) => {
          state.modals.set(modalId, false);
        }),

      closeAllModals: () =>
        set((state) => {
          state.modals.clear();
        }),

      setSelectedTour: (tourId) =>
        set((state) => {
          state.selectedTour = tourId;
        }),

      setSelectedTournament: (tournamentId) =>
        set((state) => {
          state.selectedTournament = tournamentId;
        }),

      setSidebarOpen: (open) =>
        set((state) => {
          state.sidebarOpen = open;
        }),

      setTheme: (theme) =>
        set((state) => {
          state.theme = theme;
        }),

      reset: () => set(initialState),
    })),
    { name: "UIStore" },
  ),
);

// Computed selectors
export const selectIsAnyLoading = (store: UIStore) => {
  return store.loadingStates.size > 0;
};

export const selectHasErrors = (store: UIStore) => {
  return store.errors.size > 0;
};

export const selectCurrentModal = (store: UIStore) => {
  for (const [modalId, isOpen] of store.modals.entries()) {
    if (isOpen) return modalId;
  }
  return null;
};

export const selectLoadingKeys = (store: UIStore) => {
  return Array.from(store.loadingStates.keys());
};

export const selectErrorMessages = (store: UIStore) => {
  return Array.from(store.errors.entries()).map(([key, error]) => ({
    key,
    message: error.message,
  }));
};
