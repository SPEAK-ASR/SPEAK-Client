import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "../components/layout/PageHeader";
import { useAdmin } from "../context/useAdmin";
import {
  ActionBar,
  AudioCard,
  GuidelinesCard,
  PointCelebrationDialog,
  ReferenceCard,
  TranscriptionEditor,
  UnsuitableDialog,
} from "../components/transcription";
import { toast } from "../components/ui/toast";
import {
  transcriptionServiceApi,
  type AdminNameApi,
  type AudioTask,
  type SpeakerGender,
  type TranscriptionSubmissionPayload,
} from "../lib/transcriptionServiceApi";
import {
  DEFAULT_METADATA,
  type TranscriptionMetadata,
} from "../types/transcription";

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

function normalize(s: string | null | undefined) {
  if (!s?.trim()) return "";
  return s.trim().split(/\s+/).join(" ");
}

function computeRefLayout(
  google: string | null | undefined,
  speak: string | null | undefined,
): RefLayout {
  const g = google?.trim() ?? "";
  const s = speak?.trim() ?? "";
  const gN = normalize(google);
  const sN = normalize(speak);
  if (!gN && !sN) return { kind: "none" };
  if (gN && sN && gN === sN) return { kind: "unified", text: g };
  if (gN && !sN) return { kind: "single", text: g, source: "google" };
  if (!gN && sN) return { kind: "single", text: s, source: "speak" };
  const swap = Math.random() >= 0.5;
  return swap
    ? {
        kind: "dual",
        ref1: { text: s, source: "speak" },
        ref2: { text: g, source: "google" },
      }
    : {
        kind: "dual",
        ref1: { text: g, source: "google" },
        ref2: { text: s, source: "speak" },
      };
}

const REF_DESC =
  "Anonymous machine reference — verify by ear before submitting.";

