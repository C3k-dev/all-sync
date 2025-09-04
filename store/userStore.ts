"use client";
import { create } from "zustand";

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export interface RoomHistoryEntry {
  roomId: string;
  role: "owner" | "guest";
  joinedAt: number;
  videos: string[];
}

interface UserState {
  nickname: string | null;
  avatar: string | null;
  telegramUser: TelegramUser | null;
  history: RoomHistoryEntry[];

  setNickname: (nickname: string) => void;
  setAvatar: (avatar: string | null) => void;
  setTelegramUser: (user: TelegramUser | null) => void;
  setHistory: (history: RoomHistoryEntry[]) => void;

  addRoomHistory: (roomId: string, role: "owner" | "guest") => void;
  addVideoToRoom: (roomId: string, url: string) => void;
  removeRoomHistory: (roomId: string) => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  nickname: typeof window !== "undefined" ? localStorage.getItem("nickname") : null,
  avatar: typeof window !== "undefined" ? localStorage.getItem("avatar") : null,
  telegramUser:
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("telegramUser") || "null")
      : null,
  history:
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("roomHistory") || "[]")
      : [],

  setNickname: (nickname) => {
    set({ nickname });
    if (typeof window !== "undefined") localStorage.setItem("nickname", nickname);
  },

  setAvatar: (avatar) => {
    set({ avatar });
    if (typeof window !== "undefined") {
      avatar ? localStorage.setItem("avatar", avatar) : localStorage.removeItem("avatar");
    }
  },

  setTelegramUser: (user) => {
    set({ telegramUser: user });
    if (typeof window !== "undefined") {
      user
        ? localStorage.setItem("telegramUser", JSON.stringify(user))
        : localStorage.removeItem("telegramUser");
    }
  },

  setHistory: (history) => {
    set({ history });
    if (typeof window !== "undefined") localStorage.setItem("roomHistory", JSON.stringify(history));
  },

  addRoomHistory: (roomId, role) => {
    const newEntry: RoomHistoryEntry = { roomId, role, joinedAt: Date.now(), videos: [] };
    const updated = [...get().history.filter((h) => h.roomId !== roomId), newEntry];
    set({ history: updated });
    if (typeof window !== "undefined") localStorage.setItem("roomHistory", JSON.stringify(updated));
  },

  addVideoToRoom: (roomId, url) => {
    const updated = get().history.map((h) =>
      h.roomId === roomId ? { ...h, videos: [...h.videos, url] } : h
    );
    set({ history: updated });
    if (typeof window !== "undefined") localStorage.setItem("roomHistory", JSON.stringify(updated));
  },

  removeRoomHistory: (roomId) => {
    const updated = get().history.filter((h) => h.roomId !== roomId);
    set({ history: updated });
    if (typeof window !== "undefined") localStorage.setItem("roomHistory", JSON.stringify(updated));
  },
}));
