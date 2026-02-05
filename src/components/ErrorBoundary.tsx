import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Box, Button, Card, CardContent, Typography, Collapse } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

/**
 * Error Boundary component that catches JavaScript errors anywhere in the child
 * component tree, logs them, and displays a fallback UI.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    // Log error to console (could be sent to error reporting service)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
  };

  toggleDetails = (): void => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  render(): ReactNode {
    const { hasError, error, errorInfo, showDetails } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '50vh',
            p: 3,
          }}
        >
          <Card
            sx={{
              maxWidth: 600,
              width: '100%',
              textAlign: 'center',
              bgcolor: 'error.dark',
              borderColor: 'error.main',
              borderWidth: 1,
              borderStyle: 'solid',
            }}
          >
            <CardContent sx={{ py: 4 }}>
              <ErrorOutlineIcon
                sx={{ fontSize: 64, color: 'error.light', mb: 2 }}
              />
              
              <Typography variant="h5" fontWeight={600} gutterBottom>
                Something went wrong
              </Typography>
              
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 3 }}
              >
                {error?.message || 'An unexpected error occurred while rendering this component.'}
              </Typography>

              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={this.handleRetry}
                sx={{ mb: 2 }}
              >
                Try Again
              </Button>

              {errorInfo && (
                <>
                  <Button
                    variant="text"
                    size="small"
                    onClick={this.toggleDetails}
                    endIcon={showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    sx={{ display: 'block', mx: 'auto', mt: 1 }}
                  >
                    {showDetails ? 'Hide' : 'Show'} Error Details
                  </Button>

                  <Collapse in={showDetails}>
                    <Box
                      sx={{
                        mt: 2,
                        p: 2,
                        bgcolor: 'background.default',
                        borderRadius: 1,
                        textAlign: 'left',
                        overflow: 'auto',
                        maxHeight: 200,
                      }}
                    >
                      <Typography
                        variant="caption"
                        component="pre"
                        sx={{
                          fontFamily: 'monospace',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          color: 'text.secondary',
                          m: 0,
                        }}
                      >
                        {error?.stack || error?.toString()}
                      </Typography>
                    </Box>
                  </Collapse>
                </>
              )}

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mt: 2 }}
              >
                If the problem persists, please refresh the page or contact support.
              </Typography>
            </CardContent>
          </Card>
        </Box>
      );
    }

    return children;
  }
}

/**
 * Presentational error component for displaying errors without boundary functionality
 * Use this when you need to show an error UI manually (e.g., from try/catch)
 */
interface ErrorDisplayProps {
  error: Error | null;
  onRetry?: () => void;
  title?: string;
}

export function ErrorDisplay({ error, onRetry, title = 'Something went wrong' }: ErrorDisplayProps) {
  if (!error) return null;

  return (
    <Box sx={{ maxWidth: 500, mx: 'auto', p: 3 }}>
      <Card
        sx={{
          textAlign: 'center',
          bgcolor: 'error.dark',
          borderColor: 'error.main',
          borderWidth: 1,
          borderStyle: 'solid',
        }}
      >
        <CardContent>
          <ErrorOutlineIcon sx={{ fontSize: 48, color: 'error.light', mb: 2 }} />
          
          <Typography variant="h6" fontWeight={600} gutterBottom>
            {title}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {error.message || 'An unexpected error occurred.'}
          </Typography>

          {onRetry && (
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={onRetry}
            >
              Try Again
            </Button>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}