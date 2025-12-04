import { Avatar, Box, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Tooltip, Typography } from '@mui/material';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import CloseIcon from '@mui/icons-material/Close';
import HomeIcon from '@mui/icons-material/Home';
import MicIcon from '@mui/icons-material/Mic';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import { useState } from 'react';
import { Footer } from '../Footer';
import { useAdmin } from '../../context/AdminContext';
import { AdminSelectorDialog } from '../admin/AdminSelectorDialog';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Processor', path: '/', icon: <HomeIcon /> },
  { label: 'Transcription', path: '/transcription', icon: <MicIcon /> },
  { label: 'Validation', path: '/validation', icon: <CheckCircleIcon />, adminOnly: true },
  { label: 'Leaderboard', path: '/leaderboard', icon: <LeaderboardIcon />, adminOnly: true },
  { label: 'Statistics', path: '/statistics', icon: <QueryStatsIcon />, adminOnly: true },
];

const DRAWER_WIDTH = 240;
const COLLAPSED_WIDTH = 72;

export function AppLayout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { admin, profiles, clearAdmin, isAdmin } = useAdmin();

  const currentProfile = admin ? profiles.find(p => p.id === admin) : null;
  const displayName = currentProfile?.displayName || 'Guest';
  const avatarSrc = currentProfile?.imagePath || '/src/assets/profiles/placeholder.svg';

  const visibleNavItems = NAV_ITEMS.filter(item => !item.adminOnly || isAdmin);

  return (
    <Box display="flex" minHeight="100vh">
      <Drawer
        variant="permanent"
        open={open}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        sx={{
          width: open ? DRAWER_WIDTH : COLLAPSED_WIDTH,
          flexShrink: 0,
          transition: 'width 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
          '& .MuiDrawer-paper': {
            width: open ? DRAWER_WIDTH : COLLAPSED_WIDTH,
            boxSizing: 'border-box',
            transition: 'width 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
            overflowX: 'hidden',
            willChange: 'width',
            borderRight: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 64 }}>
          {open ? (
            <>
              <Typography variant="h6" fontWeight={700} noWrap>
                SPEAK
              </Typography>
              <IconButton size="small" onClick={() => setOpen(false)}>
                <ChevronLeftIcon />
              </IconButton>
            </>
          ) : (
            <IconButton onClick={() => setOpen(true)} sx={{ mx: 'auto' }}>
              <MenuIcon />
            </IconButton>
          )}
        </Box>
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
                  justifyContent: open ? 'initial' : 'center',
                  px: 2.5,
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
                    transition: 'opacity 0.2s',
                    '& .MuiTypography-root': {
                      fontWeight: isActive ? 600 : 400,
                    },
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>
        <Box
          sx={{
            p: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
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
              <Box sx={{ ml: 2, overflow: 'hidden', flex: 1 }}>
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
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                clearAdmin();
              }}
              sx={{
                color: 'text.secondary',
                '&:hover': {
                  color: 'text.primary',
                  bgcolor: 'action.hover',
                },
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <Box sx={{ flexGrow: 1, p: 3, overflow: 'auto' }}>
          <Outlet />
        </Box>
        <Footer />
      </Box>

      <AdminSelectorDialog />
    </Box>
  );
}
