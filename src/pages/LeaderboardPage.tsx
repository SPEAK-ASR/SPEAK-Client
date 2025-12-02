import { useEffect, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  ButtonGroup,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { transcriptionServiceApi, type AdminLeaderboardEntry, type LeaderboardRange } from '../lib/transcriptionServiceApi';
import { useAdmin } from '../context/AdminContext';

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
  const { profiles } = useAdmin();

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

  const getProfileImage = (adminName: string) => {
    const profile = profiles.find(p => p.id === adminName.toLowerCase());
    return profile?.imagePath;
  };

  const getMedalColor = (rank: number) => {
    if (rank === 1) return { bg: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', icon: '#FFD700' };
    if (rank === 2) return { bg: 'linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 100%)', icon: '#C0C0C0' };
    if (rank === 3) return { bg: 'linear-gradient(135deg, #CD7F32 0%, #B8860B 100%)', icon: '#CD7F32' };
    return { bg: 'linear-gradient(135deg, #424242 0%, #303030 100%)', icon: '#757575' };
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', py: 4 }}>
      <Stack spacing={4}>
        {/* Header */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h3" fontWeight="bold" sx={{ mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <EmojiEventsIcon sx={{ fontSize: 40, color: '#FFD700' }} />
            Leaderboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Top contributors to the transcription database
          </Typography>
        </Box>

        {/* Time Range Selector */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <ButtonGroup variant="outlined" size="medium">
            {(Object.keys(RANGE_LABELS) as LeaderboardRange[]).map(key => (
              <Button 
                key={key} 
                onClick={() => setRange(key)} 
                variant={key === range ? 'contained' : 'outlined'}
                sx={{ minWidth: 120 }}
              >
                {RANGE_LABELS[key]}
              </Button>
            ))}
          </ButtonGroup>
          {state && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'background.paper', px: 2, py: 1, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <TrendingUpIcon color="primary" />
              <Typography variant="body2" fontWeight={600}>
                {state.total.toLocaleString()} total contributions
              </Typography>
            </Box>
          )}
        </Box>

        {loading && (
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress size={48} />
          </Box>
        )}

        {error && <Alert severity="error">{error}</Alert>}

        {!loading && !error && state && state.leaders.length === 0 && (
          <Alert severity="info">No admin transcriptions yet.</Alert>
        )}

        {!loading && !error && state && state.leaders.length > 0 && (
          <Stack spacing={4}>
            {/* Top 3 Podium */}
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 3, flexWrap: 'wrap' }}>
              {topThree.length >= 2 && (
                <Card 
                  sx={{ 
                    width: 240, 
                    textAlign: 'center', 
                    background: getMedalColor(2).bg,
                    transform: 'translateY(20px)',
                    transition: 'transform 0.3s ease',
                    '&:hover': { transform: 'translateY(15px) scale(1.05)' }
                  }}
                >
                  <CardContent sx={{ py: 3 }}>
                    <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
                      <Avatar
                        src={getProfileImage(topThree[1].admin)}
                        alt={topThree[1].admin}
                        sx={{ 
                          width: 100, 
                          height: 100, 
                          border: '4px solid #C0C0C0',
                          fontSize: '2.5rem',
                          fontWeight: 700
                        }}
                      >
                        {topThree[1].admin.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box sx={{ 
                        position: 'absolute', 
                        bottom: -8, 
                        right: -8, 
                        bgcolor: '#C0C0C0', 
                        borderRadius: '50%', 
                        width: 36, 
                        height: 36, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        border: '3px solid white'
                      }}>
                        <Typography variant="h6" fontWeight="bold" color="white">2</Typography>
                      </Box>
                    </Box>
                    <Typography variant="h5" fontWeight="bold" sx={{ textTransform: 'capitalize', mb: 1 }}>
                      {topThree[1].admin}
                    </Typography>
                    <Box sx={{ bgcolor: 'rgba(255,255,255,0.9)', borderRadius: 2, py: 1, px: 2 }}>
                      <Typography variant="h6" fontWeight="bold" color="text.secondary">
                        {topThree[1].count.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">contributions</Typography>
                    </Box>
                  </CardContent>
                </Card>
              )}

              {topThree.length >= 1 && (
                <Card 
                  sx={{ 
                    width: 260, 
                    textAlign: 'center', 
                    background: getMedalColor(1).bg,
                    boxShadow: '0 8px 24px rgba(255, 215, 0, 0.3)',
                    transition: 'transform 0.3s ease',
                    '&:hover': { transform: 'scale(1.05)' }
                  }}
                >
                  <CardContent sx={{ py: 4 }}>
                    {/* <EmojiEventsIcon sx={{ fontSize: 48, color: '#FFD700', mb: 1 }} /> */}
                    <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
                      <Avatar
                        src={getProfileImage(topThree[0].admin)}
                        alt={topThree[0].admin}
                        sx={{ 
                          width: 120, 
                          height: 120, 
                          border: '5px solid #FFD700',
                          fontSize: '3rem',
                          fontWeight: 700
                        }}
                      >
                        {topThree[0].admin.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box sx={{ 
                        position: 'absolute', 
                        bottom: -8, 
                        right: -8, 
                        bgcolor: '#FFD700', 
                        borderRadius: '50%', 
                        width: 40, 
                        height: 40, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        border: '3px solid white',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                      }}>
                        <Typography variant="h5" fontWeight="bold" color="white">1</Typography>
                      </Box>
                    </Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ textTransform: 'capitalize', mb: 1 }}>
                      {topThree[0].admin}
                    </Typography>
                    <Box sx={{ bgcolor: 'rgba(255,255,255,0.95)', borderRadius: 2, py: 1.5, px: 2 }}>
                      <Typography variant="h5" fontWeight="bold" color="text.secondary">
                        {topThree[0].count.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">contributions</Typography>
                    </Box>
                  </CardContent>
                </Card>
              )}

              {topThree.length >= 3 && (
                <Card 
                  sx={{ 
                    width: 240, 
                    textAlign: 'center', 
                    background: getMedalColor(3).bg,
                    transform: 'translateY(20px)',
                    transition: 'transform 0.3s ease',
                    '&:hover': { transform: 'translateY(15px) scale(1.05)' }
                  }}
                >
                  <CardContent sx={{ py: 3 }}>
                    <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
                      <Avatar
                        src={getProfileImage(topThree[2].admin)}
                        alt={topThree[2].admin}
                        sx={{ 
                          width: 100, 
                          height: 100, 
                          border: '4px solid #CD7F32',
                          fontSize: '2.5rem',
                          fontWeight: 700
                        }}
                      >
                        {topThree[2].admin.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box sx={{ 
                        position: 'absolute', 
                        bottom: -8, 
                        right: -8, 
                        bgcolor: '#CD7F32', 
                        borderRadius: '50%', 
                        width: 36, 
                        height: 36, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        border: '3px solid white'
                      }}>
                        <Typography variant="h6" fontWeight="bold" color="white">3</Typography>
                      </Box>
                    </Box>
                    <Typography variant="h5" fontWeight="bold" sx={{ textTransform: 'capitalize', mb: 1 }}>
                      {topThree[2].admin}
                    </Typography>
                    <Box sx={{ bgcolor: 'rgba(255,255,255,0.9)', borderRadius: 2, py: 1, px: 2 }}>
                      <Typography variant="h6" fontWeight="bold" color="text.secondary">
                        {topThree[2].count.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">contributions</Typography>
                    </Box>
                  </CardContent>
                </Card>
              )}
            </Box>

            {/* Rest of leaderboard */}
            {remainder.length > 0 && (
              <Card>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Rank</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Admin</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Contributions</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Badge</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {remainder.map((entry, idx) => {
                        const rank = idx + 4;
                        return (
                          <TableRow 
                            key={entry.admin}
                            sx={{ 
                              '&:hover': { bgcolor: 'action.hover' },
                              transition: 'background-color 0.2s ease'
                            }}
                          >
                            <TableCell>
                              <Typography variant="h6" fontWeight="bold" color="text.secondary">
                                #{rank}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar
                                  src={getProfileImage(entry.admin)}
                                  alt={entry.admin}
                                  sx={{ width: 40, height: 40 }}
                                >
                                  {entry.admin.charAt(0).toUpperCase()}
                                </Avatar>
                                <Typography variant="body1" fontWeight={500} sx={{ textTransform: 'capitalize' }}>
                                  {entry.admin}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="h6" fontWeight="bold">
                                {entry.count.toLocaleString()}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Box sx={{ 
                                display: 'inline-flex', 
                                bgcolor: 'primary.main', 
                                color: 'white', 
                                px: 2, 
                                py: 0.5, 
                                borderRadius: 2,
                                fontSize: '0.75rem',
                                fontWeight: 600
                              }}>
                                Contributor
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            )}
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
