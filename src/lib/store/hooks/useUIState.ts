import {
  useUIStore,
  selectIsAnyLoading,
  selectHasErrors,
  selectCurrentModal,
  selectLoadingKeys,
  selectErrorMessages,
} from "../domains/ui/store";

export function useUIState() {
  const store = useUIStore();

  return {
    // State
    selectedTour: store.selectedTour,
    selectedTournament: store.selectedTournament,
    sidebarOpen: store.sidebarOpen,
    theme: store.theme,

    // Actions
    setLoading: store.setLoading,
    setError: store.setError,
    clearError: store.clearError,
    clearAllErrors: store.clearAllErrors,
    toggleModal: store.toggleModal,
    openModal: store.openModal,
    closeModal: store.closeModal,
    closeAllModals: store.closeAllModals,
    setSelectedTour: store.setSelectedTour,
    setSelectedTournament: store.setSelectedTournament,
    setSidebarOpen: store.setSidebarOpen,
    setTheme: store.setTheme,

    // Computed
    isAnyLoading: selectIsAnyLoading(store),
    hasErrors: selectHasErrors(store),
    currentModal: selectCurrentModal(store),
    loadingKeys: selectLoadingKeys(store),
    errorMessages: selectErrorMessages(store),
  };
}

export function useLoadingState(key: string) {
  const { setLoading } = useUIState();
  const store = useUIStore();

  return {
    isLoading: store.loadingStates.get(key) || false,
    setLoading: (loading: boolean) => setLoading(key, loading),
  };
}

export function useErrorState(key: string) {
  const { setError, clearError } = useUIState();
  const store = useUIStore();

  return {
    error: store.errors.get(key) || null,
    setError: (error: Error | null) => setError(key, error),
    clearError: () => clearError(key),
  };
}

export function useModal(modalId: string) {
  const { openModal, closeModal, toggleModal } = useUIState();
  const store = useUIStore();

  return {
    isOpen: store.modals.get(modalId) || false,
    open: () => openModal(modalId),
    close: () => closeModal(modalId),
    toggle: () => toggleModal(modalId),
  };
}
