import type { NextApiRequest, NextApiResponse } from "next";
import { Server as IOServer } from "socket.io";
import { randomUUID } from "crypto";

interface Participant {
  id: string;
  nickname: string;
  avatar?: string;
  isOwner?: boolean;
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

const rooms = new Map<string, RoomState>();
const roomUsers = new Map<string, Map<string, Participant>>();
const roomLogs = new Map<string, ActionLog[]>();

export default function handler(req: NextApiRequest, res: NextApiResponse & { socket: any }) {
  if (!res.socket.server.io) {
    const io = new IOServer(res.socket.server, { path: "/api/socket" });
    res.socket.server.io = io;

    io.on("connection", (socket) => {
      // Подключение к комнате
      socket.on("joinRoom", ({ roomId, nickname, avatar }) => {
        socket.join(roomId);

        if (!roomUsers.has(roomId)) roomUsers.set(roomId, new Map());
        const usersMap = roomUsers.get(roomId)!;
        const isOwner = usersMap.size === 0;
        const user: Participant = { id: socket.id, nickname: nickname || "Гость", avatar, isOwner };
        usersMap.set(socket.id, user);

        if (!rooms.has(roomId)) rooms.set(roomId, { playlist: [], currentIndex: -1, paused: true, time: 0, updatedAt: Date.now() });
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
      });

      // Обновление профиля
      socket.on("updateProfile", ({ roomId, nickname, avatar }) => {
        const usersMap = roomUsers.get(roomId);
        if (!usersMap) return;
        const user = usersMap.get(socket.id);
        if (!user) return;

        user.nickname = nickname || "Гость";
        user.avatar = avatar || undefined;

        io.to(roomId).emit("roomUsers", Array.from(usersMap.values()));

        const log: ActionLog = {
          id: randomUUID(),
          type: "join",
          nickname: user.nickname,
          time: Date.now(),
          details: "Обновлено имя",
        };
        roomLogs.get(roomId)?.unshift(log);
        io.to(roomId).emit("actionLog", log);
      });

      // Добавление видео в плейлист
      socket.on("addToPlaylist", ({ roomId, url }) => {
        const room = rooms.get(roomId);
        if (!room) return;

        room.playlist.push(url);
        // Если нет текущего видео, ставим новое
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

      // Установка текущего видео
      socket.on("setVideoIndex", ({ roomId, index }) => {
        const room = rooms.get(roomId);
        if (!room) return;
        if (index < 0 || index >= room.playlist.length) return;

        room.currentIndex = index;
        room.paused = false;
        room.time = 0;
        room.updatedAt = Date.now();
        rooms.set(roomId, room);

        io.to(roomId).emit("playlistUpdate", room.playlist, room.currentIndex);
        io.to(roomId).emit("videoState", room);
      });

      // Видео завершилось — удаляем и автоплей следующего
      socket.on("nextVideo", ({ roomId }) => {
        const room = rooms.get(roomId);
        if (!room) return;

        // Удаляем текущее видео
        if (room.currentIndex >= 0 && room.currentIndex < room.playlist.length) {
          room.playlist.splice(room.currentIndex, 1);
        }

        // Ставим следующий видео
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

      // Действия видео
      socket.on("videoAction", ({ roomId, action, time, paused }) => {
        const room = rooms.get(roomId);
        if (!room) return;

        if (action === "play") room.paused = false;
        if (action === "pause") room.paused = true;
        if (action === "seek" && typeof time === "number") room.time = time;
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
      });

      // Синхронизация времени
      socket.on("updateTime", ({ roomId, currentTime, videoProgress, playing }) => {
        const usersMap = roomUsers.get(roomId);
        if (!usersMap) return;
        const user = usersMap.get(socket.id);
        if (!user) return;

        user.currentTime = currentTime;
        user.videoProgress = videoProgress;
        user.playing = playing;

        io.to(roomId).emit("roomUsers", Array.from(usersMap.values()));
      });

      // Отключение
      socket.on("disconnecting", () => {
        for (const roomId of socket.rooms) {
          if (roomId === socket.id) continue;
          const usersMap = roomUsers.get(roomId);
          if (!usersMap) continue;
          usersMap.delete(socket.id);

          if (usersMap.size > 0) {
            const ownerExists = Array.from(usersMap.values()).some((u) => u.isOwner);
            if (!ownerExists) {
              const firstUser = usersMap.values().next().value;
              firstUser.isOwner = true;
            }
          } else {
            roomUsers.delete(roomId);
            rooms.delete(roomId);
            roomLogs.delete(roomId);
          }

          io.to(roomId).emit("roomUsers", Array.from(usersMap.values()));
        }
      });
    });
  }

  res.end();
}

export const config = { api: { bodyParser: false } };
