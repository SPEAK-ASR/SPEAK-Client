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

type RefBackend = "google" | "speak";

type RefLayout =
    | { kind: "none" }
    | { kind: "unified"; text: string }
    | { kind: "single"; text: string; source: RefBackend }
    | {
          kind: "dual";
          ref1: { text: string; source: RefBackend };
          ref2: { text: string; source: RefBackend };
      };

function normalizeRefText(s: string | null | undefined): string {
    if (!s?.trim()) return "";
    return s.trim().split(/\s+/).join(" ");
}

function computeRefLayout(
    google: string | null | undefined,
    speak: string | null | undefined,
): RefLayout {
    const gTrim = google?.trim() ?? "";
    const sTrim = speak?.trim() ?? "";
    const gNorm = normalizeRefText(google);
    const sNorm = normalizeRefText(speak);
    if (!gNorm && !sNorm) return { kind: "none" };
    if (gNorm && sNorm && gNorm === sNorm) {
        return { kind: "unified", text: gTrim };
    }
    if (gNorm && !sNorm)
        return { kind: "single", text: gTrim, source: "google" };
    if (!gNorm && sNorm)
        return { kind: "single", text: sTrim, source: "speak" };
    const swap = Math.random() >= 0.5;
    if (swap) {
        return {
            kind: "dual",
            ref1: { text: sTrim, source: "speak" },
            ref2: { text: gTrim, source: "google" },
        };
    }
    return {
        kind: "dual",
        ref1: { text: gTrim, source: "google" },
        ref2: { text: sTrim, source: "speak" },
    };
}

function successMessageForPreference(
    isBestGoogle: boolean | null | undefined,
): string {
    if (isBestGoogle === true) {
        return "Submitted. Google Speech-to-Text gained a point. Loading next audio...";
    }
    if (isBestGoogle === false) {
        return "Submitted. SPEAK Sinhala ASR gained a point. Loading next audio...";
    }
    return "Transcription submitted successfully. Loading next audio...";
}

const REF_DESCRIPTION =
    "Anonymous machine reference only — verify by ear before submitting.";

export function TranscriptionPage() {
    // Data state
    const [audioTask, setAudioTask] = useState<AudioTask | null>(null);
    const [metadata, setMetadata] =
        useState<TranscriptionMetadata>(DEFAULT_METADATA);
    /** Tracks copy-based preference: true = Google ref copied, false = SPEAK, null = no scoring */
    const [asrPreference, setAsrPreference] = useState<boolean | null>(null);

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

    const refLayout = useMemo((): RefLayout => {
        if (!audioTask) return { kind: "none" };
        return computeRefLayout(
            audioTask.google_transcription,
            audioTask.speak_transcription,
        );
    }, [
        audioTask?.audio_id,
        audioTask?.google_transcription,
        audioTask?.speak_transcription,
    ]);

    useEffect(() => {
        setAsrPreference(null);
    }, [audioTask?.audio_id]);

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
        setAsrPreference(null);
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
                return "Transcription looks too short. Please double-check.");

            return null;
        },
        [audioTask, metadata.speakerGender],
    );

    const submitTranscription = useCallback(
        async (payload: TranscriptionSubmissionPayload, successMessage: string) => {
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
                is_best_google: asrPreference,
            };

            await submitTranscription(
                payload,
                successMessageForPreference(asrPreference),
            );
        },
        [
            audioTask,
            metadata,
            admin,
            asrPreference,
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
            is_best_google: null,
        };
        await submitTranscription(
            payload,
            "Audio marked as unsuitable. Loading next audio...",
        );
    }, [audioTask, admin, submitTranscription]);

    const copyIntoEditor = useCallback(
        (text: string, preference: boolean | null) => {
            if (!textareaRef.current) return;
            textareaRef.current.value = text.trim();
            setAsrPreference(preference);
            showInfo(
                "Reference copied to the editor. Listen again and correct if needed.",
            );
        },
        [showInfo],
    );

    const handleCopyUnified = useCallback(() => {
        if (refLayout.kind !== "unified") return;
        copyIntoEditor(refLayout.text, null);
    }, [refLayout, copyIntoEditor]);

    const handleCopyRef1 = useCallback(() => {
        if (refLayout.kind === "dual") {
            copyIntoEditor(
                refLayout.ref1.text,
                refLayout.ref1.source === "google",
            );
        } else if (refLayout.kind === "single") {
            copyIntoEditor(
                refLayout.text,
                refLayout.source === "google",
            );
        }
    }, [refLayout, copyIntoEditor]);

    const handleCopyRef2 = useCallback(() => {
        if (refLayout.kind !== "dual") return;
        copyIntoEditor(
            refLayout.ref2.text,
            refLayout.ref2.source === "google",
        );
    }, [refLayout, copyIntoEditor]);

    const showReferenceCards = refLayout.kind !== "none";

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

                        {showReferenceCards && refLayout.kind === "unified" && (
                            <ReferenceCard
                                title="References (identical)"
                                text={refLayout.text}
                                description={`${REF_DESCRIPTION} Both anonymous references match.`}
                                onCopy={handleCopyUnified}
                            />
                        )}

                        {showReferenceCards && refLayout.kind === "single" && (
                            <ReferenceCard
                                title="Reference 1"
                                text={refLayout.text}
                                description={REF_DESCRIPTION}
                                onCopy={handleCopyRef1}
                            />
                        )}

                        {showReferenceCards && refLayout.kind === "dual" && (
                            <>
                                <ReferenceCard
                                    title="Reference 1"
                                    text={refLayout.ref1.text}
                                    description={REF_DESCRIPTION}
                                    onCopy={handleCopyRef1}
                                />
                                <ReferenceCard
                                    title="Reference 2"
                                    text={refLayout.ref2.text}
                                    description={REF_DESCRIPTION}
                                    onCopy={handleCopyRef2}
                                />
                            </>
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
