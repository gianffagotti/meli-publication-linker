import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Button,
    Grid,
    Card,
    CardContent,
    CardActions,
    CircularProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../services/apiFactory';
import type { StockRuleGroup } from '../models/types';

export const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const [rules, setRules] = useState<StockRuleGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [ruleToDelete, setRuleToDelete] = useState<{ motherId: string, childId: string } | null>(null);

    const fetchRules = async () => {
        setLoading(true);
        try {
            const data = await dataService.getStockRules();
            setRules(data);
        } catch (err) {
            console.error(err);
            setError('Failed to load stock rules');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRules();
    }, []);

    const handleEdit = (id: string) => {
        navigate(`/rules/edit/${id}`);
    };

    const handleDeleteClick = (motherId: string) => {
        setRuleToDelete({ motherId, childId: '' });
        setDeleteConfirmOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!ruleToDelete) return;

        try {
            const group = rules.find(r => r.motherItemId === ruleToDelete.motherId);
            if (group) {
                for (const rule of group.rules) {
                    await dataService.deleteStockRule(rule.motherItemId, rule.childItemId);
                }
                await fetchRules();
            }
        } catch (err) {
            console.error(err);
            setError('Failed to delete rules');
        } finally {
            setDeleteConfirmOpen(false);
            setRuleToDelete(null);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">Stock Rules Dashboard</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/rules/new')}
                >
                    New Link
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {loading ? (
                <CircularProgress />
            ) : (
                <Grid container spacing={3}>
                    {rules.map((group) => (
                        // @ts-ignore
                        <Grid item xs={12} sm={6} md={4} key={group.motherItemId}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" noWrap title={group.motherSku}>
                                        {group.motherSku}
                                    </Typography>
                                    <Typography color="text.secondary" gutterBottom>
                                        ID: {group.motherItemId}
                                    </Typography>
                                    <Typography variant="body2">
                                        Mapped Rules: {group.rules.length}
                                    </Typography>
                                    <Box sx={{ mt: 1 }}>
                                        {group.rules.slice(0, 3).map((r, idx) => (
                                            <Typography key={idx} variant="caption" display="block">
                                                - {r.type} x{r.packQuantity} ({r.childUserProductId})
                                            </Typography>
                                        ))}
                                        {group.rules.length > 3 && <Typography variant="caption">...</Typography>}
                                    </Box>
                                </CardContent>
                                <CardActions>
                                    <Button
                                        size="small"
                                        startIcon={<EditIcon />}
                                        onClick={() => handleEdit(group.motherItemId)}
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        size="small"
                                        color="error"
                                        startIcon={<DeleteIcon />}
                                        onClick={() => handleDeleteClick(group.motherItemId)}
                                    >
                                        Delete
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                    {rules.length === 0 && (
                        // @ts-ignore
                        <Grid item xs={12}>
                            <Typography variant="body1" color="text.secondary" align="center">
                                No rules found. Create a new link to get started.
                            </Typography>
                        </Grid>
                    )}
                </Grid>
            )}

            <Dialog
                open={deleteConfirmOpen}
                onClose={() => setDeleteConfirmOpen(false)}
            >
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete all rules for this Mother publication? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
                    <Button onClick={handleDeleteConfirm} color="error" autoFocus>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
