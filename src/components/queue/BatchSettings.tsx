import { useState } from 'react';
import {
    Box,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Slider,
    Switch,
    FormControlLabel,
    Paper,
    Collapse,
    Divider,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { DOMAIN_OPTIONS } from '../../types/queue';
import type { VideoSettings } from '../../types/queue';

interface BatchSettingsProps {
    settings: VideoSettings;
    onSettingsChange: (settings: VideoSettings) => void;
    disabled?: boolean;
}

export function BatchSettings({ settings, onSettingsChange, disabled = false }: BatchSettingsProps) {
    const [showAdvanced, setShowAdvanced] = useState(false);

    const handleChange = <K extends keyof VideoSettings>(key: K, value: VideoSettings[K]) => {
        onSettingsChange({ ...settings, [key]: value });
    };

    return (
        <Paper
            elevation={2}
            sx={{
                p: 2.5,
                pt: 3,
                borderRadius: 2,
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
                bgcolor: 'background.paper',
            }}
        >
            {/* <Typography variant="h6" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Settings color="primary" />
                Default Settings
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    (Applied to new videos)
                </Typography>
            </Typography> */}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Domain Selection */}
                <FormControl size="small" fullWidth disabled={disabled}>
                    <InputLabel>Video Category</InputLabel>
                    <Select
                        value={settings.domain}
                        label="Video Category"
                        onChange={(e) => handleChange('domain', e.target.value)}
                    >
                        {DOMAIN_OPTIONS.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {/* VAD Level */}
                <FormControl size="small" disabled={disabled}>
                    <InputLabel>VAD Level</InputLabel>
                    <Select
                        value={settings.vadAggressiveness}
                        label="VAD Level"
                        onChange={(e) => handleChange('vadAggressiveness', Number(e.target.value))}
                    >
                        <MenuItem value={0}>0 - Least Aggressive</MenuItem>
                        <MenuItem value={1}>1 - Low</MenuItem>
                        <MenuItem value={2}>2 - Moderate</MenuItem>
                        <MenuItem value={3}>3 - Most Aggressive</MenuItem>
                    </Select>
                </FormControl>

                <Divider sx={{ borderColor: '#ffffff75' }} />

                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        userSelect: 'none',
                    }}
                    onClick={() => setShowAdvanced((v) => !v)}
                >
                    <Typography variant="body2" fontWeight={500}>
                        Additional settings
                    </Typography>

                    {showAdvanced ? (
                        <ExpandLessIcon fontSize="small" />
                    ) : (
                        <ExpandMoreIcon fontSize="small" />
                    )}
                </Box>

                {/* Padding Sliders */}
                <Collapse in={showAdvanced} timeout="auto" unmountOnExit>
                    <Box sx={{ display: 'flex', gap: 3 }}>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                                Start Padding: {settings.startPadding}s
                            </Typography>
                            <Slider
                                value={settings.startPadding}
                                onChange={(_, value) => handleChange('startPadding', value as number)}
                                min={0}
                                max={5}
                                step={0.1}
                                disabled={disabled}
                                size="small"
                            />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                                End Padding: {settings.endPadding}s
                            </Typography>
                            <Slider
                                value={settings.endPadding}
                                onChange={(_, value) => handleChange('endPadding', value as number)}
                                min={0}
                                max={5}
                                step={0.1}
                                disabled={disabled}
                                size="small"
                            />
                        </Box>
                    </Box>

                    {/* Auto Cleanup Toggle */}
                    <FormControlLabel
                        control={
                            <Switch
                                checked={settings.autoCleanNullTranscriptions}
                                onChange={(e) => handleChange('autoCleanNullTranscriptions', e.target.checked)}
                                disabled={disabled}
                                color="primary"
                            />
                        }
                        label={
                            <Box>
                                <Typography variant="body2">Auto-clean null transcriptions</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Automatically remove clips with failed transcriptions
                                </Typography>
                            </Box>
                        }
                    />
                </Collapse>
            </Box>
        </Paper>
    );
}
