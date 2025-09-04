/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/socket/route.ts
import { NextRequest } from "next/server";
import { Server as IOServer, Socket } from "socket.io";
import { randomUUID } from "crypto";

// --- Типы ---
interface Participant {
  id: string;
  nickname: string;
  avatar?: string;
  isOwner?: boolean;
  currentTime?: number;
  videoProgress?: number;
  playing?: boolean;
}

interface RoomState {
  playlist: string[];
  currentIndex: number;
  paused: boolean;
  time: number;
  updatedAt: number;
}

interface ActionLog {
  id: string;
  type: "play" | "pause" | "seek" | "join" | "setVideo" | "addToPlaylist" | "removeVideo";
  nickname: string;
  time: number;
  details?: string;
}

// --- Состояние комнат ---
const rooms = new Map<string, RoomState>();
const roomUsers = new Map<string, Map<string, Participant>>();
const roomLogs = new Map<string, ActionLog[]>();

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextRequest) {
  const socketServer = (req as any).socket?.server;

  if (!socketServer) {
    return new Response("Socket server not available", { status: 500 });
  }

  // Создаем Socket.IO сервер только один раз
  if (!(socketServer as any).io) {
    const io = new IOServer(socketServer as any, { path: "/api/socket" });
    (socketServer as any).io = io;

    io.on("connection", (socket: Socket) => {
      // --- JOIN ROOM ---
      socket.on(
        "joinRoom",
        ({ roomId, nickname, avatar }: { roomId: string; nickname?: string; avatar?: string }) => {
          socket.join(roomId);

          if (!roomUsers.has(roomId)) roomUsers.set(roomId, new Map());
          const usersMap = roomUsers.get(roomId)!;

          const isOwner = usersMap.size === 0;
          const user: Participant = { id: socket.id, nickname: nickname || "Гость", avatar, isOwner };
          usersMap.set(socket.id, user);

          if (!rooms.has(roomId))
            rooms.set(roomId, { playlist: [], currentIndex: -1, paused: true, time: 0, updatedAt: Date.now() });
          if (!roomLogs.has(roomId)) roomLogs.set(roomId, []);

          io.to(roomId).emit("roomUsers", Array.from(usersMap.values()));
          socket.emit("roomState", rooms.get(roomId));
          socket.emit("actionLog", roomLogs.get(roomId) || []);
          socket.emit("playlistUpdate", rooms.get(roomId)!.playlist, rooms.get(roomId)!.currentIndex);

          const log: ActionLog = {
            id: randomUUID(),
            type: "join",
            nickname: nickname || "Гость",
            time: Date.now(),
            details: "Подключился в комнату",
          };
          roomLogs.get(roomId)?.unshift(log);
          io.to(roomId).emit("actionLog", log);
        }
      );

      // --- UPDATE PROFILE ---
      socket.on("updateProfile", ({ roomId, nickname, avatar }: { roomId: string; nickname?: string; avatar?: string }) => {
        const usersMap = roomUsers.get(roomId);
        if (!usersMap) return;
        const user = usersMap.get(socket.id);
        if (!user) return;

        user.nickname = nickname || "Гость";
        user.avatar = avatar || undefined;

        io.to(roomId).emit("roomUsers", Array.from(usersMap.values()));

        const log: ActionLog = { id: randomUUID(), type: "join", nickname: user.nickname, time: Date.now(), details: "Обновлено имя" };
        roomLogs.get(roomId)?.unshift(log);
        io.to(roomId).emit("actionLog", log);
      });

      // --- ADD VIDEO ---
      socket.on("addToPlaylist", ({ roomId, url }: { roomId: string; url: string }) => {
        const room = rooms.get(roomId);
        if (!room) return;

        room.playlist.push(url);
        if (room.currentIndex === -1) room.currentIndex = room.playlist.length - 1;
        room.updatedAt = Date.now();
        rooms.set(roomId, room);

        io.to(roomId).emit("playlistUpdate", room.playlist, room.currentIndex);

        const log: ActionLog = {
          id: randomUUID(),
          type: "addToPlaylist",
          nickname: roomUsers.get(roomId)?.get(socket.id)?.nickname || "Гость",
          time: Date.now(),
          details: "Видео добавлено в плейлист",
        };
        roomLogs.get(roomId)?.unshift(log);
        io.to(roomId).emit("actionLog", log);
      });

      // --- SET VIDEO INDEX ---
      socket.on("setVideoIndex", ({ roomId, index }: { roomId: string; index: number }) => {
        const room = rooms.get(roomId);
        if (!room || index < 0 || index >= room.playlist.length) return;

        room.currentIndex = index;
        room.paused = false;
        room.time = 0;
        room.updatedAt = Date.now();
        rooms.set(roomId, room);

        io.to(roomId).emit("playlistUpdate", room.playlist, room.currentIndex);
        io.to(roomId).emit("videoState", room);
      });

      // --- NEXT VIDEO ---
      socket.on("nextVideo", ({ roomId }: { roomId: string }) => {
        const room = rooms.get(roomId);
        if (!room) return;

        if (room.currentIndex >= 0 && room.currentIndex < room.playlist.length) room.playlist.splice(room.currentIndex, 1);

        if (room.playlist.length === 0) {
          room.currentIndex = -1;
          room.paused = true;
          room.time = 0;
        } else {
          room.currentIndex = Math.min(room.currentIndex, room.playlist.length - 1);
          room.paused = false;
          room.time = 0;
        }

        room.updatedAt = Date.now();
        rooms.set(roomId, room);

        io.to(roomId).emit("playlistUpdate", room.playlist, room.currentIndex);
        io.to(roomId).emit("videoState", room);

        const log: ActionLog = {
          id: randomUUID(),
          type: "removeVideo",
          nickname: roomUsers.get(roomId)?.get(socket.id)?.nickname || "Гость",
          time: Date.now(),
          details: "Видео завершено и удалено из плейлиста",
        };
        roomLogs.get(roomId)?.unshift(log);
        io.to(roomId).emit("actionLog", log);
      });

      // --- VIDEO ACTION ---
      socket.on(
        "videoAction",
        ({ roomId, action, time, paused }: { roomId: string; action: ActionLog["type"]; time: number; paused?: boolean }) => {
          const room = rooms.get(roomId);
          if (!room) return;

          if (action === "play") room.paused = false;
          if (action === "pause") room.paused = true;
          if (action === "seek") room.time = time;
          if (typeof paused === "boolean") room.paused = paused;

          room.updatedAt = Date.now();
          rooms.set(roomId, room);

          io.to(roomId).emit("videoState", room);

          const log: ActionLog = {
            id: randomUUID(),
            type: action,
            nickname: roomUsers.get(roomId)?.get(socket.id)?.nickname || "Гость",
            time: Date.now(),
            details: `time=${time?.toFixed(2)}s`,
          };
          roomLogs.get(roomId)?.unshift(log);
          io.to(roomId).emit("actionLog", log);
        }
      );

      // --- UPDATE TIME ---
      socket.on(
        "updateTime",
        ({ roomId, currentTime, videoProgress, playing }: { roomId: string; currentTime: number; videoProgress: number; playing: boolean }) => {
          const usersMap = roomUsers.get(roomId);
          if (!usersMap) return;
          const user = usersMap.get(socket.id);
          if (!user) return;

          user.currentTime = currentTime;
          user.videoProgress = videoProgress;
          user.playing = playing;

          io.to(roomId).emit("roomUsers", Array.from(usersMap.values()));
        }
      );

      // --- DISCONNECT ---
      socket.on("disconnecting", () => {
        socket.rooms.forEach((roomId) => {
          if (roomId === socket.id) return;
          const usersMap = roomUsers.get(roomId);
          if (!usersMap) return;

          usersMap.delete(socket.id);

          if (usersMap.size > 0) {
            const ownerExists = Array.from(usersMap.values()).some((u) => u.isOwner);
            if (!ownerExists) {
              const firstUser = Array.from(usersMap.values())[0];
              if (firstUser) firstUser.isOwner = true;
            }
          } else {
            roomUsers.delete(roomId);
            rooms.delete(roomId);
            roomLogs.delete(roomId);
          }

          io.to(roomId).emit("roomUsers", Array.from(usersMap.values()));
        });
      });
    });
  }

  return new Response(null, { status: 200 });
}
