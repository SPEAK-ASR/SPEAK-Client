import { Fragment, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  RotateCw,
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
import { Label } from "../../components/ui/label";
import { Progress } from "../../components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Slider } from "../../components/ui/slider";
import { Switch } from "../../components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { VIDEO_DOMAINS } from "../../lib/domains";
import { cn } from "../../lib/utils";
import { STAGE_LABELS, type QueueVideo, type VideoSettings } from "../../types/queue";

interface QueueTableProps {
  videos: QueueVideo[];
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
  onUpdateSettings: (id: string, settings: VideoSettings) => void;
  isProcessing: boolean;
}

export function QueueTable({
  videos,
  onRemove,
  onRetry,
  onUpdateSettings,
  isProcessing,
}: QueueTableProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setExpanded((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  if (videos.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm font-medium">No videos in the queue</p>
          <p className="text-xs text-muted-foreground mt-1">
            Add videos from the panel on the left to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">
          Queue · {videos.length} video{videos.length !== 1 ? "s" : ""}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead className="w-8">#</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="w-[180px]">Category</TableHead>
              <TableHead className="w-[160px]">Status</TableHead>
              <TableHead className="w-[80px] text-right">Clips</TableHead>
              <TableHead className="w-[88px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {videos.map((v, idx) => {
              const isOpen = expanded.has(v.id);
              const isActive =
                v.status !== "pending" &&
                v.status !== "complete" &&
                v.status !== "error";
              const statusBadge =
                v.status === "complete"
                  ? "success"
                  : v.status === "error"
                    ? "destructive"
                    : v.status === "pending"
                      ? "outline"
                      : "info";

              return (
                <Fragment key={v.id}>
                  <TableRow className={cn(isActive && "bg-muted/30")}>
                    <TableCell className="px-2">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => toggle(v.id)}
                        aria-label={isOpen ? "Collapse" : "Expand"}
                      >
                        {isOpen ? (
                          <ChevronDown className="size-4" />
                        ) : (
                          <ChevronRight className="size-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs tabular-nums">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="min-w-0 max-w-[28rem]">
                      <p className="text-sm font-medium truncate">
                        {v.title || v.url}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {v.url}
                      </p>
                      {(isActive || v.error) && (
                        <div className="mt-1.5 max-w-md">
                          <Progress
                            value={v.progress}
                            className="h-1"
                            indeterminate={v.status === "splitting" && v.progress < 5}
                          />
                          {v.error && (
                            <p className="text-xs text-destructive mt-1 truncate">
                              {v.error}
                            </p>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={v.settings.domain}
                        onValueChange={(val) =>
                          onUpdateSettings(v.id, {
                            ...v.settings,
                            domain: val,
                          })
                        }
                        disabled={isProcessing && isActive}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                          {VIDEO_DOMAINS.map((d) => (
                            <SelectItem key={d.value} value={d.value}>
                              {d.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadge} className="gap-1.5">
                        {isActive && <Loader2 className="size-3 animate-spin" />}
                        {STAGE_LABELS[v.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-xs">
                      {v.savedCount ?? v.clipCount ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {v.status === "error" && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => onRetry(v.id)}
                            aria-label="Retry"
                          >
                            <RotateCw className="size-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => onRemove(v.id)}
                          disabled={isProcessing && isActive}
                          aria-label="Remove"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <TableRow>
                        <TableCell colSpan={7} className="bg-muted/30 p-0">
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.18 }}
                            className="overflow-hidden"
                          >
                            <RowDetails
                              video={v}
                              isProcessing={isProcessing}
                              onUpdateSettings={onUpdateSettings}
                            />
                          </motion.div>
                        </TableCell>
                      </TableRow>
                    )}
                  </AnimatePresence>
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function RowDetails({
  video,
  isProcessing,
  onUpdateSettings,
}: {
  video: QueueVideo;
  isProcessing: boolean;
  onUpdateSettings: (id: string, settings: VideoSettings) => void;
}) {
  const set = <K extends keyof VideoSettings>(k: K, val: VideoSettings[K]) =>
    onUpdateSettings(video.id, { ...video.settings, [k]: val });

  const isActive =
    video.status !== "pending" &&
    video.status !== "complete" &&
    video.status !== "error";
  const disabled = isProcessing && isActive;

  return (
    <div className="px-5 py-4 grid gap-4 md:grid-cols-3">
      <div className="space-y-2 md:col-span-1">
        <div className="flex items-center justify-between">
          <Label className="text-xs">VAD threshold</Label>
          <span className="text-xs tabular-nums text-muted-foreground">
            {video.settings.vadThreshold.toFixed(2)}
          </span>
        </div>
        <Slider
          value={[video.settings.vadThreshold]}
          min={0}
          max={1}
          step={0.01}
          onValueChange={(v) => set("vadThreshold", v[0])}
          disabled={disabled}
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Start padding</Label>
          <span className="text-xs tabular-nums text-muted-foreground">
            {video.settings.startPadding.toFixed(1)}s
          </span>
        </div>
        <Slider
          value={[video.settings.startPadding]}
          min={0}
          max={5}
          step={0.1}
          onValueChange={(v) => set("startPadding", v[0])}
          disabled={disabled}
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">End padding</Label>
          <span className="text-xs tabular-nums text-muted-foreground">
            {video.settings.endPadding.toFixed(1)}s
          </span>
        </div>
        <Slider
          value={[video.settings.endPadding]}
          min={0}
          max={5}
          step={0.1}
          onValueChange={(v) => set("endPadding", v[0])}
          disabled={disabled}
        />
      </div>
      <label className="md:col-span-3 flex items-center justify-between rounded-md border border-border bg-background/40 px-3 py-2 cursor-pointer">
        <div>
          <p className="text-sm font-medium">
            Auto-clean failed transcriptions
          </p>
          <p className="text-xs text-muted-foreground">
            Remove clips that fail before saving to cloud.
          </p>
        </div>
        <Switch
          checked={video.settings.autoCleanNullTranscriptions}
          onCheckedChange={(v) => set("autoCleanNullTranscriptions", v)}
          disabled={disabled}
        />
      </label>
    </div>
  );
}
