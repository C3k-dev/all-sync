"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useUserStore } from "@/store/userStore";
import styles from "./room.module.scss";
import UserCell from "@/components/cell/UserCell/UserCell";
import RoomHeader from "@/components/header/RoomHeader/RoomHeader";
import ActiveDetailCell from "@/components/cell/ActiveDetailCell/ActiveDetailCell";
import TabButton from "@/components/button/TabButton/TabButton";

interface Participant {
  id: string;
  nickname: string;
  avatar?: string;
  currentTime?: number;
  videoProgress?: number;
  playing?: boolean;
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
  type: "play" | "pause" | "seek" | "join" | "setVideo" | "addToPlaylist";
  nickname: string;
  time: number;
  details?: string;
}

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const socketRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const { nickname, avatar, setNickname, setAvatar } = useUserStore();
  const [nickInput, setNickInput] = useState(nickname || "");
  const [avatarInput, setAvatarInput] = useState(avatar || "");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [state, setState] = useState<RoomState>({
    playlist: [],
    currentIndex: -1,
    paused: true,
    time: 0,
    updatedAt: Date.now(),
  });
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [tab, setTab] = useState<"participants" | "actions" | "playlist">("participants");

  const [localSeeking, setLocalSeeking] = useState(false);
  const [vkInput, setVkInput] = useState("");
  const [vkProgress, setVkProgress] = useState(0);

  // Подключение к Socket.IO
  useEffect(() => {
    const s = io({ path: "/api/socket" });
    socketRef.current = s;

    s.emit("joinRoom", { roomId, nickname: nickname || "Гость", avatar });

    s.on("roomUsers", (list: Participant[]) => setParticipants(list));
    s.on("roomState", (st: RoomState) => setState((prev) => ({ ...prev, ...st })));
    s.on("videoState", (st: RoomState) => setState((prev) => ({ ...prev, ...st })));
    s.on("playlistUpdate", (playlist: string[], currentIndex: number) =>
      setState((prev) => ({ ...prev, playlist, currentIndex }))
    );
    s.on("actionLog", (entry: ActionLog) => setLogs((prev) => [entry, ...prev]));

    s.on("vkDownloadProgress", ({ progress }) => setVkProgress(progress));
    s.on("vkDownloadDone", ({ url }) => {
      socketRef.current?.emit("addToPlaylist", { roomId, url });
      setVkInput("");
      setVkProgress(0);
    });
    s.on("vkDownloadError", ({ error }) => {
      alert(error);
      setVkProgress(0);
    });

    return () => s.disconnect();
  }, [roomId]);

  // Установка src видео при смене плейлиста или текущего индекса
  useEffect(() => {
    if (!videoRef.current) return;
    if (!state.playlist || state.currentIndex < 0 || !state.playlist[state.currentIndex]) return;

    const video = videoRef.current;
    const currentVideo = state.playlist[state.currentIndex];
    const src = currentVideo.startsWith("http") ? currentVideo : window.location.origin + currentVideo;

    if (video.src !== src) {
      video.src = src;
      video.play().catch(() => {});
    }
  }, [state.playlist, state.currentIndex]);

  // Синхронизация видео
  useEffect(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const delta = Math.abs(video.currentTime - state.time);
    if (!video.seeking && delta > 0.5 && video.readyState >= 3) {
      video.currentTime = state.time;
    }

    if (state.paused && !video.paused) video.pause();
    if (!state.paused && video.paused && video.readyState >= 3) {
      video.play().catch(() => {});
    }
  }, [state.time, state.paused]);

  const sendVideoAction = (action: "play" | "pause" | "seek") => {
    if (!videoRef.current) return;
    const now = videoRef.current.currentTime;
    const paused = videoRef.current.paused;

    socketRef.current?.emit("videoAction", { roomId, action, time: now, paused });
    socketRef.current?.emit("addActionLog", {
      roomId,
      type: action,
      nickname,
      time: Date.now(),
      details: `time=${now.toFixed(2)}s`,
    });
  };

  const onPlay = () => sendVideoAction("play");
  const onPause = () => sendVideoAction("pause");
  const onSeeked = () => {
    setLocalSeeking(false);
    sendVideoAction("seek");
  };
  const onSeeking = () => setLocalSeeking(true);

  const onEnded = () => {
    // Удаляем текущее видео из плейлиста и автоплей следующего
    socketRef.current?.emit("removeVideo", { roomId, index: state.currentIndex });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (!videoRef.current || !socketRef.current) return;
      const progress = videoRef.current.duration
        ? (videoRef.current.currentTime / videoRef.current.duration) * 100
        : 0;

      socketRef.current.emit("updateTime", {
        roomId,
        currentTime: videoRef.current.currentTime,
        videoProgress: progress,
        playing: !videoRef.current.paused,
      });
    }, 500);
    return () => clearInterval(interval);
  }, [roomId]);

  const submitProfile = (newNick?: string) => {
    const finalNick = newNick?.trim() || nickInput || "Гость";
    setNickInput(finalNick);
    setNickname(finalNick);
    setAvatar(avatarInput);

    socketRef.current?.emit("updateProfile", { roomId, nickname: finalNick, avatar: avatarInput });
  };

  const onUpload = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (!res.ok) {
      alert("Upload failed");
      return;
    }
    const { url } = await res.json();
    socketRef.current?.emit("addToPlaylist", { roomId, url });
  };

  const submitVk = async () => {
    if (!vkInput) return;
    try {
      const res = await fetch("/api/download-vk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: vkInput, roomId }),
      });
      if (!res.ok) throw new Error("Не удалось загрузить видео VK");
      setVkProgress(0);
    } catch (e: any) {
      alert(e.message);
      setVkProgress(0);
    }
  };

  const formatTime = (time: number) => {
    const m = Math.floor(time / 60).toString().padStart(2, "0");
    const s = Math.floor(time % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <main className={styles.grid}>
      <RoomHeader id_room={roomId} />

      <section className={styles.card}>
        <div className={styles["video-container"]}>
          <video
            ref={videoRef}
            controls
            muted
            width="100%"
            onPlay={onPlay}
            onPause={onPause}
            onSeeked={onSeeked}
            onSeeking={onSeeking}
            onEnded={onEnded}
          />
        </div>

        <div className={styles.uploadContent}>
          <label className={styles.button}>
            Выбрать видео
            <input
              type="file"
              accept="video/*"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUpload(file);
              }}
            />
          </label>

          <div className={styles.vkUpload}>
            <input
              type="text"
              placeholder="Ссылка на VK видео"
              value={vkInput}
              onChange={(e) => setVkInput(e.target.value)}
            />
            <button className={styles.button} onClick={submitVk}>
              Загрузить видео VK
            </button>
            {vkProgress > 0 && <span>Прогресс: {vkProgress.toFixed(0)}%</span>}
          </div>
        </div>

        <div className={styles.tabs}>
          <TabButton text={"Чат"} diasbled />
          <TabButton text={"Зрители"} onClick={() => setTab("participants")} counter={participants.length} active={tab === "participants"} />
          <TabButton text={"Плейлист"} onClick={() => setTab("playlist")} active={tab === "playlist"} />
          <TabButton text={"Журнал действий"} onClick={() => setTab("actions")} active={tab === "actions"} />
        </div>

        {tab === "participants" && (
          <div className={styles.participants}>
            {participants.map((p) => (
              <UserCell
                key={p.id}
                name={p.nickname}
                you={p.nickname === nickname}
                owner={p.isOwner}
                sync_time={formatTime(p.currentTime || 0)}
                sync_play={p.playing ? "ic_pause" : "ic_play"}
                onChange={(newName) => submitProfile(newName)}
              />
            ))}
          </div>
        )}

        {tab === "playlist" && (
          <div className={styles.playlist}>
            {(!state.playlist || state.playlist.length === 0) && <p>Плейлист пуст</p>}
            <ul>
              {state.playlist.map((url, i) => (
                <li
                  key={i}
                  className={i === state.currentIndex ? styles.activeVideo : ""}
                >
                  <span>{url.split("/").pop()?.substring(0, 30)}</span>

                  {i !== state.currentIndex && (
                    <button
                      className={styles.buttonPlayNext}
                      onClick={() => {
                        socketRef.current?.emit("setVideoIndex", { roomId, index: i });
                      }}
                    >
                      Включить
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {tab === "actions" && (
          <div className={styles.actionsLog}>
            {logs.map((log) => (
              <ActiveDetailCell
                key={log.id}
                time={new Date(log.time).toLocaleTimeString()}
                name={log.nickname}
                active={log.details || ''}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
