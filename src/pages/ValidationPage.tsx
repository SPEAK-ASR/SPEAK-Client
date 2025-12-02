import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  FormControl,
  FormControlLabel,
  LinearProgress,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import { AudioPlayer } from '../components/audio/AudioPlayer';
import { useSinhalaIme } from '../hooks/useSinhalaIme';
import {
  transcriptionServiceApi,
  type SpeakerGender,
  type ValidationQueueItem,
  type ValidationStats,
} from '../lib/transcriptionServiceApi';
import '../styles/transcription.css';

interface SnackbarState {
  message: string;
  severity: 'success' | 'error' | 'info';
}

const SPEAKER_OPTIONS: SpeakerGender[] = ['male', 'female', 'cannot_recognized'];

export function ValidationPage() {
  const [queueItem, setQueueItem] = useState<ValidationQueueItem | null>(null);
  const [stats, setStats] = useState<ValidationStats | null>(null);
  const [metadata, setMetadata] = useState({
    speakerGender: '' as '' | SpeakerGender,
    hasNoise: false,
    isCodeMixed: false,
    isOverlap: false,
    isAudioSuitable: true,
  });
  const [loadingItem, setLoadingItem] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);
  const [showReference, setShowReference] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const toggleRef = useRef<HTMLInputElement | null>(null);
  const chipRef = useRef<HTMLButtonElement | null>(null);
  const imeDomId = useMemo(() => `ime-${Math.random().toString(36).slice(2, 8)}`, []);
  const textareaId = `${imeDomId}-textarea`;
  const toggleId = `${imeDomId}-toggle`;
  const chipId = `${imeDomId}-chip`;

  useSinhalaIme({ textareaRef, toggleRef, chipRef });

  useEffect(() => {
    loadStats();
    loadNextItem();
  }, []);

  useEffect(() => {
    if (!queueItem || !textareaRef.current) return;
    textareaRef.current.value = queueItem.transcription.transcription;
    setMetadata({
      speakerGender: queueItem.transcription.speaker_gender,
      hasNoise: queueItem.transcription.has_noise,
      isCodeMixed: queueItem.transcription.is_code_mixed,
      isOverlap: queueItem.transcription.is_speaker_overlappings_exist,
      isAudioSuitable: queueItem.transcription.is_audio_suitable !== false,
    });
    setShowReference(false);
  }, [queueItem]);

  async function loadStats() {
    try {
      const nextStats = await transcriptionServiceApi.getValidationStats();
      setStats(nextStats);
    } catch (error) {
      console.error(error);
    }
  }

  async function loadNextItem() {
    setLoadingItem(true);
    try {
      const payload = await transcriptionServiceApi.getNextValidationItem();
      setQueueItem(payload);
    } catch (error: any) {
      if (error?.response?.status === 404) {
        setQueueItem(null);
        setSnackbar({ message: 'No pending transcriptions. Great job!', severity: 'info' });
      } else {
        console.error(error);
        setSnackbar({ message: 'Failed to load next transcription.', severity: 'error' });
      }
    } finally {
      setLoadingItem(false);
    }
  }

  const progressPercent = stats && stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  function cleanupText() {
    if (!textareaRef.current) return;
    const cleaned = textareaRef.current.value
      .replace(/[ \t]+/g, ' ')
      .replace(/[ \t]*\n[ \t]*/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    textareaRef.current.value = cleaned;
    setSnackbar({ message: 'Cleaned up transcription text.', severity: 'info' });
  }

  function validate(): string | null {
    if (!queueItem) return 'No transcription loaded.';
    if (!metadata.speakerGender) return 'Please select speaker gender.';
    const value = textareaRef.current?.value ?? '';
    if (!value.trim()) return 'Transcription cannot be empty.';
    return null;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setSnackbar({ message: validationError, severity: 'error' });
      return;
    }
    if (!queueItem) return;
    try {
      setSubmitting(true);
      await transcriptionServiceApi.submitValidation(queueItem.transcription.trans_id, {
        transcription: (textareaRef.current?.value ?? '').trim(),
        speaker_gender: metadata.speakerGender as SpeakerGender,
        has_noise: metadata.hasNoise,
        is_code_mixed: metadata.isCodeMixed,
        is_speaker_overlappings_exist: metadata.isOverlap,
        is_audio_suitable: metadata.isAudioSuitable,
      });
      setSnackbar({ message: 'Transcription validated. Loading next item...', severity: 'success' });
      await loadStats();
      await loadNextItem();
    } catch (error) {
      console.error(error);
      setSnackbar({ message: 'Failed to validate transcription.', severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box component="section">
      <Stack spacing={3}>
        <Card variant="outlined">
          <CardHeader title="Validation progress" />
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              {stats ? `${stats.completed.toLocaleString()} / ${stats.total.toLocaleString()} validated` : 'Fetching stats...'}
            </Typography>
            <LinearProgress sx={{ my: 2 }} variant="determinate" value={progressPercent} />
            <Typography variant="body2">{progressPercent}% complete</Typography>
          </CardContent>
        </Card>

        {queueItem ? (
          <Card component="form" variant="outlined" onSubmit={handleSubmit}>
            <CardHeader
              title={queueItem.audio.audio_filename}
              subheader={`Created ${new Date(queueItem.transcription.created_at).toLocaleString()}`}
              action={
                <Button startIcon={<SkipNextIcon />} onClick={loadNextItem} disabled={loadingItem || submitting}>
                  Next pending
                </Button>
              }
            />
            <CardContent>
              <AudioPlayer src={queueItem.audio.gcs_signed_url} disabled={loadingItem} />

              <Box className="ime-toggle-container" sx={{ mt: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Sinhala phonetic keyboard available below. Toggle via the chip or <kbd>Ctrl</kbd> + <kbd>Space</kbd>.
                </Typography>
                <label className="toggle-switch">
                  <input type="checkbox" id={toggleId} ref={toggleRef} className="toggle-input" />
                  <span className="toggle-slider">
                    <span className="toggle-text off">Off</span>
                    <span className="toggle-text on">On</span>
                  </span>
                </label>
              </Box>

              <div className="ime-container">
                <textarea
                  id={textareaId}
                  ref={textareaRef}
                  rows={6}
                  style={{
                    width: '100%',
                    resize: 'vertical',
                    padding: '16px',
                    borderRadius: 8,
                    border: '1px solid #cfd8dc',
                    fontSize: '1rem',
                  }}
                />
                <button type="button" id={chipId} ref={chipRef} className="ime-chip">
                  සි | en
                </button>
              </div>

              <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                <Button variant="outlined" size="small" startIcon={<CleaningServicesIcon />} onClick={cleanupText}>
                  Clean text
                </Button>
                {queueItem.audio.google_transcription && (
                  <Button
                    variant="text"
                    size="small"
                    startIcon={<ContentCopyIcon />}
                    onClick={() => {
                      if (textareaRef.current) {
                        textareaRef.current.value = queueItem.audio.google_transcription ?? '';
                        setSnackbar({ message: 'Reference copied. Adjust as needed.', severity: 'info' });
                      }
                    }}
                  >
                    Quick copy reference
                  </Button>
                )}
                {queueItem.audio.google_transcription && (
                  <Button size="small" onClick={() => setShowReference(prev => !prev)}>
                    {showReference ? 'Hide reference' : 'Show reference'}
                  </Button>
                )}
              </Stack>

              {showReference && queueItem.audio.google_transcription && (
                <Box sx={{ mt: 2, p: 2, borderRadius: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Google transcription (guidance only)
                  </Typography>
                  <Typography sx={{ whiteSpace: 'pre-wrap' }}>{queueItem.audio.google_transcription}</Typography>
                </Box>
              )}

              <Stack spacing={2} sx={{ mt: 3 }}>
                <FormControl fullWidth required>
                  <Typography variant="subtitle2" gutterBottom>
                    Speaker gender
                  </Typography>
                  <select
                    value={metadata.speakerGender}
                    onChange={event => setMetadata(prev => ({ ...prev, speakerGender: event.target.value as SpeakerGender }))}
                    style={{ width: '100%', padding: '12px', borderRadius: 8 }}
                  >
                    <option value="">Select gender...</option>
                    {SPEAKER_OPTIONS.map(option => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </FormControl>

                <FormControlLabel
                  control={<Checkbox checked={metadata.hasNoise} onChange={event => setMetadata(prev => ({ ...prev, hasNoise: event.target.checked }))} />}
                  label="Audio contains background noise"
                />
                <FormControlLabel
                  control={<Checkbox checked={metadata.isCodeMixed} onChange={event => setMetadata(prev => ({ ...prev, isCodeMixed: event.target.checked }))} />}
                  label="Audio contains code-mixed content"
                />
                <FormControlLabel
                  control={<Checkbox checked={metadata.isOverlap} onChange={event => setMetadata(prev => ({ ...prev, isOverlap: event.target.checked }))} />}
                  label="Speakers overlap"
                />
                <FormControlLabel
                  control={<Checkbox checked={!metadata.isAudioSuitable} onChange={event => setMetadata(prev => ({ ...prev, isAudioSuitable: !event.target.checked }))} />}
                  label="Audio is not suitable"
                />

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }}>
                  <Button type="submit" variant="contained" endIcon={<SendIcon />} disabled={submitting || loadingItem}>
                    Mark as validated
                  </Button>
                  <Button variant="outlined" onClick={loadNextItem} disabled={loadingItem || submitting} startIcon={<SkipNextIcon />}>
                    Next pending
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ) : (
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6">No submissions waiting 🎉</Typography>
              <Typography color="text.secondary">All pending transcriptions have been reviewed.</Typography>
              <Button sx={{ mt: 2 }} onClick={loadNextItem} variant="outlined">
                Refresh queue
              </Button>
            </CardContent>
          </Card>
        )}
      </Stack>

      {snackbar && (
        <Snackbar open autoHideDuration={4000} onClose={() => setSnackbar(null)}>
          <Alert severity={snackbar.severity} onClose={() => setSnackbar(null)} variant="filled">
            {snackbar.message}
          </Alert>
        </Snackbar>
      )}
    </Box>
  );
}
