import React from 'react';
import {
  AppBar,
  Box,
  Button,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  CssBaseline,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardIcon from '@mui/icons-material/Dashboard';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import IconButton from '@mui/material/IconButton';

const DRAWER_WIDTH = 260;

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
  { label: 'Reglas de Stock', path: '/rules', icon: <Inventory2Icon /> },
] as const;

const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => setMobileOpen((v) => !v);
  const handleNav = (path: string) => {
    navigate(path);
    if (isSmall) setMobileOpen(false);
  };

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar
        sx={{
          minHeight: { xs: 56, sm: 64 },
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="h6" component="div" sx={{ fontWeight: 700, color: 'primary.main' }}>
          Gestor de Stock
        </Typography>
      </Toolbar>
      <List component="nav" sx={{ px: 1, py: 2, flex: 1 }}>
        {navItems.map(({ label, path, icon }) => (
          <ListItemButton
            key={path}
            selected={isActive(path)}
            onClick={() => handleNav(path)}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              '&.Mui-selected': {
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': { bgcolor: 'primary.dark' },
                '& .MuiListItemIcon-root': { color: 'primary.contrastText' },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: isActive(path) ? 'primary.contrastText' : 'text.secondary' }}>
              {icon}
            </ListItemIcon>
            <ListItemText primary={label} primaryTypographyProps={{ fontWeight: 500 }} />
          </ListItemButton>
        ))}
      </List>
      {user && (
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" display="block" noWrap title={user.userDetails}>
            {user.userDetails}
          </Typography>
          <Button
            fullWidth
            startIcon={<LogoutIcon />}
            onClick={logout}
            size="small"
            color="inherit"
            sx={{ mt: 1, justifyContent: 'flex-start' }}
          >
            Cerrar Sesión
          </Button>
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'grey.50' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}
      >
        <Toolbar variant="dense">
          {isSmall && (
            <>
              <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 1 }}>
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Gestor de Stock
              </Typography>
            </>
          )}
          <Box sx={{ flexGrow: 1 }} />
          {user && !isSmall && (
            <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }} noWrap>
              {user.userDetails}
            </Typography>
          )}
          {isSmall && (
            <Button color="inherit" size="small" startIcon={<LogoutIcon />} onClick={logout}>
              Salir
            </Button>
          )}
        </Toolbar>
      </AppBar>
      <Drawer
        variant={isSmall ? 'temporary' : 'permanent'}
        open={isSmall ? mobileOpen : true}
        onClose={isSmall ? handleDrawerToggle : undefined}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            top: { xs: 0, md: 56 },
            height: { xs: '100%', md: 'calc(100% - 56px)' },
            borderRight: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
          },
        }}
      >
        {drawer}
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { xs: '100%', md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { xs: 0, md: 0 },
          mt: { xs: 7, sm: 8 },
          minHeight: 'calc(100vh - 56px)',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default MainLayout;
