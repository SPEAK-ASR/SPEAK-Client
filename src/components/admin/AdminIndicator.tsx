import { Box, Button, Chip } from '@mui/material';
import { useAdmin } from '../../context/useAdmin';
import { getAdminDisplayName } from '../../context/adminUtils';

export function AdminIndicator() {
  const { admin, isAdmin, clearAdmin, openSelector } = useAdmin();

  return (
    <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
      {isAdmin && admin ? (
        <Chip
          color="primary"
          label={`Admin: ${getAdminDisplayName(admin)}`}
          onDelete={clearAdmin}
          sx={{ fontWeight: 600 }}
        />
      ) : (
        <Button variant="outlined" size="small" onClick={openSelector}>
          Admin login (Ctrl+`)
        </Button>
      )}
    </Box>
  );
}
