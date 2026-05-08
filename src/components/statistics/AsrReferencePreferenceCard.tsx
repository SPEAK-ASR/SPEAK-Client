import { Typography, Box, LinearProgress } from "@mui/material";
import type { AsrReferencePreferenceStats } from "../../lib/statisticsApi";

interface AsrReferencePreferenceCardProps {
    data: AsrReferencePreferenceStats;
}

/**
 * Shows how often transcribers copied text that matched Google STT vs SPEAK ASR
 * (when references differed). Neutral = manual entry or identical machine refs.
 */
export function AsrReferencePreferenceCard({
    data,
}: AsrReferencePreferenceCardProps) {
    const decisive = data.decisive_total;
    const googleRatio = decisive > 0 ? (data.google_chosen / decisive) * 100 : 0;
    const speakRatio = decisive > 0 ? (data.speak_chosen / decisive) * 100 : 0;

    return (
        <Box
            sx={{
                background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
                color: "white",
                borderRadius: 1,
                boxShadow: 2,
            }}
        >
            <Box sx={{ p: 2 }}>
                <Typography
                    variant="h6"
                    gutterBottom
                    fontWeight="bold"
                    color="white"
                    sx={{ mb: 0.5 }}
                >
                    ASR reference preference
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, color: "#b0bec5" }}>
                    Human copy preference when Google Speech-to-Text and SPEAK
                    Sinhala ASR references differ. Neutral includes typed
                    transcriptions, identical references, or no copy-based
                    scoring.
                </Typography>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <Box>
                        <Typography variant="caption" color="#b0bec5">
                            Google Speech-to-Text (copied)
                        </Typography>
                        <Typography variant="h5" fontWeight="bold">
                            {data.google_chosen.toLocaleString()}
                            {decisive > 0 && (
                                <Typography
                                    component="span"
                                    variant="body2"
                                    sx={{ ml: 1, color: "#b0bec5" }}
                                >
                                    ({googleRatio.toFixed(1)}% of decisive)
                                </Typography>
                            )}
                        </Typography>
                        <LinearProgress
                            variant="determinate"
                            value={googleRatio}
                            sx={{
                                mt: 0.5,
                                height: 8,
                                borderRadius: 1,
                                backgroundColor: "rgba(255,255,255,0.12)",
                                "& .MuiLinearProgress-bar": {
                                    backgroundColor: "#42a5f5",
                                },
                            }}
                        />
                    </Box>

                    <Box>
                        <Typography variant="caption" color="#b0bec5">
                            SPEAK Sinhala ASR (copied)
                        </Typography>
                        <Typography variant="h5" fontWeight="bold">
                            {data.speak_chosen.toLocaleString()}
                            {decisive > 0 && (
                                <Typography
                                    component="span"
                                    variant="body2"
                                    sx={{ ml: 1, color: "#b0bec5" }}
                                >
                                    ({speakRatio.toFixed(1)}% of decisive)
                                </Typography>
                            )}
                        </Typography>
                        <LinearProgress
                            variant="determinate"
                            value={speakRatio}
                            sx={{
                                mt: 0.5,
                                height: 8,
                                borderRadius: 1,
                                backgroundColor: "rgba(255,255,255,0.12)",
                                "& .MuiLinearProgress-bar": {
                                    backgroundColor: "#66bb6a",
                                },
                            }}
                        />
                    </Box>

                    <Box
                        sx={{
                            p: 1.5,
                            borderRadius: 2,
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.12)",
                        }}
                    >
                        <Typography variant="caption" color="#b0bec5">
                            Neutral (no decisive copy preference)
                        </Typography>
                        <Typography variant="h6" fontWeight="bold">
                            {data.neutral.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="#90a4ae">
                            Decisive copy choices:{" "}
                            {decisive.toLocaleString()}
                            {data.google_share_percent != null &&
                                decisive > 0 && (
                                    <>
                                        {" "}
                                        — Google share{" "}
                                        {data.google_share_percent.toFixed(1)}%
                                    </>
                                )}
                        </Typography>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
