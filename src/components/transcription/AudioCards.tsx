import {
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Typography,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import RefreshIcon from "@mui/icons-material/Refresh";
import { AudioPlayer } from "../audio/AudioPlayer";

interface AudioCardProps {
    /** Title to display (usually filename) */
    title: string;
    /** Subtitle text (optional) */
    subtitle?: string;
    /** Audio URL to play */
    audioUrl?: string;
    /** Whether audio is still loading */
    loading?: boolean;
    /** Callback for skip/refresh action */
    onSkip?: () => void;
    /** Label for skip button */
    skipLabel?: string;
    /** Whether skip button is disabled */
    skipDisabled?: boolean;
}

/**
 * Reusable audio player card component
 */
export function AudioCard({
    title,
    subtitle,
    audioUrl,
    loading = false,
    onSkip,
    skipLabel = "Skip audio",
    skipDisabled = false,
}: AudioCardProps) {
    return (
        <Card variant="outlined">
            <CardHeader
                title={title}
                subheader={subtitle}
                action={
                    onSkip && (
                        <Button
                            startIcon={<RefreshIcon />}
                            onClick={onSkip}
                            disabled={skipDisabled || loading}
                            size="small"
                        >
                            {skipLabel}
                        </Button>
                    )
                }
            />
            <CardContent>
                <AudioPlayer src={audioUrl} disabled={!audioUrl || loading} />
            </CardContent>
        </Card>
    );
}

interface ReferenceCardProps {
    /** Reference text to display */
    text: string;
    /** Description text */
    description?: string;
    /** Callback when copy button is clicked */
    onCopy: () => void;
    /** Title for the card */
    title?: string;
}

/**
 * Reusable reference text card with copy functionality
 */
export function ReferenceCard({
    text,
    description = "Reference transcription",
    onCopy,
    title = "Reference transcription",
}: ReferenceCardProps) {
    return (
        <Card variant="outlined">
            <CardHeader title={title} />
            <CardContent>
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                >
                    {description}
                </Typography>
                <Typography sx={{ whiteSpace: "pre-wrap", mb: 2 }}>
                    {text}
                </Typography>
                <Button
                    variant="outlined"
                    startIcon={<ContentCopyIcon />}
                    onClick={onCopy}
                >
                    Copy into editor
                </Button>
            </CardContent>
        </Card>
    );
}

interface GuidelinesCardProps {
    /** Whether the card is collapsed */
    collapsed: boolean;
    /** Toggle collapse state */
    onToggle: () => void;
    /** Custom guidelines content */
    children?: React.ReactNode;
}

/**
 * Collapsible guidelines card
 */
export function GuidelinesCard({
    collapsed,
    onToggle,
    children,
}: GuidelinesCardProps) {
    return (
        <Card variant="outlined">
            <CardHeader
                title="Transcription guidelines"
                action={
                    <Button size="small" onClick={onToggle}>
                        {collapsed ? "Show" : "Hide"}
                    </Button>
                }
            />
            {!collapsed && (
                <CardContent>
                    {children || (
                        <Box component="ul" sx={{ pl: 3, m: 0 }}>
                            <li style={{ marginBottom: 8 }}>
                                Transcribe exactly what you hear in Sinhala.
                                Keep English words in English.
                            </li>
                            <li style={{ marginBottom: 8 }}>
                                Enable the Sinhala phonetic keyboard if you do
                                not have a native keyboard. Toggle via the chip
                                or <kbd>Ctrl</kbd> + <kbd>Space</kbd>.
                            </li>
                            <li style={{ marginBottom: 8 }}>
                                Skip fillers that do not add meaning (e.g.,
                                "ම්ම්").
                            </li>
                            <li>
                                Complete the metadata section after transcribing
                                (speaker gender, noise, overlaps, etc.).
                            </li>
                        </Box>
                    )}
                </CardContent>
            )}
        </Card>
    );
}

interface EmptyQueueCardProps {
    /** Title text */
    title?: string;
    /** Description text */
    description?: string;
    /** Action button click handler */
    onRefresh?: () => void;
    /** Refresh button label */
    refreshLabel?: string;
}

/**
 * Empty state card for when there's no data
 */
export function EmptyQueueCard({
    title = "No submissions waiting 🎉",
    description = "All pending transcriptions have been reviewed.",
    onRefresh,
    refreshLabel = "Refresh queue",
}: EmptyQueueCardProps) {
    return (
        <Card variant="outlined">
            <CardContent sx={{ textAlign: "center", py: 4 }}>
                <Typography variant="h6" gutterBottom>
                    {title}
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                    {description}
                </Typography>
                {onRefresh && (
                    <Button onClick={onRefresh} variant="outlined">
                        {refreshLabel}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
