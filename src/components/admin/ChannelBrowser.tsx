// src/components/admin/ChannelBrowser.tsx
import React, { useMemo, useState } from 'react';
import {
    Alert,
    Box,
    Card,
    CardActionArea,
    CircularProgress,
    IconButton,
    Skeleton,
    Snackbar,
    Stack,
    Typography,
    useTheme,
} from '@mui/material';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import type { ChannelCard } from '../../types/channel';
import { useChannelCards } from '../../hooks/useChannelCards';

// domain categories mapping to display names
const DOMAIN_DISPLAY_NAMES: Record<string, string> = {
    education: 'Education',
    health: 'Health',
    politics_and_government: 'Politics and Government',
    news_and_current_affairs: 'News and Current Affairs',
    science: 'Science',
    technology_and_computing: 'Technology and Computing',
    business_and_finance: 'Business and Finance',
    entertainment: 'Entertainment',
    food_and_drink: 'Food and Drink',
    law_and_justice: 'Law and Justice',
    environment_and_sustainability: 'Environment and Sustainability',
    religion: 'Religion',
    media_marketing: 'Media Marketing',
    history_and_cultural: 'History and Cultural',
    work_and_careers: 'Work and Careers',
    sports: 'Sports',
    music: 'Music',
    others: 'Others',
};

const getDisplayCategoryName = (domain: string): string => {
    return DOMAIN_DISPLAY_NAMES[domain.toLowerCase()] || 'Others';
};

interface SnackbarState {
    message: string;
    severity: 'success' | 'error' | 'info';
}

export const ChannelBrowser: React.FC = () => {
    const { channels, loading, error, deleteChannel } = useChannelCards();
    const [deletingChannels, setDeletingChannels] = useState<Set<string>>(new Set());
    const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);

    const channelsByCategory = useMemo(() => {
        const map = new Map<string, ChannelCard[]>();

        channels.forEach(ch => {
            if (!ch.domain || ch.domain.trim() === '') {
                const list = map.get('Others') ?? [];
                list.push(ch);
                map.set('Others', list);
            } else {
                const displayName = getDisplayCategoryName(ch.domain);
                const list = map.get(displayName) ?? [];
                list.push(ch);
                map.set(displayName, list);
            }
        });

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
            'Others',
        ];

        return categoryOrder
            .filter(category => map.has(category))
            .map(category => [category, map.get(category)!] as [string, ChannelCard[]]);
    }, [channels]);

    const handleDelete = async (channelId: string) => {
        setDeletingChannels(prev => new Set([...prev, channelId]));
        try {
            await deleteChannel(channelId);
            // Successfully deleted - keep it in deletingChannels to hide it
            setSnackbar({ message: 'Channel deleted successfully', severity: 'success' });
        } catch (err) {
            // Deletion failed - remove from deletingChannels to restore visibility
            console.error('Failed to delete channel:', err);
            setDeletingChannels(prev => {
                const next = new Set(prev);
                next.delete(channelId);
                return next;
            });
            setSnackbar({ message: 'Failed to delete channel. Please try again.', severity: 'error' });
        }
    };

    return (
        <Stack spacing={4} sx={{ color: '#f5f5f5' }}>
            {error && (
                <Alert severity="error" sx={{ bgcolor: 'error.dark', color: 'common.white' }}>
                    Error loading channels: {error}
                </Alert>
            )}

            {loading && channels.length === 0 ? (
                <Stack spacing={2} alignItems="center" justifyContent="center" sx={{ py: 6 }}>
                    <CircularProgress color="inherit" size={28} thickness={5} />
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Loading channels…
                    </Typography>
                </Stack>
            ) : (
                <Stack spacing={4} component="main">
                    {channelsByCategory.map(([category, list]) => (
                        <Stack key={category} spacing={1} sx={{ overflow: 'visible', position: 'relative' }}>
                            <Typography variant="h6" fontWeight={700} sx={{ px: 0.5 }}>
                                {category}
                            </Typography>

                            <Box
                                sx={{
                                    display: 'flex',
                                    gap: 2,
                                    overflowX: 'auto',
                                    overflowY: 'visible',
                                    pt: 1.5,
                                    pb: 1.5,
                                    px: 0.5,
                                    scrollbarWidth: 'thin',
                                    scrollbarColor: '#2b2b31 transparent',
                                    '&::-webkit-scrollbar': {
                                        height: 8,
                                    },
                                    '&::-webkit-scrollbar-thumb': {
                                        backgroundColor: '#2b2b31',
                                        borderRadius: 999,
                                        border: '1px solid #0f0f13',
                                    },
                                    '&::-webkit-scrollbar-thumb:hover': {
                                        backgroundColor: '#34343d',
                                    },
                                    '&::-webkit-scrollbar-track': {
                                        backgroundColor: '#0f0f13',
                                    },
                                }}
                            >
                                {list
                                    .filter(ch => !deletingChannels.has(ch.channelId))
                                    .map(ch => (
                                        <ChannelCardItem
                                            key={`${category}-${ch.channelId}`}
                                            channel={ch}
                                            onDelete={handleDelete}
                                        />
                                    ))}

                                {loading && (
                                    <Stack direction="row" spacing={2}>
                                        {Array.from({ length: 3 }).map((_, idx) => (
                                            <Skeleton
                                                key={`skeleton-${idx}`}
                                                variant="rounded"
                                                width={224}
                                                height={148}
                                                sx={{ bgcolor: 'grey.900', flexShrink: 0, borderRadius: 2 }}
                                            />
                                        ))}
                                    </Stack>
                                )}
                            </Box>
                        </Stack>
                    ))}

                    {!loading && !error && channelsByCategory.length === 0 && (
                        <Typography variant="body2" sx={{ color: 'text.secondary', px: 0.5 }}>
                            No channels found.
                        </Typography>
                    )}
                </Stack>
            )}

            {snackbar && (
                <Snackbar open autoHideDuration={4000} onClose={() => setSnackbar(null)}>
                    <Alert severity={snackbar.severity} onClose={() => setSnackbar(null)} variant="filled">
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            )}
        </Stack>
    );
};

