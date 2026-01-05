import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Container, 
  TextField, 
  Typography, 
  Paper,
  Alert,
  CircularProgress
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { checkAdminUsers } from '../lib/mockData';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error' | 'unknown'>('unknown');
  const [serverInfo, setServerInfo] = useState<string>('');
  const [adminUsersCount, setAdminUsersCount] = useState<number>(0);
  
    const { user, login } = useAuth();

  // Check server status on component mount
  React.useEffect(() => {
    checkServerStatus();
  }, []);

  // If already logged in, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const checkServerStatus = async () => {
    setConnectionStatus('checking');
    setServerInfo('Checking server connection...');
    
    // Check environment variables first
    const hasSupabaseUrl = !!process.env.REACT_APP_SUPABASE_URL;
    const hasSupabaseKey = !!process.env.REACT_APP_SUPABASE_ANON_KEY;
    
    if (!hasSupabaseUrl || !hasSupabaseKey) {
      setConnectionStatus('error');
      setServerInfo(`❌ Missing environment variables: ${!hasSupabaseUrl ? 'SUPABASE_URL' : ''} ${!hasSupabaseKey ? 'SUPABASE_ANON_KEY' : ''}`);
      setAdminUsersCount(0);
      return;
    }
    
    try {
      // Simplified connection test with single timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout - server not responding after 15 seconds')), 15000);
      });
      
      const connectionTest = async () => {
        // Direct Supabase connection test - no external network checks
        const result = await checkAdminUsers();
        console.log('Connection test result:', result);
        
        if (result.error) {
          throw new Error((result.error as any)?.message || 'Supabase connection failed');
        }
        
        return result;
      };
      
      const result = await Promise.race([connectionTest(), timeoutPromise]) as any;
      
      setConnectionStatus('connected');
      const supabaseHost = process.env.REACT_APP_SUPABASE_URL?.split('//')[1]?.split('.')[0] || 'server';
      setServerInfo(`✅ Connected to Supabase (${supabaseHost})`);
      setAdminUsersCount(result.data?.length || 0);
      
    } catch (error) {
      console.error('Connection test error:', error);
      setConnectionStatus('error');
      
      // Provide helpful error messages
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      if (errorMessage.includes('timeout')) {
        setServerInfo(`❌ Connection timeout - check your internet connection or try again`);
      } else if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
        setServerInfo(`❌ Network error - check firewall/VPN settings`);
      } else {
        setServerInfo(`❌ ${errorMessage}`);
      }
      setAdminUsersCount(0);
    }
  };

  const handleTestConnection = async () => {
    await checkServerStatus();
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      const { error: loginError } = await login(email, password);
      
      if (loginError) {
        setError(loginError.message || 'Failed to login');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #2c2c2c 0%, #333333 50%, #404040 100%)',
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: '#f5f5f5', // Off-white background
            border: '1px solid #cccccc',
          }}
        >
          <Typography component="h1" variant="h4" sx={{ mb: 3, color: '#333333' }}>
            Momu Admin Dashboard
          </Typography>
          
          {/* Server Status Display */}
          <Box sx={{ 
            mb: 3, 
            p: 2, 
            borderRadius: 1, 
            backgroundColor: connectionStatus === 'connected' ? '#e8f5e8' : 
                           connectionStatus === 'error' ? '#ffeaea' : 
                           connectionStatus === 'checking' ? '#fff3e0' : '#f5f5f5',
            border: `1px solid ${
              connectionStatus === 'connected' ? '#4caf50' : 
              connectionStatus === 'error' ? '#f44336' : 
              connectionStatus === 'checking' ? '#ff9800' : '#ddd'
            }`
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ 
                fontWeight: 'bold',
                color: connectionStatus === 'connected' ? '#2e7d32' : 
                       connectionStatus === 'error' ? '#d32f2f' : 
                       connectionStatus === 'checking' ? '#f57c00' : '#666'
              }}>
                Server Status
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {connectionStatus === 'checking' && (
                  <CircularProgress size={16} sx={{ color: '#ff9800' }} />
                )}
                <Typography variant="caption" sx={{ 
                  color: connectionStatus === 'connected' ? '#2e7d32' : 
                         connectionStatus === 'error' ? '#d32f2f' : 
                         connectionStatus === 'checking' ? '#f57c00' : '#666'
                }}>
                  {connectionStatus === 'connected' ? 'ONLINE' : 
                   connectionStatus === 'error' ? 'ERROR' : 
                   connectionStatus === 'checking' ? 'CHECKING' : 'UNKNOWN'}
                </Typography>
              </Box>
            </Box>
            
            <Typography variant="body2" sx={{ 
              color: connectionStatus === 'connected' ? '#2e7d32' : 
                     connectionStatus === 'error' ? '#d32f2f' : 
                     connectionStatus === 'checking' ? '#f57c00' : '#666',
              mb: 1
            }}>
              {serverInfo}
            </Typography>
            
            {connectionStatus === 'connected' && (
              <Typography variant="caption" sx={{ color: '#2e7d32' }}>
                Admin users available: {adminUsersCount}
              </Typography>
            )}
            
            {connectionStatus === 'error' && (
              <Typography variant="caption" sx={{ color: '#d32f2f' }}>
                Check your .env file and internet connection
              </Typography>
            )}
          </Box>
          
          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 3 }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading}
              sx={{ 
                py: 1.5,
                backgroundColor: '#333333',
                color: '#ffffff',
                '&:hover': {
                  backgroundColor: '#2a2a2a',
                },
                '&:disabled': {
                  backgroundColor: '#666666',
                  color: '#cccccc',
                },
                '&:active': {
                  backgroundColor: '#1a1a1a',
                }
              }}
            >
              {isLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} sx={{ color: '#ffffff' }} />
                  <span>Signing In...</span>
                </Box>
              ) : 'Sign In'}
            </Button>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
            Admin access only
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button
              onClick={handleTestConnection}
              variant="outlined"
              disabled={connectionStatus === 'checking'}
              sx={{ 
                flex: 1,
                borderColor: connectionStatus === 'connected' ? '#4caf50' : 
                            connectionStatus === 'error' ? '#f44336' : '#ddd',
                color: connectionStatus === 'connected' ? '#2e7d32' : 
                       connectionStatus === 'error' ? '#d32f2f' : '#666'
              }}
            >
              {connectionStatus === 'checking' ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} />
                  Testing...
                </Box>
              ) : (
                'Refresh Connection'
              )}
            </Button>
            
            {connectionStatus === 'checking' && (
              <Button
                onClick={() => {
                  setConnectionStatus('error');
                  setServerInfo('❌ Connection test cancelled');
                }}
                variant="outlined"
                color="error"
                sx={{ minWidth: 'auto' }}
              >
                Cancel
              </Button>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login; 