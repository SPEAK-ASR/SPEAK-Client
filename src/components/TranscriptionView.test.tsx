import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TranscriptionView } from './TranscriptionView';
import { audioApi } from '../lib/api';

vi.mock('../lib/api', () => ({
  audioApi: {
    cleanNullTranscriptions: vi.fn(),
    deleteAudioFiles: vi.fn(),
  },
}));

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockImplementation(() => Promise.resolve()),
  },
});

// Mock window.confirm and alert
vi.stubGlobal('confirm', vi.fn(() => true));
vi.stubGlobal('alert', vi.fn());

describe('TranscriptionView', () => {
  const mockTranscriptions = [
    { clip_name: 'clip1', transcription: 'Hello world' },
    { clip_name: 'clip2', transcription: '' },
    { clip_name: 'clip3', transcription: null },
  ];
  const mockVideoMetadata = { title: 'Test Video' };
  const mockVideoId = '123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders transcriptions correctly', () => {
    render(
      <TranscriptionView
        transcriptions={mockTranscriptions as any}
        videoMetadata={mockVideoMetadata as any}
        videoId={mockVideoId}
      />
    );

    expect(screen.getByText('clip1')).toBeInTheDocument();
    expect(screen.getByText('Hello world')).toBeInTheDocument();
    // 1. Header: "2 failed"
    // 2. Button: "Delete Failed (2)"
    // 3. Clip 2: "Failed"
    // 4. Clip 3: "Failed"
    const failedElements = screen.getAllByText(/failed/i);
    expect(failedElements.length).toBe(4);
  });

  it('calls copyAllTranscriptions when Copy All button is clicked', async () => {
    render(
      <TranscriptionView
        transcriptions={mockTranscriptions as any}
        videoMetadata={mockVideoMetadata as any}
        videoId={mockVideoId}
      />
    );

    const copyAllButton = screen.getByRole('button', { name: /Copy All/i });
    fireEvent.click(copyAllButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByText(/Copied!/i)).toBeInTheDocument();
    });
  });

  it('calls handleDeleteFailedTranscriptions when Delete Failed button is clicked', async () => {
    vi.mocked(audioApi.cleanNullTranscriptions).mockResolvedValueOnce({
      success: true,
      total_deleted: 2,
      remaining_clips: 1,
      deleted_files: ['clip2', 'clip3'],
      message: 'Deleted'
    } as any);

    render(
      <TranscriptionView
        transcriptions={mockTranscriptions as any}
        videoMetadata={mockVideoMetadata as any}
        videoId={mockVideoId}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /Delete Failed \(2\)/i });
    fireEvent.click(deleteButton);

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(audioApi.cleanNullTranscriptions).toHaveBeenCalledWith(mockVideoId);
    });
  });

  it('calls handleRevert when Start Over button is clicked', async () => {
    const mockOnRevert = vi.fn();
    vi.mocked(audioApi.deleteAudioFiles).mockResolvedValueOnce({
      success: true,
      deleted_files: [],
      total_deleted: 3,
      message: 'Deleted'
    } as any);

    render(
      <TranscriptionView
        transcriptions={mockTranscriptions as any}
        videoMetadata={mockVideoMetadata as any}
        videoId={mockVideoId}
        onRevert={mockOnRevert}
      />
    );

    const revertButton = screen.getByRole('button', { name: /Start Over/i });
    fireEvent.click(revertButton);

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(audioApi.deleteAudioFiles).toHaveBeenCalledWith(mockVideoId);
      expect(mockOnRevert).toHaveBeenCalled();
    });
  });
});