interface ChannelCardItemProps {
    channel: ChannelCard;
    onDelete: (channelId: string) => Promise<void>;
}

const ChannelCardItem: React.FC<ChannelCardItemProps> = ({ channel, onDelete }) => {
    const theme = useTheme();
    const youtubeUrl = `https://www.youtube.com/channel/${channel.channelId}`;

    const handleView = (event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        window.open(youtubeUrl, '_blank', 'noopener,noreferrer');
    };

    const handleDelete = async (event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        await onDelete(channel.channelId);
    };

    const fallbackGradient = 'linear-gradient(135deg, #ff4d6d 0%, #6a4dff 50%, #00d2ff 100%)';

    return (
        <Card
            component={CardActionArea}
            onClick={handleView}
            sx={{
                position: 'relative',
                width: 224,
                height: 148,
                borderRadius: 2,
                overflow: 'hidden',
                flexShrink: 0,
                backgroundColor: '#0f0f13',
                boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
                transform: 'scale(1)',
                transition: 'transform 180ms ease, box-shadow 180ms ease',
                '&:hover': {
                    transform: 'translateY(-6px) scale(1.08)',
                    boxShadow: '0 18px 45px rgba(0,0,0,0.45)',
                    zIndex: 2,
                },
                '&:hover .actions': {
                    opacity: 1,
                    height: 30,
                    visibility: 'visible',
                    transform: 'translateY(0)',
                    pointerEvents: 'auto',
                },
            }}
        >
            <Box
                sx={{
                    position: 'absolute',
                    inset: 0,
                    background: channel.thumbnailUrl
                        ? `url(${channel.thumbnailUrl}) center/cover no-repeat`
                        : fallbackGradient,
                    filter: channel.thumbnailUrl ? 'saturate(1.05)' : 'none',
                    transition: 'transform 180ms ease',
                }}
            />

            <Box
                sx={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.85) 80%)',
                    pointerEvents: 'none',
                }}
            />

            <Stack
                spacing={1}
                sx={{
                    position: 'absolute',
                    inset: 0,
                    p: 1.5,
                    justifyContent: 'flex-end',
                }}
            >
                <Typography
                    variant="subtitle2"
                    noWrap
                    className="title"
                    sx={{
                        color: 'common.white',
                        textShadow: '0 6px 12px rgba(0,0,0,0.7)',
                        fontWeight: 700,
                        transition: 'transform 180ms ease',
                    }}
                >
                    {channel.channelTitle || 'Channel'}
                </Typography>

                <Stack
                    direction="row"
                    spacing={1}
                    className="actions"
                    sx={{
                        opacity: 0,
                        height: 0,
                        visibility: 'hidden',
                        transform: 'translateY(12px)',
                        transition: 'height 200ms ease, opacity 160ms ease, transform 180ms ease',
                        overflow: 'hidden',
                        pointerEvents: 'none',
                    }}
                >
                    <IconButton
                        size="small"
                        onClick={handleView}
                        sx={{
                            bgcolor: 'common.white',
                            color: '#000',
                            '&:hover': { bgcolor: 'grey.200' },
                            boxShadow: '0 8px 20px rgba(0,0,0,0.35)',
                            width: 30,
                            height: 30,
                        }}
                        aria-label={`Open ${channel.channelTitle || 'channel'} on YouTube`}
                    >
                        <PlayArrowRoundedIcon fontSize="small" />
                    </IconButton>

                    <IconButton
                        size="small"
                        onClick={handleDelete}
                        sx={{
                            bgcolor: theme.palette.error.main,
                            color: 'common.white',
                            '&:hover': { bgcolor: theme.palette.error.dark },
                            boxShadow: '0 8px 20px rgba(0,0,0,0.35)',
                            width: 30,
                            height: 30,
                        }}
                        aria-label="Delete channel"
                    >
                        <DeleteOutlineRoundedIcon fontSize="small" />
                    </IconButton>
                </Stack>
            </Stack>
        </Card>
    );
};