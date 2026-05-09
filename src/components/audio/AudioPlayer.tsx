import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  Pause,
  Play,
  Repeat,
  RotateCcw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "../ui/button";
import { Slider } from "../ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { cn, formatDuration } from "../../lib/utils";

export interface AudioPlayerHandle {
  play: () => Promise<void>;
  pause: () => void;
  seek: (seconds: number) => void;
  reset: () => void;
}

interface AudioPlayerProps {
  src: string;
  className?: string;
  autoPlay?: boolean;
  onEnded?: () => void;
  showSpeed?: boolean;
  showLoop?: boolean;
  showSkip?: boolean;
  skipSeconds?: number;
  compact?: boolean;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export const AudioPlayer = forwardRef<AudioPlayerHandle, AudioPlayerProps>(
  function AudioPlayer(
    {
      src,
      className,
      autoPlay = false,
      onEnded,
      showSpeed = true,
      showLoop = true,
      showSkip = true,
      skipSeconds = 5,
      compact = false,
    },
    ref,
  ) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [muted, setMuted] = useState(false);
    const [speed, setSpeed] = useState(1);
    const [loop, setLoop] = useState(false);

    useImperativeHandle(ref, () => ({
      play: async () => {
        const a = audioRef.current;
        if (a) await a.play();
      },
      pause: () => audioRef.current?.pause(),
      seek: (s) => {
        if (audioRef.current) audioRef.current.currentTime = s;
      },
      reset: () => {
        const a = audioRef.current;
        if (a) {
          a.pause();
          a.currentTime = 0;
        }
        setIsPlaying(false);
      },
    }));

    useEffect(() => {
      const a = audioRef.current;
      if (!a) return;
      a.pause();
      a.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      if (autoPlay) {
        a.play().catch(() => undefined);
      }
    }, [src, autoPlay]);

    useEffect(() => {
      const a = audioRef.current;
      if (a) a.playbackRate = speed;
    }, [speed]);

    useEffect(() => {
      const a = audioRef.current;
      if (a) {
        a.volume = muted ? 0 : volume;
      }
    }, [volume, muted]);

    const togglePlay = async () => {
      const a = audioRef.current;
      if (!a) return;
      if (a.paused) {
        await a.play();
      } else {
        a.pause();
      }
    };

    return (
      <div
        className={cn(
          "rounded-lg border border-border bg-background/40 p-3",
          compact && "p-2",
          className,
        )}
      >
        <audio
          ref={audioRef}
          src={src}
          loop={loop}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={(e) =>
            setCurrentTime((e.target as HTMLAudioElement).currentTime)
          }
          onLoadedMetadata={(e) =>
            setDuration((e.target as HTMLAudioElement).duration || 0)
          }
          onEnded={() => {
            setIsPlaying(false);
            onEnded?.();
          }}
        />

        <div className="flex items-center gap-2">
          {showSkip && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                const a = audioRef.current;
                if (a) a.currentTime = Math.max(0, a.currentTime - skipSeconds);
              }}
              aria-label={`Rewind ${skipSeconds} seconds`}
            >
              <SkipBack className="size-4" />
            </Button>
          )}

          <Button
            size="icon"
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause" : "Play"}
            aria-pressed={isPlaying}
          >
            {isPlaying ? (
              <Pause className="size-4" />
            ) : (
              <Play className="size-4" />
            )}
          </Button>

          {showSkip && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                const a = audioRef.current;
                if (a)
                  a.currentTime = Math.min(
                    a.duration || a.currentTime + skipSeconds,
                    a.currentTime + skipSeconds,
                  );
              }}
              aria-label={`Forward ${skipSeconds} seconds`}
            >
              <SkipForward className="size-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              const a = audioRef.current;
              if (a) {
                a.currentTime = 0;
                a.play().catch(() => undefined);
              }
            }}
            aria-label="Replay"
          >
            <RotateCcw className="size-4" />
          </Button>

          <span className="text-xs tabular-nums text-muted-foreground min-w-[5.5rem]">
            {formatDuration(currentTime)} / {formatDuration(duration)}
          </span>

          <div className="flex-1 min-w-0">
            <Slider
              value={[currentTime]}
              max={duration || 0}
              step={0.05}
              onValueChange={(v) => {
                const a = audioRef.current;
                if (a && Number.isFinite(v[0])) a.currentTime = v[0];
              }}
              aria-label="Seek"
            />
          </div>

          {showLoop && (
            <Button
              variant={loop ? "default" : "ghost"}
              size="icon-sm"
              onClick={() => setLoop((l) => !l)}
              aria-label="Toggle loop"
              aria-pressed={loop}
            >
              <Repeat className="size-4" />
            </Button>
          )}

          {!compact && (
            <div className="hidden md:flex items-center gap-1.5 w-28">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setMuted((m) => !m)}
                aria-label={muted ? "Unmute" : "Mute"}
              >
                {muted ? (
                  <VolumeX className="size-4" />
                ) : (
                  <Volume2 className="size-4" />
                )}
              </Button>
              <Slider
                value={[muted ? 0 : volume]}
                max={1}
                step={0.05}
                onValueChange={(v) => {
                  setMuted(false);
                  setVolume(v[0]);
                }}
                aria-label="Volume"
              />
            </div>
          )}

          {showSpeed && (
            <Select
              value={speed.toString()}
              onValueChange={(v) => setSpeed(parseFloat(v))}
            >
              <SelectTrigger
                className="h-8 w-[5rem] text-xs"
                aria-label="Playback speed"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SPEEDS.map((s) => (
                  <SelectItem key={s} value={s.toString()}>
                    {s}×
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
    );
  },
);
