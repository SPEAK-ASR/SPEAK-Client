import { Loader2, Music, SkipForward } from "lucide-react";
import { AudioPlayer } from "../audio/AudioPlayer";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Skeleton } from "../ui/skeleton";

interface AudioCardProps {
  title: string;
  subtitle?: string;
  audioUrl?: string;
  loading?: boolean;
  onSkip?: () => void;
  skipDisabled?: boolean;
  skipLabel?: string;
}

export function AudioCard({
  title,
  subtitle,
  audioUrl,
  loading,
  onSkip,
  skipDisabled,
  skipLabel = "Skip audio",
}: AudioCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <span className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
              <Music className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Audio clip
              </p>
              <CardTitle className="truncate">{title}</CardTitle>
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {onSkip && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSkip}
              disabled={skipDisabled || loading}
            >
              <SkipForward className="size-4" />
              {skipLabel}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="rounded-lg border border-border bg-background/40 p-3">
            <div className="flex items-center gap-3">
              <span className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
              </span>
              <Skeleton className="h-2 flex-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ) : audioUrl ? (
          <AudioPlayer src={audioUrl} skipSeconds={1} />
        ) : (
          <p className="text-sm text-muted-foreground">No audio loaded.</p>
        )}
      </CardContent>
    </Card>
  );
}
