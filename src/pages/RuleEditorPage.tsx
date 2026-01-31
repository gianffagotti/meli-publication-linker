import React, { useState } from 'react';
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
    FormControl,
    Radio,
    RadioGroup,
    FormControlLabel,
    Stepper,
    Step,
    StepLabel,
    IconButton,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Divider,
    Chip,
    Avatar
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useParams } from 'react-router-dom';
import { ItemSearch } from '../components/Shared/ItemSearch';
import { dataService } from '../services/apiFactory';
import type { MeliItem, StockRule, RuleType, RuleComponent, VariantMapping } from '../models/types';

const STEPS = ['Seleccionar Objetivo', 'Definir Componentes', 'Mapear Variantes'];

export const RuleEditorPage: React.FC = () => {
    const navigate = useNavigate();
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // --- State: Step 1 (Target) ---
    const [ruleType, setRuleType] = useState<RuleType>('PACK');
    const [targetItem, setTargetItem] = useState<MeliItem | null>(null);

    // --- State: Step 2 (Components) ---
    const [components, setComponents] = useState<RuleComponent[]>([]);
    // We need full item details for sources to render Step 3, so we store them here
    const [sourceItemsDetails, setSourceItemsDetails] = useState<MeliItem[]>([]);

    // --- State: Step 3 (Mapping) ---
    // Key: targetVariantId, Value: { sourceItemId: sourceVariantId }
    const [mappings, setMappings] = useState<VariantMapping[]>([]);
    // Hydrated details for Target (fetched on entering Step 3)
    const [targetItemDetails, setTargetItemDetails] = useState<MeliItem | null>(null);

    const { targetItemId } = useParams<{ targetItemId: string }>();

    React.useEffect(() => {
        if (!targetItemId) return;

        const loadRule = async () => {
            setLoading(true);
            try {
                // 1. Get Rule Data
                const rule = await dataService.getStockRule(targetItemId);
                if (!rule) {
                    setError('Regla no encontrada.');
                    return;
                }

                // 2. Hydrate Target Item
                const targetDetails = await dataService.getItemDetails(rule.targetItemId);

                // 3. Hydrate Source Items (Parallel)
                const sourceDetailsPromises = rule.components.map(async (c) => {
                    try {
                        return await dataService.getItemDetails(c.sourceItemId);
                    } catch (e) {
                        console.error(`Error fetching source item ${c.sourceItemId}`, e);
                        return null;
                    }
                });
                const sourceItems = (await Promise.all(sourceDetailsPromises)).filter((i): i is MeliItem => i !== null);

                // 4. Update State
                setRuleType(rule.ruleType);
                setTargetItem(targetDetails);
                setComponents(rule.components);
                setSourceItemsDetails(sourceItems);
                setMappings(rule.mappings || []);

                // Optional: Load target details if we want to be ready for Step 3 immediately, 
                // but usually that happens on transition. 
                // However, if we are editing, we might want to have it ready.
                // Let's fetch it to be safe if the user jumps to step 3 (though we start at 0).
                // Actually, targetDetails IS the full item, so we might already have what we need 
                // if getItemDetails returns the full object including variations.
                setTargetItemDetails(targetDetails);

                // 5. Jump to Step 3 (Index 2) - Mapping
                setActiveStep(2);

            } catch (err) {
                console.error(err);
                setError('Error al cargar la regla para edición.');
            } finally {
                setLoading(false);
            }
        };
        loadRule();
    }, [targetItemId]);

    // --- Handlers: Step 1 ---
    const handleTargetSelect = (item: MeliItem | null) => {
        setTargetItem(item);
        // Reset subsequent steps if target changes
        setComponents([]);
        setSourceItemsDetails([]);
        setMappings([]);
        setTargetItemDetails(null);
    };

    // --- Handlers: Step 2 ---
    const handleAddSource = async (item: MeliItem | null) => {
        if (!item) return;

        // Validation: FULL/PACK allow only 1 source
        if ((ruleType === 'FULL' || ruleType === 'PACK') && components.length >= 1) {
            setError(`Las reglas tipo ${ruleType} solo pueden tener 1 componente.`);
            return;
        }

        // Check duplicate
        if (components.some(c => c.sourceItemId === item.id)) {
            setError('Este componente ya ha sido agregado.');
            return;
        }

        setError(null);
        setLoading(true);
        try {
            // Fetch full details immediately to have them ready
            const fullItem = await dataService.getItemDetails(item.id);

            setComponents([...components, { sourceItemId: item.id, quantity: 1 }]);
            setSourceItemsDetails([...sourceItemsDetails, fullItem]);
        } catch (err) {
            console.error(err);
            setError('Error al cargar detalles del componente.');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveSource = (itemId: string) => {
        setComponents(components.filter(c => c.sourceItemId !== itemId));
        setSourceItemsDetails(sourceItemsDetails.filter(i => i.id !== itemId));
    };

    const handleQuantityChange = (itemId: string, qty: number) => {
        setComponents(components.map(c =>
            c.sourceItemId === itemId ? { ...c, quantity: qty } : c
        ));
    };

    // --- Handlers: Step 3 ---
    // Helper to generate "Surtido" / Grouped options
    const getSourceOptions = (sourceItem: MeliItem) => {
        const options: { value: string; label: string; isGroup?: boolean }[] = [];

        // 1. Individual Variants
        sourceItem.variations.forEach(v => {
            options.push({
                value: v.id.toString(),
                label: `${v.sku || 'Sin SKU'} - ${v.description || 'Sin Desc'}`,
                isGroup: false
            });
        });

        // 2. Grouped Options (Surtido Logic)
        // Simple heuristic: Group by "Size" if description contains typical size patterns or attributes
        // For now, let's assume description is "Color Size" or similar.
        // We will try to extract the "Size" part.
        // A more robust way would be to use structured attributes if available in MeliItem (not currently in our interface).
        // Let's implement a basic "By Size" grouping assuming the last word is size if > 1 word.

        const sizeGroups: { [size: string]: string[] } = {};

        sourceItem.variations.forEach(v => {
            if (!v.description) return;
            const parts = v.description.split(' ');
            if (parts.length > 1) {
                const size = parts[parts.length - 1]; // Assume last part is size
                if (!sizeGroups[size]) sizeGroups[size] = [];
                sizeGroups[size].push(v.id.toString());
            }
        });

        Object.keys(sizeGroups).forEach(size => {
            // Only add group if it covers more than 1 variant
            if (sizeGroups[size].length > 1) {
                options.push({
                    value: `GROUP:SIZE:${size}`,
                    label: `Cualquier Color - Talle ${size}`,
                    isGroup: true
                });
            }
        });

        return options;
    };

    const handleMappingChange = (targetVarId: string, sourceItemId: string, sourceVarId: string) => {
        const newMappings = [...mappings];
        let mappingIndex = newMappings.findIndex(m => m.targetVariantId === targetVarId);

        if (mappingIndex === -1) {
            // Create new mapping entry
            newMappings.push({
                targetVariantId: targetVarId,
                sourceMatches: { [sourceItemId]: sourceVarId }
            });
        } else {
            // Update existing
            newMappings[mappingIndex] = {
                ...newMappings[mappingIndex],
                sourceMatches: {
                    ...newMappings[mappingIndex].sourceMatches,
                    [sourceItemId]: sourceVarId
                }
            };
        }
        setMappings(newMappings);
    };

    const getMappedValue = (targetVarId: string, sourceItemId: string): string => {
        const mapping = mappings.find(m => m.targetVariantId === targetVarId);
        return mapping?.sourceMatches?.[sourceItemId] || '';
    };

    // --- Navigation Handlers ---
    const handleNext = async () => {
        if (activeStep === 0) {
            if (!targetItem) {
                setError('Seleccione un artículo objetivo.');
                return;
            }
        }

        if (activeStep === 1) {
            if (components.length === 0) {
                setError('Agregue al menos un componente.');
                return;
            }
            // Fetch target details before moving to Step 3
            setLoading(true);
            try {
                const details = await dataService.getItemDetails(targetItem!.id);
                setTargetItemDetails(details);

                // Initialize mappings if empty
                if (mappings.length === 0) {
                    // Auto-match logic could go here (e.g. by SKU)
                    // For now, start empty
                }
            } catch (err) {
                console.error(err);
                setError('Error al cargar detalles del objetivo.');
                setLoading(false);
                return;
            } finally {
                setLoading(false);
            }
        }

        setError(null);
        setActiveStep((prev) => prev + 1);
    };

    const handleBack = () => {
        setActiveStep((prev) => prev - 1);
    };

    const handleSave = async () => {
        if (!targetItem) return;

        setLoading(true);
        try {
            const rule: StockRule = {
                targetItemId: targetItem.id,
                ruleType,
                components,
                mappings
            };

            await dataService.saveStockRule(rule);
            navigate('/');
        } catch (err) {
            console.error(err);
            setError('Error al guardar la regla.');
        } finally {
            setLoading(false);
        }
    };

    // --- Render Steps ---

    const renderStep1 = () => (
        <Grid container spacing={3}>
            {/* @ts-ignore */}
            <Grid item xs={12} md={6}>
                <Card variant="outlined">
                    <CardContent>
                        <Typography variant="h6" gutterBottom>1. Tipo de Regla</Typography>
                        <FormControl component="fieldset">
                            <RadioGroup
                                value={ruleType}
                                onChange={(e) => setRuleType(e.target.value as RuleType)}
                            >
                                <FormControlLabel value="PACK" control={<Radio />} label="PACK (Mismo producto x Cantidad)" />
                                <FormControlLabel value="FULL" control={<Radio />} label="FULL (1 a 1 directo)" />
                                <FormControlLabel value="COMBO" control={<Radio />} label="COMBO (Múltiples productos distintos)" />
                            </RadioGroup>
                        </FormControl>
                    </CardContent>
                </Card>
            </Grid>
            {/* @ts-ignore */}
            <Grid item xs={12} md={6}>
                <Card variant="outlined">
                    <CardContent>
                        <Typography variant="h6" gutterBottom>2. Artículo Objetivo (Publicación)</Typography>
                        <ItemSearch label="Buscar Publicación a controlar..." onSelect={handleTargetSelect} />

                        {targetItem && (
                            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                                <CardMedia
                                    component="img"
                                    sx={{ width: 80, height: 80, objectFit: 'contain', borderRadius: 1, border: '1px solid #eee' }}
                                    image={targetItem.thumbnail}
                                    alt={targetItem.title}
                                />
                                <Box>
                                    <Typography variant="subtitle2" fontWeight="bold">{targetItem.title}</Typography>
                                    <Typography variant="caption" color="text.secondary">{targetItem.id}</Typography>
                                </Box>
                            </Box>
                        )}
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );

    const renderStep2 = () => (
        <Grid container spacing={3}>
            {/* @ts-ignore */}
            <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                    Componentes para: <strong>{targetItem?.title}</strong>
                </Typography>
                <Alert severity="info" sx={{ mb: 2 }}>
                    {ruleType === 'PACK' && 'Seleccione el producto unitario y defina la cantidad por pack.'}
                    {ruleType === 'FULL' && 'Seleccione el producto equivalente (1 a 1).'}
                    {ruleType === 'COMBO' && 'Agregue todos los productos que componen el combo.'}
                </Alert>

                <Box sx={{ mb: 3 }}>
                    <ItemSearch label="Agregar Componente (Ingrediente)..." onSelect={handleAddSource} />
                </Box>

                <Paper variant="outlined">
                    <List>
                        {components.map((comp, index) => {
                            const details = sourceItemsDetails.find(i => i.id === comp.sourceItemId);
                            return (
                                <React.Fragment key={comp.sourceItemId}>
                                    <ListItem>
                                        <Box sx={{ mr: 2 }}>
                                            <Avatar src={details?.thumbnail} variant="rounded" />
                                        </Box>
                                        <ListItemText
                                            primary={details?.title || comp.sourceItemId}
                                            secondary={`ID: ${comp.sourceItemId}`}
                                        />
                                        <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                                            <TextField
                                                label="Cantidad"
                                                type="number"
                                                size="small"
                                                value={comp.quantity}
                                                onChange={(e) => handleQuantityChange(comp.sourceItemId, parseInt(e.target.value) || 1)}
                                                sx={{ width: 100 }}
                                                inputProps={{ min: 1 }}
                                            />
                                        </Box>
                                        <ListItemSecondaryAction>
                                            <IconButton edge="end" aria-label="delete" onClick={() => handleRemoveSource(comp.sourceItemId)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                    {index < components.length - 1 && <Divider />}
                                </React.Fragment>
                            );
                        })}
                        {components.length === 0 && (
                            <ListItem>
                                <ListItemText primary="No hay componentes agregados." sx={{ color: 'text.secondary', textAlign: 'center' }} />
                            </ListItem>
                        )}
                    </List>
                </Paper>
            </Grid>
        </Grid>
    );

    const renderStep3 = () => (
        <Box>
            <Typography variant="h6" gutterBottom>Matriz de Variantes</Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
                Relacione cada variante del objetivo con las variantes de los componentes.
            </Typography>

            <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                    <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                        <TableRow>
                            <TableCell><strong>Variante Objetivo</strong></TableCell>
                            {components.map(comp => {
                                const details = sourceItemsDetails.find(i => i.id === comp.sourceItemId);
                                return (
                                    <TableCell key={comp.sourceItemId}>
                                        <strong>{details?.title?.substring(0, 30)}...</strong>
                                        <br />
                                        <Typography variant="caption">(Qty: {comp.quantity})</Typography>
                                    </TableCell>
                                );
                            })}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {targetItemDetails?.variations.map(targetVar => (
                            <TableRow key={targetVar.id}>
                                <TableCell>
                                    <Typography variant="body2" fontWeight="medium">
                                        {targetVar.description}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {targetVar.sku || 'No SKU'}
                                    </Typography>
                                </TableCell>
                                {components.map(comp => {
                                    const details = sourceItemsDetails.find(i => i.id === comp.sourceItemId);
                                    if (!details) return <TableCell key={comp.sourceItemId}>Error</TableCell>;

                                    const options = getSourceOptions(details);

                                    return (
                                        <TableCell key={comp.sourceItemId}>
                                            <FormControl fullWidth size="small">
                                                <Select
                                                    value={getMappedValue(targetVar.id.toString(), comp.sourceItemId)}
                                                    onChange={(e) => handleMappingChange(targetVar.id.toString(), comp.sourceItemId, e.target.value)}
                                                    displayEmpty
                                                >
                                                    <MenuItem value=""><em>Sin Asignar</em></MenuItem>
                                                    {options.map(opt => (
                                                        <MenuItem key={opt.value} value={opt.value}>
                                                            {opt.isGroup && <Chip label="Grupo" size="small" color="info" sx={{ mr: 1, height: 20 }} />}
                                                            {opt.label}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );

    return (
        <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
            <Box sx={{ mb: 2 }}>
                <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/')}>
                    Volver
                </Button>
            </Box>

            <Paper sx={{ p: 3, mb: 3 }}>
                <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                    {STEPS.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}

                <Box sx={{ minHeight: 300 }}>
                    {activeStep === 0 && renderStep1()}
                    {activeStep === 1 && renderStep2()}
                    {activeStep === 2 && renderStep3()}
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4, pt: 2, borderTop: '1px solid #eee' }}>
                    <Button
                        disabled={activeStep === 0}
                        onClick={handleBack}
                        sx={{ mr: 1 }}
                    >
                        Atrás
                    </Button>
                    {activeStep === STEPS.length - 1 ? (
                        <Button
                            variant="contained"
                            onClick={handleSave}
                            disabled={loading}
                        >
                            {loading ? 'Guardando...' : 'Guardar Regla'}
                        </Button>
                    ) : (
                        <Button
                            variant="contained"
                            onClick={handleNext}
                            disabled={loading}
                        >
                            Siguiente
                        </Button>
                    )}
                </Box>
            </Paper>
        </Box>
    );
};
