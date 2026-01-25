import React from 'react';
import { AppBar, Box, Button, Container, Toolbar, Typography, CssBaseline } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const MainLayout: React.FC = () => {
    const { user, logout } = useAuth();

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'grey.100' }}>
            <CssBaseline />
            <AppBar position="static" elevation={0} sx={{ bgcolor: 'primary.main' }}>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
                        Gestor de Stock
                    </Typography>
                    {user && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="body2" sx={{ color: 'inherit' }}>{user.userDetails}</Typography>
                            <Button color="inherit" variant="outlined" onClick={logout} size="small" sx={{ borderColor: 'rgba(255,255,255,0.5)' }}>
                                Cerrar Sesión
                            </Button>
                        </Box>
                    )}
                </Toolbar>
            </AppBar>
            <Container component="main" maxWidth="xl" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
                <Outlet />
            </Container>
        </Box>
    );
};

export default MainLayout;
