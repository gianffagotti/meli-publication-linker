import React from 'react';
import { Box, Card, CardContent, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Inventory2Icon from '@mui/icons-material/Inventory2';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 3 }}>
        Dashboard de Sincronización
      </Typography>
      <Card
        variant="outlined"
        sx={{
          maxWidth: 520,
          borderStyle: 'dashed',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <CardContent sx={{ textAlign: 'center', py: 4, px: 3 }}>
          <InfoOutlinedIcon sx={{ fontSize: 56, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" color="text.primary" gutterBottom>
            Próximamente
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Estadísticas de stock, logs de errores y alertas de sincronización.
          </Typography>
          <Button
            variant="contained"
            startIcon={<Inventory2Icon />}
            onClick={() => navigate('/rules')}
            size="large"
          >
            Ir a Reglas de Stock
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};
