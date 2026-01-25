import React, { useEffect, useState } from 'react';
import {
    Box,
    Grid,
    CircularProgress,
    Alert,
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

    const handleEditChild = (motherId: string, childId: string) => {
        navigate(`/rules/${motherId}/edit/${childId}`);
    };

    const handleDeleteGroup = async (motherId: string) => {
        if (window.confirm('¿Está seguro de que desea eliminar este enlace? Esto eliminará todas las reglas asociadas con esta publicación hija.')) {
            try {
                await dataService.deleteStockRuleGroup(motherId);
                await fetchRules();
            } catch (err) {
                console.error(err);
                setError('Error al eliminar las reglas');
            }
        }
    };

    const handleDeleteRule = async (motherId: string, childId: string) => {
        if (window.confirm('¿Está seguro de que desea eliminar este enlace? Esto eliminará todas las reglas asociadas con esta publicación hija.')) {
            try {
                await dataService.deleteStockRule(motherId, childId);
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
                                            onDeleteGroup={handleDeleteGroup}
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
