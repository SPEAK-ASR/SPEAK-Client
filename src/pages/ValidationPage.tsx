import { useCallback, useEffect, useRef, useState } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Divider,
    LinearProgress,
    Stack,
    Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import {
    MiniAudioPlayer,
    type MiniAudioPlayerHandle,
} from "../components/audio/MiniAudioPlayer";
import {
    EmptyQueueCard,
    NotificationSnackbar,
} from "../components/transcription";
import { useSnackbar } from "../hooks/useSnackbar";
import {
    transcriptionServiceApi,
    type YouTubeVideoValidationItem,
    type VideoAudioClip,
} from "../lib/transcriptionServiceApi";

export function ValidationPage() {
    const [video, setVideo] = useState<YouTubeVideoValidationItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [playingAll, setPlayingAll] = useState(false);
    const [activeClipIndex, setActiveClipIndex] = useState<number>(-1);

    const clipRefs = useRef<(MiniAudioPlayerHandle | null)[]>([]);
    const clipCardRefs = useRef<(HTMLDivElement | null)[]>([]);
    const playAllAbort = useRef(false);

    const { snackbar, showSuccess, showError, showInfo, closeSnackbar } =
        useSnackbar();

    const loadNextVideo = useCallback(async () => {
        setLoading(true);
        setVideo(null);
        setPlayingAll(false);
        setActiveClipIndex(-1);
        playAllAbort.current = true;
        try {
            const data =
                await transcriptionServiceApi.getNextYouTubeVideoForValidation();
            setVideo(data);
        } catch (error: unknown) {
            const err = error as { response?: { status?: number } };
            if (err?.response?.status === 404) {
                setVideo(null);
                showInfo("No pending videos to validate. Great job!");
            } else {
                console.error(error);
                showError("Failed to load next video.");
            }
        } finally {
            setLoading(false);
        }
    }, [showInfo, showError]);

    useEffect(() => {
        loadNextVideo();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Reset refs array when clip count changes
    useEffect(() => {
        clipRefs.current = video?.audio_clips.map(() => null) ?? [];
        clipCardRefs.current = video?.audio_clips.map(() => null) ?? [];
    }, [video]);

    const handlePlayAll = useCallback(async () => {
        if (!video || video.audio_clips.length === 0) return;
        playAllAbort.current = false;
        setPlayingAll(true);

        for (let i = 0; i < video.audio_clips.length; i++) {
            if (playAllAbort.current) break;
            setActiveClipIndex(i);

            // Auto-scroll to the active clip
            const clipCard = clipCardRefs.current[i];
            if (clipCard) {
                clipCard.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                });
            }

            const player = clipRefs.current[i];
            if (!player) continue;

            await new Promise<void>((resolve) => {
                // We need to wire onEnded temporarily — handled via the ref's play + a listener
                const onEnd = () => resolve();
                // Play and wait for it to end
                player.play().catch(() => resolve());
                // The MiniAudioPlayer calls onEnded when clip finishes; we'll use a polling approach
                // since we can't dynamically swap onEnded. Instead, let's use the audio element ended event.
                // Simpler: create a promise that resolves when the audio element fires "ended"
                // We'll rely on a timeout-based polling since we don't have direct access.
                // Actually, the cleanest way: use the onEnded callback. We'll set it up on the clip card.
                // For now, let's just resolve via the onEnded wired in the clip.
                // We pass a callback per-clip that resolves the promise.
                clipEndResolvers.current[i] = onEnd;
            });

            // 1-second gap between clips
            if (i < video.audio_clips.length - 1 && !playAllAbort.current) {
                await new Promise((r) => setTimeout(r, 1000));
            }
        }

        setPlayingAll(false);
        setActiveClipIndex(-1);
    }, [video]);

    const handleStopAll = useCallback(() => {
        playAllAbort.current = true;
        setPlayingAll(false);
        setActiveClipIndex(-1);
        clipRefs.current.forEach((ref) => ref?.stop());
        // Resolve any pending promise
        clipEndResolvers.current.forEach((resolve) => resolve?.());
        clipEndResolvers.current = [];
    }, []);

    // Store resolvers for play-all sequencing
    const clipEndResolvers = useRef<((() => void) | null)[]>([]);

    const handleClipEnded = useCallback((index: number) => {
        const resolver = clipEndResolvers.current[index];
        if (resolver) {
            resolver();
            clipEndResolvers.current[index] = null;
        }
    }, []);

    const handleValidate = useCallback(
        async (isValidated: boolean) => {
            if (!video) return;
            handleStopAll();
            try {
                setSubmitting(true);
                await transcriptionServiceApi.submitVideoValidationStatus(
                    video.id,
                    isValidated,
                );
                showSuccess(
                    isValidated
                        ? "Video marked as validated. Loading next..."
                        : "Video marked as not validated. Loading next...",
                );
                await loadNextVideo();
            } catch (error) {
                console.error(error);
                showError("Failed to submit validation status.");
            } finally {
                setSubmitting(false);
            }
        },
        [video, handleStopAll, loadNextVideo, showSuccess, showError],
    );

    return (
        <Box
            component="section"
            sx={{ height: "90vh", display: "flex", flexDirection: "column" }}
        >
            {/* Header */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    mb: 3,
                    // items in here vertically align bottom of the outer div
                }}
            >
                <Box>
                    <Typography variant="h4" fontWeight={700} gutterBottom>
                        Video Validation
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Listen to audio clips and validate YouTube video
                        transcriptions
                    </Typography>
                </Box>
                {/* Play All / Stop All toolbar */}
                {playingAll ? (
                    <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<StopIcon />}
                        onClick={handleStopAll}
                        sx={{ mt: "auto" }}
                    >
                        Stop All
                    </Button>
                ) : (
                    <Button
                        variant="contained"
                        size="small"
                        startIcon={<PlayArrowIcon />}
                        onClick={handlePlayAll}
                        sx={{ mt: "auto" }}
                    >
                        Play All
                    </Button>
                )}
            </Box>

            {/* Empty / Loading state */}
            {!video && !loading ? (
                <EmptyQueueCard
                    title="No videos pending validation 🎉"
                    description="All YouTube videos have been reviewed."
                    onRefresh={loadNextVideo}
                    refreshLabel="Check again"
                />
            ) : loading ? (
                <Card variant="outlined">
                    <CardContent sx={{ textAlign: "center", py: 4 }}>
                        <Typography color="text.secondary">
                            Loading next video...
                        </Typography>
                    </CardContent>
                </Card>
            ) : (
                video && (
                    <Box
                        sx={{
                            flexGrow: 1,
                            minHeight: 0,
                            display: "flex",
                            flexDirection: "column",
                        }}
                    >
                        {/* Two-column layout: Video info (left) + Audio clips (right) */}
                        <Box
                            sx={{
                                display: "grid",
                                gap: 3,
                                gridTemplateColumns: {
                                    xs: "1fr",
                                    md: "380px 1fr",
                                },
                                alignItems: "stretch",
                                flexGrow: 1,
                                minHeight: 0,
                            }}
                        >
                            {/* Left Column – Video Info */}
                            <Card
                                variant="outlined"
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    maxHeight: "100%",
                                    overflow: "hidden",
                                }}
                            >
                                <CardContent
                                    sx={{
                                        p: 2,
                                        "&:last-child": { pb: 2 },
                                        overflowY: "auto",
                                        flexGrow: 1,
                                    }}
                                >
                                    <Box
                                        component="img"
                                        src={video.thumbnail}
                                        alt={video.title}
                                        sx={{
                                            width: "100%",
                                            borderRadius: 1.5,
                                            objectFit: "cover",
                                            mb: 2,
                                        }}
                                    />

                                    <Typography
                                        variant="subtitle1"
                                        fontWeight={600}
                                        gutterBottom
                                        sx={{
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {video.title}
                                    </Typography>

                                    <Stack
                                        direction="row"
                                        spacing={0.5}
                                        flexWrap="wrap"
                                        useFlexGap
                                        sx={{ mb: 1.5 }}
                                    >
                                        <Chip
                                            label={video.uploader}
                                            size="small"
                                            variant="outlined"
                                        />
                                        <Chip
                                            label={video.domain.replace(
                                                /_/g,
                                                " ",
                                            )}
                                            size="small"
                                            color="primary"
                                            variant="outlined"
                                        />
                                        <Chip
                                            label={`${video.audio_clip_count} clips`}
                                            size="small"
                                            variant="outlined"
                                        />
                                        <Chip
                                            label={`${Math.floor(Number(video.duration) / 60)}m ${Number(video.duration) % 60}s`}
                                            size="small"
                                            variant="outlined"
                                        />
                                        <Chip
                                            label={video.upload_date}
                                            size="small"
                                            variant="outlined"
                                        />
                                    </Stack>

                                    <Button
                                        href={video.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        size="small"
                                        startIcon={<OpenInNewIcon />}
                                        fullWidth
                                        variant="outlined"
                                    >
                                        Open on YouTube
                                    </Button>

                                    {/* Validation Actions */}
                                    <Divider sx={{ my: 2 }} />
                                    <Stack spacing={1}>
                                        <Button
                                            variant="contained"
                                            color="success"
                                            startIcon={<CheckCircleIcon />}
                                            onClick={() => handleValidate(true)}
                                            disabled={submitting}
                                            fullWidth
                                        >
                                            Mark as Validated
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            color="warning"
                                            onClick={() =>
                                                handleValidate(false)
                                            }
                                            disabled={submitting}
                                            fullWidth
                                        >
                                            Mark as Not Valid
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            startIcon={<SkipNextIcon />}
                                            onClick={loadNextVideo}
                                            disabled={submitting}
                                            fullWidth
                                        >
                                            Skip
                                        </Button>
                                    </Stack>
                                </CardContent>
                            </Card>

                            {/* Right Column – Audio Clips */}
                            <Stack
                                sx={{
                                    height: "100%",
                                    overflowY: "auto",
                                    pr: 1,
                                    borderRadius: 1.5,
                                }}
                            >
                                {video.audio_clips.map(
                                    (clip: VideoAudioClip, index: number) => (
                                        <AudioClipCard
                                            key={clip.audio_id}
                                            clip={clip}
                                            highlight={
                                                playingAll &&
                                                activeClipIndex === index
                                            }
                                            playerRef={(el) => {
                                                clipRefs.current[index] = el;
                                            }}
                                            cardRef={(el) => {
                                                clipCardRefs.current[index] =
                                                    el;
                                            }}
                                            onEnded={() =>
                                                handleClipEnded(index)
                                            }
                                        />
                                    ),
                                )}
                            </Stack>
                        </Box>
                    </Box>
                )
            )}

            <NotificationSnackbar snackbar={snackbar} onClose={closeSnackbar} />
        </Box>
    );
}

