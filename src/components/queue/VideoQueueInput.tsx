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
  Divider,
} from "@mui/material";
import {
  YouTube,
  PlaylistPlay,
  Add,
  Clear,
  UploadFile,
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

  const isValidYoutubeUrl = (url: string) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
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
      setError(err instanceof Error ? err.message : "Failed to load playlist");
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
          setError("Invalid JSON format: Expected an array of videos");
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
        onLoadJson(validVideos);

        // Clear the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to parse JSON file",
        );
      }
    };
    reader.onerror = () => {
      setError("Failed to read file");
    };
    reader.readAsText(file);
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
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Single URL Input */}
      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="https://www.youtube.com/watch?v=..."
          value={singleUrl}
          onChange={(e) => setSingleUrl(e.target.value)}
          onKeyPress={(e) => handleKeyPress(e, handleAddSingleUrl)}
          disabled={disabled}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <YouTube fontSize="small" color="action" />
              </InputAdornment>
            ),
            endAdornment: singleUrl && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSingleUrl("")}>
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
            disabled || !singleUrl.trim() || !isValidYoutubeUrl(singleUrl)
          }
          startIcon={<Add />}
          sx={{ whiteSpace: "nowrap" }}
        >
          Add
        </Button>
      </Box>

      <Divider sx={{ my: 2 }}>
        <Typography variant="caption" color="text.secondary">
          OR
        </Typography>
      </Divider>

      {/* Playlist Import */}
      <Box>
        <Typography
          variant="subtitle2"
          color="text.secondary"
          sx={{ mb: 2, display: "flex", alignItems: "center", gap: 0.5 }}
        >
          <PlaylistPlay fontSize="small" />
          Import from Playlist
        </Typography>
        <TextField
          fullWidth
          size="small"
          placeholder="https://www.youtube.com/playlist?list=..."
          value={playlistUrl}
          onChange={(e) => setPlaylistUrl(e.target.value)}
          onKeyPress={(e) => handleKeyPress(e, handleLoadPlaylist)}
          disabled={disabled || isLoadingPlaylist}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PlaylistPlay fontSize="small" color="action" />
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
              onChange={(e) => setPlaylistLimit(e.target.value)}
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
      </Box>

      <Divider sx={{ my: 2 }}>
        <Typography variant="caption" color="text.secondary">
          OR
        </Typography>
      </Divider>

      {/* JSON Import */}
      <Box>
        <Typography
          variant="subtitle2"
          color="text.secondary"
          sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: 0.5 }}
        >
          <UploadFile fontSize="small" />
          Import from JSON
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          sx={{ mb: 1 }}
        >
          Upload a JSON file with video_link and domain fields
        </Typography>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleJsonUpload}
          disabled={disabled}
          style={{ display: "none" }}
          id="json-upload-input"
        />
        <label htmlFor="json-upload-input">
          <Button
            variant="outlined"
            component="span"
            disabled={disabled}
            startIcon={<UploadFile />}
            fullWidth
          >
            Choose JSON File
          </Button>
        </label>
      </Box>
    </Box>
  );
}
