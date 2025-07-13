import React, { useState, useRef } from 'react';
import { Box, Container, Paper, Alert, Typography, CircularProgress } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const Dashboard = () => {
  const [currentTab, setCurrentTab] = useState<string>('support');
  const { user, loading } = useAuth();
  const [dbConnectionStatus, setDbConnectionStatus] = useState<{
    checking: boolean;
    connected: boolean;
    error: string | null;
  }>({
    checking: true,
    connected: false,
    error: null
  });
  
  // Check Supabase connection
  React.useEffect(() => {
    const checkConnection = async () => {
      try {
        // Try a simple query to check connection
        const healthCheck = await supabase.from('users').select('count').limit(1);
        
        if (healthCheck.error) {
          throw healthCheck.error;
        }
        
        setDbConnectionStatus({
          checking: false,
          connected: true,
          error: null
        });
        
        console.log("Supabase connection successful");
      } catch (err: any) {
        console.error('Supabase connection error:', err);
        setDbConnectionStatus({
          checking: false,
          connected: false,
          error: err.message || 'Failed to connect to Supabase'
        });
      }
    };
    
    checkConnection();
  }, []);
  
  // If user is not authenticated and not loading, redirect to login
  if (!loading && !user) {
    return <Navigate to="/" replace />;
  }
  
  const renderTabContent = () => {
    if (dbConnectionStatus.checking) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress color="primary" />
        </Box>
      );
    }
    
    if (!dbConnectionStatus.connected) {
      return (
        <Alert severity="error" sx={{ m: 2 }}>
          <Typography variant="h6">Database Connection Error</Typography>
          <Typography variant="body1">{dbConnectionStatus.error}</Typography>
          <Typography variant="body2" sx={{ mt: 2 }}>
            Please check your Supabase configuration in src/lib/supabase.ts:
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            1. Set REACT_APP_SUPABASE_URL in your .env file
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            2. Set REACT_APP_SUPABASE_ANON_KEY in your .env file
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            3. Ensure the database has the necessary tables: users, communities, support_requests, reports
          </Typography>
        </Alert>
      );
    }
    
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h5" gutterBottom>
          Welcome to Momu Admin Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Database connected successfully! The admin components will be implemented next.
        </Typography>
        
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Available Sections:
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            • Users Management
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            • Communities Management
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            • Support Requests
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            • Reports & Moderation
          </Typography>
        </Box>
      </Box>
    );
  };
  
  if (loading) {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #151320 0%, #28154A 50%, #4C1B8C 100%)',
        }}
      >
        <CircularProgress color="primary" />
      </Box>
    );
  }
  
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #151320 0%, #28154A 50%, #4C1B8C 100%)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h4" sx={{ color: 'white', mb: 2 }}>
          Momu Admin Dashboard
        </Typography>
      </Box>
      
      <Box sx={{ mt: 2, mb: 2 }}>
        <Container maxWidth="lg">
          <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ p: { xs: 2, md: 3 } }}>
              {renderTabContent()}
            </Box>
          </Paper>
        </Container>
      </Box>
    </Box>
  );
};

export default Dashboard; 