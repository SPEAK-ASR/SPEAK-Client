import React from 'react';
import { Box, Typography, Stack } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { ChannelBrowser } from '../components/admin/ChannelBrowser';

const ChannelBrowserPage: React.FC = () => {
    return (
        <Box sx={{ maxWidth: 1200, mx: 'auto', py: 4 }}>
            <Stack spacing={4}>
                {/* Header */}
                <Box sx={{ textAlign: 'center' }}>
                    <Typography
                        variant="h3"
                        fontWeight="bold"
                        sx={{
                            mb: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 1,
                        }}
                    >
                        <SearchIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                        Channels
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Browse and manage YouTube channels for Audio Scraping
                    </Typography>
                </Box>

                {/* Channel Browser Component */}
                <ChannelBrowser />
            </Stack>
        </Box>
    );
};

export default ChannelBrowserPage;
