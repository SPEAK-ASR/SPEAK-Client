// src/components/admin/ChannelBrowser.tsx
import React, { useMemo } from 'react';
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

        return Array.from(map.entries()).sort(([a, b]) => a.localeCompare(b));
    }, [channels]);

    return (
        <div className="min-h-screen bg-black text-white px-8 py-6">
            <header className="mb-8 flex items-center justify-between">
                <h1 className="text-3xl font-bold text-red-600">
                    Sinhala YouTube Channels
                </h1>
                <span className="text-sm text-gray-300">Admin · Channel Browser</span>
            </header>

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
                            {list.map(ch => (
                                <ChannelCardItem
                                    key={`${category}-${ch.channelId}`}
                                    channel={ch}
                                    onDelete={deleteChannel}
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
}

const ChannelCardItem: React.FC<ChannelCardItemProps> = ({
    channel,
    onDelete,
}) => {
    const youtubeUrl = `https://www.youtube.com/channel/${channel.channelId}`;

    const handleDelete = (e: React.MouseEvent) => {
        // prevent card link from opening when deleting
        e.preventDefault();
        e.stopPropagation();
        void onDelete(channel.channelId);
    };

    return (
        <a
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex-shrink-0 w-56 h-40 rounded-lg overflow-hidden bg-zinc-900/80 shadow-lg transform transition duration-200 hover:scale-105 cursor-pointer"
        >
            {channel.thumbnailUrl ? (
                <img
                    src={channel.thumbnailUrl}
                    alt={channel.channelId}
                    className="absolute inset-0 h-full w-full object-cover"
                />
            ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-emerald-500" />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

            <div className="relative z-10 flex h-full flex-col justify-end p-3 space-y-1">
                <p className="text-xs text-gray-300 uppercase tracking-wide truncate">
                    {channel.channelId}
                </p>
                {/* category line removed as requested */}
            </div>

            <div className="pointer-events-none absolute inset-0 flex items-start justify-end opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-150">
                <button
                    onClick={handleDelete}
                    className="m-2 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-red-500"
                >
                    Delete
                </button>
            </div>
        </a>
    );
};
