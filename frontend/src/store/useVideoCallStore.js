// frontend/src/store/useVideoCallStore.js
import { create } from "zustand";

export const useVideoCallStore = create((set) => ({
  incomingCall: null, // Almacenará { fromUser, offer }
  setIncomingCall: (call) => set({ incomingCall: call }),
  clearIncomingCall: () => set({ incomingCall: null }),
}));