export function TranscriptionPage() {
  const [audioTask, setAudioTask] = useState<AudioTask | null>(null);
  const [metadata, setMetadata] =
    useState<TranscriptionMetadata>(DEFAULT_METADATA);
  const [asrPreference, setAsrPreference] = useState<boolean | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [unsuitableOpen, setUnsuitableOpen] = useState(false);
  const [celebration, setCelebration] = useState<{
    open: boolean;
    asrSystem: "google" | "speak" | null;
  }>({ open: false, asrSystem: null });

  const onCelebrationOpenChange = useCallback((open: boolean) => {
    setCelebration((p) => ({ ...p, open }));
  }, []);

  const [guidelinesCollapsed, setGuidelinesCollapsed] = useState(() =>
    typeof window === "undefined"
      ? false
      : window.localStorage.getItem(GUIDELINES_KEY) === "1",
  );

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { admin, isAdmin } = useAdmin();

  const refLayout = useMemo<RefLayout>(() => {
    if (!audioTask) return { kind: "none" };
    return computeRefLayout(
      audioTask.google_transcription,
      audioTask.speak_transcription,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    audioTask?.audio_id,
    audioTask?.google_transcription,
    audioTask?.speak_transcription,
  ]);

  useEffect(() => {
    setAsrPreference(null);
  }, [audioTask?.audio_id]);

  const loadNext = useCallback(async () => {
    setLoading(true);
    setSubmitting(false);
    setMetadata(DEFAULT_METADATA);
    setAsrPreference(null);
    setCelebration({ open: false, asrSystem: null });
    if (textareaRef.current) textareaRef.current.value = "";
    try {
      const data = await transcriptionServiceApi.fetchRandomAudio();
      setAudioTask(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load audio", {
        description: (err as Error)?.message,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNext();
  }, [loadNext]);

  const toggleGuidelines = useCallback(() => {
    setGuidelinesCollapsed((p) => {
      const n = !p;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(GUIDELINES_KEY, n ? "1" : "0");
      }
      return n;
    });
  }, []);

  const updateMeta = useCallback(
    (key: keyof TranscriptionMetadata, value: boolean | string) =>
      setMetadata((p) => ({ ...p, [key]: value })),
    [],
  );

  const validate = useCallback(
    (value: string): string | null => {
      if (!audioTask) return "No audio selected.";
      if (!metadata.speakerGender) return "Please select the speaker gender.";
      if (!value.trim()) return "Transcription cannot be empty.";
      if (value.trim().length < 3)
        return "Transcription looks too short. Please double-check.";
      return null;
    },
    [audioTask, metadata.speakerGender],
  );

  const submit = useCallback(
    async (
      payload: TranscriptionSubmissionPayload,
      successMessage: string,
      asrSystemForCelebration: "google" | "speak" | null,
    ) => {
      try {
        setSubmitting(true);
        await transcriptionServiceApi.submitTranscription(payload);
        if (asrSystemForCelebration) {
          setCelebration({ open: true, asrSystem: asrSystemForCelebration });
          setTimeout(() => loadNext(), 2000);
        } else {
          toast.success(successMessage);
          await loadNext();
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to submit transcription", {
          description: (err as Error)?.message,
        });
      } finally {
        setSubmitting(false);
      }
    },
    [loadNext],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const value = textareaRef.current?.value ?? "";
      const err = validate(value);
      if (err) {
        toast.error(err);
        return;
      }
      if (!audioTask) return;

      const payload: TranscriptionSubmissionPayload = {
        audio_id: audioTask.audio_id,
        transcription: value.trim(),
        speaker_gender: metadata.speakerGender as SpeakerGender,
        has_noise: metadata.hasNoise,
        is_code_mixed: metadata.isCodeMixed,
        is_speaker_overlappings_exist: metadata.isOverlap,
        is_audio_suitable: true,
        admin: (admin as AdminNameApi | null) ?? undefined,
        validated_at: admin ? new Date().toISOString() : undefined,
        is_best_google: asrPreference,
      };

      const asrCelebration =
        asrPreference === true
          ? "google"
          : asrPreference === false
            ? "speak"
            : null;
      await submit(payload, "Transcription submitted.", asrCelebration);
    },
    [audioTask, metadata, admin, asrPreference, validate, submit],
  );

  const handleUnsuitable = useCallback(
    async () => {
      if (!audioTask) return;
      setUnsuitableOpen(false);
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
        admin: (admin as AdminNameApi | null) ?? undefined,
        is_best_google: null,
      };
      await submit(payload, "Audio marked as unsuitable.", null);
    },
    [audioTask, admin, submit],
  );

  const copyIntoEditor = useCallback(
    (text: string, isGoogle: boolean | null) => {
      if (!textareaRef.current) return;
      textareaRef.current.value = text.trim();
      textareaRef.current.dispatchEvent(new Event("input", { bubbles: true }));
      setAsrPreference(isGoogle);
      toast.info("Reference copied to the editor", {
        description: "Listen again and correct if needed.",
      });
    },
    [],
  );

  const copyTextOnly = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.info("Copied to clipboard");
    } catch (err) {
      toast.error("Could not copy to clipboard", {
        description: (err as Error)?.message,
      });
    }
  }, []);

  const showRefs = refLayout.kind !== "none";

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Transcription"
        description="Type exactly what you hear. Use the Sinhala phonetic IME."
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-2 items-start">
          <div className="space-y-4 min-w-0">
            {!isAdmin && (
              <GuidelinesCard
                collapsed={guidelinesCollapsed}
                onToggle={toggleGuidelines}
              />
            )}

            <AudioCard
              title={audioTask?.audio_filename ?? "Fetching audio…"}
              subtitle={
                audioTask
                  ? `${audioTask.transcription_count} transcription${
                      audioTask.transcription_count === 1 ? "" : "s"
                    } collected`
                  : undefined
              }
              audioUrl={audioTask?.gcs_signed_url}
              loading={loading}
              onSkip={loadNext}
              skipDisabled={submitting}
            />

            {showRefs && refLayout.kind === "unified" && (
              <ReferenceCard
                title="References (identical)"
                text={refLayout.text}
                description={`${REF_DESC} Both anonymous references match.`}
                onCopy={() => copyIntoEditor(refLayout.text, null)}
                onCopyNoScore={() => copyTextOnly(refLayout.text)}
              />
            )}
            {showRefs && refLayout.kind === "single" && (
              <ReferenceCard
                title="Reference 1"
                text={refLayout.text}
                description={REF_DESC}
                onCopy={() =>
                  copyIntoEditor(
                    refLayout.text,
                    refLayout.source === "google",
                  )
                }
                onCopyNoScore={() => copyTextOnly(refLayout.text)}
              />
            )}
            {showRefs && refLayout.kind === "dual" && (
              <>
                <ReferenceCard
                  title="Reference 1"
                  text={refLayout.ref1.text}
                  description={REF_DESC}
                  onCopy={() =>
                    copyIntoEditor(
                      refLayout.ref1.text,
                      refLayout.ref1.source === "google",
                    )
                  }
                  onCopyNoScore={() => copyTextOnly(refLayout.ref1.text)}
                />
                <ReferenceCard
                  title="Reference 2"
                  text={refLayout.ref2.text}
                  description={REF_DESC}
                  onCopy={() =>
                    copyIntoEditor(
                      refLayout.ref2.text,
                      refLayout.ref2.source === "google",
                    )
                  }
                  onCopyNoScore={() => copyTextOnly(refLayout.ref2.text)}
                />
              </>
            )}
          </div>

          <TranscriptionEditor
            textareaRef={textareaRef}
            metadata={metadata}
            onMetadataChange={updateMeta}
            disabled={loading || submitting}
          />
        </div>

        <ActionBar
          submitting={submitting}
          loading={loading}
          hasData={!!audioTask}
          onUnsuitableClick={() => setUnsuitableOpen(true)}
          onSkip={loadNext}
        />
      </form>

      <UnsuitableDialog
        open={unsuitableOpen}
        onOpenChange={setUnsuitableOpen}
        onConfirm={handleUnsuitable}
      />
      <PointCelebrationDialog
        open={celebration.open}
        asrSystem={celebration.asrSystem}
        onOpenChange={onCelebrationOpenChange}
      />
    </>
  );
}
