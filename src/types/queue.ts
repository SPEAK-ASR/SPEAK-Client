export type VideoStatus =
  | "pending"
  | "splitting"
  | "transcribing"
  | "cleaning"
  | "saving"
  | "complete"
  | "error";

export interface VideoSettings {
  domain: string;
  vadThreshold: number;
  startPadding: number;
  endPadding: number;
  autoCleanNullTranscriptions: boolean;
}

export interface QueueVideo {
  id: string;
  url: string;
  videoId?: string;
  title?: string;
  thumbnail?: string;
  duration?: number;
  status: VideoStatus;
  progress: number;
  error?: string;
  clipCount?: number;
  savedCount?: number;
  settings: VideoSettings;
}

export const DEFAULT_VIDEO_SETTINGS: VideoSettings = {
  domain: "",
  vadThreshold: 0.5,
  startPadding: 1,
  endPadding: 0.5,
  autoCleanNullTranscriptions: true,
};

export const STAGE_PROGRESS: Record<VideoStatus, number> = {
  pending: 0,
  splitting: 25,
  transcribing: 50,
  cleaning: 75,
  saving: 90,
  complete: 100,
  error: 0,
};

export const CONCURRENT_VIDEO_LIMIT = 2;

export const STAGE_LABELS: Record<VideoStatus, string> = {
  pending: "Pending",
  splitting: "Splitting",
  transcribing: "Transcribing",
  cleaning: "Cleaning",
  saving: "Saving",
  complete: "Done",
  error: "Failed",
};
