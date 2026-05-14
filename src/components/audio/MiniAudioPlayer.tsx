import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "../ui/button";
import { Slider } from "../ui/slider";
import { cn, formatDuration } from "../../lib/utils";

export interface MiniAudioPlayerHandle {
  play: () => Promise<void>;
  pause: () => void;
  stop: () => void;
}

interface MiniAudioPlayerProps {
  src: string;
  highlight?: boolean;
  onEnded?: () => void;
}

export const MiniAudioPlayer = forwardRef<
  MiniAudioPlayerHandle,
  MiniAudioPlayerProps
>(function MiniAudioPlayer({ src, highlight, onEnded }, ref) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useImperativeHandle(ref, () => ({
    play: async () => {
      const a = audioRef.current;
      if (a) await a.play();
    },
    pause: () => audioRef.current?.pause(),
    stop: () => {
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
    setTime(0);
    setDuration(0);
  }, [src]);

  const toggle = async () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) await a.play();
    else a.pause();
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border border-border bg-background/40 px-2 py-1.5 transition-colors",
        highlight && "border-primary bg-primary/10",
      )}
    >
      <audio
        ref={audioRef}
        src={src}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={(e) =>
          setTime((e.target as HTMLAudioElement).currentTime)
        }
        onLoadedMetadata={(e) =>
          setDuration((e.target as HTMLAudioElement).duration || 0)
        }
        onEnded={() => {
          setIsPlaying(false);
          onEnded?.();
        }}
      />
      <Button
        size="icon-sm"
        variant={isPlaying ? "default" : "outline"}
        onClick={toggle}
        aria-label={isPlaying ? "Pause" : "Play"}
        aria-pressed={isPlaying}
      >
        {isPlaying ? (
          <Pause className="size-3.5" />
        ) : (
          <Play className="size-3.5" />
        )}
      </Button>
      <Button
        size="icon-sm"
        variant="ghost"
        onClick={() => {
          const a = audioRef.current;
          if (a) {
            a.currentTime = 0;
            a.play().catch(() => undefined);
          }
        }}
        aria-label="Replay"
      >
        <RotateCcw className="size-3.5" />
      </Button>
      <span className="tabular-nums text-[11px] text-muted-foreground min-w-[5rem]">
        {formatDuration(time)} / {formatDuration(duration)}
      </span>
      <div className="flex-1 min-w-0">
        <Slider
          value={[time]}
          max={duration || 0}
          step={0.05}
          onValueChange={(v) => {
            const a = audioRef.current;
            if (a && Number.isFinite(v[0])) a.currentTime = v[0];
          }}
          aria-label="Seek"
        />
      </div>
    </div>
  );
});
