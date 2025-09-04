"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import io from "socket.io-client";

const socket = io("/api/socket");

const movies = {
  "1": { title: "Интерстеллар", year: 2014, url: "/videos/interstellar.mp4" },
  "2": { title: "Темный рыцарь", year: 2008, url: "/videos/darkknight.mp4" },
  "3": { title: "Начало", year: 2010, url: "/videos/inception.mp4" },
};

export default function MoviePage() {
  const { id } = useParams<{ id: string }>();
  const movie = movies[id as keyof typeof movies];
  const [rooms, setRooms] = useState<string[]>(["room1", "room2"]); // список комнат пользователя
  const [selectedRoom, setSelectedRoom] = useState("");

  const addToRoom = () => {
    if (!selectedRoom) return alert("Выберите комнату!");
    socket.emit("addToPlaylist", { roomId: selectedRoom, url: movie.url });
    alert(`Фильм "${movie.title}" добавлен в комнату ${selectedRoom}`);
  };

  if (!movie) return <p>Фильм не найден</p>;

  return (
    <main>
      <h1>{movie.title}</h1>
      <p>{movie.year}</p>
      <video src={movie.url} controls width="600" />

      <div>
        <h3>Добавить в комнату:</h3>
        <select value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)}>
          <option value="">Выберите комнату</option>
          {rooms.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <button onClick={addToRoom}>Добавить</button>
      </div>
    </main>
  );
}
