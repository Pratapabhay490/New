import { create } from 'zustand';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  duration?: number;
}

interface UIState {
  isToolbarOpen: boolean;
  isSidebarOpen: boolean;
  notifications: Notification[];
  isFullscreen: boolean;

  setToolbarOpen: (open: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleToolbar: () => void;
  toggleSidebar: () => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  setFullscreen: (fullscreen: boolean) => void;
  toggleFullscreen: () => void;
  reset: () => void;
}

const initialState = {
  isToolbarOpen: true,
  isSidebarOpen: false,
  notifications: [],
  isFullscreen: false,
};

export const useUIStore = create<UIState>((set) => ({
  ...initialState,

  setToolbarOpen: (isToolbarOpen) => set({ isToolbarOpen }),

  setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),

  toggleToolbar: () => set((state) => ({ isToolbarOpen: !state.isToolbarOpen })),

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        { ...notification, id: Math.random().toString(36).substr(2, 9) },
      ],
    })),

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  setFullscreen: (isFullscreen) => set({ isFullscreen }),

  toggleFullscreen: () => set((state) => ({ isFullscreen: !state.isFullscreen })),

  reset: () => set(initialState),
}));
