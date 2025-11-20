'use client';

import Image from "next/image";
import { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';

export default function MusicPlayer() {
  const [tracks, setTracks] = useState([]);           // [{ url: string, title: string|null }]
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [volume, setVolume] = useState(-6);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);

  const playerRef = useRef(null);
  const gainNodeRef = useRef(null);
  const isPlayingRef = useRef(false);
  const durationRef = useRef(0);
  const offsetRef = useRef(0);
  const startTimeRef = useRef(0);
  const rafRef = useRef(null);

  const now = () => performance.now() / 1000;

  const updatePosition = () => {
    if (!isPlayingRef.current) {
      setPosition(offsetRef.current);
      return;
    }
    const elapsed = now() - startTimeRef.current;
    const pos = Math.min(offsetRef.current + elapsed, durationRef.current);
    setPosition(pos);

    if (durationRef.current > 0 && pos >= durationRef.current - 0.1) {
      handleNext();
    } else {
      rafRef.current = requestAnimationFrame(updatePosition);
    }
  };

  const loadTrack = async (url) => {
    if (!gainNodeRef.current || !url) return;

    if (playerRef.current) {
      playerRef.current.stop();
      playerRef.current.dispose();
    }

    setIsLoaded(false);
    offsetRef.current = 0;
    setPosition(0);

    const player = new Tone.Player({
      url,
      autostart: false,
      onload: () => {
        const dur = player.buffer?.duration || 0;
        setDuration(dur);
        durationRef.current = dur;
        setIsLoaded(true);

        if (isPlayingRef.current) {
          Tone.start();
          player.start();
          startTimeRef.current = now();
          updatePosition();
        }
      },
    }).connect(gainNodeRef.current);

    playerRef.current = player;
    await player.load(url);
  };

  const play = async () => {
    if (!playerRef.current || !isLoaded) return;
    await Tone.start();
    playerRef.current.start(undefined, offsetRef.current);
    startTimeRef.current = now() - offsetRef.current;
    isPlayingRef.current = true;
    setIsPlaying(true);
    updatePosition();
  };

  const pause = () => {
    if (!playerRef.current) return;
    playerRef.current.stop();
    offsetRef.current = position;
    isPlayingRef.current = false;
    setIsPlaying(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  };

  const handleNext = () => {
    setActiveIndex((i) => (i + 1) % tracks.length);
    offsetRef.current = 0;
    setPosition(0);
  };

  const handlePrev = () => {
    setActiveIndex((i) => (i - 1 + tracks.length) % tracks.length);
    offsetRef.current = 0;
    setPosition(0);
  };

  const handleSeek = (e) => {
    const value = Number(e.target.value);
    offsetRef.current = value;
    setPosition(value);
    if (isPlayingRef.current && playerRef.current) {
      playerRef.current.stop();
      playerRef.current.start(undefined, value);
      startTimeRef.current = now() - value;
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Fetch playlist from our fixed API
  useEffect(() => {
    fetch("/api/playlist")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.tracks) && data.tracks.length > 0) {
          setTracks(data.tracks);
          setActiveIndex(0);
        }
      })
      .catch((err) => console.error("Playlist failed", err));
  }, []);

  // Load current track when index changes
  useEffect(() => {
    if (tracks.length > 0 && tracks[activeIndex]?.url) {
      loadTrack(tracks[activeIndex].url);
    }
  }, [activeIndex, tracks]);

  // Volume control
  useEffect(() => {
    if (gainNodeRef.current) gainNodeRef.current.volume.value = volume;
  }, [volume]);

  // Create gain node once
  useEffect(() => {
    gainNodeRef.current = new Tone.Volume(volume).toDestination();
    return () => {
      gainNodeRef.current?.dispose();
      playerRef.current?.dispose();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const currentTrack = tracks[activeIndex] || {};
  const title = currentTrack.title || "Loading...";

  return (
    <div className="music-player fixed bottom-6 right-6 z-50">
      <div className="bg-black/95 backdrop-blur-lg border border-orange-900/50 rounded-3xl p-6 shadow-2xl max-w-md w-full text-white">

        {/* Title */}
        <div className="text-orange-400 font-bold text-xl truncate mb-4">
          {title}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-6 mb-4">
          <button onClick={handlePrev} disabled={tracks.length === 0} className="text-orange-400 hover:text-orange-300 disabled:opacity-50">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>

          <button
            onClick={() => (isPlaying ? pause() : play())}
            disabled={!isLoaded}
            className="w-16 h-16 bg-orange-600 hover:bg-orange-500 rounded-full flex items-center justify-center shadow-xl transition disabled:opacity-50"
          >
            {isLoaded ? (
              isPlaying ? (
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )
            ) : (
              <Image src="/comb-circle.png" width={40} height={40} alt="Loading" className="animate-spin" />
            )}
          </button>

          <button onClick={handleNext} disabled={tracks.length === 0} className="text-orange-400 hover:text-orange-300 disabled:opacity-50">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>{formatTime(position)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <input
            type="range"
            min="0"
            max={duration || 0.01}
            step="0.1"
            value={position}
            onChange={handleSeek}
            className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer accent-orange-600"
            disabled={!isLoaded}
          />
        </div>

        {/* Playlist Chips */}
        <div className="max-h-48 overflow-y-auto">
          <div className="flex flex-wrap gap-2 justify-center">
            {tracks.map((track, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  i === activeIndex
                    ? "bg-orange-600 text-black shadow-lg"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                {track.title || `Track ${i + 1}`}
              </button>
            ))}
          </div>
        </div>

        {/* Volume */}
        <div className="mt-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 9v6h4l5 4V5L9 9H5z" />
          </svg>
          <input
            type="range"
            min="-30"
            max="6"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="flex-1 h-2 bg-gray-700 rounded-full appearance-none cursor-pointer accent-orange-600"
          />
        </div>
      </div>
    </div>
  );
}