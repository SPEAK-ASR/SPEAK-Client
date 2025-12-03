import axios from 'axios';

const TRANSCRIPTION_API_BASE_URL =
  import.meta.env.VITE_TRANSCRIPTION_API_URL || 'http://localhost:5000/api/v1';

const transcriptionApi = axios.create({
  baseURL: TRANSCRIPTION_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// helper: base without `/v1` for leaderboard endpoint
const ROOT_API_BASE_URL = TRANSCRIPTION_API_BASE_URL.replace(/\/v1\/?$/, '');

export interface AudioTask {
  audio_id: string;
  audio_filename: string;
  google_transcription?: string | null;
  transcription_count: number;
  gcs_signed_url: string;
}

export type SpeakerGender = 'male' | 'female' | 'cannot_recognized';
export type AdminName = 'chirath' | 'rusira' | 'kokila' | 'sahan';

export interface TranscriptionSubmissionPayload {
  audio_id: string;
  transcription: string;
  speaker_gender: SpeakerGender;
  has_noise: boolean;
  is_code_mixed: boolean;
  is_speaker_overlappings_exist: boolean;
  is_audio_suitable: boolean;
  admin?: AdminName | null;
}

export interface ValidationSubmissionPayload {
  transcription: string;
  speaker_gender: SpeakerGender;
  has_noise: boolean;
  is_code_mixed: boolean;
  is_speaker_overlappings_exist: boolean;
  is_audio_suitable: boolean;
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
  admin: AdminName | null;
  validated_at: string | null;
  created_at: string | null;
}

export interface ValidationQueueItem {
  audio: AudioTask;
  transcription: TranscriptionRecord;
}

export interface ValidationStats {
  total: number;
  pending: number;
  completed: number;
}

export type LeaderboardRange = 'all' | 'week' | 'month';

export interface AdminLeaderboardEntry {
  admin: string;
  count: number;
}

export interface AdminLeaderboardResponse {
  success: boolean;
  range: LeaderboardRange;
  total: number;
  leaders: AdminLeaderboardEntry[];
}

export const transcriptionServiceApi = {
  async fetchRandomAudio() {
    const { data } = await transcriptionApi.get<AudioTask>('/audio/random');
    return data;
  },

  async submitTranscription(payload: TranscriptionSubmissionPayload) {
    const { data } = await transcriptionApi.post('/transcription', payload);
    return data as TranscriptionRecord;
  },

  async getNextValidationItem() {
    const { data } = await transcriptionApi.get<ValidationQueueItem>('/validation/next');
    return data;
  },

  async submitValidation(transcriptionId: string, payload: ValidationSubmissionPayload) {
    const { data } = await transcriptionApi.put<TranscriptionRecord>(`/validation/${transcriptionId}`, payload);
    return data;
  },

  async getValidationStats() {
    const { data } = await transcriptionApi.get<ValidationStats>('/validation/stats');
    return data;
  },

  async fetchLeaderboard(range: LeaderboardRange = 'all') {
    const { data } = await axios.get<AdminLeaderboardResponse>(
      `${ROOT_API_BASE_URL}/admin-leaderboard`,
      { params: { range } },
    );
    return data;
  },
};
