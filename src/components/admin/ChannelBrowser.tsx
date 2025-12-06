// src/components/admin/ChannelBrowser.tsx
import React, { useMemo, useState } from 'react';
import { useChannelCards } from '../../hooks/useChannelCards';
import type { ChannelCard } from '../../types/channel';

// domain categories mapping to display names
const DOMAIN_DISPLAY_NAMES: Record<string, string> = {
    'education': 'Education',
    'health': 'Health',
    'politics_and_government': 'Politics and Government',
    'news_and_current_affairs': 'News and Current Affairs',
    'science': 'Science',
    'technology_and_computing': 'Technology and Computing',
    'business_and_finance': 'Business and Finance',
    'entertainment': 'Entertainment',
    'food_and_drink': 'Food and Drink',
    'law_and_justice': 'Law and Justice',
    'environment_and_sustainability': 'Environment and Sustainability',
    'religion': 'Religion',
    'media_marketing': 'Media Marketing',
    'history_and_cultural': 'History and Cultural',
    'work_and_careers': 'Work and Careers',
    'sports': 'Sports',
    'music': 'Music',
    'others': 'Others'
};

const getDisplayCategoryName = (domain: string): string => {
    return DOMAIN_DISPLAY_NAMES[domain.toLowerCase()] || 'Others';
};

export const ChannelBrowser: React.FC = () => {
    const { channels, loading, error, deleteChannel } = useChannelCards();
    const [deletingChannels, setDeletingChannels] = useState<Set<string>>(new Set());

    const channelsByCategory = useMemo(() => {
        const map = new Map<string, ChannelCard[]>();

        channels.forEach(ch => {
            if (!ch.domain || ch.domain.trim() === '') {
                const list = map.get('Others') ?? [];
                list.push(ch);
                map.set('Others', list);
            } else {
                // Get display name for the domain
                const displayName = getDisplayCategoryName(ch.domain);
                const list = map.get(displayName) ?? [];
                list.push(ch);
                map.set(displayName, list);
            }
        });

        // Sort by predefined order
        const categoryOrder = [
            'Education',
            'Health',
            'Politics and Government',
            'News and Current Affairs',
            'Science',
            'Technology and Computing',
            'Business and Finance',
            'Entertainment',
            'Food and Drink',
            'Law and Justice',
            'Environment and Sustainability',
            'Religion',
            'Media Marketing',
            'History and Cultural',
            'Work and Careers',
            'Sports',
            'Music',
            'Others'
        ];

        return categoryOrder
            .filter(category => map.has(category))
            .map(category => [category, map.get(category)!] as [string, ChannelCard[]]);
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

            {loading && (
                <div className="flex items-center justify-center py-12">
                    <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        <p className="text-gray-400">Loading channels…</p>
                    </div>
                </div>
            )}
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
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium py-1.5 px-2 rounded transition-colors duration-150 truncate"
                        title={`View ${channel.channelTitle} on YouTube`}
                    >
                        {channel.channelTitle || 'View'}
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