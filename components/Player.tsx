'use client';

import { useRef, useEffect, useState } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';

function formatTime(time: number) {
  if (isNaN(time) || !isFinite(time) || time < 0) return '0:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function Player() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    currentSong,
    isPlaying,
    volume,
    currentTime,
    duration,
    setIsPlaying,
    playNext,
    playPrevious,
    setVolume,
    setCurrentTime,
    setDuration,
  } = usePlayerStore();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentSong) {
      setLoading(true);
      setError(null);
      audio.src = currentSong.url;
      audio.load();
    }
  }, [currentSong]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;
    if (isPlaying) {
      audio.play().catch((err) => {
        if (err && err.name !== 'NotAllowedError') {
          setLoading(false);
          setError('Playback failed. Tap retry.');
        }
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, currentSong]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const retry = () => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;
    setError(null);
    setLoading(true);
    const sep = currentSong.url.includes('?') ? '&' : '?';
    audio.src = `${currentSong.url}${sep}retry=${Date.now()}`;
    audio.load();
    audio.play().catch(() => undefined);
  };

  if (!currentSong) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-neutral-900/95 backdrop-blur border-t border-neutral-700 z-50">
      <audio
        ref={audioRef}
        onTimeUpdate={() =>
          audioRef.current && setCurrentTime(audioRef.current.currentTime)
        }
        onLoadedMetadata={() =>
          audioRef.current && setDuration(audioRef.current.duration || 0)
        }
        onCanPlay={() => {
          setLoading(false);
          setError(null);
        }}
        onPlaying={() => {
          setLoading(false);
          setError(null);
        }}
        onWaiting={() => setLoading(true)}
        onEnded={playNext}
        onError={() => {
          setLoading(false);
          setIsPlaying(false);
          setError('Playback failed. Tap retry.');
        }}
      />
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        <div className="flex items-center gap-3 w-1/4 min-w-0">
          <img
            src={currentSong.thumbnail || '/placeholder.svg'}
            alt={currentSong.title}
            className="w-12 h-12 object-cover rounded bg-neutral-700"
          />
          <div className="min-w-0">
            <h3 className="font-medium truncate text-sm">{currentSong.title}</h3>
            <p className="text-xs text-gray-400 truncate">{currentSong.artist}</p>
            {error && (
              <button
                onClick={retry}
                className="mt-0.5 flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
              >
                <RotateCcw className="w-3 h-3" /> Retry
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center gap-1 flex-1 max-w-xl">
          <div className="flex items-center gap-4">
            <button
              onClick={playPrevious}
              className="p-2 hover:bg-neutral-800 rounded-full transition-colors"
              aria-label="Previous"
            >
              <SkipBack className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-3 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={playNext}
              className="p-2 hover:bg-neutral-800 rounded-full transition-colors"
              aria-label="Next"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-2 w-full">
            <span className="text-[11px] text-gray-400 tabular-nums w-9 text-right">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={Math.min(currentTime, duration || 0)}
              onChange={handleSeek}
              className="flex-1 h-1 bg-neutral-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <span className="text-[11px] text-gray-400 tabular-nums w-9">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 w-1/4 justify-end">
          <button
            onClick={() => setVolume(volume === 0 ? 0.8 : 0)}
            className="p-2 hover:bg-neutral-800 rounded-full transition-colors"
            aria-label="Mute"
          >
            {volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-24 h-1 bg-neutral-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
            aria-label="Volume"
          />
        </div>
      </div>
    </div>
  );
}
