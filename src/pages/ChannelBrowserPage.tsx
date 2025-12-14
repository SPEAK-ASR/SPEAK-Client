import React from 'react';
import { Box, Typography, Stack } from '@mui/material';
import YouTubeIcon from '@mui/icons-material/YouTube';
import { ChannelBrowser } from '../components/admin/ChannelBrowser';

const ChannelBrowserPage: React.FC = () => {
    return (
        <Box
            sx={{
                minHeight: '100vh',
                // bgcolor: '#0b0b0f',
                color: '#f5f5f5',
                px: { xs: 2.5, sm: 3.5, md: 5 },
                py: { xs: 4 },
            }}
        >
            <Stack spacing={5} sx={{ maxWidth: 1400, mx: 'auto' }}>
                {/* Header */}
                <Box sx={{ textAlign: 'center' }}>
                    <Typography
                        variant="h3"
                        fontWeight={800}
                        gutterBottom
                        sx={{
                            mb: 1,
                            letterSpacing: 0.2,
                        }}
                    >
                        <YouTubeIcon sx={{ fontSize: 60, color: '#fd3e3eff', pr: 2 }} />
                        Sinhala YouTube Channels
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                        Browse and shortlist channels to feed the audio scraper
                    </Typography>
                </Box>

                {/* Channel Browser Component */}
                <ChannelBrowser />
            </Stack>
        </Box>
    );
};

export default ChannelBrowserPage;
