import { useState, useRef } from "react";
import {
    Box,
    TextField,
    Button,
    Typography,
    InputAdornment,
    IconButton,
    Tooltip,
    CircularProgress,
    Alert,
    Accordion,
    AccordionSummary,
    AccordionDetails,
} from "@mui/material";
import {
    YouTube,
    PlaylistPlay,
    Add,
    Clear,
    UploadFile,
    ExpandMore,
} from "@mui/icons-material";

interface VideoQueueInputProps {
    onAddUrl: (url: string) => void;
    onLoadPlaylist: (playlistUrl: string, limit?: number) => Promise<void>;
    onLoadJson: (videos: Array<{ video_link: string; domain: string }>) => void;
    isLoadingPlaylist: boolean;
    disabled?: boolean;
}

export function VideoQueueInput({
    onAddUrl,
    onLoadPlaylist,
    onLoadJson,
    isLoadingPlaylist,
    disabled = false,
}: VideoQueueInputProps) {
    const [singleUrl, setSingleUrl] = useState("");
    const [playlistUrl, setPlaylistUrl] = useState("");
    const [playlistLimit, setPlaylistLimit] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadedJsonData, setUploadedJsonData] = useState<Array<{
        video_link: string;
        domain: string;
    }> | null>(null);
    const [uploadedFileName, setUploadedFileName] = useState<string | null>(
        null,
    );
    const [jsonLimit, setJsonLimit] = useState<string>("");
    const [expandedPanel, setExpandedPanel] = useState<string | false>(
        "playlist",
    );

    const isValidYoutubeUrl = (url: string) => {
        const youtubeRegex =
            /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
        return youtubeRegex.test(url);
    };

    const isValidPlaylistUrl = (url: string) => {
        const playlistRegex =
            /^(https?:\/\/)?(www\.)?youtube\.com\/(playlist\?list=|watch\?.*list=)/;
        return playlistRegex.test(url);
    };

    const handleAddSingleUrl = () => {
        if (!singleUrl.trim()) return;
        if (!isValidYoutubeUrl(singleUrl)) {
            setError("Please enter a valid YouTube URL");
            return;
        }
        setError(null);
        onAddUrl(singleUrl.trim());
        setSingleUrl("");
    };

    const handleLoadPlaylist = async () => {
        if (!playlistUrl.trim()) return;
        if (!isValidPlaylistUrl(playlistUrl)) {
            setError("Please enter a valid YouTube playlist URL");
            return;
        }
        setError(null);
        const limit = playlistLimit ? parseInt(playlistLimit, 10) : undefined;
        try {
            await onLoadPlaylist(playlistUrl.trim(), limit);
            setPlaylistUrl("");
            setPlaylistLimit("");
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to load playlist",
            );
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
        if (e.key === "Enter") {
            e.preventDefault();
            action();
        }
    };

    const handleJsonUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const jsonContent = JSON.parse(e.target?.result as string);
                if (!Array.isArray(jsonContent)) {
                    setError(
                        "Invalid JSON format: Expected an array of videos",
                    );
                    return;
                }

                const validVideos = jsonContent.filter((item) => {
                    return (
                        item.video_link &&
                        typeof item.video_link === "string" &&
                        item.domain &&
                        typeof item.domain === "string"
                    );
                });

                if (validVideos.length === 0) {
                    setError(
                        "No valid videos found in JSON. Each entry needs video_link and domain.",
                    );
                    return;
                }

                setError(null);
                setUploadedJsonData(validVideos);
                setUploadedFileName(file.name);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Failed to parse JSON file",
                );
            }
        };
        reader.onerror = () => {
            setError("Failed to read file");
        };
        reader.readAsText(file);
    };

    const handleLoadJson = () => {
        if (!uploadedJsonData) return;

        const limit = jsonLimit ? parseInt(jsonLimit, 10) : undefined;
        const videosToLoad = limit
            ? uploadedJsonData.slice(0, limit)
            : uploadedJsonData;

        onLoadJson(videosToLoad);

        // Clear the state
        setUploadedJsonData(null);
        setUploadedFileName(null);
        setJsonLimit("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleClearJson = () => {
        setUploadedJsonData(null);
        setUploadedFileName(null);
        setJsonLimit("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handlePanelChange =
        (panel: string) =>
        (_event: React.SyntheticEvent, isExpanded: boolean) => {
            setExpandedPanel(isExpanded ? panel : false);
        };

    return (
        <Box
            sx={{
                bgcolor: "background.paper",
                borderRadius: 2,
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
                p: 2.5,
                boxShadow: 2,
            }}
        >
            <Typography
                variant="h6"
                fontWeight={600}
                sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
            >
                <YouTube sx={{ color: "#FF0000" }} />
                Add Videos to Queue
            </Typography>

            {error && (
                <Alert
                    severity="error"
                    sx={{ mb: 2 }}
                    onClose={() => setError(null)}
                >
                    {error}
                </Alert>
            )}

            {/* Single URL Accordion */}
            <Accordion
                expanded={expandedPanel === "single"}
                onChange={handlePanelChange("single")}
                disableGutters
                elevation={0}
                sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    "&:before": { display: "none" },
                    borderRadius: 1,
                    mb: 1,
                }}
            >
                <AccordionSummary
                    expandIcon={<ExpandMore />}
                    sx={{
                        minHeight: 48,
                        "&.Mui-expanded": { minHeight: 48 },
                        "& .MuiAccordionSummary-content": {
                            margin: "8px 0",
                            "&.Mui-expanded": { margin: "8px 0" },
                        },
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <YouTube fontSize="small" color="primary" />
                        <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 500 }}
                        >
                            Add Single Video
                        </Typography>
                    </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0, pb: 2 }}>
                    <Box sx={{ display: "flex", gap: 1 }}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="https://www.youtube.com/watch?v=..."
                            value={singleUrl}
                            onChange={(e) => setSingleUrl(e.target.value)}
                            onKeyPress={(e) =>
                                handleKeyPress(e, handleAddSingleUrl)
                            }
                            disabled={disabled}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <YouTube
                                            fontSize="small"
                                            color="action"
                                        />
                                    </InputAdornment>
                                ),
                                endAdornment: singleUrl && (
                                    <InputAdornment position="end">
                                        <IconButton
                                            size="small"
                                            onClick={() => setSingleUrl("")}
                                        >
                                            <Clear fontSize="small" />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <Button
                            variant="contained"
                            onClick={handleAddSingleUrl}
                            disabled={
                                disabled ||
                                !singleUrl.trim() ||
                                !isValidYoutubeUrl(singleUrl)
                            }
                            startIcon={<Add />}
                            sx={{ whiteSpace: "nowrap" }}
                        >
                            Add
                        </Button>
                    </Box>
                </AccordionDetails>
            </Accordion>

            {/* Playlist Import Accordion */}
            <Accordion
                expanded={expandedPanel === "playlist"}
                onChange={handlePanelChange("playlist")}
                disableGutters
                elevation={0}
                sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    "&:before": { display: "none" },
                    borderRadius: 1,
                    mb: 1,
                }}
            >
                <AccordionSummary
                    expandIcon={<ExpandMore />}
                    sx={{
                        minHeight: 48,
                        "&.Mui-expanded": { minHeight: 48 },
                        "& .MuiAccordionSummary-content": {
                            margin: "8px 0",
                            "&.Mui-expanded": { margin: "8px 0" },
                        },
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <PlaylistPlay fontSize="small" color="primary" />
                        <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 500 }}
                        >
                            Import from Playlist
                        </Typography>
                    </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0, pb: 2 }}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="https://www.youtube.com/playlist?list=..."
                        value={playlistUrl}
                        onChange={(e) => setPlaylistUrl(e.target.value)}
                        onKeyPress={(e) =>
                            handleKeyPress(e, handleLoadPlaylist)
                        }
                        disabled={disabled || isLoadingPlaylist}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <PlaylistPlay
                                        fontSize="small"
                                        color="action"
                                    />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <Box
                        sx={{
                            display: "flex",
                            gap: 1,
                            mt: 1,
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <Tooltip title="Max videos to load (optional)">
                            <TextField
                                size="small"
                                type="number"
                                placeholder="Limit"
                                value={playlistLimit}
                                onChange={(e) =>
                                    setPlaylistLimit(e.target.value)
                                }
                                disabled={disabled || isLoadingPlaylist}
                                sx={{ width: 90 }}
                                inputProps={{ min: 1, max: 500 }}
                            />
                        </Tooltip>
                        <Button
                            variant="outlined"
                            onClick={handleLoadPlaylist}
                            disabled={
                                disabled ||
                                isLoadingPlaylist ||
                                !playlistUrl.trim() ||
                                !isValidPlaylistUrl(playlistUrl)
                            }
                            startIcon={
                                isLoadingPlaylist ? (
                                    <CircularProgress size={16} />
                                ) : (
                                    <PlaylistPlay />
                                )
                            }
                            sx={{ whiteSpace: "nowrap" }}
                        >
                            {isLoadingPlaylist ? "Loading..." : "Load"}
                        </Button>
                    </Box>
                </AccordionDetails>
            </Accordion>

            {/* JSON Import Accordion */}
            <Accordion
                expanded={expandedPanel === "json"}
                onChange={handlePanelChange("json")}
                disableGutters
                elevation={0}
                sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    "&:before": { display: "none" },
                    borderRadius: 1,
                }}
            >
                <AccordionSummary
                    expandIcon={<ExpandMore />}
                    sx={{
                        minHeight: 48,
                        "&.Mui-expanded": { minHeight: 48 },
                        "& .MuiAccordionSummary-content": {
                            margin: "8px 0",
                            "&.Mui-expanded": { margin: "8px 0" },
                        },
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <UploadFile fontSize="small" color="primary" />
                        <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 500 }}
                        >
                            Import from JSON
                        </Typography>
                    </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0, pb: 2 }}>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleJsonUpload}
                        disabled={disabled || !!uploadedJsonData}
                        style={{ display: "none" }}
                        id="json-upload-input"
                    />
                    <label htmlFor="json-upload-input">
                        <Button
                            variant="outlined"
                            component="span"
                            disabled={disabled || !!uploadedJsonData}
                            startIcon={<UploadFile />}
                            fullWidth
                        >
                            Choose JSON File
                        </Button>
                    </label>

                    {uploadedFileName && uploadedJsonData && (
                        <Box sx={{ mt: 1.5 }}>
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    p: 1,
                                    bgcolor: "action.hover",
                                    borderRadius: 1,
                                    mb: 1,
                                }}
                            >
                                <Typography variant="body2" sx={{ flex: 1 }}>
                                    📄 {uploadedFileName} (
                                    {uploadedJsonData.length} videos)
                                </Typography>
                                <IconButton
                                    size="small"
                                    onClick={handleClearJson}
                                    disabled={disabled}
                                >
                                    <Clear fontSize="small" />
                                </IconButton>
                            </Box>
                            <Box
                                sx={{
                                    display: "flex",
                                    gap: 1,
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                }}
                            >
                                <Tooltip title="Max videos to load (optional)">
                                    <TextField
                                        size="small"
                                        type="number"
                                        placeholder="Limit"
                                        value={jsonLimit}
                                        onChange={(e) =>
                                            setJsonLimit(e.target.value)
                                        }
                                        disabled={disabled}
                                        sx={{ width: 90 }}
                                        inputProps={{
                                            min: 1,
                                            max: uploadedJsonData.length,
                                        }}
                                    />
                                </Tooltip>
                                <Button
                                    variant="outlined"
                                    onClick={handleLoadJson}
                                    disabled={disabled}
                                    startIcon={<UploadFile />}
                                    sx={{ whiteSpace: "nowrap" }}
                                >
                                    Load
                                </Button>
                            </Box>
                        </Box>
                    )}
                </AccordionDetails>
            </Accordion>
        </Box>
    );
}
