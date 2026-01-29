import { useState, useCallback, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Chip,
  LinearProgress,
} from "@mui/material";
import {
  PlayArrow,
  Stop,
  Queue as QueueIcon,
  CheckCircle,
  Error as ErrorIcon,
} from "@mui/icons-material";
import {
  VideoQueueInput,
  BatchSettings,
  VideoQueueTable,
} from "../components/queue";
import { audioApi } from "../lib/api";
import type { PlaylistVideo } from "../lib/api";
import { DEFAULT_VIDEO_SETTINGS, STAGE_PROGRESS } from "../types/queue";
import type { QueueVideo, VideoSettings, VideoStatus } from "../types/queue";

// Pipeline stage capacity - how many videos can be in each stage simultaneously
// Adjust these values to change concurrency per stage
const STAGE_CAPACITY: Partial<Record<VideoStatus, number>> = {
  splitting: 1, // Only 1 download at a time (heavy I/O)
  transcribing: 1, // 1 transcription at a time
  cleaning: 1, // 1 cleaning at a time
  saving: 1, // 1 save at a time
};

// Generate unique ID
const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Extract video ID from YouTube URL
const extractVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

export function QueueProcessorPage() {
  const [queue, setQueue] = useState<QueueVideo[]>([]);
  const [defaultSettings, setDefaultSettings] = useState<VideoSettings>(
    DEFAULT_VIDEO_SETTINGS
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingPlaylist, setIsLoadingPlaylist] = useState(false);
  const abortRef = useRef(false);
  // Track which videos are currently being processed to prevent double-processing
  const processingRef = useRef<Set<string>>(new Set());

  // Count videos by status
  const statusCounts = queue.reduce(
    (acc, v) => {
      if (v.status === "complete") acc.complete++;
      else if (v.status === "error") acc.error++;
      else if (v.status !== "pending") acc.processing++;
      else acc.pending++;
      return acc;
    },
    { pending: 0, processing: 0, complete: 0, error: 0 }
  );

  // Add single URL to queue
  const handleAddUrl = useCallback(
    (url: string) => {
      const videoId = extractVideoId(url);
      const newVideo: QueueVideo = {
        id: generateId(),
        url,
        title: videoId ? `Video ${videoId}` : "Unknown Video",
        status: "pending",
        progress: 0,
        settings: { ...defaultSettings },
      };
      setQueue((prev) => [...prev, newVideo]);
    },
    [defaultSettings]
  );

  // Load videos from playlist
  const handleLoadPlaylist = useCallback(
    async (playlistUrl: string, limit?: number) => {
      setIsLoadingPlaylist(true);
      try {
        const response = await audioApi.getPlaylistVideos(playlistUrl, limit);
        if (response.success && response.videos.length > 0) {
          const newVideos: QueueVideo[] = response.videos.map(
            (video: PlaylistVideo) => ({
              id: generateId(),
              url: video.url,
              videoId: video.video_id,
              title: video.title,
              thumbnail: video.thumbnail,
              duration: video.duration,
              status: "pending" as const,
              progress: 0,
              settings: { ...defaultSettings },
            })
          );
          setQueue((prev) => [...prev, ...newVideos]);
        }
      } finally {
        setIsLoadingPlaylist(false);
      }
    },
    [defaultSettings]
  );

  // Remove video from queue
  const handleRemove = useCallback((id: string) => {
    setQueue((prev) => prev.filter((v) => v.id !== id));
  }, []);

  // Update video settings
  const handleUpdateSettings = useCallback(
    (id: string, settings: VideoSettings) => {
      setQueue((prev) =>
        prev.map((v) => (v.id === id ? { ...v, settings } : v))
      );
    },
    []
  );

  // Update video state helper
  const updateVideo = useCallback(
    (id: string, updates: Partial<QueueVideo>) => {
      setQueue((prev) =>
        prev.map((v) => (v.id === id ? { ...v, ...updates } : v))
      );
    },
    []
  );

  // Pipeline stage processors - each handles one stage and marks video ready for next stage

  // Stage 1: Split Audio (download and split)
  const processSplitting = useCallback(
    async (video: QueueVideo) => {
      const { id, url, settings } = video;
      processingRef.current.add(id);

      try {
        updateVideo(id, {
          status: "splitting",
          progress: STAGE_PROGRESS.splitting,
        });
        const splitResult = await audioApi.splitAudio(
          url,
          settings.domain,
          settings.vadAggressiveness,
          settings.startPadding,
          settings.endPadding
        );

        if (!splitResult.success || abortRef.current) {
          throw new Error("Failed to split audio");
        }

        // Update video with metadata and move to transcribing stage
        updateVideo(id, {
          videoId: splitResult.video_id,
          title: splitResult.video_metadata.title,
          thumbnail: splitResult.video_metadata.thumbnail,
          clipCount: splitResult.total_clips,
          status: "transcribing",
          progress: STAGE_PROGRESS.transcribing,
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        updateVideo(id, { status: "error", progress: 0, error: errorMessage });
      } finally {
        processingRef.current.delete(id);
      }
    },
    [updateVideo]
  );

  // Stage 2: Transcribe clips
  const processTranscribing = useCallback(
    async (video: QueueVideo) => {
      const { id, videoId, settings } = video;
      if (!videoId) return;
      processingRef.current.add(id);

      try {
        const transcribeResult = await audioApi.transcribeClips(videoId);

        if (!transcribeResult.success || abortRef.current) {
          throw new Error("Failed to transcribe clips");
        }

        // Move to cleaning or saving stage based on settings
        if (settings.autoCleanNullTranscriptions) {
          updateVideo(id, {
            status: "cleaning",
            progress: STAGE_PROGRESS.cleaning,
          });
        } else {
          updateVideo(id, {
            status: "saving",
            progress: STAGE_PROGRESS.saving,
          });
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        updateVideo(id, { status: "error", progress: 0, error: errorMessage });
      } finally {
        processingRef.current.delete(id);
      }
    },
    [updateVideo]
  );

  // Stage 3: Clean null transcriptions
  const processCleaning = useCallback(
    async (video: QueueVideo) => {
      const { id, videoId } = video;
      if (!videoId) return;
      processingRef.current.add(id);

      try {
        await audioApi.cleanNullTranscriptions(videoId);

        if (abortRef.current) {
          throw new Error("Processing cancelled");
        }

        // Move to saving stage
        updateVideo(id, { status: "saving", progress: STAGE_PROGRESS.saving });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        updateVideo(id, { status: "error", progress: 0, error: errorMessage });
      } finally {
        processingRef.current.delete(id);
      }
    },
    [updateVideo]
  );

  // Stage 4: Save to cloud
  const processSaving = useCallback(
    async (video: QueueVideo) => {
      const { id, videoId } = video;
      if (!videoId) return;
      processingRef.current.add(id);

      try {
        const saveResult = await audioApi.saveToCloud(videoId);

        if (!saveResult.success) {
          throw new Error("Failed to save to cloud");
        }

        // Complete!
        updateVideo(id, {
          status: "complete",
          progress: STAGE_PROGRESS.complete,
          savedCount: saveResult.total_processed,
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        updateVideo(id, { status: "error", progress: 0, error: errorMessage });
      } finally {
        processingRef.current.delete(id);
      }
    },
    [updateVideo]
  );

  // Retry a failed video
  const handleRetry = useCallback((id: string) => {
    setQueue((prev) =>
      prev.map((v) =>
        v.id === id
          ? { ...v, status: "pending" as const, progress: 0, error: undefined }
          : v
      )
    );
  }, []);

  // Start/stop processing
  const handleStartProcessing = useCallback(() => {
    abortRef.current = false;
    setIsProcessing(true);
  }, []);

  const handleStopProcessing = useCallback(() => {
    abortRef.current = true;
    setIsProcessing(false);
  }, []);

  // Pipeline scheduler - processes videos through stages with capacity limits
  useEffect(() => {
    if (!isProcessing) return;

    const schedulePipeline = () => {
      // Count videos currently in each stage (excluding those being processed by ref)
      const stageCounts: Partial<Record<VideoStatus, number>> = {};
      for (const video of queue) {
        if (processingRef.current.has(video.id)) {
          stageCounts[video.status] = (stageCounts[video.status] || 0) + 1;
        }
      }

      // Process each stage with capacity limits
      // Stage 4: Saving - process videos ready for saving
      const savingCount = stageCounts["saving"] || 0;
      if (savingCount < (STAGE_CAPACITY.saving || 1)) {
        const readyForSaving = queue.find(
          (v) => v.status === "saving" && !processingRef.current.has(v.id)
        );
        if (readyForSaving) {
          processSaving(readyForSaving);
        }
      }

      // Stage 3: Cleaning - process videos ready for cleaning
      const cleaningCount = stageCounts["cleaning"] || 0;
      if (cleaningCount < (STAGE_CAPACITY.cleaning || 1)) {
        const readyForCleaning = queue.find(
          (v) => v.status === "cleaning" && !processingRef.current.has(v.id)
        );
        if (readyForCleaning) {
          processCleaning(readyForCleaning);
        }
      }

      // Stage 2: Transcribing - process videos ready for transcription
      const transcribingCount = stageCounts["transcribing"] || 0;
      if (transcribingCount < (STAGE_CAPACITY.transcribing || 1)) {
        const readyForTranscribing = queue.find(
          (v) => v.status === "transcribing" && !processingRef.current.has(v.id)
        );
        if (readyForTranscribing) {
          processTranscribing(readyForTranscribing);
        }
      }

      // Stage 1: Splitting - start pending videos (only if splitting stage has capacity)
      const splittingCount = stageCounts["splitting"] || 0;
      if (splittingCount < (STAGE_CAPACITY.splitting || 1)) {
        const pendingVideo = queue.find(
          (v) => v.status === "pending" && !processingRef.current.has(v.id)
        );
        if (pendingVideo) {
          processSplitting(pendingVideo);
        }
      }

      // Check if all done
      const hasActive = queue.some((v) =>
        ["pending", "splitting", "transcribing", "cleaning", "saving"].includes(
          v.status
        )
      );

      if (!hasActive && !abortRef.current) {
        setIsProcessing(false);
      }
    };

    schedulePipeline();
  }, [
    isProcessing,
    queue,
    processSplitting,
    processTranscribing,
    processCleaning,
    processSaving,
  ]);

  // Calculate overall progress
  const overallProgress =
    queue.length > 0
      ? Math.round(queue.reduce((acc, v) => acc + v.progress, 0) / queue.length)
      : 0;

  const hasVideosToProcess = queue.some(
    (v) => v.status === "pending" || v.status === "error"
  );

  return (
    <Box sx={{ minHeight: "100vh", p: 2 }}>
      <Box sx={{ maxWidth: 1400, mx: "auto" }}>
        {/* Header */}
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Typography
            variant="h3"
            component="h1"
            fontWeight="bold"
            sx={{
              mb: 0.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
            }}
          >
            <QueueIcon sx={{ fontSize: 40 }} />
            Queue Processor
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Process multiple YouTube videos with concurrent batch processing
          </Typography>
        </Box>

        {/* Main layout */}
        <Box
          sx={{
            display: "flex",
            gap: 3,
            flexDirection: { xs: "column", lg: "row" },
          }}
        >
          {/* Left sidebar: Input & Settings */}
          <Box sx={{ width: { xs: "100%", lg: 400 }, flexShrink: 0 }}>
            <VideoQueueInput
              onAddUrl={handleAddUrl}
              onLoadPlaylist={handleLoadPlaylist}
              isLoadingPlaylist={isLoadingPlaylist}
              disabled={isProcessing}
            />
            <BatchSettings
              settings={defaultSettings}
              onSettingsChange={setDefaultSettings}
              disabled={isProcessing}
            />
          </Box>

          {/* Main content: Queue table */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* Control bar */}
            <Paper
              elevation={2}
              sx={{
                p: 2,
                mb: 2,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              <Button
                variant="contained"
                color={isProcessing ? "error" : "primary"}
                startIcon={isProcessing ? <Stop /> : <PlayArrow />}
                onClick={
                  isProcessing ? handleStopProcessing : handleStartProcessing
                }
                disabled={!hasVideosToProcess && !isProcessing}
                sx={{ minWidth: 140 }}
              >
                {isProcessing ? "Stop" : "Start Processing"}
              </Button>

              <Box sx={{ flex: 1, minWidth: 200 }}>
                {isProcessing && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Overall Progress: {overallProgress}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={overallProgress}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>
                )}
              </Box>

              {/* Status chips */}
              <Box sx={{ display: "flex", gap: 1 }}>
                <Chip
                  size="small"
                  label={`${statusCounts.pending} pending`}
                  variant="outlined"
                />
                <Chip
                  size="small"
                  icon={<CheckCircle sx={{ fontSize: 16 }} />}
                  label={`${statusCounts.complete} done`}
                  color="success"
                  variant="outlined"
                />
                {statusCounts.error > 0 && (
                  <Chip
                    size="small"
                    icon={<ErrorIcon sx={{ fontSize: 16 }} />}
                    label={`${statusCounts.error} failed`}
                    color="error"
                    variant="outlined"
                  />
                )}
              </Box>
            </Paper>

            {/* Queue table */}
            <VideoQueueTable
              videos={queue}
              onRemove={handleRemove}
              onRetry={handleRetry}
              onUpdateSettings={handleUpdateSettings}
              isProcessing={isProcessing}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
