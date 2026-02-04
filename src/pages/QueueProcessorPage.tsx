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
import { DEFAULT_VIDEO_SETTINGS, STAGE_PROGRESS, CONCURRENT_VIDEO_LIMIT } from "../types/queue";
import type { QueueVideo, VideoSettings } from "../types/queue";

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
    // Track IDs of videos currently being processed (for concurrent processing)
    const activeVideoIdsRef = useRef<Set<string>>(new Set());

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

    // Process a single video through all stages sequentially
    const processVideoSequentially = useCallback(
        async (video: QueueVideo) => {
            const { id, url, settings } = video;

            try {
                // Stage 1: Split Audio (download and split)
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

                const videoId = splitResult.video_id;

                // Update video with metadata
                updateVideo(id, {
                    videoId: videoId,
                    title: splitResult.video_metadata.title,
                    thumbnail: splitResult.video_metadata.thumbnail,
                    clipCount: splitResult.total_clips,
                    status: "transcribing",
                    progress: STAGE_PROGRESS.transcribing,
                });

                if (abortRef.current) throw new Error("Processing cancelled");

                // Stage 2: Transcribe clips
                const transcribeResult = await audioApi.transcribeClips(videoId);

                if (!transcribeResult.success || abortRef.current) {
                    throw new Error("Failed to transcribe clips");
                }

                // Stage 3: Clean null transcriptions (if enabled)
                if (settings.autoCleanNullTranscriptions) {
                    updateVideo(id, {
                        status: "cleaning",
                        progress: STAGE_PROGRESS.cleaning,
                    });

                    if (abortRef.current) throw new Error("Processing cancelled");

                    await audioApi.cleanNullTranscriptions(videoId);
                }

                if (abortRef.current) throw new Error("Processing cancelled");

                // Stage 4: Save to cloud
                updateVideo(id, {
                    status: "saving",
                    progress: STAGE_PROGRESS.saving,
                });

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

                return true;
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : "Unknown error";
                updateVideo(id, { status: "error", progress: 0, error: errorMessage });
                return false;
            }
        },
        [updateVideo]
    );

    // Process a single video and remove from active set when done
    const processVideoWithTracking = useCallback(
        async (video: QueueVideo) => {
            activeVideoIdsRef.current.add(video.id);
            try {
                await processVideoSequentially(video);
            } finally {
                activeVideoIdsRef.current.delete(video.id);
            }
        },
        [processVideoSequentially]
    );

    // Start processing pending videos up to the concurrency limit
    const fillProcessingSlots = useCallback(() => {
        if (abortRef.current) return;

        // Get current active count
        const activeCount = activeVideoIdsRef.current.size;
        const availableSlots = CONCURRENT_VIDEO_LIMIT - activeCount;

        if (availableSlots <= 0) return;

        // Find pending videos that aren't already being processed
        const pendingVideos = queue.filter(
            (v) => v.status === "pending" && !activeVideoIdsRef.current.has(v.id)
        );

        // Start processing videos up to available slots
        const videosToStart = pendingVideos.slice(0, availableSlots);

        videosToStart.forEach((video) => {
            // Fire and forget - each video processes independently
            processVideoWithTracking(video);
        });
    }, [queue, processVideoWithTracking]);

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

    // Concurrent queue processor - fills available slots when processing is active
    useEffect(() => {
        if (!isProcessing) return;

        fillProcessingSlots();
    }, [isProcessing, queue, fillProcessingSlots]);

    // Auto-stop when all videos are done
    useEffect(() => {
        if (!isProcessing) return;

        const allDone = queue.every(
            (v) => v.status === "complete" || v.status === "error"
        );

        if (allDone && queue.length > 0) {
            setIsProcessing(false);
        }
    }, [isProcessing, queue]);

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
                        Process multiple YouTube videos concurrently (up to {CONCURRENT_VIDEO_LIMIT} at a time)
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
                                {isProcessing && (
                                    <Chip
                                        size="small"
                                        label={`${statusCounts.processing}/${CONCURRENT_VIDEO_LIMIT} slots`}
                                        color="info"
                                        variant="filled"
                                    />
                                )}
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
