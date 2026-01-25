import React, { useEffect, useState } from 'react';
import {
    Box,
    Grid,
    CircularProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
    Typography,
    Container
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../services/apiFactory';
import type { StockRuleGroup } from '../models/types';
import { RuleCard } from '../components/RuleCard';
import { DashboardToolbar } from '../components/DashboardToolbar';
import { SearchOff as SearchOffIcon } from '@mui/icons-material';

export const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const [rules, setRules] = useState<StockRuleGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Delete state
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);

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

    const handleDeleteClick = (motherId: string) => {
        setRuleToDelete(motherId);
        setDeleteConfirmOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!ruleToDelete) return;

        try {
            const group = rules.find(r => r.motherItemId === ruleToDelete);
            if (group) {
                // Delete all rules in the group
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

    const handleEditChild = (motherId: string, childId: string) => {
        navigate(`/rules/${motherId}/edit/${childId}`);
    };

    const handleDeleteRule = async (motherId: string, childId: string) => {
        if (window.confirm('Are you sure you want to delete this link? This will remove all rules associated with this child publication.')) {
            try {
                await dataService.deleteStockRule(motherId, childId);
                await fetchRules();
            } catch (err) {
                console.error(err);
                setError('Failed to delete rule');
            }
        }
    };

    // Filter rules based on search term
    const filteredRules = rules.filter(rule => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            (rule.motherTitle?.toLowerCase() || '').includes(term)
        );
    });

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100', py: 4 }}>
            <Container maxWidth="xl">
                <DashboardToolbar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onNewLink={() => navigate('/rules/new')}
                />

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        {filteredRules.length > 0 ? (
                            <Grid container spacing={3}>
                                {filteredRules.map((group) => (
                                    // @ts-ignore
                                    <Grid item xs={12} sm={6} md={4} lg={3} key={group.motherItemId}>
                                        <RuleCard
                                            ruleGroup={group}
                                            onEditChild={handleEditChild}
                                            onDeleteGroup={handleDeleteClick}
                                            onDeleteRule={handleDeleteRule}
                                        />
                                    </Grid>
                                ))}
                            </Grid>
                        ) : (
                            <Box sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mt: 8,
                                opacity: 0.7
                            }}>
                                <SearchOffIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                                <Typography variant="h6" color="text.secondary">
                                    {searchTerm ? 'No rules found matching your search' : 'No rules found'}
                                </Typography>
                                {searchTerm && (
                                    <Button sx={{ mt: 1 }} onClick={() => setSearchTerm('')}>
                                        Clear Search
                                    </Button>
                                )}
                            </Box>
                        )}
                    </>
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
            </Container>
        </Box>
    );
};
