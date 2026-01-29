import * as React from 'react';
import {
  Avatar,
  Box,
  CssBaseline,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
  Drawer as MuiDrawer,
} from '@mui/material';
import { styled, type Theme, type CSSObject } from '@mui/material/styles';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import CloseIcon from '@mui/icons-material/Close';
import HomeIcon from '@mui/icons-material/Home';
import MicIcon from '@mui/icons-material/Mic';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import YouTubeIcon from '@mui/icons-material/YouTube';
import QueueIcon from '@mui/icons-material/Queue';

import { Footer } from '../Footer';
import { useAdmin } from '../../context/AdminContext';
import { AdminSelectorDialog } from '../admin/AdminSelectorDialog';
import { ServiceStatusIndicator } from './ServiceStatusIndicator';
import { useServiceStatus } from '../../hooks/useServiceStatus';

/* ------------------------------------------------------------------ */
/* Drawer styling (same pattern as MUI mini variant)                    */
/* ------------------------------------------------------------------ */

const DRAWER_WIDTH = 240;

const openedMixin = (theme: Theme): CSSObject => ({
  width: DRAWER_WIDTH,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== 'open',
})<{ open?: boolean }>(({ theme, open }) => ({
  width: DRAWER_WIDTH,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  ...(open && {
    ...openedMixin(theme),
    '& .MuiDrawer-paper': openedMixin(theme),
  }),
  ...(!open && {
    ...closedMixin(theme),
    '& .MuiDrawer-paper': closedMixin(theme),
  }),
}));

/* ------------------------------------------------------------------ */

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Processor', path: '/', icon: <HomeIcon /> },
  { label: 'Queue Processor', path: '/queue-processor', icon: <QueueIcon /> },
  { label: 'Transcription', path: '/transcription', icon: <MicIcon /> },
  { label: 'Validation', path: '/validation', icon: <CheckCircleIcon />, adminOnly: true },
  { label: 'Leaderboard', path: '/leaderboard', icon: <LeaderboardIcon />, adminOnly: true },
  { label: 'Statistics', path: '/statistics', icon: <QueryStatsIcon />, adminOnly: true },
  { label: 'YouTube Channels', path: '/channels', icon: <YouTubeIcon />, adminOnly: true },
];

export function AppLayout() {
  const [open, setOpen] = React.useState(false);
  const location = useLocation();

  const { admin, profiles, clearAdmin, isAdmin } = useAdmin();
  const { services, refresh } = useServiceStatus();

  const currentProfile = admin ? profiles.find(p => p.id === admin) : null;
  const displayName = currentProfile?.displayName || 'Guest';
  const avatarSrc = currentProfile?.imagePath || '/src/assets/profiles/placeholder.svg';

  const visibleNavItems = NAV_ITEMS.filter(i => !i.adminOnly || isAdmin);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />

      {/* ---------------- Drawer ---------------- */}
      <Drawer
        variant="permanent"
        open={open}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: open ? 'space-between' : 'center',
            px: 2,
            minHeight: 64,
          }}
        >
          {open && (
            <Typography variant="h6" fontWeight={700} noWrap>
              SPEAK
            </Typography>
          )}
          <IconButton size="small" onClick={() => setOpen(o => !o)}>
            {open ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
        </Box>

        <Divider />

        {/* Nav Items */}
        <List sx={{ flexGrow: 1 }}>
          {visibleNavItems.map(item => {
            const isActive = location.pathname === item.path;

            return (
              <ListItemButton
                key={item.path}
                component={NavLink}
                to={item.path}
                selected={isActive}
                sx={{
                  minHeight: 48,
                  px: 2.5,
                  justifyContent: open ? 'initial' : 'center',
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: open ? 3 : 'auto',
                    justifyContent: 'center',
                    color: isActive ? 'primary.main' : 'inherit',
                  }}
                >
                  {item.icon}
                </ListItemIcon>

                <ListItemText
                  primary={item.label}
                  sx={{
                    opacity: open ? 1 : 0,
                    transition: 'opacity 0.15s ease',
                    '& .MuiTypography-root': {
                      fontWeight: isActive ? 600 : 400,
                      whiteSpace: 'nowrap',
                    },
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>

        <ServiceStatusIndicator
          services={services}
          isDrawerOpen={open}
          onRefresh={refresh}
        />

        <Divider />

        {/* Profile */}
        <Box
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: open ? 'space-between' : 'center',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title={displayName} placement="right">
              <Avatar
                src={avatarSrc}
                alt={displayName}
                sx={{
                  width: 40,
                  height: 40,
                  border: currentProfile ? '2px solid' : 'none',
                  borderColor: 'primary.main',
                }}
              />
            </Tooltip>

            {open && (
              <Box sx={{ ml: 2, overflow: 'hidden' }}>
                <Typography variant="body2" fontWeight={600} noWrap>
                  {displayName}
                </Typography>
                {currentProfile && (
                  <Typography variant="caption" color="text.secondary" noWrap>
                    Admin
                  </Typography>
                )}
              </Box>
            )}
          </Box>

          {open && currentProfile && (
            <IconButton size="small" onClick={clearAdmin}>
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Drawer>

      {/* ---------------- Main ---------------- */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box sx={{ flexGrow: 1, p: 3, overflow: 'auto' }}>
          <Outlet />
        </Box>
        <Footer />
      </Box>

      <AdminSelectorDialog />
    </Box>
  );
}
