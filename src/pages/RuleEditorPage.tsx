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
    FormControl
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { ItemSearch } from '../components/Shared/ItemSearch';
import { dataService } from '../services/apiFactory';
import type { MeliItem, StockRule, StockRuleGroup } from '../models/types';

export const RuleEditorPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>(); // For edit mode (future use)

    const [selectedMother, setSelectedMother] = useState<MeliItem | null>(null);
    const [selectedChild, setSelectedChild] = useState<MeliItem | null>(null);
    const [loadingMother, setLoadingMother] = useState(false);
    const [loadingChild, setLoadingChild] = useState(false);
    const [rules, setRules] = useState<StockRule[]>([]);
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
            // Reset child and rules when mother changes
            setSelectedChild(null);
            setRules([]);
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
            // Don't clear rules immediately, maybe we want to keep mother selected?
            // But if child is removed, rules involving child are invalid.
            // For simplicity, let's clear rules or at least the child part of them.
            // Re-initializing rules is safer.
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
                // Try to find a matching child variation by SKU
                // We assume SKU might be contained or exact match.
                // Let's try exact match first, then loose match if needed.
                // Requirement says "Auto-match by SKU".
                const matchingChildVar = selectedChild.variations.find(cVar =>
                    cVar.sku === mVar.sku ||
                    (cVar.sku && mVar.sku && cVar.sku.toLowerCase() === mVar.sku.toLowerCase())
                );

                return {
                    motherUserProductId: mVar.user_product_id, // Using UPID as stable ID for rule
                    childUserProductId: matchingChildVar ? matchingChildVar.user_product_id : '',
                    type: 'PACK', // Default
                    packQuantity: 3, // Default for PACK
                    motherItemId: selectedMother.id,
                    childItemId: selectedChild.id,
                    active: true
                };
            });
            setRules(newRules);
        }
    }, [selectedMother, selectedChild]);

    const handleRuleChange = (index: number, field: keyof StockRule, value: any) => {
        const updatedRules = [...rules];
        updatedRules[index] = { ...updatedRules[index], [field]: value };

        // Auto-adjust quantity default based on type
        if (field === 'type') {
            if (value === 'FULL') {
                updatedRules[index].packQuantity = 1;
            } else if (value === 'PACK') {
                updatedRules[index].packQuantity = 3;
            }
        }

        setRules(updatedRules);
    };

    const handleSave = async () => {
        if (!selectedMother) return;

        setSaving(true);
        setError(null);

        try {
            // Filter out incomplete rules if necessary, or validate
            // For now, we save all.
            const ruleGroup: StockRuleGroup = {
                motherItemId: selectedMother.id,
                motherSku: selectedMother.sku,
                rules: rules.filter(r => r.childUserProductId) // Only save rules with a mapped child
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
            <Typography variant="h4" gutterBottom>
                {id ? 'Edit Stock Rules' : 'New Stock Link'}
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Grid container spacing={3}>
                {/* Left Panel: Mother Selection */}
                {/* @ts-ignore */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>Mother Publication (Source)</Typography>
                        <ItemSearch label="Search Mother Publication (Flex)..." onSelect={handleMotherSelect} />

                        {loadingMother && <CircularProgress sx={{ mt: 2 }} />}

                        {selectedMother && (
                            <Card sx={{ mt: 2, display: 'flex' }}>
                                <CardMedia
                                    component="img"
                                    sx={{ width: 100, objectFit: 'contain' }}
                                    image={selectedMother.thumbnail}
                                    alt={selectedMother.title}
                                />
                                <CardContent>
                                    <Typography variant="subtitle1">{selectedMother.title}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        ID: {selectedMother.id} <br />
                                        SKU: {selectedMother.sku} <br />
                                        Price: ${selectedMother.price}
                                    </Typography>
                                </CardContent>
                            </Card>
                        )}
                    </Paper>
                </Grid>

                {/* Right Panel: Child Selection */}
                {/* @ts-ignore */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>Child Publication (Target)</Typography>
                        {selectedMother ? (
                            <>
                                <ItemSearch label="Search Child Publication (Pack/Full)..." onSelect={handleChildSelect} />
                                {loadingChild && <CircularProgress sx={{ mt: 2 }} />}

                                {selectedChild && (
                                    <Card sx={{ mt: 2, display: 'flex' }}>
                                        <CardMedia
                                            component="img"
                                            sx={{ width: 100, objectFit: 'contain' }}
                                            image={selectedChild.thumbnail}
                                            alt={selectedChild.title}
                                        />
                                        <CardContent>
                                            <Typography variant="subtitle1">{selectedChild.title}</Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                ID: {selectedChild.id} <br />
                                                SKU: {selectedChild.sku} <br />
                                                Price: ${selectedChild.price}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                )}
                            </>
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                Please select a Mother publication first.
                            </Typography>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            {/* Matching Table */}
            {selectedMother && selectedChild && (
                <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom>Variation Matching</Typography>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Mother Variant</TableCell>
                                    <TableCell>Child Variant</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell>Quantity</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {selectedMother.variations.map((mVar, index) => {
                                    const rule = rules[index] || {};
                                    return (
                                        <TableRow key={mVar.id}>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {mVar.sku} (ID: {mVar.id})
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <FormControl fullWidth size="small">
                                                    <Select
                                                        value={rule.childUserProductId || ''}
                                                        onChange={(e) => handleRuleChange(index, 'childUserProductId', e.target.value)}
                                                        displayEmpty
                                                    >
                                                        <MenuItem value="">
                                                            <em>None</em>
                                                        </MenuItem>
                                                        {selectedChild.variations.map(cVar => (
                                                            <MenuItem key={cVar.id} value={cVar.user_product_id}>
                                                                {cVar.sku} (ID: {cVar.id})
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            </TableCell>
                                            <TableCell>
                                                <FormControl fullWidth size="small">
                                                    <Select
                                                        value={rule.type || 'PACK'}
                                                        onChange={(e) => handleRuleChange(index, 'type', e.target.value)}
                                                    >
                                                        <MenuItem value="PACK">PACK</MenuItem>
                                                        <MenuItem value="FULL">FULL</MenuItem>
                                                    </Select>
                                                </FormControl>
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    type="number"
                                                    size="small"
                                                    value={rule.packQuantity || 0}
                                                    onChange={(e) => handleRuleChange(index, 'packQuantity', parseInt(e.target.value, 10))}
                                                    inputProps={{ min: 1 }}
                                                />
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
                        >
                            {saving ? 'Saving...' : 'Save Rules'}
                        </Button>
                    </Box>
                </Box>
            )}
        </Box>
    );
};
