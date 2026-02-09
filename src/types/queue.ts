// Types for Queue Processor batch processing

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

// Progress percentages for each stage
export const STAGE_PROGRESS: Record<VideoStatus, number> = {
    pending: 0,
    splitting: 25,
    transcribing: 50,
    cleaning: 75,
    saving: 90,
    complete: 100,
    error: 0,
};

// Maximum number of videos to process concurrently
// Note: Set to 2 to avoid overwhelming PostgreSQL with connection requests
export const CONCURRENT_VIDEO_LIMIT = 2;

export const STAGE_LABELS: Record<VideoStatus, string> = {
    pending: "Pending",
    splitting: "Splitting Audio",
    transcribing: "Transcribing",
    cleaning: "Cleaning",
    saving: "Saving to Cloud",
    complete: "Complete",
    error: "Error",
};

// Domain options
export const DOMAIN_OPTIONS = [
    { value: "education", label: "Education" },
    { value: "health", label: "Health" },
    { value: "politics_and_government", label: "Politics and Government" },
    { value: "news_and_current_affairs", label: "News and Current Affairs" },
    { value: "science", label: "Science" },
    { value: "technology_and_computing", label: "Technology and Computing" },
    { value: "business_and_finance", label: "Business and Finance" },
    { value: "entertainment", label: "Entertainment" },
    { value: "food_and_drink", label: "Food and Drink" },
    { value: "law_and_justice", label: "Law and Justice" },
    {
        value: "environment_and_sustainability",
        label: "Environment and Sustainability",
    },
    { value: "religion", label: "Religion" },
    { value: "media_marketing", label: "Media Marketing" },
    { value: "history_and_cultural", label: "History and Cultural" },
    { value: "work_and_careers", label: "Work and Careers" },
    { value: "sports", label: "Sports" },
    { value: "music", label: "Music" },
    { value: "others", label: "Others" },
];
