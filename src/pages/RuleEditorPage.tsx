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
    Avatar,
    Stack
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useParams } from 'react-router-dom';
import { ItemSearch } from '../components/Shared/ItemSearch';
import { dataService } from '../services/apiFactory';
import type { MeliItem, StockRule, RuleType, RuleComponent, VariantMapping, RuleSourceMatchPayload } from '../models/types';

const STEPS = ['Seleccionar Objetivo', 'Definir Componentes', 'Mapear Variantes'];
const STEPS_FULL = ['Seleccionar Objetivo', 'Definir Componentes'];

/** Backend does not accept this value as sourceVariantId; send null for "surtido". */
const GROUP_OPTION_PREFIX = 'GROUP#';

export const RuleEditorPage: React.FC = () => {
    const navigate = useNavigate();
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // --- State: Step 1 (Target) ---
    const [ruleType, setRuleType] = useState<RuleType>('PACK');
    const [targetItem, setTargetItem] = useState<MeliItem | null>(null);

    // --- State: Step 2 (Strategy + Components) ---
    const [defaultPackQuantity, setDefaultPackQuantity] = useState<number>(1);
    const [components, setComponents] = useState<RuleComponent[]>([]);
    // We need full item details for sources to render Step 3, so we store them here
    const [sourceItemsDetails, setSourceItemsDetails] = useState<MeliItem[]>([]);

    // --- State: Step 3 (Mapping) ---
    // Key: targetVariantId, Value: { sourceItemId: sourceVariantId }
    // NOTE: We now use the full object structure for state to match types, 
    // but for easier UI manipulation we might want a helper. 
    // Let's store the full array as per the type.
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
                setMappings((rule.mappings || []).map(m => ({
                    targetVariantId: m.targetVariantId,
                    targetSku: m.targetSku,
                    customPackQuantity: (m as VariantMapping & { packQuantity?: number }).packQuantity ?? m.customPackQuantity,
                    sourceMatches: m.sourceMatches || []
                })));
                setDefaultPackQuantity(rule.defaultPackQuantity ?? 1);

                // Optional: Load target details if we want to be ready for Step 3 immediately, 
                // but usually that happens on transition. 
                // However, if we are editing, we might want to have it ready.
                // Let's fetch it to be safe if the user jumps to step 3 (though we start at 0).
                // Actually, targetDetails IS the full item, so we might already have what we need 
                // if getItemDetails returns the full object including variations.
                setTargetItemDetails(targetDetails);

                // 5. Jump to mapping step (FULL: step 1 = componentes; PACK/COMBO: step 2 = mapeo)
                setActiveStep(rule.ruleType === 'FULL' ? 1 : 2);

            } catch (err) {
                console.error(err);
                setError('Error al cargar la regla para edición.');
            } finally {
                setLoading(false);
            }
        };
        loadRule();
    }, [targetItemId]);

    // Punto 6.7: Inicialización segura al llegar al Paso 3 por ruta alternativa (mappings vacíos)
    React.useEffect(() => {
        if (
            activeStep === 2 &&
            ruleType !== 'FULL' &&
            mappings.length === 0 &&
            targetItemDetails?.variations?.length &&
            components.length > 0
        ) {
            const newMappings = buildInitialMappings(targetItemDetails, components, sourceItemsDetails);
            if (newMappings.length > 0) setMappings(newMappings);
        }
    }, [activeStep, ruleType, mappings.length, targetItemDetails, components, sourceItemsDetails]);

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

            let defaultQty = 1;
            if (ruleType === 'PACK') defaultQty = 3;

            setComponents([...components, { sourceItemId: item.id, quantity: defaultQty }]);
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
    /** Flat list of all source variations for "Add source" dropdown (all components). */
    const getAllSourceOptions = (): { sourceItemId: string; sourceVariantId: string; sourceSku: string; label: string }[] => {
        const options: { sourceItemId: string; sourceVariantId: string; sourceSku: string; label: string }[] = [];
        sourceItemsDetails.forEach(sourceItem => {
            (sourceItem.variations || []).forEach(v => {
                options.push({
                    sourceItemId: sourceItem.id,
                    sourceVariantId: v.user_product_id.toString(),
                    sourceSku: v.sku || '',
                    label: `${v.sku || 'Sin SKU'} – ${v.description || sourceItem.title || sourceItem.id}`
                });
            });
        });
        return options;
    };

    const handleAddSourceToVariant = (targetVarId: string, option: { sourceItemId: string; sourceVariantId: string; sourceSku: string }, quantity: number = 1) => {
        const newMappings = [...mappings];
        let mappingIndex = newMappings.findIndex(m => m.targetVariantId === targetVarId);
        if (mappingIndex === -1) {
            const targetVar = targetItemDetails?.variations.find(v => v.user_product_id.toString() === targetVarId);
            if (!targetVar) return;
            newMappings.push({
                targetVariantId: targetVarId,
                targetSku: targetVar.sku || '',
                sourceMatches: []
            });
            mappingIndex = newMappings.length - 1;
        }
        const existing = newMappings[mappingIndex];
        if (existing.sourceMatches.some(m => m.sourceItemId === option.sourceItemId && m.sourceVariantId === option.sourceVariantId)) return;
        newMappings[mappingIndex] = {
            ...existing,
            sourceMatches: [...existing.sourceMatches, { ...option, quantity }]
        };
        setMappings(newMappings);
    };

    const handleRemoveSourceFromVariant = (targetVarId: string, matchIndex: number) => {
        const newMappings = [...mappings];
        const mappingIndex = newMappings.findIndex(m => m.targetVariantId === targetVarId);
        if (mappingIndex === -1) return;
        const existing = newMappings[mappingIndex];
        const sourceMatches = existing.sourceMatches.filter((_, i) => i !== matchIndex);
        newMappings[mappingIndex] = { ...existing, sourceMatches };
        setMappings(newMappings);
    };

    const handleApplyMappingToAll = (fromTargetVarId: string) => {
        const sourceMapping = mappings.find(m => m.targetVariantId === fromTargetVarId);
        if (!sourceMapping || sourceMapping.sourceMatches.length === 0) return;
        const targetVars = targetItemDetails?.variations ?? [];
        const newMappings = targetVars.map(targetVar => {
            const id = targetVar.user_product_id.toString();
            if (id === fromTargetVarId) return sourceMapping;
            return {
                targetVariantId: id,
                targetSku: targetVar.sku || '',
                customPackQuantity: sourceMapping.customPackQuantity,
                sourceMatches: [...sourceMapping.sourceMatches]
            };
        });
        setMappings(newMappings);
    };

    const handleMappingQuantityChange = (targetVarId: string, sourceItemId: string, quantity: number) => {
        const qty = Math.max(1, Math.floor(quantity));
        const newMappings = [...mappings];
        const mappingIndex = newMappings.findIndex(m => m.targetVariantId === targetVarId);
        if (mappingIndex === -1) return;
        const existingMapping = newMappings[mappingIndex];
        const matchIndex = existingMapping.sourceMatches.findIndex(m => m.sourceItemId === sourceItemId);
        if (matchIndex === -1) return;
        const sourceMatches = [...existingMapping.sourceMatches];
        sourceMatches[matchIndex] = { ...sourceMatches[matchIndex], quantity: qty };
        newMappings[mappingIndex] = { ...existingMapping, sourceMatches };
        setMappings(newMappings);
    };

    const handleCustomPackQuantityChange = (targetVarId: string, value: number | '') => {
        const newMappings = [...mappings];
        const mappingIndex = newMappings.findIndex(m => m.targetVariantId === targetVarId);
        if (mappingIndex === -1) return;
        newMappings[mappingIndex] = { ...newMappings[mappingIndex], customPackQuantity: value === '' ? undefined : Math.max(1, value) };
        setMappings(newMappings);
    };

    /** Build initial mappings by SKU (used when entering Step 3 or when mappings are empty). */
    const buildInitialMappings = (
        details: MeliItem,
        comps: RuleComponent[],
        sourceDetails: MeliItem[]
    ): VariantMapping[] => {
        const newMappings: VariantMapping[] = [];
        if (!details.variations?.length) return newMappings;
        details.variations.forEach(targetVar => {
            const sourceMatches: VariantMapping['sourceMatches'] = [];
            comps.forEach(comp => {
                const sourceDetail = sourceDetails.find(s => s.id === comp.sourceItemId);
                if (sourceDetail) {
                    const match = sourceDetail.variations.find(sv =>
                        sv.sku && targetVar.sku && sv.sku === targetVar.sku
                    );
                    if (match) {
                        sourceMatches.push({
                            sourceItemId: comp.sourceItemId,
                            sourceVariantId: match.user_product_id.toString(),
                            sourceSku: match.sku || '',
                            quantity: comp.quantity
                        });
                    }
                }
            });
            newMappings.push({
                targetVariantId: targetVar.user_product_id.toString(),
                targetSku: targetVar.sku || '',
                sourceMatches
            });
        });
        return newMappings;
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

                // Initialize mappings if empty (Punto 6.7: same logic used when entering Step 3)
                if (mappings.length === 0 && details) {
                    const newMappings = buildInitialMappings(details, components, sourceItemsDetails);
                    if (newMappings.length > 0) setMappings(newMappings);
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

    const handleDeleteAndCreateNew = async () => {
        if (!targetItemId) return;
        if (!window.confirm('¿Eliminar esta regla y crear una nueva desde cero? Se perderán los datos actuales.')) return;
        setLoading(true);
        try {
            await dataService.deleteStockRule(targetItemId);
            setTargetItem(null);
            setComponents([]);
            setSourceItemsDetails([]);
            setMappings([]);
            setTargetItemDetails(null);
            setActiveStep(0);
            setError(null);
            navigate('/rules/new', { replace: true });
        } catch (err) {
            console.error(err);
            setError('Error al eliminar la regla.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!targetItem) return;

        setLoading(true);
        setError(null);
        try {
            let mappingsToSave = mappings;

            if (ruleType === 'FULL') {
                // Ensure we have target details (user may not have clicked "Siguiente" through Step 2)
                let targetDetails = targetItemDetails;
                if (!targetDetails) {
                    targetDetails = await dataService.getItemDetails(targetItem.id);
                    setTargetItemDetails(targetDetails);
                }
                const comp = components[0];
                const sourceDetail = sourceItemsDetails.find(s => s.id === comp?.sourceItemId);
                const targetVars = targetDetails?.variations ?? [];
                const fullMappings: VariantMapping[] = [];
                const unmatchedTargetSkus: string[] = [];

                targetVars.forEach(targetVar => {
                    const sourceVar = sourceDetail?.variations.find(sv =>
                        sv.sku && targetVar.sku && sv.sku === targetVar.sku
                    );
                    if (sourceVar) {
                        fullMappings.push({
                            targetVariantId: targetVar.user_product_id.toString(),
                            targetSku: targetVar.sku || '',
                            sourceMatches: [{
                                sourceItemId: comp!.sourceItemId,
                                sourceVariantId: sourceVar.user_product_id.toString(),
                                sourceSku: sourceVar.sku || '',
                                quantity: 1
                            }]
                        });
                    } else {
                        if (targetVar.sku) unmatchedTargetSkus.push(targetVar.sku);
                    }
                });

                if (unmatchedTargetSkus.length > 0) {
                    console.warn('FULL: algunas variantes no tienen correspondencia por SKU:', unmatchedTargetSkus);
                }
                mappingsToSave = fullMappings;
            }

            if (ruleType === 'PACK' || ruleType === 'COMBO') {
                if (defaultPackQuantity < 1) {
                    setError('La cantidad por pack debe ser al menos 1.');
                    return;
                }
            }

            // Validación: todas las variantes destino deben tener al menos un mapeo
            if (ruleType === 'PACK' || ruleType === 'COMBO') {
                let detailsForValidation = targetItemDetails;
                if (!detailsForValidation) {
                    detailsForValidation = await dataService.getItemDetails(targetItem.id);
                    setTargetItemDetails(detailsForValidation);
                }
                const targetVariantIds = new Set(
                    (detailsForValidation?.variations ?? []).map(v => v.user_product_id.toString())
                );
                const mappedTargetIds = new Set(mappingsToSave.filter(m => m.sourceMatches.length > 0).map(m => m.targetVariantId));
                const orphanIds = [...targetVariantIds].filter(id => !mappedTargetIds.has(id));
                if (orphanIds.length > 0) {
                    setError('Faltan variantes por asignar. Por favor complete el mapeo para todas las variantes.');
                    return;
                }
            }

            // Build payload: backend expects packQuantity (not customPackQuantity), sourceMatches
            const payloadMappings = mappingsToSave.map(m => ({
                targetVariantId: m.targetVariantId,
                targetSku: m.targetSku,
                packQuantity: m.customPackQuantity ?? undefined,
                sourceMatches: m.sourceMatches.map((sm): RuleSourceMatchPayload => ({
                    sourceItemId: sm.sourceItemId,
                    sourceVariantId: sm.sourceVariantId.startsWith(GROUP_OPTION_PREFIX) ? null : sm.sourceVariantId,
                    sourceSku: sm.sourceSku,
                    quantity: sm.quantity
                }))
            }));

            const targetSku = targetItem.variations?.[0]?.sku ?? targetItem.id ?? '';

            const rule: StockRule = {
                targetItemId: targetItem.id,
                targetTitle: targetItem.title ?? '',
                targetThumbnail: targetItem.thumbnail ?? undefined,
                targetSku,
                ruleType,
                defaultPackQuantity,
                components,
                mappings: payloadMappings as VariantMapping[]
            };

            await dataService.saveStockRule(rule);
            navigate('/');
        } catch (err) {
            console.error(err);
            // Punto 7.7: Mensaje de error desde la respuesta del backend si existe
            const axErr = err as { response?: { data?: { message?: string } } };
            const message = axErr.response?.data?.message ?? (err instanceof Error ? err.message : 'Error al guardar la regla.');
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    // --- Render Steps ---

    const renderStep1 = () => (
        <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
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
            <Grid size={{ xs: 12, md: 6 }}>
                <Card variant="outlined">
                    <CardContent>
                        <Typography variant="h6" gutterBottom>2. Artículo Objetivo (Publicación)</Typography>
                        <ItemSearch label="Buscar Publicación a controlar..." onSelect={handleTargetSelect} />

                        {targetItem && (
                            <>
                                {targetItem.shipping?.logistic_type === 'fulfillment' && (
                                    <Alert severity="warning" sx={{ mt: 2 }}>
                                        Publicación FULL. Solo se actualizará el stock local.
                                    </Alert>
                                )}
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
                            </>
                        )}
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );

    const renderStep2 = () => (
        <Grid container spacing={3}>
            <Grid size={12}>
                <Typography variant="h6" gutterBottom>
                    Estrategia y componentes para: <strong>{targetItem?.title}</strong>
                </Typography>
                {(ruleType === 'PACK' || ruleType === 'COMBO') && (
                    <Box sx={{ mb: 2 }}>
                        <TextField
                            label="Cantidad por pack (default)"
                            type="number"
                            value={defaultPackQuantity}
                            onChange={(e) => setDefaultPackQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                            inputProps={{ min: 1 }}
                            size="small"
                            sx={{ width: 180 }}
                        />
                    </Box>
                )}
                <Alert severity="info" sx={{ mb: 2 }}>
                    {ruleType === 'PACK' && 'Seleccione el producto unitario. La cantidad por pack se puede ajustar por variante en el siguiente paso.'}
                    {ruleType === 'FULL' && 'Seleccione el producto equivalente (1 a 1).'}
                    {ruleType === 'COMBO' && 'Agregue todos los productos que componen el combo.'}
                </Alert>

                <Box sx={{ mb: 3 }}>
                    <ItemSearch label="Agregar Componente ..." onSelect={handleAddSource} />
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
                                                disabled={ruleType === 'FULL'}
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

    const renderStep3 = () => {
        const allSourceOptions = getAllSourceOptions();
        return (
            <Box>
                <Typography variant="h6" gutterBottom>Mapeo de variantes</Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                    Asigne una o más fuentes (SKU) a cada variante objetivo. Variante con más de un SKU = Pool/Surtido (se sumará el stock).
                </Typography>

                <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                        <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                            <TableRow>
                                <TableCell><strong>Variante objetivo</strong></TableCell>
                                <TableCell><strong>Fuentes (SKU)</strong></TableCell>
                                {ruleType === 'PACK' && <TableCell width={100}><strong>Cant. pack</strong></TableCell>}
                                <TableCell width={120}><strong>Acción</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {targetItemDetails?.variations.map(targetVar => {
                                const targetVarId = targetVar.user_product_id.toString();
                                const mapping = mappings.find(m => m.targetVariantId === targetVarId);
                                const sourceMatches = mapping?.sourceMatches ?? [];
                                const isPool = sourceMatches.length > 1;
                                return (
                                    <TableRow key={targetVarId}>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="medium">{targetVar.description ?? targetVar.sku}</Typography>
                                            <Typography variant="caption" color="text.secondary">{targetVar.sku || 'No SKU'}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Stack direction="row" flexWrap="wrap" gap={0.5} alignItems="center" sx={{ py: 0.5 }}>
                                                {isPool && <Chip label="Surtido/Pool" size="small" color="secondary" sx={{ mr: 0.5 }} />}
                                                {sourceMatches.map((sm, idx) => (
                                                    <Chip
                                                        key={`${sm.sourceItemId}-${sm.sourceVariantId}-${idx}`}
                                                        label={ruleType === 'COMBO' ? `${sm.sourceSku} × ${sm.quantity}` : sm.sourceSku}
                                                        size="small"
                                                        onDelete={() => handleRemoveSourceFromVariant(targetVarId, idx)}
                                                        sx={{ mb: 0.5 }}
                                                    />
                                                ))}
                                                <FormControl size="small" sx={{ minWidth: 220 }}>
                                                    <Select
                                                        displayEmpty
                                                        value=""
                                                        onChange={(e) => {
                                                            const val = e.target.value as string;
                                                            if (!val) return;
                                                            const opt = allSourceOptions.find(o => `${o.sourceItemId}:${o.sourceVariantId}` === val);
                                                            if (opt) handleAddSourceToVariant(targetVarId, opt, ruleType === 'COMBO' ? 1 : defaultPackQuantity);
                                                        }}
                                                    >
                                                        <MenuItem value=""><em>+ Agregar fuente</em></MenuItem>
                                                        {allSourceOptions.map(opt => (
                                                            <MenuItem key={`${opt.sourceItemId}-${opt.sourceVariantId}`} value={`${opt.sourceItemId}:${opt.sourceVariantId}`}>
                                                                {opt.label}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            </Stack>
                                            {ruleType === 'COMBO' && sourceMatches.length > 0 && (
                                                <Box sx={{ mt: 0.5 }}>
                                                    {sourceMatches.map((sm, idx) => (
                                                        <TextField
                                                            key={`qty-${targetVarId}-${idx}`}
                                                            size="small"
                                                            type="number"
                                                            label={`Cant. ${sm.sourceSku}`}
                                                            value={sm.quantity}
                                                            onChange={(e) => handleMappingQuantityChange(targetVarId, sm.sourceItemId, parseInt(e.target.value, 10) || 1)}
                                                            inputProps={{ min: 1 }}
                                                            sx={{ width: 80, mr: 1, mt: 0.5 }}
                                                        />
                                                    ))}
                                                </Box>
                                            )}
                                        </TableCell>
                                        {ruleType === 'PACK' && (
                                            <TableCell>
                                                <TextField
                                                    size="small"
                                                    type="number"
                                                    placeholder={`${defaultPackQuantity}`}
                                                    value={mapping?.customPackQuantity ?? ''}
                                                    onChange={(e) => handleCustomPackQuantityChange(targetVarId, e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                                                    inputProps={{ min: 1 }}
                                                    sx={{ width: 70 }}
                                                />
                                            </TableCell>
                                        )}
                                        <TableCell>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                disabled={sourceMatches.length === 0}
                                                onClick={() => handleApplyMappingToAll(targetVarId)}
                                            >
                                                Aplicar a todas
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        );
    };

    return (
        <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
            <Box sx={{ mb: 2 }}>
                <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/')}>
                    Volver
                </Button>
            </Box>

            <Paper sx={{ p: 3, mb: 3 }}>
                {(() => {
                    const stepsToShow = ruleType === 'FULL' ? STEPS_FULL : STEPS;
                    return (
                        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                            {stepsToShow.map((label) => (
                                <Step key={label}>
                                    <StepLabel>{label}</StepLabel>
                                </Step>
                            ))}
                        </Stepper>
                    );
                })()}

                {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}

                {targetItemId && (
                    <Alert severity="info" sx={{ mb: 3 }} action={
                        <Button color="inherit" size="small" onClick={handleDeleteAndCreateNew} disabled={loading}>
                            Eliminar y crear nueva
                        </Button>
                    }>
                        <strong>Modo edición.</strong> Sirve para actualizar el mapeo cuando hay nuevas variantes. Para cambiar el tipo de regla o los componentes, elimine esta regla y cree una nueva.
                    </Alert>
                )}

                <Box sx={{ minHeight: 300 }}>
                    {activeStep === 0 && renderStep1()}
                    {activeStep === 1 && renderStep2()}
                    {activeStep === 2 && ruleType !== 'FULL' && renderStep3()}
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4, pt: 2, borderTop: '1px solid #eee' }}>
                    {(() => {
                        const stepsToShow = ruleType === 'FULL' ? STEPS_FULL : STEPS;
                        const lastStepIndex = stepsToShow.length - 1;
                        return (
                            <>
                                <Button
                                    disabled={activeStep === 0}
                                    onClick={handleBack}
                                    sx={{ mr: 1 }}
                                >
                                    Atrás
                                </Button>
                                {activeStep === lastStepIndex ? (
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
                            </>
                        );
                    })()}
                </Box>
            </Paper>
        </Box>
    );
};
