'use client';

import { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';

const titleFromUrl = (url) => {
  try {
    const name = url.split('/').pop() || '';
    return decodeURIComponent(name.replace(/\.(mp3|m4a|ogg|wav)$/i, ''));
  } catch {
    return url;
  }
};

export default function MusicPlayer() {
  // dynamic playlist from API
  const [playlist, setPlaylist] = useState([]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [volume, setVolume] = useState(-6); // dB
  const [activeTrackIndex, setActiveTrackIndex] = useState(0);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);

  const player = useRef(null);
  const gainNode = useRef(null);

  // refs to avoid stale closures
  const isPlayingRef = useRef(false);
  const durationRef = useRef(0);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { durationRef.current = duration; }, [duration]);

  // timing
  const startTimeRef = useRef(0);   // performance.now() seconds when started
  const offsetRef = useRef(0);      // paused offset seconds
  const rafRef = useRef(null);
  const manualStopRef = useRef(false);
  const autoplayNextRef = useRef(false);

  const nowSec = () => performance.now() / 1000;

  const getPosition = () => {
    const dur = durationRef.current || 0;
    if (!player.current) return 0;
    if (isPlayingRef.current) {
      const elapsed = nowSec() - startTimeRef.current;
      return Math.min(offsetRef.current + elapsed, dur);
    }
    return Math.min(offsetRef.current, dur);
  };

  const startRaf = () => {
    cancelAnimationFrame(rafRef.current);
    const tick = () => {
      const dur = durationRef.current || 0;
      const pos = getPosition();
      setPosition(pos);

      // Fallback auto-advance
      if (isPlayingRef.current && dur > 0 && pos >= dur - 0.05) {
        setIsPlaying(false);
        isPlayingRef.current = false;
        cancelAnimationFrame(rafRef.current);
        autoplayNextRef.current = true;
        setActiveTrackIndex((i) => (i + 1) % playlist.length);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const stopRaf = () => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  };

  const loadAndPrepareTrack = async (url) => {
    if (player.current) {
      manualStopRef.current = true;
      player.current.stop();
      player.current.dispose();
      player.current = null;
    }
    setIsLoaded(false);
    offsetRef.current = 0;
    setPosition(0);

    const newPlayer = new Tone.Player({
      url,
      autostart: false,
      loop: false,
      volume: -12,
    }).connect(gainNode.current);

    await newPlayer.load(url);
    player.current = newPlayer;

    const dur = newPlayer.buffer?.duration || 0;
    setDuration(dur);
    durationRef.current = dur;

    newPlayer.onstop = () => {
      const endedNaturally =
        !manualStopRef.current &&
        durationRef.current > 0 &&
        getPosition() >= durationRef.current - 0.1;

      if (endedNaturally) {
        setIsPlaying(false);
        isPlayingRef.current = false;
        stopRaf();
        autoplayNextRef.current = true;
        setActiveTrackIndex((i) => (i + 1) % playlist.length);
      }
      manualStopRef.current = false;
    };

    setIsLoaded(true);

    // Autoplay if previously playing or flagged (playlist click/next/prev)
    const shouldAuto = isPlayingRef.current || autoplayNextRef.current;
    if (shouldAuto) {
      await Tone.start();
      startTimeRef.current = nowSec();
      manualStopRef.current = false;
      newPlayer.start(undefined, 0);
      setIsPlaying(true);
      isPlayingRef.current = true;
      startRaf();
    }
    autoplayNextRef.current = false;
  };

  // 1) create gain node once
  useEffect(() => {
    gainNode.current = new Tone.Volume(volume).toDestination();
    return () => {
      stopRaf();
      if (player.current) {
        manualStopRef.current = true;
        player.current.stop();
        player.current.dispose();
      }
      if (gainNode.current) gainNode.current.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2) fetch playlist on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          'https://backend.petereichhorst.com/wp-json/audio/v1/list?sort=mtime_desc'
        );
        const data = await res.json(); // [{url, name, ...}]
        const urls = (Array.isArray(data) ? data : []).map((item) => item.url).reverse();
        setPlaylist(urls);
        if (urls.length > 0) setActiveTrackIndex(0);
      } catch (e) {
        console.error('Failed to load playlist', e);
      }
    })();
  }, []);

  // 3) when playlist arrives (or changes), load current track
  useEffect(() => {
    if (playlist.length > 0 && gainNode.current) {
      loadAndPrepareTrack(playlist[activeTrackIndex]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playlist]);

  // 4) when activeTrackIndex changes, load that track
  useEffect(() => {
    if (playlist.length > 0) loadAndPrepareTrack(playlist[activeTrackIndex]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTrackIndex]);

  // volume change
  useEffect(() => {
    if (gainNode.current) gainNode.current.volume.value = volume;
  }, [volume]);

  const handleToggle = async () => {
    if (!isLoaded || !player.current) return;

    if (!isPlayingRef.current) {
      await Tone.start();
      startTimeRef.current = nowSec();
      manualStopRef.current = false;
      player.current.start(undefined, offsetRef.current);
      setIsPlaying(true);
      isPlayingRef.current = true;
      startRaf();
    } else {
      manualStopRef.current = true;
      player.current.stop();
      offsetRef.current = getPosition();
      setPosition(offsetRef.current);
      setIsPlaying(false);
      isPlayingRef.current = false;
      stopRaf();
    }
  };

  const handleNextTrack = () => {
    if (!playlist.length) return;
    setIsPlaying(false);
    isPlayingRef.current = false;
    stopRaf();
    autoplayNextRef.current = true;
    setActiveTrackIndex((i) => (i + 1) % playlist.length);
  };

  const handlePreviousTrack = () => {
    if (!playlist.length) return;
    setIsPlaying(false);
    isPlayingRef.current = false;
    stopRaf();
    autoplayNextRef.current = true;
    setActiveTrackIndex((i) => (i - 1 + playlist.length) % playlist.length);
  };

  const handlePickTrack = (index) => {
    if (index === activeTrackIndex) {
      if (!isPlayingRef.current && isLoaded) handleToggle();
      return;
    }
    stopRaf();
    autoplayNextRef.current = true;
    offsetRef.current = 0;
    setPosition(0);
    setActiveTrackIndex(index);
  };

  // seek
  const handleSeek = async (e) => {
    const target = Number(e.target.value);
    const dur = durationRef.current || 0;
    offsetRef.current = Math.max(0, Math.min(target, dur));
    setPosition(offsetRef.current);

    if (!player.current) return;

    if (isPlayingRef.current) {
      manualStopRef.current = true;
      player.current.stop();
      await Tone.start();
      startTimeRef.current = nowSec();
      manualStopRef.current = false;
      player.current.start(undefined, offsetRef.current);
      // RAF already running
    }
  };

  const fmt = (s) => {
    if (!isFinite(s)) s = 0;
    const m = Math.floor(s / 60);
    const ss = Math.floor(s % 60);
    return `${m}:${ss.toString().padStart(2, '0')}`;
  };

  const activeUrl = playlist[activeTrackIndex] || '';
  const activeTitle = titleFromUrl(activeUrl);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className="flex flex-col items-center gap-3 p-2 rounded-2xl shadow-2xl backdrop-blur-md max-w-[52vw]"
        style={{
          background: 'rgba(var(--color-bg-dark-rgb), 0.7)',
          border: '1px solid rgba(var(--color-accent-rgb), 0.2)',
          color: 'var(--color-text)',
        }}
      >
        {/* Active title */}
        <span className="font-bold text-lg text-center opacity-80 px-3">
          {playlist.length ? activeTitle : 'Loading...'}
        </span>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePreviousTrack}
            className="w-10 h-10 flex items-center justify-center rounded-full transition-all hover:opacity-80"
            style={{ background: 'rgba(var(--color-accent-rgb), 0.1)', color: 'var(--color-text)' }}
            disabled={!isLoaded || !playlist.length}
            aria-label="Previous"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>

          <button
            onClick={handleToggle}
            className={`w-14 h-14 flex items-center justify-center rounded-full shadow-lg transition-all ${
              isPlaying ? 'animate-pulse' : 'hover:scale-110'
            }`}
            style={{ background: 'var(--color-accent)', color: 'var(--color-bg-dark)' }}
            disabled={!isLoaded || !playlist.length}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isLoaded ? (
              isPlaying ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 6h12v12H6z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348l1.71-1.71a3.75 3.75 0 115.304 5.304L19.22 17.514m-1.258-2.538a2.502 2.502 0 01-1.259-2.502l2.502-1.259m3.351.986l-1.675-1.675a3.75 3.75 0 10-5.304 5.304L7.486 17.72c.451.981 1.259 1.79 2.24 2.24a2.502 2.502 0 012.502 1.259l1.259 2.502" />
              </svg>
            )}
          </button>

          <button
            onClick={handleNextTrack}
            className="w-10 h-10 flex items-center justify-center rounded-full transition-all hover:opacity-80"
            style={{ background: 'rgba(var(--color-accent-rgb), 0.1)', color: 'var(--color-text)' }}
            disabled={!isLoaded || !playlist.length}
            aria-label="Next"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

        {/* Seekable progress */}
        <div className="w-full flex items-center gap-2">
          <span className="text-[11px] opacity-70 w-10 text-right">{fmt(position)}</span>
          <input
            type="range"
            min={0}
            max={Math.max(duration, 0.01)}
            step={0.01}
            value={Math.min(position, duration || 0)}
            onChange={handleSeek}
            className="w-full h-1 bg-gray-500 rounded-lg appearance-none cursor-pointer"
            style={{ accentColor: 'var(--color-accent)' }}
            disabled={!isLoaded}
            aria-label="Seek"
          />
          <span className="text-[11px] opacity-70 w-10">{fmt(duration)}</span>
        </div>

        {/* Playlist */}
        <div className="w-full" title="Playlist" aria-label="Playlist">
          <div className="flex flex-wrap justify-center items-center gap-2">
            {playlist.map((url, idx) => {
              const label = titleFromUrl(url);
              const isActive = idx === activeTrackIndex;
              return (
                <button
                  key={url}
                  onClick={() => handlePickTrack(idx)}
                  className={`px-3 py-1.5 rounded-full text-xs md:text-sm transition-all border ${
                    isActive ? 'font-semibold' : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{
                    background: isActive ? 'var(--color-accent)' : 'rgba(var(--color-accent-rgb), 0.08)',
                    color: isActive ? 'var(--color-bg-dark)' : 'var(--color-text)',
                    borderColor: 'rgba(var(--color-accent-rgb), 0.25)',
                  }}
                  aria-current={isActive ? 'true' : 'false'}
                  title={label}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Volume */}
        <div className="w-full flex items-center gap-2">
          <span aria-hidden className="inline-flex items-center justify-center w-5 h-5 opacity-75">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M5 9v6h4l5 4V5L9 9H5z" />
              <path d="M16.5 8.5a4 4 0 010 7" />
            </svg>
          </span>
          <input
            type="range"
            min="-24"
            max="0"
            step="1"
            value={volume}
            onChange={(e) => setVolume(+e.target.value)}
            style={{ accentColor: 'var(--color-accent)' }}
            className="w-full h-1 bg-gray-500 rounded-lg appearance-none cursor-pointer"
            title="Volume"
            disabled={!isLoaded}
          />
        </div>
      </div>
    </div>
  );
}
