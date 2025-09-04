"use client";

import { useEffect, useRef } from "react";

type PlayerType = "file" | "vk" | "rutube";

interface PlayerAPI {
  play: (time?: number) => void;
  pause: (time?: number) => void;
  seek: (time: number) => void;
}

interface Options {
  type: PlayerType;
  url: string;
  containerId: string; // id контейнера для vk/rutube
  onPlay: (time: number) => void;
  onPause: (time: number) => void;
  onSeek: (time: number) => void;
}

export function useVideoPlayer({ type, url, containerId, onPlay, onPause, onSeek }: Options) {
  const playerRef = useRef<any>(null);

  useEffect(() => {
    if (type === "file") {
      const video = document.getElementById(containerId) as HTMLVideoElement;
      if (!video) return;

      video.src = url;
      video.addEventListener("play", () => onPlay(video.currentTime));
      video.addEventListener("pause", () => onPause(video.currentTime));
      video.addEventListener("seeked", () => onSeek(video.currentTime));

      playerRef.current = {
        play: (time?: number) => {
          if (time !== undefined) video.currentTime = time;
          video.play();
        },
        pause: (time?: number) => {
          if (time !== undefined) video.currentTime = time;
          video.pause();
        },
        seek: (time: number) => {
          video.currentTime = time;
        },
      } as PlayerAPI;
    }

    if (type === "vk") {
      const script = document.createElement("script");
      script.src = "https://vk.com/js/api/openapi.js?169";
      script.onload = () => {
        // @ts-ignore
        const player = new VK.Video(containerId, url, {});
        playerRef.current = {
          play: (time?: number) => {
            if (time !== undefined) player.seekTo(time);
            player.play();
          },
          pause: (time?: number) => {
            if (time !== undefined) player.seekTo(time);
            player.pause();
          },
          seek: (time: number) => player.seekTo(time),
        };

        player.on("play", () => onPlay(player.currentTime()));
        player.on("pause", () => onPause(player.currentTime()));
        player.on("seek", () => onSeek(player.currentTime()));
      };
      document.body.appendChild(script);
    }

    if (type === "rutube") {
      const script = document.createElement("script");
      script.src = "https://rutube.ru/api/player.js";
      script.onload = () => {
        // @ts-ignore
        const player = new RutubePlayer(containerId, { url });
        playerRef.current = {
          play: (time?: number) => {
            if (time !== undefined) player.setCurrentTime(time);
            player.play();
          },
          pause: (time?: number) => {
            if (time !== undefined) player.setCurrentTime(time);
            player.pause();
          },
          seek: (time: number) => player.setCurrentTime(time),
        };

        player.on("play", () => onPlay(player.currentTime));
        player.on("pause", () => onPause(player.currentTime));
        player.on("seek", () => onSeek(player.currentTime));
      };
      document.body.appendChild(script);
    }
  }, [type, url, containerId, onPlay, onPause, onSeek]);

  return playerRef;
}
