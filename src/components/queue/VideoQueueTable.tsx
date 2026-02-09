import { useState } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  Avatar,
  Collapse,
  Slider,
  Switch,
} from "@mui/material";
import {
  Delete,
  Refresh,
  ExpandMore,
  ExpandLess,
  CheckCircle,
  Error as ErrorIcon,
  HourglassEmpty,
  Sync,
  CloudUpload,
  ContentCut,
  Mic,
  CleaningServices,
} from "@mui/icons-material";
import { DOMAIN_OPTIONS, STAGE_LABELS } from "../../types/queue";
import type { QueueVideo, VideoSettings } from "../../types/queue";

interface VideoQueueTableProps {
  videos: QueueVideo[];
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
  onUpdateSettings: (id: string, settings: VideoSettings) => void;
  isProcessing: boolean;
}

// Get status icon
const getStatusIcon = (status: QueueVideo["status"]) => {
  switch (status) {
    case "pending":
      return <HourglassEmpty fontSize="small" />;
    case "splitting":
      return <ContentCut fontSize="small" />;
    case "transcribing":
      return <Mic fontSize="small" />;
    case "cleaning":
      return <CleaningServices fontSize="small" />;
    case "saving":
      return <CloudUpload fontSize="small" />;
    case "complete":
      return <CheckCircle fontSize="small" />;
    case "error":
      return <ErrorIcon fontSize="small" />;
    default:
      return <Sync fontSize="small" />;
  }
};

// Get status color
const getStatusColor = (
  status: QueueVideo["status"],
):
  | "default"
  | "primary"
  | "secondary"
  | "success"
  | "error"
  | "info"
  | "warning" => {
  switch (status) {
    case "pending":
      return "default";
    case "splitting":
    case "transcribing":
    case "cleaning":
    case "saving":
      return "primary";
    case "complete":
      return "success";
    case "error":
      return "error";
    default:
      return "default";
  }
};

// Get progress gradient based on percentage
const getProgressGradient = (progress: number) => {
  if (progress === 100) {
    return "linear-gradient(90deg, #10b981, #34d399)"; // Green for complete
  }
  if (progress >= 75) {
    return "linear-gradient(90deg, #8b5cf6, #a78bfa)"; // Purple for saving
  }
  if (progress >= 50) {
    return "linear-gradient(90deg, #ec4899, #f472b6)"; // Pink for cleaning
  }
  if (progress >= 25) {
    return "linear-gradient(90deg, #6366f1, #818cf8)"; // Indigo for transcribing
  }
  return "linear-gradient(90deg, #3b82f6, #60a5fa)"; // Blue for splitting
};

interface VideoRowProps {
  video: QueueVideo;
  onRemove: () => void;
  onRetry: () => void;
  onUpdateSettings: (settings: VideoSettings) => void;
  isProcessing: boolean;
}

