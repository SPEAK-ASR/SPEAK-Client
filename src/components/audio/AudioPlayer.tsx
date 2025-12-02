import { useEffect, useRef, useState } from 'react';
import {
  Box,
  FormControl,
  IconButton,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import ReplayIcon from '@mui/icons-material/Replay';
import LoopIcon from '@mui/icons-material/Loop';
import FastForwardIcon from '@mui/icons-material/FastForward';
import FastRewindIcon from '@mui/icons-material/FastRewind';

interface AudioPlayerProps {
  src?: string;
  disabled?: boolean;
  onEnded?: () => void;
}

const SPEEDS = [0.75, 1, 1.25, 1.5];

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return '00:00';
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${secs}`;
}

export function AudioPlayer({ src, disabled, onEnded }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [autoReplay, setAutoReplay] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoaded = () => {
      setDuration(audio.duration || 0);
    };
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => {
      setIsPlaying(false);
      if (autoReplay) {
        audio.currentTime = 0;
        audio.play().catch(() => setIsPlaying(false));
      }
      onEnded?.();
    };

    audio.addEventListener('loadedmetadata', handleLoaded);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoaded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [autoReplay, onEnded]);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.load();
    }
  }, [src]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const togglePlayback = () => {
    if (!audioRef.current || !src) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const seek = (delta: number) => {
    if (!audioRef.current) return;
    const next = Math.min(Math.max(audioRef.current.currentTime + delta, 0), duration || audioRef.current.duration || 0);
    audioRef.current.currentTime = next;
    setCurrentTime(next);
  };

  const handleProgressClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    const next = Math.max(0, Math.min(duration * ratio, duration));
    audioRef.current.currentTime = next;
    setCurrentTime(next);
  };

  return (
    <Box>
      <audio ref={audioRef} preload="auto">
        {src && <source src={src} />}
      </audio>

      <Box onClick={handleProgressClick} sx={{ cursor: 'pointer', mb: 1 }}>
        <LinearProgress variant={duration ? 'determinate' : 'indeterminate'} value={duration ? (currentTime / duration) * 100 : undefined} />
      </Box>

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="body2">{formatTime(currentTime)}</Typography>
        <Typography variant="body2" color="text.secondary">
          {formatTime(duration)}
        </Typography>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between">
        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip title="Replay">
            <span>
              <IconButton onClick={() => {
                if (!audioRef.current) return;
                audioRef.current.currentTime = 0;
                if (isPlaying) {
                  audioRef.current.play().catch(() => undefined);
                }
              }} disabled={disabled || !src}>
                <ReplayIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Back 1s">
            <span>
              <IconButton onClick={() => seek(-1)} disabled={disabled || !src}>
                <FastRewindIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={isPlaying ? 'Pause' : 'Play'}>
            <span>
              <IconButton color="primary" onClick={togglePlayback} disabled={disabled || !src}>
                {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Forward 1s">
            <span>
              <IconButton onClick={() => seek(1)} disabled={disabled || !src}>
                <FastForwardIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Auto replay when finished">
            <span>
              <IconButton color={autoReplay ? 'primary' : 'default'} onClick={() => setAutoReplay(prev => !prev)} disabled={disabled || !src}>
                <LoopIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
        <FormControl size="small" sx={{ minWidth: 120, alignSelf: { xs: 'stretch', sm: 'flex-end' } }}>
          <Select
            value={playbackRate}
            onChange={event => setPlaybackRate(Number(event.target.value))}
            displayEmpty
            inputProps={{ 'aria-label': 'Playback speed' }}
          >
            {SPEEDS.map(speed => (
              <MenuItem key={speed} value={speed}>
                {speed.toFixed(2).replace(/\.00$/, '')}x
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
    </Box>
  );
}
