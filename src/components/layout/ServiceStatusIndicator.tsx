import { Box, Chip, CircularProgress, IconButton, Tooltip, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import RefreshIcon from '@mui/icons-material/Refresh';
import type { ServiceStatus } from '../../hooks/useServiceStatus';

interface ServiceStatusIndicatorProps {
  services: ServiceStatus[];
  isDrawerOpen: boolean;
  onRefresh: () => void;
}

export function ServiceStatusIndicator({ services, isDrawerOpen, onRefresh }: ServiceStatusIndicatorProps) {
  const getStatusIcon = (service: ServiceStatus) => {
    if (service.lastChecked === null) {
      return <CircularProgress size={16} />;
    }
    return service.isOnline ? (
      <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
    ) : (
      <CancelIcon sx={{ fontSize: 16, color: 'error.main' }} />
    );
  };

  const getStatusColor = (service: ServiceStatus) => {
    if (service.lastChecked === null) return 'default';
    return service.isOnline ? 'success' : 'error';
  };

  const getTooltipText = (service: ServiceStatus) => {
    if (service.lastChecked === null) {
      return `${service.name} Service: Checking...`;
    }
    const status = service.isOnline ? 'Online' : 'Offline';
    const responseTime = service.responseTime ? ` (${service.responseTime}ms)` : '';
    return `${service.name} Service: ${status}${responseTime}\nPort: ${service.port}\nLast checked: ${service.lastChecked.toLocaleTimeString()}`;
  };

  if (!isDrawerOpen) {
    // Compact view - just dots
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
          alignItems: 'center',
          py: 1,
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        {services.map((service) => (
          <Tooltip key={service.name} title={getTooltipText(service)} placement="right">
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                bgcolor: service.isOnline ? 'success.main' : 'error.main',
                opacity: service.lastChecked === null ? 0.5 : 1,
              }}
            />
          </Tooltip>
        ))}
      </Box>
    );
  }

  // Expanded view
  return (
    <Box
      sx={{
        px: 2,
        py: 1.5,
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontWeight: 600 }}
        >
          Services
        </Typography>
        <Tooltip title="Refresh service status">
          <IconButton
            size="small"
            onClick={onRefresh}
            sx={{
              color: 'text.secondary',
              '&:hover': {
                color: 'primary.main',
              },
            }}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {services.map((service) => (
          <Tooltip key={service.name} title={getTooltipText(service)} placement="right">
            <Chip
              icon={getStatusIcon(service)}
              label={service.name}
              size="small"
              color={getStatusColor(service)}
              variant="outlined"
              sx={{
                justifyContent: 'flex-start',
                '& .MuiChip-label': {
                  fontSize: '0.75rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                },
              }}
            />
          </Tooltip>
        ))}
      </Box>
    </Box>
  );
}
