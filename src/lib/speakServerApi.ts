import axios from "axios";

const SPEAK_SERVER_API_URL =
  import.meta.env.VITE_SPEAK_SERVER_API_URL ||
  "http://localhost:5000/api/v1";

export const SPEAK_SERVER_API_BASE = SPEAK_SERVER_API_URL;

const client = axios.create({
  baseURL: SPEAK_SERVER_API_URL,
  headers: { "Content-Type": "application/json" },
});

export type LeaderboardRange = "all" | "week" | "month";

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

export interface VideoAudioClip {
  audio_id: string;
  audio_filename: string;
  google_transcription: string | null;
  gcs_signed_url: string;
}

export interface YouTubeVideoValidationItem {
  id: string;
  video_id: string;
  title: string;
  description: string;
  duration: string;
  uploader: string;
  upload_date: string;
  thumbnail: string;
  url: string;
  domain: string;
  is_validated: boolean | null;
  created_at: string;
  audio_clip_count: number;
  audio_clips: VideoAudioClip[];
}

export interface VideoValidationResponse {
  id: string;
  video_id: string;
  is_validated: boolean;
  message: string;
}

export const speakServerApi = {
  async fetchLeaderboard(range: LeaderboardRange = "all") {
    const { data } = await client.get<AdminLeaderboardResponse>(
      "/admin/leaderboard",
      { params: { range } },
    );
    return data;
  },
  async getNextYouTubeVideoForValidation() {
    const { data } = await client.get<YouTubeVideoValidationItem>(
      "/validation/youtube-video/next",
    );
    return data;
  },
  async submitVideoValidationStatus(videoId: string, isValidated: boolean) {
    const { data } = await client.post<VideoValidationResponse>(
      `/validation/youtube-video/${videoId}/validation-status`,
      { is_validated: isValidated },
    );
    return data;
  },
};
