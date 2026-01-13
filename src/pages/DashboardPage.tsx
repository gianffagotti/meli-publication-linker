import React from 'react';
import { Typography, Box, Grid as Grid, Paper, Card, CardContent } from '@mui/material';

const DashboardPage: React.FC = () => {
    return (
        <Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                Dashboard
            </Typography>
            <Typography variant="subtitle1" gutterBottom sx={{ color: 'text.secondary', mb: 4 }}>
                Welcome to the Znube Stock Admin Dashboard.
            </Typography>

            <Grid container spacing={3}>
                {/* Summary Cards */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card elevation={2}>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom>
                                Total Products
                            </Typography>
                            <Typography variant="h3" component="div">
                                1,234
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card elevation={2}>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom>
                                Pending Sync
                            </Typography>
                            <Typography variant="h3" component="div" color="warning.main">
                                56
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card elevation={2}>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom>
                                Errors
                            </Typography>
                            <Typography variant="h3" component="div" color="error.main">
                                3
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Main Content Area */}
                <Grid size={{ xs: 12 }}>
                    <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', minHeight: 240 }}>
                        <Typography variant="h6" gutterBottom>
                            Recent Activity
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            No recent activity to display.
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default DashboardPage;
