import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { YoutubeUrlInput } from './YoutubeUrlInput';
import { audioApi } from '../lib/api';

vi.mock('../lib/api', () => ({
  audioApi: {
    splitAudio: vi.fn(),
  },
}));

describe('YoutubeUrlInput', () => {
  const mockOnSubmit = vi.fn();
  const mockOnClipsGenerated = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    render(
      <YoutubeUrlInput
        onSubmit={mockOnSubmit}
        onClipsGenerated={mockOnClipsGenerated}
        onError={mockOnError}
      />
    );

    expect(screen.getByLabelText(/YouTube Video URL/i)).toBeInTheDocument();
    // In MUI, the label might be associated with the select's hidden input or a button
    expect(screen.getByLabelText(/Video Category/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Process Video/i })).toBeDisabled();
  });

  it('enables the button when valid URL and domain are provided', async () => {
    render(
      <YoutubeUrlInput
        onSubmit={mockOnSubmit}
        onClipsGenerated={mockOnClipsGenerated}
        onError={mockOnError}
      />
    );

    const urlInput = screen.getByLabelText(/YouTube Video URL/i);
    fireEvent.change(urlInput, { target: { value: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' } });

    // Handle MUI Select
    const domainSelect = screen.getByLabelText(/Video Category/i);
    fireEvent.mouseDown(domainSelect);

    // MUI renders the list in a portal, so we look globally
    const listbox = screen.getByRole('listbox');
    const option = within(listbox).getByText('Education');
    fireEvent.click(option);

    expect(screen.getByRole('button', { name: /Process Video/i })).not.toBeDisabled();
  });

  it('shows error for invalid YouTube URL', () => {
    render(
      <YoutubeUrlInput
        onSubmit={mockOnSubmit}
        onClipsGenerated={mockOnClipsGenerated}
        onError={mockOnError}
      />
    );

    const urlInput = screen.getByLabelText(/YouTube Video URL/i);
    fireEvent.change(urlInput, { target: { value: 'invalid-url' } });

    expect(screen.getByText(/Please enter a valid YouTube URL/i)).toBeInTheDocument();
  });

  it('calls splitAudio API on form submission', async () => {
    const mockResponse = {
      success: true,
      video_id: '123',
      video_metadata: { title: 'Test Video' },
      clips: [],
    };
    vi.mocked(audioApi.splitAudio).mockResolvedValueOnce(mockResponse as any);

    render(
      <YoutubeUrlInput
        onSubmit={mockOnSubmit}
        onClipsGenerated={mockOnClipsGenerated}
        onError={mockOnError}
      />
    );

    const urlInput = screen.getByLabelText(/YouTube Video URL/i);
    fireEvent.change(urlInput, { target: { value: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' } });

    const domainSelect = screen.getByLabelText(/Video Category/i);
    fireEvent.mouseDown(domainSelect);
    const listbox = screen.getByRole('listbox');
    fireEvent.click(within(listbox).getByText('Education'));

    const submitButton = screen.getByRole('button', { name: /Process Video/i });
    fireEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalled();
    await waitFor(() => {
      expect(audioApi.splitAudio).toHaveBeenCalledWith(
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'education',
        2,
        1,
        0.5
      );
      expect(mockOnClipsGenerated).toHaveBeenCalledWith('123', { title: 'Test Video' }, []);
    });
  });

  it('handles API error', async () => {
    vi.mocked(audioApi.splitAudio).mockRejectedValueOnce(new Error('API Failure'));

    render(
      <YoutubeUrlInput
        onSubmit={mockOnSubmit}
        onClipsGenerated={mockOnClipsGenerated}
        onError={mockOnError}
      />
    );

    const urlInput = screen.getByLabelText(/YouTube Video URL/i);
    fireEvent.change(urlInput, { target: { value: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' } });

    const domainSelect = screen.getByLabelText(/Video Category/i);
    fireEvent.mouseDown(domainSelect);
    const listbox = screen.getByRole('listbox');
    fireEvent.click(within(listbox).getByText('Education'));

    fireEvent.click(screen.getByRole('button', { name: /Process Video/i }));

    await waitFor(() => {
      expect(screen.getByText(/API Failure/i)).toBeInTheDocument();
      expect(mockOnError).toHaveBeenCalledWith('API Failure');
    });
  });
});
