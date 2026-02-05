/**
 * Common shared types used across the application
 * Single source of truth for reusable interfaces and constants
 */

import type { SpeakerGender } from '../lib/transcriptionServiceApi';

// ============================================================================
// Snackbar / Notification Types
// ============================================================================

export type SnackbarSeverity = 'success' | 'error' | 'info' | 'warning';

export interface SnackbarState {
  message: string;
  severity: SnackbarSeverity;
}

// ============================================================================
// Transcription Metadata Types
// ============================================================================

export interface TranscriptionMetadata {
  speakerGender: '' | SpeakerGender;
  hasNoise: boolean;
  isCodeMixed: boolean;
  isOverlap: boolean;
}

export const DEFAULT_METADATA: TranscriptionMetadata = {
  speakerGender: '',
  hasNoise: false,
  isCodeMixed: false,
  isOverlap: false,
};

export const SPEAKER_OPTIONS: SpeakerGender[] = ['male', 'female', 'cannot_recognized'];

// ============================================================================
// Admin Types (re-exported from AdminContext for convenience)
// ============================================================================

export type AdminName = 'chirath' | 'rusira' | 'kokila' | 'sahan';

export interface AdminProfile {
  id: AdminName;
  displayName: string;
  imagePath: string;
}

// ============================================================================
// Async State Types (for useAsyncData hook)
// ============================================================================

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// ============================================================================
// Common Component Props
// ============================================================================

export interface LoadingOverlayProps {
  loading: boolean;
  message?: string;
}

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}
