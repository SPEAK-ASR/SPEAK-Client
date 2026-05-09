import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PageHeader } from "../components/layout/PageHeader";
import type {
  ClipData,
  TranscribedClip,
  VideoMetadata,
} from "../lib/api";
import { fadeUp } from "../lib/motion";
import { ClipsPanel } from "./audio-processor/ClipsPanel";
import { CompletionPanel } from "./audio-processor/CompletionPanel";
import { LoadingPanel } from "./audio-processor/LoadingPanel";
import { ProgressStepper } from "./audio-processor/ProgressStepper";
import { TranscriptionsPanel } from "./audio-processor/TranscriptionsPanel";
import { UrlForm } from "./audio-processor/UrlForm";

export type ProcessingStep =
  | "input"
  | "processing"
  | "clips"
  | "transcription"
  | "storage"
  | "complete";

export function AudioProcessorPage() {
  const [step, setStep] = useState<ProcessingStep>("input");
  const [videoId, setVideoId] = useState("");
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [clips, setClips] = useState<ClipData[]>([]);
  const [transcriptions, setTranscriptions] = useState<TranscribedClip[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    setStep("processing");
    setBusy(true);
    setError(null);
  };

  const handleClipsGenerated = (
    id: string,
    md: VideoMetadata,
    cs: ClipData[],
  ) => {
    setVideoId(id);
    setMetadata(md);
    setClips(cs);
    setStep("clips");
    setBusy(false);
    setError(null);
  };

  const handleSubmitError = (msg: string) => {
    setStep("input");
    setBusy(false);
    setError(msg);
  };

  const handleTranscribeStart = () => {
    setStep("transcription");
    setBusy(true);
  };

  const handleTranscribeDone = (cs: TranscribedClip[]) => {
    setTranscriptions(cs);
    setBusy(false);
    if (cs.length === 0) {
      setStep("clips");
    }
  };

  const handleCleanupComplete = (deletedFiles: string[]) => {
    const deleted = new Set(deletedFiles);
    setTranscriptions((p) => p.filter((t) => !deleted.has(t.clip_name)));
    setClips((p) => p.filter((c) => !deleted.has(c.clip_name)));
  };

  const handleSaveStart = () => {
    setStep("storage");
    setBusy(true);
  };

  const handleSaveDone = () => {
    setBusy(false);
    setStep("complete");
  };

  const handleReset = () => {
    setStep("input");
    setVideoId("");
    setMetadata(null);
    setClips([]);
    setTranscriptions([]);
    setBusy(false);
    setError(null);
  };

  return (
    <>
      <PageHeader
        eyebrow="Pipeline"
        title="Audio Processor"
        description="Ingest a YouTube video, split it into clips, transcribe, and persist."
      />

      <ProgressStepper currentStep={step} isProcessing={busy} />

      <AnimatePresence mode="wait">
        <motion.div
          key={renderKey(step, busy, transcriptions.length)}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          exit="exit"
        >
          {step === "input" && (
            <UrlForm
              onSubmit={handleSubmit}
              onClipsGenerated={handleClipsGenerated}
              onError={handleSubmitError}
              initialError={error}
            />
          )}

          {step === "processing" && busy && (
            <LoadingPanel
              title="Splitting audio…"
              description="This may take a few minutes depending on video length."
            />
          )}

          {step === "clips" && (
            <ClipsPanel
              videoId={videoId}
              metadata={metadata}
              clips={clips}
              hasTranscriptions={transcriptions.length > 0}
              onTranscribeStart={handleTranscribeStart}
              onTranscribeDone={handleTranscribeDone}
              onSaveStart={handleSaveStart}
              onSaveDone={handleSaveDone}
              onReset={handleReset}
            />
          )}

          {step === "transcription" && busy && (
            <LoadingPanel
              title="Transcribing audio clips…"
              description="This may take a few minutes."
            />
          )}

          {step === "transcription" && !busy && transcriptions.length > 0 && (
            <TranscriptionsPanel
              videoId={videoId}
              metadata={metadata}
              transcriptions={transcriptions}
              onCleanupComplete={handleCleanupComplete}
              onSaveStart={handleSaveStart}
              onSaveDone={handleSaveDone}
              onReset={handleReset}
            />
          )}

          {step === "storage" && busy && (
            <LoadingPanel
              title="Saving to cloud storage…"
              description="Uploading audio clips and updating the database."
            />
          )}

          {step === "complete" && (
            <CompletionPanel
              totalClips={clips.length}
              transcriptionCount={transcriptions.length}
              onReset={handleReset}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </>
  );
}

function renderKey(step: ProcessingStep, busy: boolean, transcribedCount: number) {
  if (step === "transcription" && !busy && transcribedCount > 0) {
    return "transcription-list";
  }
  return `${step}-${busy ? "loading" : "idle"}`;
}
