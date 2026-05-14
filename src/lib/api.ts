import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_AUDIO_SCRAPING_API_URL ||
  "http://localhost:5001/api/v1";
const AUDIO_BASE_URL =
  import.meta.env.VITE_AUDIO_SCRAPING_BASE_URL || "http://localhost:5001";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

export interface VideoMetadata {
  video_id: string;
  title: string;
  duration: number;
  uploader?: string;
  description?: string;
  upload_date?: string;
  thumbnail?: string;
  url?: string;
  [key: string]: unknown;
}

export interface ClipData {
  clip_name: string;
  duration: number;
  start_time: number;
  end_time: number;
  padded_duration: number;
}

export interface AudioSplitResponse {
  success: boolean;
  message: string;
  video_id: string;
  domain: string;
  video_metadata: VideoMetadata;
  clips: ClipData[];
  total_clips: number;
  start_padding: number;
  end_padding: number;
}

export interface TranscribedClip {
  clip_name: string;
  transcription: string | null;
}

export interface TranscriptionResponse {
  success: boolean;
  message: string;
  video_id: string;
  transcribed_clips: TranscribedClip[];
  total_transcribed: number;
  failed_clips: string[];
}

export interface ProcessedClip {
  clip_name: string;
  cloud_url: string | null;
  database_id: string | null;
}

export interface CloudStorageResponse {
  success: boolean;
  message: string;
  video_id: string;
  processed_clips: ProcessedClip[];
  total_processed: number;
  failed_clips: string[];
}

export interface PlaylistVideo {
  video_id: string;
  url: string;
  title: string;
  duration: number;
  thumbnail?: string;
}

export interface PlaylistResponse {
  success: boolean;
  playlist_id: string;
  playlist_title: string;
  total_videos: number;
  returned_videos: number;
  videos: PlaylistVideo[];
}

export const audioApi = {
  splitAudio: async (
    youtubeUrl: string,
    domain: string,
    vadThreshold: number = 0.5,
    startPadding: number = 1.0,
    endPadding: number = 0.5,
  ): Promise<AudioSplitResponse> => {
    const r = await api.post("/split-audio", {
      youtube_url: youtubeUrl,
      domain,
      vad_threshold: vadThreshold,
      start_padding: startPadding,
      end_padding: endPadding,
    });
    return r.data;
  },
  transcribeClips: async (
    videoId: string,
    clipNames?: string[],
  ): Promise<TranscriptionResponse> => {
    const r = await api.post("/transcribe-clips", {
      video_id: videoId,
      clip_names: clipNames,
    });
    return r.data;
  },
  saveToCloud: async (
    videoId: string,
    clipNames?: string[],
  ): Promise<CloudStorageResponse> => {
    const r = await api.post("/save-clips", {
      video_id: videoId,
      clip_names: clipNames,
      upload_to_cloud_bucket: true,
      add_to_transcription_service: true,
    });
    return r.data;
  },
  deleteAudioFiles: async (videoId: string) => {
    const r = await api.delete<{
      success: boolean;
      message: string;
      deleted_files: string[];
      total_deleted: number;
    }>(`/delete-audio/${videoId}`);
    return r.data;
  },
  cleanNullTranscriptions: async (videoId: string) => {
    const r = await api.post<{
      success: boolean;
      message: string;
      deleted_files: string[];
      total_deleted: number;
      remaining_clips: number;
    }>(`/clean-transcriptions/${videoId}`);
    return r.data;
  },
  getAudioFile: (videoId: string, clipName: string) =>
    `${AUDIO_BASE_URL}/output/${videoId}/${clipName}`,

  getPlaylistVideos: async (
    playlistUrl: string,
    limit?: number,
  ): Promise<PlaylistResponse> => {
    const r = await api.post("/playlist-videos", {
      playlist_url: playlistUrl,
      limit,
    });
    return r.data;
  },
};

export interface ApiErrorShape {
  message: string;
  isWarning?: boolean;
}

export function extractApiError(err: unknown): ApiErrorShape {
  if (err && typeof err === "object" && "response" in err) {
    const ax = err as {
      response?: {
        status?: number;
        data?: {
          detail?:
            | string
            | { error?: string; video_title?: string; suggestion?: string };
        };
      };
      message?: string;
    };
    const status = ax.response?.status;
    const detail = ax.response?.data?.detail;

    if (status === 409 && detail && typeof detail === "object") {
      if (detail.error === "VIDEO_ALREADY_EXISTS") {
        return {
          message: `Video "${detail.video_title}" has already been processed. ${detail.suggestion ?? ""}`.trim(),
          isWarning: true,
        };
      }
    }
    if (typeof detail === "string") return { message: detail };
    if (typeof detail === "object" && detail?.error) {
      return { message: detail.error };
    }
    if (status === 500) {
      return {
        message:
          "Server error occurred. Please check the backend service and try again.",
      };
    }
    if (ax.message) return { message: ax.message };
  }
  if (err instanceof Error) return { message: err.message };
  return { message: "An unexpected error occurred" };
}
