import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import axios from 'axios';
import { useChannelCards } from './useChannelCards';

vi.mock('axios');

describe('useChannelCards', () => {
  it('fetches and returns channels', async () => {
    const mockChannels = [
      { channelId: '1', channelTitle: 'Channel 1', domain: 'education' },
      { channelId: '2', channelTitle: 'Channel 2', domain: 'health' },
    ];
    vi.mocked(axios.get).mockResolvedValueOnce({ data: mockChannels });

    const { result } = renderHook(() => useChannelCards());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.channels).toEqual(mockChannels);
    expect(result.current.error).toBeNull();
  });

  it('filters out deleted channels', async () => {
    const mockChannels = [
      { channelId: '1', channelTitle: 'Channel 1', domain: 'education', isDeleted: false },
      { channelId: '2', channelTitle: 'Channel 2', domain: 'health', isDeleted: true },
    ];
    vi.mocked(axios.get).mockResolvedValueOnce({ data: mockChannels });

    const { result } = renderHook(() => useChannelCards());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.channels).toHaveLength(1);
    expect(result.current.channels[0].channelId).toBe('1');
  });

  it('handles errors correctly', async () => {
    // Suppress console.error for this test as we expect an error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(axios.get).mockRejectedValueOnce(new Error('Network Error'));

    const { result } = renderHook(() => useChannelCards());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Network Error');
    expect(result.current.channels).toEqual([]);
    consoleSpy.mockRestore();
  });

  it('deletes a channel', async () => {
    const mockChannels = [
      { channelId: '1', channelTitle: 'Channel 1', domain: 'education' },
    ];
    vi.mocked(axios.get).mockResolvedValueOnce({ data: mockChannels });
    vi.mocked(axios.delete).mockResolvedValueOnce({});

    const { result } = renderHook(() => useChannelCards());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.deleteChannel('1');
    });

    expect(axios.delete).toHaveBeenCalled();
    expect(result.current.channels).toHaveLength(0);
  });
});
