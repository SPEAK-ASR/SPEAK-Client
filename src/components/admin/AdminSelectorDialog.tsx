import { Avatar, Box, ButtonBase, Modal, Typography } from '@mui/material';
import { useAdmin } from '../../context/AdminContext';

export function AdminSelectorDialog() {
  const { profiles, isSelectorOpen, closeSelector, selectAdmin } = useAdmin();

  const handleSelect = (adminId: string) => {
    selectAdmin(adminId as any);
  };

  return (
    <Modal
      open={isSelectorOpen}
      onClose={closeSelector}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      BackdropProps={{
        sx: {
          backgroundColor: 'rgba(20, 20, 20, 0.65)',
          backdropFilter: 'blur(4px)',
        },
      }}
    >
      <Box
        sx={{
          textAlign: 'center',
          maxWidth: 1200,
          width: '100%',
          px: 5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          outline: 'none',
        }}
      >
        <Typography
          variant="h2"
          sx={{
            color: '#ffffff',
            fontSize: '2.5rem',
            fontWeight: 400,
            mb: '50px',
            letterSpacing: '-0.5px',
          }}
        >
          Who's transcribing?
        </Typography>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 5,
            flexWrap: 'wrap',
          }}
        >
          {profiles.map(profile => (
            <ButtonBase
              key={profile.id}
              onClick={() => handleSelect(profile.id)}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                '&:hover': {
                  transform: 'scale(1.05)',
                  '& .profile-avatar': {
                    borderColor: '#ffffff',
                    boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.7)',
                  },
                  '& .profile-name': {
                    color: '#ffffff',
                  },
                },
                '&:active': {
                  transform: 'scale(0.98)',
                },
              }}
            >
              <Avatar
                className="profile-avatar"
                src={profile.imagePath}
                alt={profile.displayName}
                sx={{
                  width: 160,
                  height: 160,
                  borderRadius: 1,
                  mb: 2.5,
                  border: '4px solid transparent',
                  transition: 'all 0.3s ease',
                  fontSize: '4rem',
                  fontWeight: 700,
                }}
              >
                {profile.displayName.charAt(0)}
              </Avatar>
              <Typography
                className="profile-name"
                sx={{
                  color: '#808080',
                  fontSize: '1.3rem',
                  fontWeight: 400,
                  transition: 'color 0.3s ease',
                }}
              >
                {profile.displayName}
              </Typography>
            </ButtonBase>
          ))}
        </Box>
      </Box>
    </Modal>
  );
}
