import { useEffect, useMemo, useState } from "react";
import {
  CloudUpload,
  Loader2,
  Music,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { AudioPlayer } from "../../components/audio/AudioPlayer";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Separator } from "../../components/ui/separator";
import { audioApi, type ClipData, type VideoMetadata } from "../../lib/api";
import { cn, formatDuration } from "../../lib/utils";
import { toast } from "../../components/ui/toast";
import { fadeUp, stagger } from "../../lib/motion";

interface ClipsPanelProps {
  videoId: string;
  metadata: VideoMetadata | null;
  clips: ClipData[];
  hasTranscriptions: boolean;
  onTranscribeStart: () => void;
  onTranscribeDone: (
    clips: import("../../lib/api").TranscribedClip[],
  ) => void;
  onSaveStart: () => void;
  onSaveDone: () => void;
  onReset: () => void;
}

export function ClipsPanel({
  videoId,
  metadata,
  clips,
  hasTranscriptions,
  onTranscribeStart,
  onTranscribeDone,
  onSaveStart,
  onSaveDone,
  onReset,
}: ClipsPanelProps) {
  const [selected, setSelected] = useState<ClipData | null>(clips[0] ?? null);
  const [transcribing, setTranscribing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    if (!selected && clips.length > 0) setSelected(clips[0]);
  }, [clips, selected]);

  const audioUrl = useMemo(
    () => (selected ? audioApi.getAudioFile(videoId, selected.clip_name) : ""),
    [selected, videoId],
  );

  async function handleTranscribe() {
    setTranscribing(true);
    onTranscribeStart();
    try {
      const res = await audioApi.transcribeClips(videoId);
      if (res.success) {
        onTranscribeDone(res.transcribed_clips);
        toast.success("Transcription complete", {
          description: `${res.total_transcribed} of ${clips.length} clips transcribed.`,
        });
      } else {
        toast.error("Transcription failed");
        onTranscribeDone([]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Transcription failed", {
        description: (err as Error)?.message,
      });
      onTranscribeDone([]);
    } finally {
      setTranscribing(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    onSaveStart();
    try {
      const res = await audioApi.saveToCloud(videoId);
      if (res.success) {
        toast.success("Saved", {
          description: `${res.total_processed} clips saved to cloud.`,
        });
        onSaveDone();
      } else {
        toast.error("Save failed");
        onSaveDone();
      }
    } catch (err) {
      console.error(err);
      toast.error("Save failed", {
        description: (err as Error)?.message,
      });
      onSaveDone();
    } finally {
      setSaving(false);
    }
  }

  async function handleResetConfirmed() {
    setResetting(true);
    try {
      await audioApi.deleteAudioFiles(videoId);
      onReset();
      toast.info("Started over", {
        description: "Audio files were removed.",
      });
    } catch (err) {
      toast.error("Could not start over", {
        description: (err as Error)?.message,
      });
    } finally {
      setResetting(false);
      setShowResetConfirm(false);
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_1.4fr] gap-4">
        <Card className="lg:sticky lg:top-20 self-start">
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              <span className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
                <Music className="size-4" />
              </span>
              <div className="min-w-0">
                <CardTitle className="truncate">
                  {metadata?.title ?? videoId}
                </CardTitle>
                <CardDescription className="truncate">
                  {metadata?.uploader ?? "Unknown uploader"} ·{" "}
                  {formatDuration(metadata?.duration ?? 0)}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            <div className="px-4 pt-3 pb-2 flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {clips.length} clip{clips.length !== 1 ? "s" : ""}
              </p>
            </div>
            <ScrollArea className="h-[50vh] lg:h-[55vh]">
              <motion.ul
                className="px-2 pb-3 space-y-1"
                variants={stagger(0.02)}
                initial="hidden"
                animate="show"
              >
                {clips.map((clip, idx) => {
                  const active = selected?.clip_name === clip.clip_name;
                  return (
                    <motion.li key={clip.clip_name} variants={fadeUp}>
                      <button
                        type="button"
                        onClick={() => setSelected(clip)}
                        className={cn(
                          "w-full text-left rounded-md px-3 py-2 transition-colors flex items-center gap-3",
                          active
                            ? "bg-accent"
                            : "hover:bg-accent/60 text-muted-foreground",
                        )}
                      >
                        <span
                          className={cn(
                            "tabular-nums text-xs w-7 text-right shrink-0",
                            active ? "text-primary" : "text-muted-foreground",
                          )}
                        >
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <span
                          className={cn(
                            "truncate text-sm flex-1",
                            active && "text-foreground",
                          )}
                        >
                          {clip.clip_name}
                        </span>
                        <span className="tabular-nums text-xs text-muted-foreground shrink-0">
                          {formatDuration(clip.duration)}
                        </span>
                      </button>
                    </motion.li>
                  );
                })}
              </motion.ul>
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4 min-w-0">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Now playing
                  </p>
                  <CardTitle className="truncate">
                    {selected?.clip_name ?? "Select a clip"}
                  </CardTitle>
                </div>
                {selected && (
                  <Badge variant="muted">
                    {formatDuration(selected.start_time)} –{" "}
                    {formatDuration(selected.end_time)}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {selected ? (
                <AudioPlayer src={audioUrl} />
              ) : (
                <div className="text-sm text-muted-foreground py-8 text-center">
                  Select a clip from the list to play.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Next steps</p>
                  <p className="text-xs text-muted-foreground">
                    {hasTranscriptions
                      ? "Save the transcribed clips to cloud and database."
                      : "Run transcription on every clip in the video."}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowResetConfirm(true)}
                    disabled={resetting || transcribing || saving}
                  >
                    <RotateCcw className="size-4" />
                    Start over
                  </Button>
                  {!hasTranscriptions ? (
                    <Button
                      onClick={handleTranscribe}
                      disabled={transcribing || clips.length === 0}
                    >
                      {transcribing ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Sparkles className="size-4" />
                      )}
                      Get transcriptions
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSave}
                      disabled={saving || clips.length === 0}
                      variant="success"
                    >
                      {saving ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <CloudUpload className="size-4" />
                      )}
                      Save to cloud & database
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Start over?</DialogTitle>
            <DialogDescription>
              This will permanently delete all audio files and metadata for
              this video. The action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowResetConfirm(false)}
              disabled={resetting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleResetConfirmed}
              disabled={resetting}
            >
              {resetting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RotateCcw className="size-4" />
              )}
              Start over
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
