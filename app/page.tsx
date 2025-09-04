"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import Link from "next/link";
import Image from "next/image";
import { LoginButton } from "@telegram-auth/react";

type TelegramUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
};

type RoomHistoryItem = {
  roomId: string;
  role: "owner" | "guest";
  joinedAt: number;
};

export default function HomePage() {
  const router = useRouter();
  const {
    nickname,
    setNickname,
    history,
    setHistory,
    addRoomHistory,
    removeRoomHistory,
    telegramUser,
    setTelegramUser
  } = useUserStore();

  const [nicknameInput, setNicknameInput] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");

  // Загружаем историю после авторизации через Telegram
  useEffect(() => {
    if (!telegramUser) return;
    fetch(`/api/history?telegramId=${telegramUser.id}`)
      .then((res) => res.json())
      .then((data) => Array.isArray(data) && setHistory(data))
      .catch(console.error);
  }, [telegramUser, setHistory]);

  const createRoom = async () => {
    if (!nicknameInput.trim()) return alert("Введите ник");
    setNickname(nicknameInput.trim());
    const roomId = Math.random().toString(36).substring(2, 8);
    addRoomHistory(roomId, "owner");

    if (telegramUser) {
      await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramId: telegramUser.id, roomId, role: "owner" })
      });
    }

    router.push(`/room/${roomId}`);
  };

  const joinRoom = async () => {
    if (!nicknameInput.trim()) return alert("Введите ник");
    if (!joinRoomId.trim()) return alert("Введите ID комнаты");
    setNickname(nicknameInput.trim());
    addRoomHistory(joinRoomId.trim(), "guest");

    if (telegramUser) {
      await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramId: telegramUser.id, roomId: joinRoomId.trim(), role: "guest" })
      });
    }

    router.push(`/room/${joinRoomId.trim()}`);
  };

  const onTelegramAuth = async (data: TelegramUser) => {
    setTelegramUser(data);
    setNickname(data.username || data.first_name || "Гость");
    // Загружаем историю
    const res = await fetch(`/api/history?telegramId=${data.id}`);
    const rooms = await res.json();
    if (Array.isArray(rooms)) setHistory(rooms);
  };

  return (
    <main className="container">
      {!telegramUser ? (
        <LoginButton
          botUsername="allsync_bot"
          onAuthCallback={onTelegramAuth}
          buttonSize="large"
          cornerRadius={5}
          showAvatar={true}
          lang="en"
        />
      ) : (
        <div className="profile-info" style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 20 }}>
          {telegramUser.photo_url && (
            <Image
              src={telegramUser.photo_url}
              alt={telegramUser.username || telegramUser.first_name}
              width={40}
              height={40}
              className="rounded-full"
            />
          )}
          <span>{telegramUser.username || telegramUser.first_name}</span>
        </div>
      )}

      <div className="card" style={{ marginTop: 20 }}>
        <input
          className="input"
          type="text"
          placeholder="Ваш ник"
          value={nicknameInput}
          onChange={(e) => setNicknameInput(e.target.value)}
        />
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button onClick={createRoom}>Создать комнату</button>
          <input
            type="text"
            placeholder="ID комнаты"
            value={joinRoomId}
            onChange={(e) => setJoinRoomId(e.target.value)}
          />
          <button onClick={joinRoom}>Войти в комнату</button>
        </div>
      </div>

      <ul style={{ marginTop: 20 }}>
        {history
          .sort((a, b) => b.joinedAt - a.joinedAt)
          .map((h: RoomHistoryItem) => (
            <li key={h.roomId} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Link href={`/room/${h.roomId}`}>{h.roomId}</Link>
              <span>({h.role})</span>
            </li>
          ))}
      </ul>
    </main>
  );
}
