// src/components/admin/ChannelBrowser.tsx
import React, { useMemo, useState } from 'react';
import { useChannelCards } from '../../hooks/useChannelCards';
import type { ChannelCard } from '../../types/channel';

const humanizeTopic = (raw: string): string => {
    // "https://en.wikipedia.org/wiki/Film" -> "Film"
    try {
        const parts = raw.split('/');
        const last = parts[parts.length - 1] || raw;
        return decodeURIComponent(last).replace(/_/g, ' ');
    } catch {
        return raw;
    }
};

export const ChannelBrowser: React.FC = () => {
    const { channels, loading, error, deleteChannel } = useChannelCards();
    const [deletingChannels, setDeletingChannels] = useState<Set<string>>(new Set());

    const channelsByCategory = useMemo(() => {
        const map = new Map<string, ChannelCard[]>();

        channels.forEach(ch => {
            if (!ch.topicCategories || ch.topicCategories.length === 0) {
                const list = map.get('Uncategorized') ?? [];
                list.push(ch);
                map.set('Uncategorized', list);
            } else {
                ch.topicCategories.forEach(topic => {
                    const label = humanizeTopic(topic);
                    const list = map.get(label) ?? [];
                    list.push(ch);
                    map.set(label, list);
                });
            }
        });

        return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
    }, [channels]);

    const handleDelete = async (channelId: string) => {
        setDeletingChannels(prev => new Set([...prev, channelId]));
        try {
            await deleteChannel(channelId);
        } catch (error) {
            // If delete fails, remove from deleting state
            setDeletingChannels(prev => {
                const newSet = new Set(prev);
                newSet.delete(channelId);
                return newSet;
            });
        }
    };

    return (
        <div className="min-h-screen bg-black text-white px-8 py-6">
            {/* <header className="mb-8 flex items-center justify-between">
                <h1 className="text-3xl font-bold text-red-600">
                    Sinhala YouTube Channels
                </h1>
            </header> */}

            {loading && <p className="text-gray-400">Loading channels…</p>}
            {error && (
                <p className="mb-4 text-sm text-red-400">
                    Error loading channels: {error}
                </p>
            )}

            <main className="space-y-10">
                {channelsByCategory.map(([category, list]) => (
                    <section key={category} className="space-y-3">
                        <h2 className="text-xl font-semibold">{category}</h2>

                        <div className="flex gap-4 overflow-x-auto pb-3">
                            {list
                                .filter(ch => !deletingChannels.has(ch.channelId))
                                .map(ch => (
                                    <ChannelCardItem
                                        key={`${category}-${ch.channelId}`}
                                        channel={ch}
                                        onDelete={handleDelete}
                                        isDeleting={deletingChannels.has(ch.channelId)}
                                    />
                                ))}
                        </div>
                    </section>
                ))}

                {!loading && !error && channelsByCategory.length === 0 && (
                    <p className="text-gray-400">No channels found.</p>
                )}
            </main>
        </div>
    );
};

interface ChannelCardItemProps {
    channel: ChannelCard;
    onDelete: (channelId: string) => Promise<void>;
    isDeleting?: boolean;
}

const ChannelCardItem: React.FC<ChannelCardItemProps> = ({
    channel,
    onDelete,
    isDeleting = false,
}) => {
    const youtubeUrl = `https://www.youtube.com/channel/${channel.channelId}`;

    const handleView = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        window.open(youtubeUrl, '_blank', 'noopener,noreferrer');
    };

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        await onDelete(channel.channelId);
    };

    if (isDeleting) {
        return null; // Hide immediately when deleting starts
    }

    return (
        <div className="group relative flex-shrink-0 w-56 h-48 rounded-lg overflow-hidden bg-zinc-900/80 shadow-lg transform transition duration-200 hover:scale-105">
            {/* Thumbnail */}
            {channel.thumbnailUrl ? (
                <img
                    src={channel.thumbnailUrl}
                    alt={`Channel ${channel.channelId}`}
                    className="absolute inset-0 h-full w-full object-cover"
                />
            ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-emerald-500" />
            )}

            {/* Dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

            {/* Action buttons at the bottom */}
            <div className="absolute bottom-0 left-0 right-0 z-10 p-2">
                <div className="flex gap-2 justify-center">
                    <button
                        onClick={handleView}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium py-1.5 px-2 rounded transition-colors duration-150"
                        title="View channel on YouTube"
                    >
                        View
                    </button>
                    <button
                        onClick={handleDelete}
                        className="flex-1 bg-red-600 hover:bg-red-500 text-white text-xs font-medium py-1.5 px-2 rounded transition-colors duration-150"
                        title="Delete channel"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};