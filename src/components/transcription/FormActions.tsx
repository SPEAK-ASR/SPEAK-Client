import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Stack,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import type { SnackbarState } from '../../types/common';

interface ActionButtonsProps {
  /** Whether form is currently submitting */
  submitting: boolean;
  /** Whether data is loading */
  loading: boolean;
  /** Whether there's data to submit */
  hasData: boolean;
  /** Submit button label */
  submitLabel?: string;
  /** Skip button label */
  skipLabel?: string;
  /** Callback for unsuitable action */
  onUnsuitableClick: () => void;
  /** Callback for skip action */
  onSkip: () => void;
}

/**
 * Action buttons for transcription/validation forms
 */
export function ActionButtons({
  submitting,
  loading,
  hasData,
  submitLabel = 'Submit transcription',
  skipLabel = 'Skip audio',
  onUnsuitableClick,
  onSkip,
}: ActionButtonsProps) {
  const isDisabled = submitting || loading || !hasData;

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1.5}
      justifyContent="center"
      alignItems="center"
      sx={{ mt: 3 }}
    >
      <Button
        variant="outlined"
        onClick={onUnsuitableClick}
        disabled={isDisabled}
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
      <Button
        type="submit"
        variant="contained"
        endIcon={<SendIcon />}
        disabled={isDisabled}
        sx={{ minWidth: 200 }}
      >
        {submitLabel}
      </Button>
      <Button
        variant="outlined"
        onClick={onSkip}
        disabled={loading || submitting}
        sx={{ minWidth: 200 }}
      >
        {skipLabel}
      </Button>
    </Stack>
  );
}

interface UnsuitableDialogProps {
  /** Whether dialog is open */
  open: boolean;
  /** Close dialog callback */
  onClose: () => void;
  /** Confirm action callback */
  onConfirm: () => void;
}

/**
 * Confirmation dialog for marking audio as unsuitable
 */
export function UnsuitableDialog({ open, onClose, onConfirm }: UnsuitableDialogProps) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Confirm unsuitable audio</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Mark this audio as unsuitable only if it cannot be transcribed (wrong language,
          corrupted, no speech, etc.). This will submit the record immediately without
          transcription.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button color="error" startIcon={<WarningAmberIcon />} onClick={onConfirm}>
          Yes, mark unsuitable
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface NotificationSnackbarProps {
  /** Snackbar state */
  snackbar: SnackbarState | null;
  /** Close callback */
  onClose: () => void;
  /** Auto hide duration in ms */
  autoHideDuration?: number;
}

/**
 * Consistent notification snackbar
 */
export function NotificationSnackbar({
  snackbar,
  onClose,
  autoHideDuration = 4000,
}: NotificationSnackbarProps) {
  if (!snackbar) return null;

  return (
    <Snackbar open autoHideDuration={autoHideDuration} onClose={onClose}>
      <Alert severity={snackbar.severity} onClose={onClose} variant="filled">
        {snackbar.message}
      </Alert>
    </Snackbar>
  );
}
