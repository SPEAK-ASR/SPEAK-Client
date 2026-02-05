import { useMemo, useRef, type RefObject } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import { useSinhalaIme } from '../../hooks/useSinhalaIme';
import type { TranscriptionMetadata } from '../../types/common';
import { SPEAKER_OPTIONS } from '../../types/common';
import '../../styles/transcription.css';

interface TranscriptionEditorProps {
  /** Ref to access the textarea value externally */
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  /** Current metadata state */
  metadata: TranscriptionMetadata;
  /** Callback when metadata changes */
  onMetadataChange: (key: keyof TranscriptionMetadata, value: boolean | string) => void;
  /** Placeholder text for the textarea */
  placeholder?: string;
  /** Initial value for the textarea */
  initialValue?: string;
  /** Show cleanup button */
  showCleanupButton?: boolean;
  /** Callback for cleanup action */
  onCleanup?: () => void;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * Reusable transcription editor component with Sinhala IME support
 * Used by both TranscriptionPage and ValidationPage
 */
export function TranscriptionEditor({
  textareaRef,
  metadata,
  onMetadataChange,
  placeholder = 'Type what you hear...',
  showCleanupButton = false,
  onCleanup,
  disabled = false,
}: TranscriptionEditorProps) {
  const toggleRef = useRef<HTMLInputElement | null>(null);
  const chipRef = useRef<HTMLButtonElement | null>(null);
  
  const imeDomId = useMemo(
    () => `ime-${Math.random().toString(36).slice(2, 8)}`,
    []
  );
  const textareaId = `${imeDomId}-textarea`;
  const toggleId = `${imeDomId}-toggle`;
  const chipId = `${imeDomId}-chip`;

  useSinhalaIme({ textareaRef, toggleRef, chipRef });

  return (
    <Card variant="outlined">
      <CardContent>
        {/* IME Toggle */}
        <Box className="ime-toggle-container">
          <Typography
            variant="body2"
            color="text.secondary"
            className="ime-toggle-text"
            component="p"
          >
            No Sinhala keyboard? Enable the built-in Sinhala phonetic keyboard below.
            Read the{' '}
            <a
              href="https://facts.helakuru.lk/sinhala-typing/phonetic"
              target="_blank"
              rel="noreferrer"
              style={{ color: '#4F8EFF', textDecoration: 'underline' }}
            >
              typing guide
            </a>
            .
          </Typography>
          <label className="toggle-switch">
            <input
              type="checkbox"
              id={toggleId}
              ref={toggleRef}
              className="toggle-input"
              defaultChecked
              disabled={disabled}
            />
            <span className="toggle-slider">
              <span className="toggle-text off">EN</span>
              <span className="toggle-text on">සි</span>
            </span>
          </label>
        </Box>

        {/* Textarea with IME chip */}
        <div className="ime-container">
          <textarea
            id={textareaId}
            ref={textareaRef}
            placeholder={placeholder}
            rows={5}
            disabled={disabled}
            style={{
              width: '100%',
              resize: 'vertical',
              padding: '12px',
              borderRadius: 8,
              border: '1px solid #333',
              backgroundColor: '#1F1F1F',
              color: '#FAFAFA',
              fontSize: '0.95rem',
              fontFamily: 'inherit',
              opacity: disabled ? 0.6 : 1,
            }}
          />
          <button
            type="button"
            id={chipId}
            ref={chipRef}
            className="ime-chip"
            disabled={disabled}
          >
            සි | en
          </button>
        </div>

        {/* Cleanup button (optional) */}
        {showCleanupButton && onCleanup && (
          <Box sx={{ mt: 1, mb: 2 }}>
            <Button
              variant="text"
              size="small"
              startIcon={<CleaningServicesIcon />}
              onClick={onCleanup}
              disabled={disabled}
            >
              Clean up text
            </Button>
          </Box>
        )}

        {/* Metadata controls */}
        <Stack spacing={1.5} sx={{ mt: showCleanupButton ? 0 : 2 }}>
          <FormControl fullWidth required size="small">
            <InputLabel id="speaker-select">Speaker gender</InputLabel>
            <Select
              labelId="speaker-select"
              value={metadata.speakerGender}
              label="Speaker gender"
              size="small"
              disabled={disabled}
              onChange={(e) => onMetadataChange('speakerGender', e.target.value)}
            >
              <MenuItem value="">
                <em>Select gender...</em>
              </MenuItem>
              {SPEAKER_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={metadata.hasNoise}
                disabled={disabled}
                onChange={(e) => onMetadataChange('hasNoise', e.target.checked)}
              />
            }
            label="Audio contains background noise"
            sx={{ '.MuiTypography-root': { fontSize: '0.9rem' } }}
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={metadata.isCodeMixed}
                disabled={disabled}
                onChange={(e) => onMetadataChange('isCodeMixed', e.target.checked)}
              />
            }
            label="Audio contains code-mixed content"
            sx={{ '.MuiTypography-root': { fontSize: '0.9rem' } }}
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={metadata.isOverlap}
                disabled={disabled}
                onChange={(e) => onMetadataChange('isOverlap', e.target.checked)}
              />
            }
            label="Multiple speakers overlapping"
            sx={{ '.MuiTypography-root': { fontSize: '0.9rem' } }}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}
