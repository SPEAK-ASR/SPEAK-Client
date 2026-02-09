import { Box, Typography } from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";

export function Footer() {
    return (
        <Box
            component="footer"
            sx={{
                mt: "auto",
                py: 2,
                px: 3,
                borderTop: 1,
                borderColor: "divider",
                bgcolor: "background.paper",
                opacity: 0.8,
            }}
        >
            <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 0.5,
                }}
            >
                Made with{" "}
                <FavoriteIcon sx={{ fontSize: 14, color: "error.main" }} /> for
                S.P.E.A.K.
            </Typography>
        </Box>
    );
}
