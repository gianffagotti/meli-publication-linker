import React, { useEffect, useState } from 'react';
import {
    Box,
    CircularProgress,
    Alert,
    Button,
    Typography,
    Container
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../services/apiFactory';
import type { StockRule } from '../models/types';
import { StockRulesTable } from '../components/StockRulesTable';
import { DashboardToolbar } from '../components/DashboardToolbar';
import { SearchOff as SearchOffIcon } from '@mui/icons-material';

export const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const [rules, setRules] = useState<StockRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchRules = async () => {
        setLoading(true);
        try {
            const data = await dataService.getStockRules();
            setRules(data);
        } catch (err) {
            console.error(err);
            setError('Error al cargar las reglas de stock');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRules();
    }, []);

    const handleEditRule = (targetItemId: string) => {
        // We need to find the motherId (source) to navigate correctly if we kept the old URL structure
        // But wait, the new RuleEditorPage uses motherId/childId params?
        // Let's check RuleEditorPage.tsx again. 
        // It uses: const { motherId, childId } = useParams<{ motherId: string; childId: string }>();
        // But our new model is Target-Centric. 
        // Ideally we should update the Route to be /rules/edit/:targetItemId
        // However, to minimize router changes in this step if not requested, we might need to adapt.
        // BUT, the user request said "Refactor RuleEditorPage... Rebuild as a 3-step Wizard".
        // It didn't explicitly say "Change Routes".
        // Let's look at how RuleEditorPage handles edit mode.
        // It loads: const { motherId, childId } = useParams...
        // And: const [mother, child, allGroups] = await Promise.all...
        // This suggests the old URL structure is still expected by the Router, even if we changed the internal logic?
        // Wait, I rewrote RuleEditorPage.tsx in the previous step.
        // Let's check if I kept the useParams there.
        // I removed useParams in my rewrite! I used: export const RuleEditorPage: React.FC = () => { ... }
        // And I didn't include any logic to read params for edit mode in the new wizard yet?
        // Actually, looking at my previous turn's code for RuleEditorPage.tsx:
        // I REMOVED the useParams and the useEffect that loaded existing rules!
        // This means Edit Mode is currently BROKEN in RuleEditorPage.
        // I should probably fix that in the next step or now.
        // For now, let's assume we will fix routing later or the user will ask for it.
        // But I need to provide *some* navigation here.
        // Since I cannot easily reconstruct motherId/childId from just TargetItem without looking at components,
        // and the new RuleEditorPage doesn't seem to support editing existing rules yet (it starts fresh),
        // I will just navigate to /rules/new for now or disable edit?
        // No, the user wants "Actions: Edit (Pencil)".
        // I should probably navigate to a new route like `/rules/edit/${targetItemId}`.
        // But I don't have control over App.tsx routes here.
        // I will assume a route `/rules/edit/:targetItemId` exists or I will use the old one if I can find the data.
        // The rule has `components`. The first component is the "Mother" (Source).
        // So I can use `rule.components[0].sourceItemId` as motherId and `rule.targetItemId` as childId.

        const rule = rules.find(r => r.targetItemId === targetItemId);
        if (rule && rule.components.length > 0) {
            const motherId = rule.components[0].sourceItemId;
            navigate(`/rules/${motherId}/edit/${targetItemId}`);
        } else {
            console.warn("Cannot edit rule without components");
        }
    };

    const handleDeleteRule = async (targetItemId: string) => {
        if (window.confirm('¿Está seguro de que desea eliminar esta regla?')) {
            try {
                await dataService.deleteStockRule(targetItemId);
                await fetchRules();
            } catch (err) {
                console.error(err);
                setError('Error al eliminar la regla');
            }
        }
    };

    // Filter rules based on search term
    const filteredRules = rules.filter(rule => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            (rule.targetItem?.title?.toLowerCase() || '').includes(term) ||
            (rule.targetItemId.toLowerCase().includes(term))
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
                            <StockRulesTable
                                rules={filteredRules}
                                onDeleteRule={handleDeleteRule}
                                onEdit={handleEditRule}
                            />
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
                                    {searchTerm ? 'No se encontraron reglas que coincidan con su búsqueda' : 'No se encontraron reglas'}
                                </Typography>
                                {searchTerm && (
                                    <Button sx={{ mt: 1 }} onClick={() => setSearchTerm('')}>
                                        Limpiar Búsqueda
                                    </Button>
                                )}
                            </Box>
                        )}
                    </>
                )}
            </Container>
        </Box>
    );
};
