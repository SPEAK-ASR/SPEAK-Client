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
import SendIcon from '@mui/icons-material/Send';
import RefreshIcon from '@mui/icons-material/Refresh';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { AudioPlayer } from '../components/audio/AudioPlayer';
import { useSinhalaIme } from '../hooks/useSinhalaIme';
import {
  transcriptionServiceApi,
  type SpeakerGender,
  type ValidationQueueItem,
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

export function ValidationPage() {
  const [queueItem, setQueueItem] = useState<ValidationQueueItem | null>(null);
  const [metadata, setMetadata] = useState(DEFAULT_METADATA);
  const [loadingItem, setLoadingItem] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);
  const [unsuitableDialog, setUnsuitableDialog] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const toggleRef = useRef<HTMLInputElement | null>(null);
  const chipRef = useRef<HTMLButtonElement | null>(null);
  const imeDomId = useMemo(() => `ime-${Math.random().toString(36).slice(2, 8)}`, []);
  const textareaId = `${imeDomId}-textarea`;
  const toggleId = `${imeDomId}-toggle`;
  const chipId = `${imeDomId}-chip`;

  useSinhalaIme({ textareaRef, toggleRef, chipRef });

  useEffect(() => {
    let isMounted = true;
    
    async function initialize() {
      if (isMounted) {
        await loadNextItem();
      }
    }
    
    initialize();
    
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!queueItem || !textareaRef.current) return;
    textareaRef.current.value = queueItem.transcription.transcription;
    setMetadata({
      speakerGender: queueItem.transcription.speaker_gender ?? '',
      hasNoise: queueItem.transcription.has_noise ?? false,
      isCodeMixed: queueItem.transcription.is_code_mixed ?? false,
      isOverlap: queueItem.transcription.is_speaker_overlappings_exist ?? false,
    });
  }, [queueItem]);

  async function loadNextItem() {
    setLoadingItem(true);
    setSubmitting(false);
    setMetadata(DEFAULT_METADATA);
    if (textareaRef.current) {
      textareaRef.current.value = '';
    }
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

  function updateMetadata(key: keyof typeof metadata, value: boolean | string) {
    setMetadata(prev => ({ ...prev, [key]: value }));
  }

  function cleanupText() {
    if (!textareaRef.current) return;
    const cleaned = textareaRef.current.value
      .replace(/[ \t]+/g, ' ')
      .replace(/[ \t]*\n[ \t]*/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    textareaRef.current.value = cleaned;
    setSnackbar({ message: 'Text cleaned up successfully.', severity: 'info' });
  }

  function validate(): string | null {
    if (!queueItem) return 'No transcription loaded.';
    if (!metadata.speakerGender) return 'Please select speaker gender.';
    const value = textareaRef.current?.value ?? '';
    if (!value.trim()) return 'Transcription cannot be empty.';
    if (value.trim().length < 3) return 'Transcription looks too short. Please double-check.';
    return null;
  }

  async function submitValidation(payload: any, successMessage: string) {
    try {
      setSubmitting(true);
      await transcriptionServiceApi.submitValidation(queueItem!.transcription.trans_id, payload);
      setSnackbar({ message: successMessage, severity: 'success' });
      await loadNextItem();
    } catch (error) {
      console.error(error);
      setSnackbar({ message: 'Failed to validate transcription.', severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setSnackbar({ message: validationError, severity: 'error' });
      return;
    }
    if (!queueItem) return;

    const payload = {
      transcription: (textareaRef.current?.value ?? '').trim(),
      speaker_gender: metadata.speakerGender as SpeakerGender,
      has_noise: metadata.hasNoise,
      is_code_mixed: metadata.isCodeMixed,
      is_speaker_overlappings_exist: metadata.isOverlap,
      is_audio_suitable: true,
    };

    await submitValidation(payload, 'Transcription validated successfully. Loading next item...');
  }

  async function handleUnsuitableConfirm() {
    if (!queueItem) return;
    setUnsuitableDialog(false);
    if (textareaRef.current) {
      textareaRef.current.value = 'Audio not suitable for transcription';
    }
    const payload = {
      transcription: 'Audio not suitable for transcription',
      speaker_gender: 'cannot_recognized' as SpeakerGender,
      has_noise: false,
      is_code_mixed: false,
      is_speaker_overlappings_exist: false,
      is_audio_suitable: false,
    };
    await submitValidation(payload, 'Audio marked as unsuitable. Loading next item...');
  }

  const referenceText = useMemo(() => queueItem?.audio.google_transcription?.trim(), [queueItem]);

  return (
    <Box component="section">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Validation
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Review and validate transcriptions
        </Typography>
      </Box>

      {!queueItem && !loadingItem ? (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>No submissions waiting 🎉</Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              All pending transcriptions have been reviewed.
            </Typography>
            <Button onClick={loadNextItem} variant="outlined">
              Refresh queue
            </Button>
          </CardContent>
        </Card>
      ) : (
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
            <Card variant="outlined">
              <CardHeader
                title={queueItem ? queueItem.audio.audio_filename : 'Fetching transcription...'}
                subheader={queueItem ? `Created ${new Date(queueItem.transcription.created_at ?? '').toLocaleString()}` : undefined}
                action={
                  <Button startIcon={<RefreshIcon />} onClick={loadNextItem} disabled={loadingItem || submitting}>
                    Skip item
                  </Button>
                }
              />
              <CardContent>
                <AudioPlayer src={queueItem?.audio.gcs_signed_url} disabled={!queueItem || loadingItem} />
              </CardContent>
            </Card>

            {referenceText && (
              <Card variant="outlined">
                <CardHeader title="Reference transcription" />
                <CardContent>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Google transcription for reference only
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
                  placeholder="Review and edit the transcription..."
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

              <Box sx={{ mt: 1, mb: 2 }}>
                <Button variant="text" size="small" startIcon={<CleaningServicesIcon />} onClick={cleanupText}>
                  Clean up text
                </Button>
              </Box>

              <Stack spacing={1.5}>
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
            disabled={submitting || loadingItem || !queueItem}
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
          <Button type="submit" variant="contained" endIcon={<SendIcon />} disabled={submitting || loadingItem || !queueItem} sx={{ minWidth: 200 }}>
            Submit validation
          </Button>
          <Button variant="outlined" onClick={loadNextItem} disabled={loadingItem || submitting} sx={{ minWidth: 200 }}>
            Skip item
          </Button>
        </Stack>
      </Box>
      )}

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
