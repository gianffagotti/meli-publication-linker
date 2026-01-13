import React from 'react';
import { Box, Button, Container, Paper, Typography } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
    const { login, user, isLoading } = useAuth();

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (user) {
        return <Navigate to="/" replace />;
    }

    return (
        <Container maxWidth="sm" sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Welcome to Stock Manager
                </Typography>
                <Box sx={{ mt: 2 }}>
                    <Button variant="contained" color="primary" size="large" onClick={login}>
                        Login with Microsoft
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default LoginPage;
