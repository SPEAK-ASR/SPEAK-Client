import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RefreshIcon from '@mui/icons-material/Refresh';
import SendIcon from '@mui/icons-material/Send';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { AudioPlayer } from '../components/audio/AudioPlayer';
import { useSinhalaIme } from '../hooks/useSinhalaIme';
import { useAdmin } from '../context/AdminContext';
import {
  transcriptionServiceApi,
  type AudioTask,
  type SpeakerGender,
  type TranscriptionSubmissionPayload,
} from '../lib/transcriptionServiceApi';
import '../styles/transcription.css';

interface SnackbarState {
  message: string;
  severity: 'success' | 'error' | 'info';
}

const SPEAKER_OPTIONS: SpeakerGender[] = ['male', 'female', 'cannot_recognized'];

const DEFAULT_METADATA = {
  speakerGender: '' as '' | SpeakerGender,
  hasNoise: false,
  isCodeMixed: false,
  isOverlap: false,
};

const GUIDELINES_KEY = 'transcriptionGuidelinesClosed';

export function TranscriptionPage() {
  const [audioTask, setAudioTask] = useState<AudioTask | null>(null);
  const [metadata, setMetadata] = useState(DEFAULT_METADATA);
  const [loadingAudio, setLoadingAudio] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);
  const [unsuitableDialog, setUnsuitableDialog] = useState(false);
  const [guidelinesCollapsed, setGuidelinesCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(GUIDELINES_KEY) === '1';
  });
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const toggleRef = useRef<HTMLInputElement | null>(null);
  const chipRef = useRef<HTMLButtonElement | null>(null);
  const imeDomId = useMemo(() => `ime-${Math.random().toString(36).slice(2, 8)}`, []);
  const textareaId = `${imeDomId}-textarea`;
  const toggleId = `${imeDomId}-toggle`;
  const chipId = `${imeDomId}-chip`;
  const { admin, isAdmin } = useAdmin();

  useSinhalaIme({ textareaRef, toggleRef, chipRef });

  useEffect(() => {
    loadNextAudio();
  }, []);

  const toggleGuidelines = () => {
    setGuidelinesCollapsed(prev => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(GUIDELINES_KEY, next ? '1' : '0');
      }
      return next;
    });
  };

  async function loadNextAudio() {
    setLoadingAudio(true);
    setSubmitting(false);
    setMetadata(DEFAULT_METADATA);
    if (textareaRef.current) {
      textareaRef.current.value = '';
    }
    try {
      const data = await transcriptionServiceApi.fetchRandomAudio();
      setAudioTask(data);
    } catch (error) {
      console.error(error);
      setSnackbar({ message: 'Failed to load audio. Please try again.', severity: 'error' });
    } finally {
      setLoadingAudio(false);
    }
  }

  function updateMetadata(key: keyof typeof metadata, value: boolean | string) {
    setMetadata(prev => ({ ...prev, [key]: value }));
  }

  function validateBeforeSubmit(value: string): string | null {
    if (!audioTask) return 'No audio selected yet.';
    if (!metadata.speakerGender) return 'Please select the speaker gender.';
    if (!value.trim()) return 'Transcription cannot be empty.';
    if (value.trim().length < 3) return 'Transcription looks too short. Please double-check.';
    return null;
  }

  async function submitTranscription(payload: TranscriptionSubmissionPayload, successMessage: string) {
    try {
      setSubmitting(true);
      await transcriptionServiceApi.submitTranscription(payload);
      setSnackbar({ message: successMessage, severity: 'success' });
      await loadNextAudio();
    } catch (error) {
      console.error(error);
      setSnackbar({ message: 'Failed to submit transcription.', severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const currentValue = textareaRef.current?.value ?? '';
    const validationError = validateBeforeSubmit(currentValue);
    if (validationError) {
      setSnackbar({ message: validationError, severity: 'error' });
      return;
    }

    if (!audioTask) return;

    const payload: TranscriptionSubmissionPayload = {
      audio_id: audioTask.audio_id,
      transcription: currentValue.trim(),
      speaker_gender: metadata.speakerGender as SpeakerGender,
      has_noise: metadata.hasNoise,
      is_code_mixed: metadata.isCodeMixed,
      is_speaker_overlappings_exist: metadata.isOverlap,
      is_audio_suitable: true,
      admin: admin ?? undefined,
    };

    await submitTranscription(payload, 'Transcription submitted successfully. Loading next audio...');
  }

  async function handleUnsuitableConfirm() {
    if (!audioTask) return;
    setUnsuitableDialog(false);
    if (textareaRef.current) {
      textareaRef.current.value = 'Audio not suitable for transcription';
    }
    const payload: TranscriptionSubmissionPayload = {
      audio_id: audioTask.audio_id,
      transcription: 'Audio not suitable for transcription',
      speaker_gender: 'cannot_recognized',
      has_noise: false,
      is_code_mixed: false,
      is_speaker_overlappings_exist: false,
      is_audio_suitable: false,
      admin: admin ?? undefined,
    };
    await submitTranscription(payload, 'Audio marked as unsuitable. Loading next audio...');
  }

  const referenceText = useMemo(() => audioTask?.google_transcription?.trim(), [audioTask]);

  return (
    <Box component="section">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Transcription
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Type exactly what you hear
        </Typography>
      </Box>
      <Box component="form" onSubmit={handleSubmit}>
        <Box
          sx={{
            display: 'grid',
            gap: 3,
            gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 1fr)' },
            alignItems: 'flex-start',
          }}
        >
          <Stack spacing={3}>
            {!isAdmin && (
              <Card variant="outlined">
                <CardHeader
                  title="Transcription guidelines"
                  action={
                    <Button size="small" onClick={toggleGuidelines}>
                      {guidelinesCollapsed ? 'Show' : 'Hide'}
                    </Button>
                  }
                />
                {!guidelinesCollapsed && (
                  <CardContent>
                    <Stack component="ul" spacing={1.5} sx={{ pl: 3 }}>
                      <li>Transcribe exactly what you hear in Sinhala. Keep English words in English.</li>
                      <li>Enable the Sinhala phonetic keyboard if you do not have a native keyboard. Toggle via the chip or <kbd>Ctrl</kbd> + <kbd>Space</kbd>.</li>
                      <li>Skip fillers that do not add meaning (e.g., “ම්ම්”).</li>
                      <li>Complete the metadata section after transcribing (speaker gender, noise, overlaps, etc.).</li>
                    </Stack>
                  </CardContent>
                )}
              </Card>
            )}

            <Card variant="outlined">
              <CardHeader
                title={audioTask ? audioTask.audio_filename : 'Fetching audio...'}
                subheader={audioTask ? `${audioTask.transcription_count} transcriptions collected` : undefined}
                action={
                  <Button startIcon={<RefreshIcon />} onClick={loadNextAudio} disabled={loadingAudio || submitting}>
                    Skip audio
                  </Button>
                }
              />
              <CardContent>
                <AudioPlayer src={audioTask?.gcs_signed_url} disabled={!audioTask || loadingAudio} />
              </CardContent>
            </Card>

            {isAdmin && referenceText && (
              <Card variant="outlined">
                <CardHeader title="Reference transcription" />
                <CardContent>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Double-check output before copying. Reference Only
                  </Typography>
                  <Typography sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>{referenceText}</Typography>
                  <Button
                    variant="outlined"
                    startIcon={<ContentCopyIcon />}
                    onClick={() => {
                      if (!textareaRef.current) return;
                      textareaRef.current.value = referenceText;
                      setSnackbar({ message: 'Reference copied to editor. Please review before submitting.', severity: 'info' });
                    }}
                  >
                    Copy into editor
                  </Button>
                </CardContent>
              </Card>
            )}
          </Stack>

          <Card variant="outlined">
            <CardContent>
              <Box className="ime-toggle-container">
                <Typography variant="body2" color="text.secondary" className="ime-toggle-text" component="p">
                  No Sinhala keyboard? Enable the built-in Sinhala phonetic keyboard below. Read the{' '}
                  <a href="https://facts.helakuru.lk/sinhala-typing/phonetic" target="_blank" rel="noreferrer" style={{ color: '#6464f9ff', textDecoration: 'underline' }}>
                    typing guide
                  </a>
                  .
                </Typography>
                <label className="toggle-switch">
                  <input type="checkbox" id={toggleId} ref={toggleRef} className="toggle-input" defaultChecked />
                  <span className="toggle-slider">
                    <span className="toggle-text off">EN</span>
                    <span className="toggle-text on">සි</span>
                  </span>
                </label>
              </Box>
              <div className="ime-container">
                <textarea
                  id={textareaId}
                  ref={textareaRef}
                  placeholder="Type what you hear..."
                  rows={5}
                  style={{
                    width: '100%',
                    resize: 'vertical',
                    padding: '12px',
                    borderRadius: 8,
                    border: '1px solid #cfd8dc',
                    fontSize: '0.95rem',
                    fontFamily: 'inherit',
                  }}
                />
                <button type="button" id={chipId} ref={chipRef} className="ime-chip">
                  සි | en
                </button>
              </div>

              <Stack spacing={1.5} sx={{ mt: 2 }}>
                <FormControl fullWidth required size="small">
                  <InputLabel id="speaker-select">Speaker gender</InputLabel>
                  <Select
                    labelId="speaker-select"
                    value={metadata.speakerGender}
                    label="Speaker gender"
                    size="small"
                    onChange={event => updateMetadata('speakerGender', event.target.value)}
                  >
                    <MenuItem value="">
                      <em>Select gender...</em>
                    </MenuItem>
                    {SPEAKER_OPTIONS.map(option => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControlLabel
                  control={<Checkbox size="small" checked={metadata.hasNoise} onChange={event => updateMetadata('hasNoise', event.target.checked)} />}
                  label="Audio contains background noise"
                  sx={{ '.MuiTypography-root': { fontSize: '0.9rem' } }}
                />
                <FormControlLabel
                  control={<Checkbox size="small" checked={metadata.isCodeMixed} onChange={event => updateMetadata('isCodeMixed', event.target.checked)} />}
                  label="Audio contains code-mixed content"
                  sx={{ '.MuiTypography-root': { fontSize: '0.9rem' } }}
                />
                <FormControlLabel
                  control={<Checkbox size="small" checked={metadata.isOverlap} onChange={event => updateMetadata('isOverlap', event.target.checked)} />}
                  label="Multiple speakers overlapping"
                  sx={{ '.MuiTypography-root': { fontSize: '0.9rem' } }}
                />
              </Stack>
            </CardContent>
          </Card>
        </Box>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="center" alignItems="center" sx={{ mt: 3 }}>
          <Button
            variant="outlined"
            onClick={() => setUnsuitableDialog(true)}
            disabled={submitting || loadingAudio || !audioTask}
            sx={{
              minWidth: 200,
              borderColor: 'error.main',
              color: 'error.main',
              backgroundColor: 'transparent',
              '&:hover': {
                borderColor: 'error.dark',
                backgroundColor: 'rgba(211, 47, 47, 0.04)',
              },
            }}
          >
            This audio is not suitable for transcription
          </Button>
          <Button type="submit" variant="contained" endIcon={<SendIcon />} disabled={submitting || loadingAudio || !audioTask} sx={{ minWidth: 200 }}>
            Submit transcription
          </Button>
          <Button variant="outlined" onClick={loadNextAudio} disabled={loadingAudio || submitting} sx={{ minWidth: 200 }}>
            Skip audio
          </Button>
        </Stack>
      </Box>

      <Dialog open={unsuitableDialog} onClose={() => setUnsuitableDialog(false)}>
        <DialogTitle>Confirm unsuitable audio</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Mark this audio as unsuitable only if it cannot be transcribed (wrong language, corrupted, no speech, etc.).
            This will submit the record immediately without transcription.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUnsuitableDialog(false)}>Cancel</Button>
          <Button color="error" startIcon={<WarningAmberIcon />} onClick={handleUnsuitableConfirm}>
            Yes, mark unsuitable
          </Button>
        </DialogActions>
      </Dialog>

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
