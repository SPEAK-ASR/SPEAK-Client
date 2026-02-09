import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Stack, Typography } from "@mui/material";
import {
    TranscriptionEditor,
    AudioCard,
    ReferenceCard,
    GuidelinesCard,
    ActionButtons,
    UnsuitableDialog,
    NotificationSnackbar,
} from "../components/transcription";
import { useSnackbar } from "../hooks/useSnackbar";
import { useAdmin } from "../context/useAdmin";
import { DEFAULT_METADATA, type TranscriptionMetadata } from "../types/common";
import {
    transcriptionServiceApi,
    type AudioTask,
    type SpeakerGender,
    type TranscriptionSubmissionPayload,
} from "../lib/transcriptionServiceApi";

const GUIDELINES_KEY = "transcriptionGuidelinesClosed";

export function TranscriptionPage() {
    // Data state
    const [audioTask, setAudioTask] = useState<AudioTask | null>(null);
    const [metadata, setMetadata] =
        useState<TranscriptionMetadata>(DEFAULT_METADATA);

    // UI state
    const [loadingAudio, setLoadingAudio] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [unsuitableDialog, setUnsuitableDialog] = useState(false);
    const [guidelinesCollapsed, setGuidelinesCollapsed] = useState(() => {
        if (typeof window === "undefined") return false;
        return window.localStorage.getItem(GUIDELINES_KEY) === "1";
    });

    // Refs
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    // Hooks
    const { snackbar, showSuccess, showError, showInfo, closeSnackbar } =
        useSnackbar();
    const { admin, isAdmin } = useAdmin();

    // Load initial audio
    useEffect(() => {
        loadNextAudio();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const toggleGuidelines = useCallback(() => {
        setGuidelinesCollapsed((prev) => {
            const next = !prev;
            if (typeof window !== "undefined") {
                window.localStorage.setItem(GUIDELINES_KEY, next ? "1" : "0");
            }
            return next;
        });
    }, []);

    const loadNextAudio = useCallback(async () => {
        setLoadingAudio(true);
        setSubmitting(false);
        setMetadata(DEFAULT_METADATA);
        if (textareaRef.current) {
            textareaRef.current.value = "";
        }
        try {
            const data = await transcriptionServiceApi.fetchRandomAudio();
            setAudioTask(data);
        } catch (error) {
            console.error(error);
            showError("Failed to load audio. Please try again.");
        } finally {
            setLoadingAudio(false);
        }
    }, [showError]);

    const updateMetadata = useCallback(
        (key: keyof TranscriptionMetadata, value: boolean | string) => {
            setMetadata((prev) => ({ ...prev, [key]: value }));
        },
        [],
    );

    const validateBeforeSubmit = useCallback(
        (value: string): string | null => {
            if (!audioTask) return "No audio selected yet.";
            if (!metadata.speakerGender)
                return "Please select the speaker gender.";
            if (!value.trim()) return "Transcription cannot be empty.";
            if (value.trim().length < 3)
                return "Transcription looks too short. Please double-check.";
            return null;
        },
        [audioTask, metadata.speakerGender],
    );

    const submitTranscription = useCallback(
        async (
            payload: TranscriptionSubmissionPayload,
            successMessage: string,
        ) => {
            try {
                setSubmitting(true);
                await transcriptionServiceApi.submitTranscription(payload);
                showSuccess(successMessage);
                await loadNextAudio();
            } catch (error) {
                console.error(error);
                showError("Failed to submit transcription.");
            } finally {
                setSubmitting(false);
            }
        },
        [loadNextAudio, showSuccess, showError],
    );

    const handleSubmit = useCallback(
        async (event: React.FormEvent) => {
            event.preventDefault();
            const currentValue = textareaRef.current?.value ?? "";
            const validationError = validateBeforeSubmit(currentValue);
            if (validationError) {
                showError(validationError);
                return;
            }

            if (!audioTask) return;

            const payload: TranscriptionSubmissionPayload = {
                audio_id: audioTask.audio_id,
                transcription: currentValue.trim(),
                speaker_gender: metadata.speakerGender as SpeakerGender,
                has_noise: metadata.hasNoise,
                is_code_mixed: metadata.isCodeMixed,
                is_speaker_overlappings_exist: metadata.isOverlap,
                is_audio_suitable: true,
                admin: admin ?? undefined,
                validated_at: admin ? new Date().toISOString() : undefined,
            };

            await submitTranscription(
                payload,
                "Transcription submitted successfully. Loading next audio...",
            );
        },
        [
            audioTask,
            metadata,
            admin,
            validateBeforeSubmit,
            submitTranscription,
            showError,
        ],
    );

    const handleUnsuitableConfirm = useCallback(async () => {
        if (!audioTask) return;
        setUnsuitableDialog(false);
        if (textareaRef.current) {
            textareaRef.current.value = "Audio not suitable for transcription";
        }
        const payload: TranscriptionSubmissionPayload = {
            audio_id: audioTask.audio_id,
            transcription: "Audio not suitable for transcription",
            speaker_gender: "cannot_recognized",
            has_noise: false,
            is_code_mixed: false,
            is_speaker_overlappings_exist: false,
            is_audio_suitable: false,
            admin: admin ?? undefined,
        };
        await submitTranscription(
            payload,
            "Audio marked as unsuitable. Loading next audio...",
        );
    }, [audioTask, admin, submitTranscription]);

    const handleCopyReference = useCallback(() => {
        if (!textareaRef.current || !audioTask?.google_transcription) return;
        textareaRef.current.value = audioTask.google_transcription.trim();
        showInfo(
            "Reference copied to editor. Please review before submitting.",
        );
    }, [audioTask, showInfo]);

    const referenceText = useMemo(
        () => audioTask?.google_transcription?.trim(),
        [audioTask],
    );

    return (
        <Box component="section">
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                    Transcription
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Type exactly what you hear
                </Typography>
            </Box>

            {/* Main Form */}
            <Box component="form" onSubmit={handleSubmit}>
                <Box
                    sx={{
                        display: "grid",
                        gap: 3,
                        gridTemplateColumns: {
                            xs: "1fr",
                            md: "minmax(0, 1fr) minmax(0, 1fr)",
                        },
                        alignItems: "flex-start",
                    }}
                >
                    {/* Left Column */}
                    <Stack spacing={3}>
                        {/* Guidelines (only for non-admins) */}
                        {!isAdmin && (
                            <GuidelinesCard
                                collapsed={guidelinesCollapsed}
                                onToggle={toggleGuidelines}
                            />
                        )}

                        {/* Audio Player */}
                        <AudioCard
                            title={
                                audioTask?.audio_filename ?? "Fetching audio..."
                            }
                            subtitle={
                                audioTask
                                    ? `${audioTask.transcription_count} transcriptions collected`
                                    : undefined
                            }
                            audioUrl={audioTask?.gcs_signed_url}
                            loading={loadingAudio}
                            onSkip={loadNextAudio}
                            skipLabel="Skip audio"
                            skipDisabled={submitting}
                        />

                        {/* Reference (admin only) */}
                        {isAdmin && referenceText && (
                            <ReferenceCard
                                text={referenceText}
                                description="Double-check output before copying. Reference Only"
                                onCopy={handleCopyReference}
                            />
                        )}
                    </Stack>

                    {/* Right Column - Editor */}
                    <TranscriptionEditor
                        textareaRef={textareaRef}
                        metadata={metadata}
                        onMetadataChange={updateMetadata}
                        placeholder="Type what you hear..."
                        disabled={loadingAudio || submitting}
                    />
                </Box>

                {/* Action Buttons */}
                <ActionButtons
                    submitting={submitting}
                    loading={loadingAudio}
                    hasData={!!audioTask}
                    submitLabel="Submit transcription"
                    skipLabel="Skip audio"
                    onUnsuitableClick={() => setUnsuitableDialog(true)}
                    onSkip={loadNextAudio}
                />
            </Box>

            {/* Dialogs & Notifications */}
            <UnsuitableDialog
                open={unsuitableDialog}
                onClose={() => setUnsuitableDialog(false)}
                onConfirm={handleUnsuitableConfirm}
            />

            <NotificationSnackbar snackbar={snackbar} onClose={closeSnackbar} />
        </Box>
    );
}
