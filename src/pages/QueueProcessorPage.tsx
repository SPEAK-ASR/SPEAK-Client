import { useCallback, useEffect, useRef, useState } from "react";
import { PageHeader } from "../components/layout/PageHeader";
import { audioApi } from "../lib/api";
import type { PlaylistVideo } from "../lib/api";
import { toast } from "../components/ui/toast";
import {
  CONCURRENT_VIDEO_LIMIT,
  DEFAULT_VIDEO_SETTINGS,
  STAGE_PROGRESS,
  type QueueVideo,
  type VideoSettings,
} from "../types/queue";
import { BatchSettingsCard } from "./queue-processor/BatchSettingsCard";
import { QueueInputCard } from "./queue-processor/QueueInputCard";
import { QueueTable } from "./queue-processor/QueueTable";
import { RunControlBar } from "./queue-processor/RunControlBar";

const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

const extractVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
};

export function QueueProcessorPage() {
  const [queue, setQueue] = useState<QueueVideo[]>([]);
  const [defaultSettings, setDefaultSettings] = useState<VideoSettings>(
    DEFAULT_VIDEO_SETTINGS,
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingPlaylist, setIsLoadingPlaylist] = useState(false);
  const abortRef = useRef(false);
  const activeIdsRef = useRef<Set<string>>(new Set());

  const counts = queue.reduce(
    (acc, v) => {
      if (v.status === "complete") acc.complete++;
      else if (v.status === "error") acc.error++;
      else if (v.status !== "pending") acc.processing++;
      else acc.pending++;
      return acc;
    },
    { pending: 0, processing: 0, complete: 0, error: 0 },
  );

  const handleAddUrl = useCallback(
    (url: string) => {
      const vid = extractVideoId(url);
      const newVideo: QueueVideo = {
        id: generateId(),
        url,
        title: vid ? `Video ${vid}` : "Unknown video",
        status: "pending",
        progress: 0,
        settings: { ...defaultSettings },
      };
      setQueue((prev) => [...prev, newVideo]);
    },
    [defaultSettings],
  );

  const handleLoadPlaylist = useCallback(
    async (url: string, limit?: number) => {
      setIsLoadingPlaylist(true);
      try {
        const res = await audioApi.getPlaylistVideos(url, limit);
        if (res.success && res.videos.length > 0) {
          const newVideos: QueueVideo[] = res.videos.map((v: PlaylistVideo) => ({
            id: generateId(),
            url: v.url,
            videoId: v.video_id,
            title: v.title,
            thumbnail: v.thumbnail,
            duration: v.duration,
            status: "pending" as const,
            progress: 0,
            settings: { ...defaultSettings },
          }));
          setQueue((prev) => [...prev, ...newVideos]);
          toast.success(`Loaded ${newVideos.length} videos from playlist`);
        } else {
          toast.info("No videos found in playlist");
        }
      } catch (err) {
        toast.error("Could not load playlist", {
          description: (err as Error)?.message,
        });
        throw err;
      } finally {
        setIsLoadingPlaylist(false);
      }
    },
    [defaultSettings],
  );

  const handleLoadJson = useCallback(
    (videos: Array<{ video_link: string; domain: string }>) => {
      setQueue((prev) => {
        const existing = new Set(prev.map((v) => v.url));
        const incoming: QueueVideo[] = videos
          .filter((v) => !existing.has(v.video_link))
          .map((v) => {
            const vid = extractVideoId(v.video_link);
            return {
              id: generateId(),
              url: v.video_link,
              title: vid ? `Video ${vid}` : "Unknown video",
              status: "pending" as const,
              progress: 0,
              settings: {
                ...defaultSettings,
                domain: v.domain || defaultSettings.domain,
              },
            };
          });
        if (incoming.length > 0) {
          toast.success(`Imported ${incoming.length} videos from JSON`);
        }
        return [...prev, ...incoming];
      });
    },
    [defaultSettings],
  );

  const handleRemove = useCallback((id: string) => {
    setQueue((prev) => prev.filter((v) => v.id !== id));
  }, []);

  const handleUpdateSettings = useCallback(
    (id: string, settings: VideoSettings) => {
      setQueue((prev) =>
        prev.map((v) => (v.id === id ? { ...v, settings } : v)),
      );
    },
    [],
  );

  const handleRetry = useCallback((id: string) => {
    setQueue((prev) =>
      prev.map((v) =>
        v.id === id
          ? { ...v, status: "pending" as const, progress: 0, error: undefined }
          : v,
      ),
    );
  }, []);

  const updateVideo = useCallback(
    (id: string, updates: Partial<QueueVideo>) =>
      setQueue((prev) =>
        prev.map((v) => (v.id === id ? { ...v, ...updates } : v)),
      ),
    [],
  );

  const processOne = useCallback(
    async (video: QueueVideo) => {
      const { id, url, settings } = video;
      try {
        if (!settings.domain) {
          throw new Error("Missing category");
        }
        updateVideo(id, {
          status: "splitting",
          progress: STAGE_PROGRESS.splitting,
        });
        const split = await audioApi.splitAudio(
          url,
          settings.domain,
          settings.vadThreshold,
          settings.startPadding,
          settings.endPadding,
        );
        if (!split.success || abortRef.current)
          throw new Error("Failed to split audio");

        const videoId = split.video_id;
        updateVideo(id, {
          videoId,
          title: split.video_metadata.title,
          thumbnail: split.video_metadata.thumbnail,
          clipCount: split.total_clips,
          status: "transcribing",
          progress: STAGE_PROGRESS.transcribing,
        });
        if (abortRef.current) throw new Error("Cancelled");

        const tx = await audioApi.transcribeClips(videoId);
        if (!tx.success || abortRef.current)
          throw new Error("Failed to transcribe clips");

        if (settings.autoCleanNullTranscriptions) {
          updateVideo(id, {
            status: "cleaning",
            progress: STAGE_PROGRESS.cleaning,
          });
          if (abortRef.current) throw new Error("Cancelled");
          await audioApi.cleanNullTranscriptions(videoId);
        }

        if (abortRef.current) throw new Error("Cancelled");

        updateVideo(id, {
          status: "saving",
          progress: STAGE_PROGRESS.saving,
        });
        const save = await audioApi.saveToCloud(videoId);
        if (!save.success) throw new Error("Failed to save to cloud");

        updateVideo(id, {
          status: "complete",
          progress: STAGE_PROGRESS.complete,
          savedCount: save.total_processed,
        });
      } catch (err) {
        updateVideo(id, {
          status: "error",
          progress: 0,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    },
    [updateVideo],
  );

  const processWithTracking = useCallback(
    async (video: QueueVideo) => {
      activeIdsRef.current.add(video.id);
      try {
        await processOne(video);
      } finally {
        activeIdsRef.current.delete(video.id);
      }
    },
    [processOne],
  );

  const fillSlots = useCallback(() => {
    if (abortRef.current) return;
    const active = activeIdsRef.current.size;
    const slots = CONCURRENT_VIDEO_LIMIT - active;
    if (slots <= 0) return;
    const pending = queue.filter(
      (v) => v.status === "pending" && !activeIdsRef.current.has(v.id),
    );
    pending.slice(0, slots).forEach((v) => {
      processWithTracking(v);
    });
  }, [queue, processWithTracking]);

  const handleStart = () => {
    if (!defaultSettings.domain && queue.some((v) => !v.settings.domain)) {
      toast.error("Pick a category", {
        description:
          "Set the default batch category, or pick one for every video first.",
      });
      return;
    }
    abortRef.current = false;
    setIsProcessing(true);
  };

  const handleStop = () => {
    abortRef.current = true;
    setIsProcessing(false);
  };

  useEffect(() => {
    if (!isProcessing) return;
    fillSlots();
  }, [isProcessing, queue, fillSlots]);

  useEffect(() => {
    if (!isProcessing) return;
    const allDone =
      queue.length > 0 &&
      queue.every((v) => v.status === "complete" || v.status === "error");
    if (allDone) {
      setIsProcessing(false);
      toast.success("Queue complete");
    }
  }, [isProcessing, queue]);

  const overallProgress =
    queue.length > 0
      ? Math.round(
          queue.reduce((acc, v) => acc + v.progress, 0) / queue.length,
        )
      : 0;
  const hasVideosToProcess = queue.some(
    (v) => v.status === "pending" || v.status === "error",
  );

  return (
    <>
      <PageHeader
        eyebrow="Pipeline"
        title="Queue Processor"
        description={`Process up to ${CONCURRENT_VIDEO_LIMIT} videos concurrently.`}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <div className="space-y-4">
          <QueueInputCard
            onAddUrl={handleAddUrl}
            onLoadPlaylist={handleLoadPlaylist}
            onLoadJson={handleLoadJson}
            isLoadingPlaylist={isLoadingPlaylist}
            disabled={isProcessing}
          />
          <BatchSettingsCard
            settings={defaultSettings}
            onChange={setDefaultSettings}
            disabled={isProcessing}
          />
        </div>

        <div className="min-w-0">
          <RunControlBar
            isProcessing={isProcessing}
            hasVideosToProcess={hasVideosToProcess}
            overallProgress={overallProgress}
            counts={counts}
            onStart={handleStart}
            onStop={handleStop}
          />
          <QueueTable
            videos={queue}
            onRemove={handleRemove}
            onRetry={handleRetry}
            onUpdateSettings={handleUpdateSettings}
            isProcessing={isProcessing}
          />
        </div>
      </div>
    </>
  );
}
