import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  forwardRef,
} from "react";
import {
  Box,
  IconButton,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import ReplayIcon from "@mui/icons-material/Replay";

export interface MiniAudioPlayerHandle {
  play: () => Promise<void>;
  pause: () => void;
  stop: () => void;
}

interface MiniAudioPlayerProps {
  src?: string;
  disabled?: boolean;
  onEnded?: () => void;
  /** Visually highlight when this clip is playing in a sequence */
  highlight?: boolean;
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export const MiniAudioPlayer = forwardRef<
  MiniAudioPlayerHandle,
  MiniAudioPlayerProps
>(function MiniAudioPlayer({ src, disabled, onEnded, highlight }, ref) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useImperativeHandle(ref, () => ({
    play: async () => {
      if (!audioRef.current || !src) return;
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
      setIsPlaying(true);
    },
    pause: () => {
      audioRef.current?.pause();
      setIsPlaying(false);
    },
    stop: () => {
      if (!audioRef.current) return;
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    },
  }));

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onLoaded = () => setDuration(audio.duration || 0);
    const onTime = () => setCurrentTime(audio.currentTime);
    const onEnd = () => {
      setIsPlaying(false);
      onEnded?.();
    };
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnd);
    };
  }, [onEnded]);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.load();
    }
  }, [src]);

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

  const handleProgressClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    const next = Math.max(0, Math.min(duration * ratio, duration));
    audioRef.current.currentTime = next;
    setCurrentTime(next);
  };

  return (
    <Box
      sx={{
        borderLeft: highlight ? 3 : 0,
        borderColor: "primary.main",
        pl: highlight ? 1 : 0,
        transition: "all 0.2s",
      }}
    >
      <audio ref={audioRef} preload="auto">
        {src && <source src={src} />}
      </audio>

      <Stack direction="row" alignItems="center" spacing={1}>
        <Tooltip title={isPlaying ? "Pause" : "Play"}>
          <span>
            <IconButton
              size="small"
              color="primary"
              onClick={togglePlayback}
              disabled={disabled || !src}
            >
              {isPlaying ? (
                <PauseIcon fontSize="small" />
              ) : (
                <PlayArrowIcon fontSize="small" />
              )}
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Replay">
          <span>
            <IconButton
              size="small"
              onClick={() => {
                if (!audioRef.current) return;
                audioRef.current.currentTime = 0;
                setCurrentTime(0);
                if (isPlaying) {
                  audioRef.current.play().catch(() => undefined);
                }
              }}
              disabled={disabled || !src}
            >
              <ReplayIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Box onClick={handleProgressClick} sx={{ cursor: "pointer", flex: 1 }}>
          <LinearProgress
            variant={duration ? "determinate" : "indeterminate"}
            value={duration ? (currentTime / duration) * 100 : undefined}
          />
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ minWidth: 65 }}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </Typography>
      </Stack>
    </Box>
  );
});
