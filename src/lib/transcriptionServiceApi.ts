import axios from "axios";

const TRANSCRIPTION_API_BASE_URL =
  import.meta.env.VITE_TRANSCRIPTION_API_URL ||
  "http://localhost:5002/api/v1";

const transcriptionApi = axios.create({
  baseURL: TRANSCRIPTION_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

export const TRANSCRIPTION_API_BASE = TRANSCRIPTION_API_BASE_URL;

export interface AudioTask {
  audio_id: string;
  audio_filename: string;
  google_transcription?: string | null;
  speak_transcription?: string | null;
  transcription_count: number;
  gcs_signed_url: string;
}

export type SpeakerGender = "male" | "female" | "cannot_recognized";
export type AdminNameApi = "chirath" | "rusira" | "kokila" | "sahan";

export interface TranscriptionSubmissionPayload {
  audio_id: string;
  transcription: string;
  speaker_gender: SpeakerGender;
  has_noise: boolean;
  is_code_mixed: boolean;
  is_speaker_overlappings_exist: boolean;
  is_audio_suitable: boolean;
  admin?: AdminNameApi | null;
  validated_at?: string | null;
  is_best_google?: boolean | null;
}

export interface TranscriptionRecord {
  trans_id: string;
  audio_id: string;
  transcription: string;
  speaker_gender: SpeakerGender | null;
  has_noise: boolean | null;
  is_code_mixed: boolean | null;
  is_speaker_overlappings_exist: boolean | null;
  is_audio_suitable: boolean | null;
  admin: AdminNameApi | null;
  validated_at: string | null;
  created_at: string | null;
  is_best_google?: boolean | null;
}

export const transcriptionServiceApi = {
  async fetchRandomAudio() {
    const { data } = await transcriptionApi.get<AudioTask>("/audio/random");
    return data;
  },
  async submitTranscription(payload: TranscriptionSubmissionPayload) {
    const { data } = await transcriptionApi.post("/transcription", payload);
    return data as TranscriptionRecord;
  },
};