function VideoRow({
  video,
  onRemove,
  onRetry,
  onUpdateSettings,
  isProcessing,
}: VideoRowProps) {
  const [expanded, setExpanded] = useState(false);
  const canEdit = video.status === "pending" && !isProcessing;
  const canRemove =
    video.status === "pending" ||
    video.status === "error" ||
    video.status === "complete";
  const canRetry = video.status === "error";

  const progressWidth = video.status === "error" ? 0 : video.progress;

  return (
    <>
      <TableRow
        sx={{
          position: "relative",
          "&:hover": {
            bgcolor: "action.hover",
          },
          // Remove default border
          "& td": {
            borderBottom: "none",
          },
          // Bottom progress indicator as background so it doesn't affect table layout
          backgroundImage:
            progressWidth > 0 ? getProgressGradient(video.progress) : "none",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "left bottom",
          backgroundSize: `${progressWidth}% 3px`,
        }}
      >
        {/* Thumbnail */}
        <TableCell sx={{ width: 80, py: 1.5 }}>
          <Avatar
            variant="rounded"
            src={video.thumbnail}
            sx={{ width: 64, height: 36, bgcolor: "grey.800" }}
          >
            {video.title?.[0] || "?"}
          </Avatar>
        </TableCell>

        {/* Title */}
        <TableCell sx={{ maxWidth: 200 }}>
          <Tooltip title={video.title || video.url}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {video.title || "Loading..."}
            </Typography>
          </Tooltip>
          {video.error && (
            <Typography
              variant="caption"
              color="error"
              sx={{ display: "block" }}
            >
              {video.error}
            </Typography>
          )}
        </TableCell>

        {/* Domain */}
        <TableCell sx={{ minWidth: 140 }}>
          {canEdit ? (
            <FormControl size="small" fullWidth>
              <Select
                value={video.settings.domain}
                onChange={(e) =>
                  onUpdateSettings({
                    ...video.settings,
                    domain: e.target.value,
                  })
                }
                sx={{ fontSize: "0.75rem" }}
              >
                {DOMAIN_OPTIONS.map((opt) => (
                  <MenuItem
                    key={opt.value}
                    value={opt.value}
                    sx={{ fontSize: "0.75rem" }}
                  >
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <Typography variant="caption" color="text.secondary">
              {
                DOMAIN_OPTIONS.find((d) => d.value === video.settings.domain)
                  ?.label
              }
            </Typography>
          )}
        </TableCell>

        {/* VAD */}
        <TableCell align="center" sx={{ width: 60 }}>
          <Chip
            label={video.settings.vadThreshold.toFixed(2)}
            size="small"
            variant="outlined"
            sx={{ fontSize: "0.7rem" }}
          />
        </TableCell>

        {/* Status */}
        <TableCell sx={{ width: 140 }}>
          <Chip
            icon={getStatusIcon(video.status)}
            label={STAGE_LABELS[video.status]}
            color={getStatusColor(video.status)}
            size="small"
            sx={{
              fontSize: "0.7rem",
              "& .MuiChip-icon": { fontSize: "0.9rem" },
            }}
          />
        </TableCell>

        {/* Clips count */}
        <TableCell align="center" sx={{ width: 80 }}>
          {video.clipCount !== undefined && (
            <Typography variant="caption" color="text.secondary">
              {video.savedCount !== undefined ? `${video.savedCount}/` : ""}
              {video.clipCount} clips
            </Typography>
          )}
        </TableCell>

        {/* Actions */}
        <TableCell align="right" sx={{ width: 100 }}>
          <Box sx={{ display: "flex", gap: 0.5, justifyContent: "flex-end" }}>
            {canEdit && (
              <Tooltip title="More settings">
                <IconButton size="small" onClick={() => setExpanded(!expanded)}>
                  {expanded ? (
                    <ExpandLess fontSize="small" />
                  ) : (
                    <ExpandMore fontSize="small" />
                  )}
                </IconButton>
              </Tooltip>
            )}
            {canRetry && (
              <Tooltip title="Retry">
                <IconButton size="small" color="primary" onClick={onRetry}>
                  <Refresh fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {canRemove && (
              <Tooltip title="Remove">
                <IconButton size="small" color="error" onClick={onRemove}>
                  <Delete fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </TableCell>
      </TableRow>

      {/* Expanded settings row */}
      <TableRow>
        <TableCell colSpan={7} sx={{ py: 0, borderBottom: "none" }}>
          <Collapse in={expanded && canEdit} timeout="auto" unmountOnExit>
            <Box
              sx={{
                py: 2,
                px: 1,
                display: "flex",
                gap: 4,
                alignItems: "center",
              }}
            >
              {/* VAD Threshold Slider */}
              <Box sx={{ minWidth: 200 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: "0.7rem" }}
                >
                  VAD Threshold: {video.settings.vadThreshold.toFixed(2)}
                </Typography>
                <Slider
                  value={video.settings.vadThreshold}
                  onChange={(_, value) =>
                    onUpdateSettings({
                      ...video.settings,
                      vadThreshold: value as number,
                    })
                  }
                  min={0}
                  max={1}
                  step={0.01}
                  size="small"
                  marks={[
                    { value: 0, label: "0" },
                    { value: 0.5, label: "0.5" },
                    { value: 1, label: "1" },
                  ]}
                />
              </Box>

              {/* Start Padding */}
              <Box sx={{ width: 150 }}>
                <Typography variant="caption" color="text.secondary">
                  Start: {video.settings.startPadding}s
                </Typography>
                <Slider
                  value={video.settings.startPadding}
                  onChange={(_, v) =>
                    onUpdateSettings({
                      ...video.settings,
                      startPadding: v as number,
                    })
                  }
                  min={0}
                  max={5}
                  step={0.1}
                  size="small"
                />
              </Box>

              {/* End Padding */}
              <Box sx={{ width: 150 }}>
                <Typography variant="caption" color="text.secondary">
                  End: {video.settings.endPadding}s
                </Typography>
                <Slider
                  value={video.settings.endPadding}
                  onChange={(_, v) =>
                    onUpdateSettings({
                      ...video.settings,
                      endPadding: v as number,
                    })
                  }
                  min={0}
                  max={5}
                  step={0.1}
                  size="small"
                />
              </Box>

              {/* Auto cleanup */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Switch
                  size="small"
                  checked={video.settings.autoCleanNullTranscriptions}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...video.settings,
                      autoCleanNullTranscriptions: e.target.checked,
                    })
                  }
                />
                <Typography variant="caption" color="text.secondary">
                  Auto-clean
                </Typography>
              </Box>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export function VideoQueueTable({
  videos,
  onRemove,
  onRetry,
  onUpdateSettings,
  isProcessing,
}: VideoQueueTableProps) {
  if (videos.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 4,
          textAlign: "center",
          bgcolor: "background.paper",
          borderRadius: 2,
          border: "2px dashed",
          borderColor: "divider",
        }}
      >
        <Typography color="text.secondary">
          No videos in queue. Add videos above to start processing.
        </Typography>
      </Paper>
    );
  }

  return (
    <TableContainer
      component={Paper}
      elevation={2}
      sx={{
        borderRadius: 2,
        maxHeight: 440,
        overflow: "auto",

        "&::-webkit-scrollbar": {
          display: "none",
        },
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow sx={{ bgcolor: "action.hover" }}>
            <TableCell sx={{ fontWeight: 600, width: 80 }}>Video</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
            <TableCell sx={{ fontWeight: 600, textAlign: "center" }}>
              VAD
            </TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 600, textAlign: "center" }}>
              Clips
            </TableCell>
            <TableCell sx={{ fontWeight: 600, textAlign: "right" }}>
              Actions
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {videos.map((video) => (
            <VideoRow
              key={video.id}
              video={video}
              onRemove={() => onRemove(video.id)}
              onRetry={() => onRetry(video.id)}
              onUpdateSettings={(settings) =>
                onUpdateSettings(video.id, settings)
              }
              isProcessing={isProcessing}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
