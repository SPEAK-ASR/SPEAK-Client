import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  ButtonGroup,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Fab,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import CloseIcon from '@mui/icons-material/Close';
import { useAdmin } from '../../context/AdminContext';
import { transcriptionServiceApi, type AdminLeaderboardEntry, type LeaderboardRange } from '../../lib/transcriptionServiceApi';

const RANGE_LABELS: Record<LeaderboardRange, string> = {
  all: 'All time',
  week: 'This week',
  month: 'This month',
};

export function AdminLeaderboardButton() {
  const { isAdmin } = useAdmin();
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<LeaderboardRange>('all');
  const [leaders, setLeaders] = useState<AdminLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await transcriptionServiceApi.fetchLeaderboard(range);
        if (mounted) {
          setLeaders(data.leaders);
        }
      } catch (error) {
        console.error(error);
        if (mounted) {
          setLeaders([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [open, range]);

  if (!isAdmin) return null;

  return (
    <>
      <Fab color="primary" sx={{ position: 'fixed', bottom: 32, right: 32 }} onClick={() => setOpen(true)}>
        <LeaderboardIcon />
      </Fab>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Admin leaderboard
          <IconButton size="small" onClick={() => setOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <ButtonGroup variant="outlined" size="small">
              {(Object.keys(RANGE_LABELS) as LeaderboardRange[]).map(key => (
                <Button key={key} onClick={() => setRange(key)} variant={range === key ? 'contained' : 'outlined'}>
                  {RANGE_LABELS[key]}
                </Button>
              ))}
            </ButtonGroup>

            {loading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress size={32} />
              </Box>
            ) : leaders.length === 0 ? (
              <Typography color="text.secondary">No admin submissions yet.</Typography>
            ) : (
              <List>
                {leaders.map((entry, idx) => (
                  <ListItem key={entry.admin} divider>
                    <ListItemText
                      primary={`#${idx + 1} ${entry.admin}`}
                      secondary={`${entry.count.toLocaleString()} submissions`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
}
