import { useState } from "react";
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
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { DOMAIN_OPTIONS } from "../../types/queue";
import type { VideoSettings } from "../../types/queue";

interface BatchSettingsProps {
    settings: VideoSettings;
    onSettingsChange: (settings: VideoSettings) => void;
    disabled?: boolean;
}

export function BatchSettings({
    settings,
    onSettingsChange,
    disabled = false,
}: BatchSettingsProps) {
    const [showAdvanced, setShowAdvanced] = useState(false);

    const handleChange = <K extends keyof VideoSettings>(
        key: K,
        value: VideoSettings[K],
    ) => {
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
                bgcolor: "background.paper",
            }}
        >
            {/* <Typography variant="h6" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Settings color="primary" />
                Default Settings
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    (Applied to new videos)
                </Typography>
            </Typography> */}

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {/* Domain Selection */}
                <FormControl
                    size="small"
                    fullWidth
                    disabled={disabled}
                    required
                    error={!settings.domain}
                >
                    <InputLabel>Video Category *</InputLabel>
                    <Select
                        value={settings.domain}
                        label="Video Category *"
                        onChange={(e) => handleChange("domain", e.target.value)}
                    >
                        <MenuItem value="" disabled>
                            Select a category
                        </MenuItem>
                        {DOMAIN_OPTIONS.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {/* VAD Threshold */}
                <Box>
                    <Typography variant="caption" color="text.secondary">
                        VAD Threshold: {settings.vadThreshold.toFixed(2)}
                    </Typography>
                    <Slider
                        value={settings.vadThreshold}
                        onChange={(_, value) =>
                            handleChange("vadThreshold", value as number)
                        }
                        min={0}
                        max={1}
                        step={0.01}
                        disabled={disabled}
                        size="small"
                        marks={[
                            { value: 0, label: "0" },
                            { value: 0.5, label: "0.5" },
                            { value: 1, label: "1" },
                        ]}
                    />
                </Box>

                <Divider sx={{ borderColor: "#ffffff75" }} />

                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        userSelect: "none",
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
                    <Box sx={{ display: "flex", gap: 3 }}>
                        <Box sx={{ flex: 1 }}>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                            >
                                Start Padding: {settings.startPadding}s
                            </Typography>
                            <Slider
                                value={settings.startPadding}
                                onChange={(_, value) =>
                                    handleChange(
                                        "startPadding",
                                        value as number,
                                    )
                                }
                                min={0}
                                max={5}
                                step={0.1}
                                disabled={disabled}
                                size="small"
                            />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                            >
                                End Padding: {settings.endPadding}s
                            </Typography>
                            <Slider
                                value={settings.endPadding}
                                onChange={(_, value) =>
                                    handleChange("endPadding", value as number)
                                }
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
                                onChange={(e) =>
                                    handleChange(
                                        "autoCleanNullTranscriptions",
                                        e.target.checked,
                                    )
                                }
                                disabled={disabled}
                                color="primary"
                            />
                        }
                        label={
                            <Box>
                                <Typography variant="body2">
                                    Auto-clean null transcriptions
                                </Typography>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                >
                                    Automatically remove clips with failed
                                    transcriptions
                                </Typography>
                            </Box>
                        }
                    />
                </Collapse>
            </Box>
        </Paper>
    );
}
