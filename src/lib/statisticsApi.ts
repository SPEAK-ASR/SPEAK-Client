import { api } from "./api";

export interface CategoryDurationData {
  category: string;
  total_duration_hours: number;
  total_duration_minutes: number;
  clip_count: number;
  video_count: number;
}

export interface TranscriptionStatusData {
  transcribed_count: number;
  non_transcribed_count: number;
  transcribed_duration_hours: number;
  non_transcribed_duration_hours: number;
  total_count: number;
  transcription_rate: number;
}

export interface DailyTranscriptionData {
  date: string;
  transcription_count: number;
  audio_count: number;
  total_duration_hours: number;
}

export interface AdminContributionData {
  admin: string;
  transcription_count: number;
  total_duration_hours: number;
  percentage: number;
}

export interface AudioDurationDistribution {
  range: string;
  count: number;
  total_duration_hours: number;
  percentage: number;
}

export interface TotalDataSummary {
  total_videos: number;
  total_audio_clips: number;
  total_duration_hours: number;
  transcribed_duration_hours: number;
  total_transcriptions: number;
  average_clip_duration_seconds: number;
}

export interface SpeakerGenderData {
  gender: string;
  count: number;
}

export interface AudioSuitabilityData {
  suitable: number;
  unsuitable: number;
  unknown: number;
}

export interface NoiseData {
  with_noise: number;
  without_noise: number;
  unknown: number;
}

export interface CodeMixingData {
  code_mixed: number;
  not_mixed: number;
  unknown: number;
}

export interface SpeakerOverlappingData {
  with_overlap: number;
  without_overlap: number;
  unknown: number;
}

export interface TranscriptionMetadata {
  total_transcriptions: number;
  audio_suitability: AudioSuitabilityData;
  speaker_gender: SpeakerGenderData[];
  noise: NoiseData;
  code_mixing: CodeMixingData;
  speaker_overlapping: SpeakerOverlappingData;
}

export interface AsrReferencePreferenceStats {
  google_chosen: number;
  speak_chosen: number;
  neutral: number;
  decisive_total: number;
  google_share_percent: number | null;
}

export interface StatisticsResponse {
  success: boolean;
  message: string;
  summary: TotalDataSummary;
  category_durations: CategoryDurationData[];
  transcription_status: TranscriptionStatusData;
  daily_transcriptions: DailyTranscriptionData[];
  admin_contributions: AdminContributionData[];
  audio_distribution: AudioDurationDistribution[];
  transcription_metadata: TranscriptionMetadata;
  asr_reference_preference?: AsrReferencePreferenceStats;
}

export const statisticsApi = {
  getAllStatistics: async (days = 30): Promise<StatisticsResponse> => {
    const r = await api.get(`/statistics?days=${days}`);
    return r.data;
  },
  getDailyTranscriptions: async (days = 30) => {
    const r = await api.get<{ success: boolean; data: DailyTranscriptionData[] }>(
      `/statistics/daily?days=${days}`,
    );
    return r.data;
  },
};