/* ------------------------------------------------------------------ */
/*  Audio Clip Card (local sub-component)                             */
/* ------------------------------------------------------------------ */

interface AudioClipCardProps {
    clip: VideoAudioClip;
    highlight?: boolean;
    playerRef: (handle: MiniAudioPlayerHandle | null) => void;
    cardRef: (el: HTMLDivElement | null) => void;
    onEnded: () => void;
}

function AudioClipCard({
    clip,
    highlight,
    playerRef,
    cardRef,
    onEnded,
}: AudioClipCardProps) {
    return (
        <Box
            ref={cardRef}
            sx={{
                borderBottom: 1,
                borderColor: "divider",
                borderRadius: 0,
                bgcolor: "background.paper",
                transition: "box-shadow 0.2s, border-color 0.2s",
                // boxShadow: highlight
                //     ? (theme) => `0 0 0 1px ${theme.palette.primary.main}`
                //     : undefined,
            }}
        >
            <Box sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <MiniAudioPlayer
                    ref={playerRef}
                    src={clip.gcs_signed_url}
                    onEnded={onEnded}
                    highlight={highlight}
                />

                {clip.google_transcription && (
                    <Box
                        sx={{
                            mt: 1,
                            p: 1,
                            border: 3,
                            borderColor: highlight
                                ? "primary.main"
                                : "transparent",
                            bgcolor: "action.hover",
                            borderRadius: 1,
                            transition: "background-color 0.2s",
                        }}
                    >
                        <Typography
                            variant="body2"
                            color={highlight ? "primary.contrastText" : ""}
                        >
                            {clip.google_transcription}
                        </Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
}
