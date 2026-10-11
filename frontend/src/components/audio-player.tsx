"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Volume2, VolumeX } from "lucide-react";

interface AudioPlayerProps {
  audioBase64: string;
  autoPlay?: boolean;
  label?: string;
}

export function AudioPlayer({
  audioBase64,
  autoPlay = false,
  label = "Listen to Explanation",
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  React.useEffect(() => {
    if (!audioBase64) return;

    // Convert base64 to data URL or Blob URL
    const audioSrc = audioBase64.startsWith("data:")
      ? audioBase64
      : `data:audio/wav;base64,${audioBase64}`;

    const audio = new Audio(audioSrc);
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      if (autoPlay) {
        audio.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audioRef.current = null;
    };
  }, [audioBase64, autoPlay]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleRestart = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
  };

  if (!audioBase64) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground italic">
        <VolumeX className="w-4 h-4" />
        No audio available for this response
      </div>
    );
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex flex-col gap-2 p-3 rounded-xl bg-primary/5 border border-primary/15 shadow-xs">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            onClick={togglePlay}
            className="rounded-full w-9 h-9 p-0 flex items-center justify-center shrink-0 shadow-sm"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 ml-0.5" />
            )}
          </Button>
          <div className="flex flex-col">
            <span className="text-sm font-semibold flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-primary" />
              {label}
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleRestart}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          title="Restart audio"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-primary/10 rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-primary h-full transition-all duration-150 rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
