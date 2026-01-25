import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    CardMedia,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Select,
    MenuItem,
    TextField,
    Button,
    Alert,
    CircularProgress,
    FormControl,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormLabel
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useParams } from 'react-router-dom';
import { ItemSearch } from '../components/Shared/ItemSearch';
import { dataService } from '../services/apiFactory';
import type { MeliItem, StockRule, StockRuleGroup } from '../models/types';

export const RuleEditorPage: React.FC = () => {
    const navigate = useNavigate();
    const { motherId, childId } = useParams<{ motherId: string; childId: string }>(); // For edit mode

    const [selectedMother, setSelectedMother] = useState<MeliItem | null>(null);
    const [selectedChild, setSelectedChild] = useState<MeliItem | null>(null);
    const [loadingMother, setLoadingMother] = useState(false);
    const [loadingChild, setLoadingChild] = useState(false);

    // Global Configuration State
    const [childType, setChildType] = useState<'PACK' | 'FULL'>('PACK');
    const [globalQuantity, setGlobalQuantity] = useState<number>(3);

    const [rules, setRules] = useState<StockRule[]>([]);
    const [existingRules, setExistingRules] = useState<StockRule[] | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch full details when a mother item is selected
    const handleMotherSelect = async (item: MeliItem | null) => {
        if (!item) {
            setSelectedMother(null);
            setRules([]);
            return;
        }
        setLoadingMother(true);
        try {
            const fullItem = await dataService.getItemDetails(item.id);
            setSelectedMother(fullItem);
            setSelectedMother(fullItem);
            // Reset child and rules when mother changes
            setSelectedChild(null);
            setRules([]);
            setExistingRules(null);
        } catch (err) {
            console.error(err);
            setError('Failed to load Mother item details');
        } finally {
            setLoadingMother(false);
        }
    };

    // Fetch full details when a child item is selected
    const handleChildSelect = async (item: MeliItem | null) => {
        if (!item) {
            setSelectedChild(null);
            setRules([]);
            return;
        }
        setLoadingChild(true);
        try {
            const fullItem = await dataService.getItemDetails(item.id);
            setSelectedChild(fullItem);
        } catch (err) {
            console.error(err);
            setError('Failed to load Child item details');
        } finally {
            setLoadingChild(false);
        }
    };

    // Auto-match logic
    useEffect(() => {
        if (selectedMother && selectedChild) {
            const newRules: StockRule[] = selectedMother.variations.map(mVar => {
                // Check if we have an existing rule for this variation
                if (existingRules) {
                    const savedRule = existingRules.find(r => r.motherUserProductId === mVar.user_product_id);
                    if (savedRule) {
                        return {
                            ...savedRule,
                            motherItemId: selectedMother.id,
                            childItemId: selectedChild.id
                        };
                    }
                }

                // Try to find a matching child variation by SKU
                const matchingChildVar = selectedChild.variations.find(cVar =>
                    cVar.sku === mVar.sku ||
                    (cVar.sku && mVar.sku && cVar.sku.toLowerCase() === mVar.sku.toLowerCase())
                );

                return {
                    motherUserProductId: mVar.user_product_id,
                    childUserProductId: matchingChildVar ? matchingChildVar.user_product_id : '',
                    // These will be overridden by global state on save, but we keep them in structure for now
                    type: childType,
                    packQuantity: globalQuantity,
                    motherItemId: selectedMother.id,
                    childItemId: selectedChild.id,
                    active: true
                };
            });
            setRules(newRules);
        }
    }, [selectedMother, selectedChild, existingRules]); // We don't re-run on childType/globalQuantity change to avoid resetting manual matches

    // Load existing rule if in edit mode
    useEffect(() => {
        const loadExistingRule = async () => {
            if (!motherId || !childId) return;

            try {
                setLoadingMother(true);
                setLoadingChild(true);

                // Load Mother and Child in parallel
                const [mother, child, allGroups] = await Promise.all([
                    dataService.getItemDetails(motherId),
                    dataService.getItemDetails(childId),
                    dataService.getStockRules()
                ]);

                setSelectedMother(mother);
                setSelectedChild(child);

                const group = allGroups.find(g => g.motherItemId === motherId);

                if (group && group.rules.length > 0) {
                    // Find the rule specifically for this child if possible, or default to first
                    // In the current data model, a group is by mother, and rules list children.
                    // We should find the rule corresponding to this childId.
                    const ruleForChild = group.rules.find(r => r.childItemId === childId) || group.rules[0];

                    // Set Config
                    setChildType(ruleForChild.type);
                    setGlobalQuantity(ruleForChild.packQuantity);

                    // Set Existing Rules for the auto-match effect to pick up
                    setExistingRules(group.rules);
                }
            } catch (err) {
                console.error(err);
                setError('Failed to load existing rules');
            } finally {
                setLoadingMother(false);
                setLoadingChild(false);
            }
        };

        loadExistingRule();
    }, [motherId, childId]);

    const handleRuleChange = (index: number, field: keyof StockRule, value: any) => {
        const updatedRules = [...rules];
        updatedRules[index] = { ...updatedRules[index], [field]: value };
        setRules(updatedRules);
    };

    const handleSave = async () => {
        if (!selectedMother) return;
        if (!selectedChild) return;

        setSaving(true);
        setError(null);

        try {
            // Apply global configuration to all rules being saved
            const finalRules = rules
                .filter(r => r.childUserProductId) // Only save rules with a mapped child
                .map(r => ({
                    ...r,
                    type: childType,
                    packQuantity: childType === 'PACK' ? globalQuantity : 1,
                    childTitle: selectedChild.title
                }));

            const ruleGroup: StockRuleGroup = {
                motherItemId: selectedMother.id,
                rules: finalRules,
                motherTitle: selectedMother.title,
                motherThumbnail: selectedMother.thumbnail
            };

            await dataService.saveStockRule(ruleGroup);
            navigate('/');
        } catch (err) {
            console.error(err);
            setError('Failed to save rules');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 2 }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/')}
                    variant="text"
                    sx={{ mb: 1 }}
                >
                    Volver al Dashboard
                </Button>
            </Box>
            <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
                {motherId ? 'Editar Regla' : 'Nueva Regla'}
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Grid container spacing={4}>
                {/* Left Panel: Mother Selection */}
                {/* @ts-ignore */}
                <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom color="primary">1. Seleccionar Origen (Madre)</Typography>
                            <Box sx={{ mb: 2 }}>
                                <ItemSearch label="Buscar Publicación Madre..." onSelect={handleMotherSelect} />
                            </Box>

                            {loadingMother && <CircularProgress sx={{ mt: 2 }} />}

                            {selectedMother && (
                                <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                    <CardMedia
                                        component="img"
                                        sx={{ width: 100, height: 100, objectFit: 'contain', borderRadius: 1, border: '1px solid #eee' }}
                                        image={selectedMother.thumbnail}
                                        alt={selectedMother.title}
                                    />
                                    <Box>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{selectedMother.title}</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            ID: {selectedMother.id} <br />
                                        </Typography>
                                    </Box>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Right Panel: Child Selection & Config */}
                {/* @ts-ignore */}
                <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom color="primary">2. Seleccionar Destino (Hija) y Configurar</Typography>

                            {selectedMother ? (
                                <>
                                    <Box sx={{ mb: 2 }}>
                                        <ItemSearch label="Buscar Publicación Hija..." onSelect={handleChildSelect} />
                                    </Box>

                                    {loadingChild && <CircularProgress sx={{ mt: 2 }} />}

                                    {selectedChild && (
                                        <>
                                            <Box sx={{ mt: 2, mb: 3, display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                                <CardMedia
                                                    component="img"
                                                    sx={{ width: 100, height: 100, objectFit: 'contain', borderRadius: 1, border: '1px solid #eee' }}
                                                    image={selectedChild.thumbnail}
                                                    alt={selectedChild.title}
                                                />
                                                <Box>
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{selectedChild.title}</Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        ID: {selectedChild.id} <br />
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #eee' }}>
                                                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>Configuración de la Relación</Typography>

                                                <FormControl component="fieldset">
                                                    <FormLabel component="legend">Tipo de Relación</FormLabel>
                                                    <RadioGroup
                                                        row
                                                        aria-label="child-type"
                                                        name="child-type"
                                                        value={childType}
                                                        onChange={(e) => setChildType(e.target.value as 'PACK' | 'FULL')}
                                                    >
                                                        <FormControlLabel value="PACK" control={<Radio />} label="PACK (N:1)" />
                                                        <FormControlLabel value="FULL" control={<Radio />} label="FULL (1:1)" />
                                                    </RadioGroup>
                                                </FormControl>

                                                {childType === 'PACK' && (
                                                    <Box sx={{ mt: 2 }}>
                                                        <TextField
                                                            label="Cantidad por Pack"
                                                            type="number"
                                                            variant="outlined"
                                                            size="small"
                                                            value={globalQuantity}
                                                            onChange={(e) => setGlobalQuantity(parseInt(e.target.value, 10) || 0)}
                                                            inputProps={{ min: 1 }}
                                                            helperText="Cuántas unidades de la Madre forman 1 unidad de la Hija?"
                                                        />
                                                    </Box>
                                                )}
                                            </Box>
                                        </>
                                    )}
                                </>
                            ) : (
                                <Alert severity="info" variant="outlined">
                                    Por favor seleccione una publicación Madre primero.
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Matching Table */}
            {selectedMother && selectedChild && (
                <Card sx={{ mt: 4 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">Variantes</Typography>
                            <Typography variant="subtitle2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                Relacionando variantes como: <strong>{childType === 'PACK' ? `PACK x${globalQuantity}` : 'FULL (1:1)'}</strong>
                            </Typography>
                        </Box>

                        <TableContainer component={Paper} elevation={0} variant="outlined">
                            <Table>
                                <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                                    <TableRow>
                                        <TableCell>Variante Madre (Origen)</TableCell>
                                        <TableCell>Variante Hija (Destino)</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {selectedMother.variations.map((mVar, index) => {
                                        const rule = rules[index] || {};
                                        return (
                                            <TableRow key={mVar.id}>
                                                <TableCell sx={{ width: '50%' }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                                        {mVar.sku || 'No SKU'}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Desc: {mVar.description}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell sx={{ width: '50%' }}>
                                                    <FormControl fullWidth size="small">
                                                        <Select
                                                            value={rule.childUserProductId || ''}
                                                            onChange={(e) => handleRuleChange(index, 'childUserProductId', e.target.value)}
                                                            displayEmpty
                                                        >
                                                            <MenuItem value="">
                                                                <em>Sin Asignar</em>
                                                            </MenuItem>
                                                            {selectedChild.variations.map(cVar => (
                                                                <MenuItem key={cVar.id} value={cVar.user_product_id}>
                                                                    {cVar.sku || 'No SKU'} (Desc: {cVar.description})
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                variant="contained"
                                color="primary"
                                size="large"
                                onClick={handleSave}
                                disabled={saving}
                                sx={{ minWidth: 150 }}
                            >
                                {saving ? 'Guardando...' : 'Guardar Reglas'}
                            </Button>
                        </Box>
                    </CardContent>
                </Card>
            )}
        </Box>
    );
};
