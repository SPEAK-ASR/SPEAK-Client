import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Stack, Typography } from "@mui/material";
import {
    TranscriptionEditor,
    AudioCard,
    ReferenceCard,
    EmptyQueueCard,
    ActionButtons,
    UnsuitableDialog,
    NotificationSnackbar,
} from "../components/transcription";
import { useSnackbar } from "../hooks/useSnackbar";
import { DEFAULT_METADATA, type TranscriptionMetadata } from "../types/common";
import {
    transcriptionServiceApi,
    type SpeakerGender,
    type ValidationQueueItem,
    type ValidationSubmissionPayload,
} from "../lib/transcriptionServiceApi";

export function ValidationPage() {
    // Data state
    const [queueItem, setQueueItem] = useState<ValidationQueueItem | null>(
        null,
    );
    const [metadata, setMetadata] =
        useState<TranscriptionMetadata>(DEFAULT_METADATA);

    // UI state
    const [loadingItem, setLoadingItem] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [unsuitableDialog, setUnsuitableDialog] = useState(false);

    // Refs
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    // Hooks
    const { snackbar, showSuccess, showError, showInfo, closeSnackbar } =
        useSnackbar();

    // Load initial item
    useEffect(() => {
        let isMounted = true;
        async function initialize() {
            if (isMounted) {
                await loadNextItem();
            }
        }
        initialize();
        return () => {
            isMounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Populate form when queue item changes
    useEffect(() => {
        if (!queueItem || !textareaRef.current) return;
        textareaRef.current.value = queueItem.transcription.transcription;
        setMetadata({
            speakerGender: queueItem.transcription.speaker_gender ?? "",
            hasNoise: queueItem.transcription.has_noise ?? false,
            isCodeMixed: queueItem.transcription.is_code_mixed ?? false,
            isOverlap:
                queueItem.transcription.is_speaker_overlappings_exist ?? false,
        });
    }, [queueItem]);

    const loadNextItem = useCallback(async () => {
        setLoadingItem(true);
        setSubmitting(false);
        setMetadata(DEFAULT_METADATA);
        if (textareaRef.current) {
            textareaRef.current.value = "";
        }
        try {
            const payload =
                await transcriptionServiceApi.getNextValidationItem();
            setQueueItem(payload);
        } catch (error: unknown) {
            const err = error as { response?: { status?: number } };
            if (err?.response?.status === 404) {
                setQueueItem(null);
                showInfo("No pending transcriptions. Great job!");
            } else {
                console.error(error);
                showError("Failed to load next transcription.");
            }
        } finally {
            setLoadingItem(false);
        }
    }, [showInfo, showError]);

    const updateMetadata = useCallback(
        (key: keyof TranscriptionMetadata, value: boolean | string) => {
            setMetadata((prev) => ({ ...prev, [key]: value }));
        },
        [],
    );

    const cleanupText = useCallback(() => {
        if (!textareaRef.current) return;
        const cleaned = textareaRef.current.value
            .replace(/[ \t]+/g, " ")
            .replace(/[ \t]*\n[ \t]*/g, "\n")
            .replace(/\n{3,}/g, "\n\n")
            .trim();
        textareaRef.current.value = cleaned;
        showInfo("Text cleaned up successfully.");
    }, [showInfo]);

    const validate = useCallback((): string | null => {
        if (!queueItem) return "No transcription loaded.";
        if (!metadata.speakerGender) return "Please select speaker gender.";
        const value = textareaRef.current?.value ?? "";
        if (!value.trim()) return "Transcription cannot be empty.";
        if (value.trim().length < 3)
            return "Transcription looks too short. Please double-check.";
        return null;
    }, [queueItem, metadata.speakerGender]);

    const submitValidation = useCallback(
        async (
            payload: ValidationSubmissionPayload,
            successMessage: string,
        ) => {
            try {
                setSubmitting(true);
                await transcriptionServiceApi.submitValidation(
                    queueItem!.transcription.trans_id,
                    payload,
                );
                showSuccess(successMessage);
                await loadNextItem();
            } catch (error) {
                console.error(error);
                showError("Failed to validate transcription.");
            } finally {
                setSubmitting(false);
            }
        },
        [queueItem, loadNextItem, showSuccess, showError],
    );

    const handleSubmit = useCallback(
        async (event: React.FormEvent) => {
            event.preventDefault();
            const validationError = validate();
            if (validationError) {
                showError(validationError);
                return;
            }
            if (!queueItem) return;

            const payload = {
                transcription: (textareaRef.current?.value ?? "").trim(),
                speaker_gender: metadata.speakerGender as SpeakerGender,
                has_noise: metadata.hasNoise,
                is_code_mixed: metadata.isCodeMixed,
                is_speaker_overlappings_exist: metadata.isOverlap,
                is_audio_suitable: true,
            };

            await submitValidation(
                payload,
                "Transcription validated successfully. Loading next item...",
            );
        },
        [queueItem, metadata, validate, submitValidation, showError],
    );

    const handleUnsuitableConfirm = useCallback(async () => {
        if (!queueItem) return;
        setUnsuitableDialog(false);
        if (textareaRef.current) {
            textareaRef.current.value = "Audio not suitable for transcription";
        }
        const payload = {
            transcription: "Audio not suitable for transcription",
            speaker_gender: "cannot_recognized" as SpeakerGender,
            has_noise: false,
            is_code_mixed: false,
            is_speaker_overlappings_exist: false,
            is_audio_suitable: false,
        };
        await submitValidation(
            payload,
            "Audio marked as unsuitable. Loading next item...",
        );
    }, [queueItem, submitValidation]);

    const handleCopyReference = useCallback(() => {
        if (!textareaRef.current || !queueItem?.audio.google_transcription)
            return;
        textareaRef.current.value = queueItem.audio.google_transcription.trim();
        showInfo(
            "Reference copied to editor. Please review before submitting.",
        );
    }, [queueItem, showInfo]);

    const referenceText = useMemo(
        () => queueItem?.audio.google_transcription?.trim(),
        [queueItem],
    );

    return (
        <Box component="section">
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                    Validation
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Review and validate transcriptions
                </Typography>
            </Box>

            {/* Empty state */}
            {!queueItem && !loadingItem ? (
                <EmptyQueueCard onRefresh={loadNextItem} />
            ) : (
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
                            {/* Audio Player */}
                            <AudioCard
                                title={
                                    queueItem?.audio.audio_filename ??
                                    "Fetching transcription..."
                                }
                                subtitle={
                                    queueItem
                                        ? `Created ${new Date(queueItem.transcription.created_at ?? "").toLocaleString()}`
                                        : undefined
                                }
                                audioUrl={queueItem?.audio.gcs_signed_url}
                                loading={loadingItem}
                                onSkip={loadNextItem}
                                skipLabel="Skip item"
                                skipDisabled={submitting}
                            />

                            {/* Reference */}
                            {referenceText && (
                                <ReferenceCard
                                    text={referenceText}
                                    description="Google transcription for reference only"
                                    onCopy={handleCopyReference}
                                />
                            )}
                        </Stack>

                        {/* Right Column - Editor */}
                        <TranscriptionEditor
                            textareaRef={textareaRef}
                            metadata={metadata}
                            onMetadataChange={updateMetadata}
                            placeholder="Review and edit the transcription..."
                            showCleanupButton
                            onCleanup={cleanupText}
                            disabled={loadingItem || submitting}
                        />
                    </Box>

                    {/* Action Buttons */}
                    <ActionButtons
                        submitting={submitting}
                        loading={loadingItem}
                        hasData={!!queueItem}
                        submitLabel="Submit validation"
                        skipLabel="Skip item"
                        onUnsuitableClick={() => setUnsuitableDialog(true)}
                        onSkip={loadNextItem}
                    />
                </Box>
            )}

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
