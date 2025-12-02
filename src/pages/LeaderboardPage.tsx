import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  ButtonGroup,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { transcriptionServiceApi, type AdminLeaderboardEntry, type LeaderboardRange } from '../lib/transcriptionServiceApi';

interface LeaderboardState {
  leaders: AdminLeaderboardEntry[];
  total: number;
}

const RANGE_LABELS: Record<LeaderboardRange, string> = {
  all: 'All time',
  week: 'This week',
  month: 'This month',
};

export function LeaderboardPage() {
  const [range, setRange] = useState<LeaderboardRange>('all');
  const [state, setState] = useState<LeaderboardState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await transcriptionServiceApi.fetchLeaderboard(range);
        if (!mounted) return;
        setState({ leaders: data.leaders, total: data.total });
      } catch (err) {
        console.error(err);
        if (mounted) {
          setError('Failed to load leaderboard.');
          setState(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [range]);

  const topThree = state?.leaders.slice(0, 3) ?? [];
  const remainder = state?.leaders.slice(3) ?? [];

  return (
    <Box>
      <Stack spacing={3}>
        <Card variant="outlined">
          <CardHeader title="Admin leaderboard" subheader="Ctrl + ` to enable the admin menu anywhere" />
          <CardContent>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <ButtonGroup variant="outlined" size="small">
                {(Object.keys(RANGE_LABELS) as LeaderboardRange[]).map(key => (
                  <Button key={key} onClick={() => setRange(key)} variant={key === range ? 'contained' : 'outlined'}>
                    {RANGE_LABELS[key]}
                  </Button>
                ))}
              </ButtonGroup>
              {state && (
                <Typography color="text.secondary">Total contributions: {state.total.toLocaleString()}</Typography>
              )}
            </Stack>
          </CardContent>
        </Card>

        {loading && (
          <Box display="flex" justifyContent="center" mt={4}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error">{error}</Alert>
        )}

        {!loading && !error && state && state.leaders.length === 0 && (
          <Alert severity="info">No admin transcriptions yet.</Alert>
        )}

        {!loading && !error && state && state.leaders.length > 0 && (
          <Stack spacing={3}>
            <Grid container spacing={2}>
              {topThree.map((entry, index) => (
                <Grid item xs={12} sm={4} key={entry.admin}>
                  <Card sx={{ height: '100%', textAlign: 'center', py: 2 }}>
                    <CardContent>
                      <EmojiEventsIcon color={index === 0 ? 'warning' : 'disabled'} sx={{ fontSize: 32, mb: 1 }} />
                      <Typography variant="h5">#{index + 1}</Typography>
                      <Typography variant="h6">{entry.admin}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {entry.count.toLocaleString()} submissions
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {remainder.length > 0 && (
              <Card variant="outlined">
                <CardHeader title="More admins" />
                <CardContent>
                  <Stack spacing={1}>
                    {remainder.map((entry, idx) => (
                      <Stack key={entry.admin} direction="row" justifyContent="space-between">
                        <Typography>
                          #{idx + 4} {entry.admin}
                        </Typography>
                        <Typography fontWeight={600}>{entry.count.toLocaleString()}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            )}
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
