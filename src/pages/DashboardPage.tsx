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
        navigate(`/rules/edit/${targetItemId}`);
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
