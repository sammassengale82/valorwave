import { create } from "zustand";

interface SingerAvatarState {
  avatars: Record<string, string>; // singerId -> avatar file path
  setAvatar: (singerId: string, path: string) => void;
  getAvatar: (singerId: string) => string | undefined;
}

export const useSingerAvatarState = create<SingerAvatarState>((set, get) => ({
  avatars: {},
  setAvatar: (singerId, path) =>
    set((state) => ({
      avatars: {
        ...state.avatars,
        [singerId]: path,
      },
    })),
  getAvatar: (singerId) => get().avatars[singerId],
}));
