import type { SpeakerGender } from "../lib/transcriptionServiceApi";

export interface TranscriptionMetadata {
  speakerGender: "" | SpeakerGender;
  hasNoise: boolean;
  isCodeMixed: boolean;
  isOverlap: boolean;
}

export const DEFAULT_METADATA: TranscriptionMetadata = {
  speakerGender: "",
  hasNoise: false,
  isCodeMixed: false,
  isOverlap: false,
};

export const SPEAKER_OPTIONS: { value: SpeakerGender; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "cannot_recognized", label: "Cannot recognise" },
];
