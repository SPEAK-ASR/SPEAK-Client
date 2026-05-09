import { useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  CloudUpload,
  Copy,
  Loader2,
  MessageSquare,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
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
import {
  audioApi,
  type TranscribedClip,
  type VideoMetadata,
} from "../../lib/api";
import { cn, copyToClipboard } from "../../lib/utils";
import { toast } from "../../components/ui/toast";

interface TranscriptionsPanelProps {
  videoId: string;
  metadata: VideoMetadata | null;
  transcriptions: TranscribedClip[];
  onCleanupComplete: (deletedFiles: string[]) => void;
  onSaveStart: () => void;
  onSaveDone: () => void;
  onReset: () => void;
}

export function TranscriptionsPanel({
  videoId,
  metadata,
  transcriptions,
  onCleanupComplete,
  onSaveStart,
  onSaveDone,
  onReset,
}: TranscriptionsPanelProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<"clean" | "save" | "reset" | null>(null);
  const [showCleanConfirm, setShowCleanConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const failedCount = useMemo(
    () => transcriptions.filter((t) => !t.transcription?.trim()).length,
    [transcriptions],
  );

  function toggleExpand(name: string) {
    setExpanded((s) => {
      const n = new Set(s);
      if (n.has(name)) n.delete(name);
      else n.add(name);
      return n;
    });
  }

  async function copyOne(name: string, text: string) {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied((s) => new Set(s).add(name));
      setTimeout(
        () =>
          setCopied((s) => {
            const n = new Set(s);
            n.delete(name);
            return n;
          }),
        1800,
      );
    }
  }

  async function copyAll() {
    const text = transcriptions
      .map(
        (t) =>
          `${t.clip_name}:\n${
            t.transcription?.trim() || "No transcription available"
          }`,
      )
      .join("\n\n");
    const header = `${metadata?.title ?? "YouTube video"} – Transcriptions\n\n`;
    const ok = await copyToClipboard(header + text);
    if (ok) {
      toast.success("All transcriptions copied");
    } else {
      toast.error("Could not copy to clipboard");
    }
  }

  async function cleanFailed() {
    setBusy("clean");
    try {
      const res = await audioApi.cleanNullTranscriptions(videoId);
      if (res.success) {
        toast.success("Failed transcriptions cleaned", {
          description: `${res.total_deleted} removed · ${res.remaining_clips} remaining.`,
        });
        onCleanupComplete(res.deleted_files);
      }
    } catch (err) {
      toast.error("Cleanup failed", {
        description: (err as Error)?.message,
      });
    } finally {
      setBusy(null);
      setShowCleanConfirm(false);
    }
  }

  async function handleSave() {
    setBusy("save");
    onSaveStart();
    try {
      const res = await audioApi.saveToCloud(videoId);
      if (res.success) {
        toast.success("Saved", {
          description: `${res.total_processed} clips saved.`,
        });
        onSaveDone();
      } else {
        toast.error("Save failed");
        onSaveDone();
      }
    } catch (err) {
      toast.error("Save failed", { description: (err as Error)?.message });
      onSaveDone();
    } finally {
      setBusy(null);
    }
  }

  async function handleResetConfirmed() {
    setBusy("reset");
    try {
      await audioApi.deleteAudioFiles(videoId);
      onReset();
    } catch (err) {
      toast.error("Could not start over", {
        description: (err as Error)?.message,
      });
    } finally {
      setBusy(null);
      setShowResetConfirm(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
                <MessageSquare className="size-4" />
              </span>
              <div>
                <CardTitle>Transcriptions</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {transcriptions.length} total
                  {failedCount > 0 && (
                    <>
                      {" "}
                      ·{" "}
                      <span className="text-destructive">
                        {failedCount} failed
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={copyAll}>
                <Copy className="size-3.5" />
                Copy all
              </Button>
              {failedCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCleanConfirm(true)}
                  disabled={busy !== null}
                >
                  <Trash2 className="size-3.5" />
                  Delete failed ({failedCount})
                </Button>
              )}
              <Button
                size="sm"
                variant="success"
                onClick={handleSave}
                disabled={busy !== null}
              >
                {busy === "save" ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <CloudUpload className="size-3.5" />
                )}
                Save to cloud
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowResetConfirm(true)}
                disabled={busy !== null}
              >
                <RotateCcw className="size-3.5" />
                Start over
              </Button>
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          <ScrollArea className="max-h-[60vh]">
            <ul className="divide-y divide-border">
              {transcriptions.length === 0 && (
                <li className="px-5 py-10 text-center text-sm text-muted-foreground">
                  No transcriptions yet.
                </li>
              )}
              {transcriptions.map((t) => {
                const open = expanded.has(t.clip_name);
                const text = t.transcription?.trim() || "";
                const failed = text === "";
                const display = failed
                  ? "No transcription available"
                  : open
                    ? text
                    : truncate(text, 200);
                const isCopied = copied.has(t.clip_name);

                return (
                  <li key={t.clip_name} className="px-5 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs text-muted-foreground truncate">
                            {t.clip_name}
                          </span>
                          {failed && (
                            <Badge variant="destructive">Failed</Badge>
                          )}
                        </div>
                        <p
                          className={cn(
                            "mt-1.5 text-sm leading-relaxed whitespace-pre-wrap break-words",
                            failed && "italic text-destructive",
                          )}
                        >
                          {display}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() =>
                            copyOne(
                              t.clip_name,
                              text || "No transcription available",
                            )
                          }
                          aria-label="Copy"
                        >
                          {isCopied ? (
                            <Check className="size-3.5 text-success" />
                          ) : (
                            <Copy className="size-3.5" />
                          )}
                        </Button>
                        {!failed && text.length > 200 && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => toggleExpand(t.clip_name)}
                            aria-label={open ? "Show less" : "Show more"}
                          >
                            {open ? (
                              <ChevronUp className="size-3.5" />
                            ) : (
                              <ChevronDown className="size-3.5" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={showCleanConfirm} onOpenChange={setShowCleanConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete failed transcriptions?</DialogTitle>
            <DialogDescription>
              This will permanently delete {failedCount} audio file
              {failedCount === 1 ? "" : "s"} that have no transcription.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowCleanConfirm(false)}
              disabled={busy === "clean"}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={cleanFailed}
              disabled={busy === "clean"}
            >
              {busy === "clean" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Start over?</DialogTitle>
            <DialogDescription>
              All audio files and metadata for this video will be permanently
              deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowResetConfirm(false)}
              disabled={busy === "reset"}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleResetConfirmed}
              disabled={busy === "reset"}
            >
              {busy === "reset" ? (
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

function truncate(s: string, n: number) {
  return s.length <= n ? s : `${s.slice(0, n)}…`;
}
