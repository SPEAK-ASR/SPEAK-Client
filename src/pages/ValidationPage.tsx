import { useCallback, useEffect, useRef, useState } from "react";
import {
  BadgeCheck,
  CheckCircle2,
  ExternalLink,
  Inbox,
  Play,
  RefreshCw,
  ShieldOff,
  SkipForward,
  Square,
  Loader2,
} from "lucide-react";
import {
  MiniAudioPlayer,
  type MiniAudioPlayerHandle,
} from "../components/audio/MiniAudioPlayer";
import { PageHeader } from "../components/layout/PageHeader";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { ScrollArea } from "../components/ui/scroll-area";
import { Separator } from "../components/ui/separator";
import { Skeleton } from "../components/ui/skeleton";
import { toast } from "../components/ui/toast";
import {
  transcriptionServiceApi,
  type VideoAudioClip,
  type YouTubeVideoValidationItem,
} from "../lib/transcriptionServiceApi";
import { cn, formatDuration } from "../lib/utils";

export function ValidationPage() {
  const [video, setVideo] = useState<YouTubeVideoValidationItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [playingAll, setPlayingAll] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const playerRefs = useRef<(MiniAudioPlayerHandle | null)[]>([]);
  const cardRefs = useRef<(HTMLLIElement | null)[]>([]);
  const endResolvers = useRef<((() => void) | null)[]>([]);
  const abortPlayAll = useRef(false);

  const loadNext = useCallback(async () => {
    setLoading(true);
    setVideo(null);
    setPlayingAll(false);
    setActiveIndex(-1);
    abortPlayAll.current = true;
    try {
      const data =
        await transcriptionServiceApi.getNextYouTubeVideoForValidation();
      setVideo(data);
    } catch (err) {
      const status =
        (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        setVideo(null);
        toast.info("No pending videos to validate");
      } else {
        console.error(err);
        toast.error("Failed to load next video", {
          description: (err as Error)?.message,
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNext();
  }, [loadNext]);

  useEffect(() => {
    playerRefs.current = video?.audio_clips.map(() => null) ?? [];
    cardRefs.current = video?.audio_clips.map(() => null) ?? [];
    endResolvers.current = video?.audio_clips.map(() => null) ?? [];
  }, [video]);

  const handleStopAll = useCallback(() => {
    abortPlayAll.current = true;
    setPlayingAll(false);
    setActiveIndex(-1);
    playerRefs.current.forEach((p) => p?.stop());
    endResolvers.current.forEach((r) => r?.());
    endResolvers.current = endResolvers.current.map(() => null);
  }, []);

  const handlePlayAll = useCallback(async () => {
    if (!video || video.audio_clips.length === 0) return;
    abortPlayAll.current = false;
    setPlayingAll(true);

    for (let i = 0; i < video.audio_clips.length; i++) {
      if (abortPlayAll.current) break;
      setActiveIndex(i);

      const card = cardRefs.current[i];
      if (card) {
        card.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      const player = playerRefs.current[i];
      if (!player) continue;

      await new Promise<void>((resolve) => {
        endResolvers.current[i] = () => {
          endResolvers.current[i] = null;
          resolve();
        };
        player.play().catch(() => {
          endResolvers.current[i] = null;
          resolve();
        });
      });

      if (i < video.audio_clips.length - 1 && !abortPlayAll.current) {
        await new Promise((r) => setTimeout(r, 250));
      }
    }
    setPlayingAll(false);
    setActiveIndex(-1);
  }, [video]);

  const handleClipEnded = useCallback((index: number) => {
    const r = endResolvers.current[index];
    if (r) r();
  }, []);

  const handleValidate = useCallback(
    async (isValidated: boolean) => {
      if (!video) return;
      handleStopAll();
      setSubmitting(true);
      try {
        await transcriptionServiceApi.submitVideoValidationStatus(
          video.id,
          isValidated,
        );
        toast.success(
          isValidated ? "Marked as validated" : "Marked as not valid",
        );
        await loadNext();
      } catch (err) {
        toast.error("Failed to submit validation", {
          description: (err as Error)?.message,
        });
      } finally {
        setSubmitting(false);
      }
    },
    [video, handleStopAll, loadNext],
  );

  const playAllAction = (
    <div className="flex flex-wrap items-center gap-2">
      {playingAll ? (
        <Button variant="destructive" size="sm" onClick={handleStopAll}>
          <Square className="size-4" />
          Stop all
        </Button>
      ) : (
        <Button
          size="sm"
          onClick={handlePlayAll}
          disabled={!video || video.audio_clips.length === 0}
        >
          <Play className="size-4" />
          Play all
        </Button>
      )}
      <Button variant="ghost" size="sm" onClick={loadNext} disabled={submitting}>
        <RefreshCw className="size-4" />
        Refresh
      </Button>
    </div>
  );

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Video Validation"
        description="Listen to audio clips and validate the YouTube video transcription set."
        actions={playAllAction}
      />

      {loading ? (
        <ValidationSkeleton />
      ) : !video ? (
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-12 pb-10 flex flex-col items-center text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
              <Inbox className="size-5" />
            </span>
            <p className="text-base font-semibold">All caught up</p>
            <p className="text-sm text-muted-foreground mt-1">
              No pending videos to validate.
            </p>
            <Button onClick={loadNext} className="mt-5" variant="outline">
              <RefreshCw className="size-4" />
              Check again
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
          <Card className="lg:sticky lg:top-20 self-start">
            <CardHeader className="pb-3">
              <div className="aspect-video w-full rounded-lg overflow-hidden bg-muted">
                <a
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group relative"
                >
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                    <span className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Play className="size-5" />
                    </span>
                  </span>
                </a>
              </div>
              <CardTitle className="mt-3 line-clamp-2">{video.title}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {video.uploader} · {video.upload_date}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline">
                  {video.domain.replace(/_/g, " ")}
                </Badge>
                <Badge variant="muted">
                  {video.audio_clip_count} clip
                  {video.audio_clip_count !== 1 ? "s" : ""}
                </Badge>
                <Badge variant="muted">
                  {formatDuration(Number(video.duration) || 0)}
                </Badge>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => window.open(video.url, "_blank", "noopener")}
              >
                <ExternalLink className="size-4" />
                Open on YouTube
              </Button>

              <Separator />

              <div className="space-y-2">
                <Button
                  variant="success"
                  className="w-full"
                  onClick={() => handleValidate(true)}
                  disabled={submitting}
                >
                  {submitting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-4" />
                  )}
                  Mark as validated
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleValidate(false)}
                  disabled={submitting}
                >
                  <ShieldOff className="size-4" />
                  Mark as not valid
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={loadNext}
                  disabled={submitting}
                >
                  <SkipForward className="size-4" />
                  Skip
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BadgeCheck className="size-4 text-primary" />
                  Audio clips
                </CardTitle>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {playingAll && activeIndex >= 0
                    ? `Playing ${activeIndex + 1} / ${video.audio_clips.length}`
                    : `${video.audio_clips.length} total`}
                </span>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="p-0">
              <ScrollArea className="h-[65vh]">
                <ul className="divide-y divide-border">
                  {video.audio_clips.map(
                    (clip: VideoAudioClip, index: number) => (
                      <li
                        key={clip.audio_id}
                        ref={(el) => {
                          cardRefs.current[index] = el;
                        }}
                        className={cn(
                          "px-5 py-3 transition-colors",
                          playingAll && activeIndex === index && "bg-primary/5",
                        )}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="text-xs text-muted-foreground truncate flex-1">
                            {clip.audio_filename}
                          </span>
                        </div>
                        <MiniAudioPlayer
                          ref={(el) => {
                            playerRefs.current[index] = el;
                          }}
                          src={clip.gcs_signed_url}
                          highlight={playingAll && activeIndex === index}
                          onEnded={() => handleClipEnded(index)}
                        />
                        {clip.google_transcription && (
                          <p
                            className={cn(
                              "mt-2 text-sm leading-relaxed rounded-md border border-border bg-background/40 p-3 whitespace-pre-wrap break-words",
                              playingAll &&
                                activeIndex === index &&
                                "border-primary",
                            )}
                          >
                            {clip.google_transcription}
                          </p>
                        )}
                      </li>
                    ),
                  )}
                </ul>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

function ValidationSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="aspect-video w-full" />
          <Skeleton className="h-5 w-3/4 mt-3" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
