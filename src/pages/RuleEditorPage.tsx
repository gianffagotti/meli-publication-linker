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
    Button,
    Alert,
    FormControl,
    Radio,
    RadioGroup,
    FormControlLabel,
    Stepper,
    Step,
    StepLabel,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useParams } from 'react-router-dom';
import { ItemSearch } from '../components/Shared/ItemSearch';
import { RuleVariantRow, type SourceOption } from '../components/Rules/RuleVariantRow';
import { RuleComponentsStep, type RuleComponentWithItem } from '../components/Rules/RuleComponentsStep';
import { dataService } from '../services/apiFactory';
import type { MeliItem, StockRule, RuleType, RuleComponent, VariantMapping, RuleSourceMatchPayload, MappingStrategy, SkuValidationResult } from '../models/types';
import { useSourceSizes } from '../hooks/useSourceSizes';

const STEPS = ['Seleccionar Objetivo', 'Definir Componentes', 'Mapear Variantes'];
/** FULL: omit Paso 2 (componentes). Step 2 = Validar SKUs contra Znube. */
const STEPS_FULL = ['Seleccionar Objetivo', 'Validar SKUs'];

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

    // --- State: Step 2 (Components: Source publications + quantity per row) ---
    const [components, setComponents] = useState<RuleComponentWithItem[]>([]);

    // --- State: Step 3 (Mapping) ---
    const [mappings, setMappings] = useState<VariantMapping[]>([]);
    const [targetItemDetails, setTargetItemDetails] = useState<MeliItem | null>(null);
    /** FULL only: result of Znube SKU validation (step Validar SKUs). */
    const [skuValidationResults, setSkuValidationResults] = useState<SkuValidationResult[] | null>(null);

    /** Unique sizes from source publications (for PACK Dynamic). */
    const sourceItemsForSizes = React.useMemo(() => components.map((c) => c.sourceItem), [components]);
    const availableSizes = useSourceSizes(sourceItemsForSizes);

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

                // 3. Hydrate Source Items (Parallel) and build components with full items
                const sourceDetailsPromises = rule.components.map(async (c) => {
                    try {
                        const item = await dataService.getItemDetails(c.sourceItemId);
                        return item ? { sourceItem: item, quantity: c.quantity } : null;
                    } catch (e) {
                        console.error(`Error fetching source item ${c.sourceItemId}`, e);
                        return null;
                    }
                });
                const loadedComponents = (await Promise.all(sourceDetailsPromises)).filter(
                    (c): c is RuleComponentWithItem => c !== null
                );

                // 4. Update State
                setRuleType(rule.ruleType);
                setTargetItem(targetDetails);
                setComponents(loadedComponents);
                setMappings((rule.mappings || []).map(m => ({
                    targetVariantId: m.targetVariantId,
                    targetSku: m.targetSku,
                    customPackQuantity: (m as VariantMapping & { packQuantity?: number }).packQuantity ?? m.customPackQuantity,
                    strategy: (m as VariantMapping & { strategy?: VariantMapping['strategy'] }).strategy ?? 'EXPLICIT',
                    matchSize: (m as VariantMapping & { matchSize?: string }).matchSize,
                    sourceMatches: m.sourceMatches || []
                })));
                setTargetItemDetails(targetDetails);

                // 5. FULL: step 1 = Validar SKUs; PACK/COMBO: step 2 = mapeo
                setActiveStep(rule.ruleType === 'FULL' ? 1 : 2);
                if (rule.ruleType === 'FULL') setSkuValidationResults(null);

            } catch (err) {
                console.error(err);
                setError('Error al cargar la regla para edición.');
            } finally {
                setLoading(false);
            }
        };
        loadRule();
    }, [targetItemId]);

    // FULL: run Znube SKU validation when on step "Validar SKUs" and target details loaded
    React.useEffect(() => {
        if (ruleType !== 'FULL' || activeStep !== 1 || !targetItemDetails?.variations?.length) return;
        const skus = targetItemDetails.variations.map(v => v.sku).filter((s): s is string => !!s?.trim());
        if (skus.length === 0) {
            setSkuValidationResults([]);
            return;
        }
        let cancelled = false;
        dataService.validateSkusInZnube(skus).then(results => {
            if (!cancelled) setSkuValidationResults(results);
        });
        return () => { cancelled = true; };
    }, [ruleType, activeStep, targetItemDetails]);

    // Inicialización segura al llegar al Paso 3 (mappings vacíos)
    React.useEffect(() => {
        if (
            activeStep === 2 &&
            ruleType !== 'FULL' &&
            mappings.length === 0 &&
            targetItemDetails?.variations?.length &&
            components.length > 0
        ) {
            const newMappings = buildInitialMappings(targetItemDetails, components);
            if (newMappings.length > 0) setMappings(newMappings);
        }
    }, [activeStep, ruleType, mappings.length, targetItemDetails, components]);

    // --- Handlers: Step 1 ---
    const handleTargetSelect = (item: MeliItem | null) => {
        setTargetItem(item);
        setComponents([]);
        setMappings([]);
        setTargetItemDetails(null);
        setSkuValidationResults(null);
    };

    // --- Handlers: Step 2 ---
    const handleAddSource = async (item: MeliItem | null) => {
        if (!item) return;

        if ((ruleType === 'FULL' || ruleType === 'PACK') && components.length >= 1) {
            setError(`Las reglas tipo ${ruleType} solo pueden tener 1 publicación Source.`);
            return;
        }
        if (components.some((c) => c.sourceItem.id === item.id)) {
            setError('Esta publicación ya está agregada.');
            return;
        }

        setError(null);
        setLoading(true);
        try {
            const fullItem = await dataService.getItemDetails(item.id);
            const qty = ruleType === 'FULL' ? 1 : ruleType === 'PACK' ? 3 : 1;
            setComponents((prev) => [...prev, { sourceItem: fullItem, quantity: qty }]);
        } catch (err) {
            console.error(err);
            setError('Error al cargar detalles de la publicación.');
        } finally {
            setLoading(false);
        }
    };

    // --- Handlers: Step 3 ---
    /** PACK: options from the single source publication. */
    const getSourceOptionsForPack = (): SourceOption[] => {
        const sourceItem = components[0]?.sourceItem;
        if (!sourceItem?.variations?.length) return [];
        return sourceItem.variations.map((v) => ({
            sourceItemId: sourceItem.id,
            sourceVariantId: v.user_product_id.toString(),
            sourceSku: v.sku || '',
            label: `${v.sku || 'Sin SKU'} – ${v.description || sourceItem.title || sourceItem.id}`,
        }));
    };

    const handlePackSingleSelect = (targetVarId: string, option: SourceOption | null) => {
        const targetVar = targetItemDetails?.variations.find((v) => v.user_product_id.toString() === targetVarId);
        if (!targetVar) return;
        const quantity = components[0]?.quantity ?? 1;
        const sourceMatches = option
            ? [{ sourceItemId: option.sourceItemId, sourceVariantId: option.sourceVariantId, sourceSku: option.sourceSku, quantity }]
            : [];
        setMappings((prev) => {
            const idx = prev.findIndex((m) => m.targetVariantId === targetVarId);
            const next = { targetVariantId: targetVarId, targetSku: targetVar.sku || '', strategy: 'EXPLICIT' as const, sourceMatches };
            if (idx === -1) return [...prev, next];
            return prev.map((m) => (m.targetVariantId === targetVarId ? { ...m, strategy: 'EXPLICIT', sourceMatches, matchSize: undefined } : m));
        });
    };

    const handleComboVariantSelect = (targetVarId: string, sourceItemId: string, sourceVariantId: string) => {
        const comp = components.find((c) => c.sourceItem.id === sourceItemId);
        const sourceItem = comp?.sourceItem;
        const variation = sourceItem?.variations?.find((v) => v.user_product_id.toString() === sourceVariantId);
        const sourceSku = variation?.sku ?? '';
        const quantity = comp?.quantity ?? 1;
        setMappings((prev) => {
            const idx = prev.findIndex((m) => m.targetVariantId === targetVarId);
            const targetVar = targetItemDetails?.variations.find((v) => v.user_product_id.toString() === targetVarId);
            const base = idx >= 0 ? prev[idx] : { targetVariantId: targetVarId, targetSku: targetVar?.sku ?? '', strategy: 'EXPLICIT' as const, sourceMatches: [] as VariantMapping['sourceMatches'] };
            const otherMatches = base.sourceMatches.filter((m) => m.sourceItemId !== sourceItemId);
            const newMatches = [...otherMatches, { sourceItemId, sourceVariantId, sourceSku, quantity }];
            const next = { ...base, sourceMatches: newMatches };
            if (idx === -1) return [...prev, next];
            return prev.map((m) => (m.targetVariantId === targetVarId ? next : m));
        });
    };

    const handleStrategyChange = (targetVarId: string, newStrategy: MappingStrategy) => {
        setMappings(prev => {
            const idx = prev.findIndex(m => m.targetVariantId === targetVarId);
            const targetSku = targetItemDetails?.variations?.find(v => v.user_product_id.toString() === targetVarId)?.sku ?? '';
            if (idx === -1) {
                const newMapping: VariantMapping = {
                    targetVariantId: targetVarId,
                    targetSku,
                    strategy: newStrategy,
                    sourceMatches: newStrategy === 'EXPLICIT' ? [] : [],
                    matchSize: newStrategy === 'DYNAMIC_SIZE' ? (availableSizes[0] ?? '') : undefined,
                };
                return [...prev, newMapping];
            }
            return prev.map(m => {
                if (m.targetVariantId !== targetVarId) return m;
                if (newStrategy === 'DYNAMIC_SIZE') {
                    return {
                        ...m,
                        strategy: 'DYNAMIC_SIZE',
                        sourceMatches: [],
                        matchSize: availableSizes.length > 0 ? availableSizes[0] : '',
                    };
                }
                return { ...m, strategy: 'EXPLICIT', matchSize: undefined };
            });
        });
    };

    const handleMatchSizeChange = (targetVarId: string, matchSize: string) => {
        setMappings(prev => prev.map(m =>
            m.targetVariantId === targetVarId ? { ...m, matchSize } : m
        ));
    };

    const handleCustomPackQuantityChange = (targetVarId: string, value: number | '') => {
        const newMappings = [...mappings];
        const mappingIndex = newMappings.findIndex(m => m.targetVariantId === targetVarId);
        if (mappingIndex === -1) return;
        newMappings[mappingIndex] = { ...newMappings[mappingIndex], customPackQuantity: value === '' ? undefined : Math.max(1, value) };
        setMappings(newMappings);
    };

    const getSkuSegments = (sku: string): string[] =>
        sku
            .split('#')
            .map((part) => part.trim())
            .filter((part) => part.length > 0);

    const getSkuColorSizeSuffix = (sku: string): { suffix: string; size: string } | null => {
        const segments = getSkuSegments(sku);
        if (segments.length < 2) return null;
        const size = segments[segments.length - 1];
        const color = segments[segments.length - 2];
        return { suffix: `${color}#${size}`.toLowerCase(), size };
    };

    /** Build initial mappings by SKU when entering Step 3. */
    const buildInitialMappings = (details: MeliItem, comps: RuleComponentWithItem[]): VariantMapping[] => {
        const newMappings: VariantMapping[] = [];
        if (!details.variations?.length) return newMappings;
        details.variations.forEach((targetVar) => {
            const targetVariantId = targetVar.user_product_id.toString();
            const targetSku = targetVar.sku || '';

            if (ruleType === 'PACK') {
                const comp = comps[0];
                const targetSuffix = targetSku ? getSkuColorSizeSuffix(targetSku) : null;
                const sourceVariants = comp?.sourceItem.variations ?? [];
                const matches = targetSuffix
                    ? sourceVariants.filter((sv) => {
                        if (!sv.sku) return false;
                        const sourceSuffix = getSkuColorSizeSuffix(sv.sku);
                        return sourceSuffix?.suffix === targetSuffix.suffix;
                    })
                    : [];

                if (matches.length === 1 && comp) {
                    const match = matches[0];
                    newMappings.push({
                        targetVariantId,
                        targetSku,
                        strategy: 'EXPLICIT',
                        sourceMatches: [{
                            sourceItemId: comp.sourceItem.id,
                            sourceVariantId: match.user_product_id.toString(),
                            sourceSku: match.sku || '',
                            quantity: comp.quantity,
                        }],
                    });
                    return;
                }

                // Fallback: si no matcheó por SKU (COLOR#TALLE), intentar por descripción
                if (matches.length === 0 && targetVar.description?.trim()) {
                    const targetDesc = targetVar.description.trim().toLowerCase();
                    const descMatches = sourceVariants.filter((sv) => {
                        const srcDesc = (sv.description ?? '').trim().toLowerCase();
                        return srcDesc && srcDesc === targetDesc;
                    });
                    if (descMatches.length === 1 && comp) {
                        const match = descMatches[0];
                        newMappings.push({
                            targetVariantId,
                            targetSku,
                            strategy: 'EXPLICIT',
                            sourceMatches: [{
                                sourceItemId: comp.sourceItem.id,
                                sourceVariantId: match.user_product_id.toString(),
                                sourceSku: match.sku || '',
                                quantity: comp.quantity,
                            }],
                        });
                        return;
                    }
                }

                if (matches.length === 0 && targetSuffix?.size) {
                    newMappings.push({
                        targetVariantId,
                        targetSku,
                        strategy: 'DYNAMIC_SIZE',
                        matchSize: targetSuffix.size,
                        sourceMatches: [],
                    });
                    return;
                }
            }

            const sourceMatches: VariantMapping['sourceMatches'] = [];
            comps.forEach((comp) => {
                const match = comp.sourceItem.variations?.find(
                    (sv) => sv.sku && targetVar.sku && sv.sku.toLowerCase() === targetVar.sku.toLowerCase()
                );
                if (match) {
                    sourceMatches.push({
                        sourceItemId: comp.sourceItem.id,
                        sourceVariantId: match.user_product_id.toString(),
                        sourceSku: match.sku || '',
                        quantity: comp.quantity,
                    });
                }
            });
            newMappings.push({
                targetVariantId,
                targetSku,
                strategy: 'EXPLICIT',
                sourceMatches,
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

        if (activeStep === 1 && ruleType !== 'FULL') {
            if (components.length === 0) {
                setError('Agregue al menos un componente.');
                return;
            }
            // Fetch target details before moving to Step 3 (PACK/COMBO)
            setLoading(true);
            try {
                const details = await dataService.getItemDetails(targetItem!.id);
                setTargetItemDetails(details);

                if (mappings.length === 0 && details) {
                    const newMappings = buildInitialMappings(details, components);
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
        if (activeStep === 0 && ruleType === 'FULL') {
            setLoading(true);
            try {
                const details = await dataService.getItemDetails(targetItem!.id);
                setTargetItemDetails(details);
                setSkuValidationResults(null);
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

    const canSave = React.useMemo(() => {
        const stepsToShow = ruleType === 'FULL' ? STEPS_FULL : STEPS;
        const lastStepIndex = stepsToShow.length - 1;
        if (activeStep !== lastStepIndex) return true;

        if (ruleType === 'FULL') {
            return !!(targetItem && targetItemDetails && (targetItemDetails.variations?.length ?? 0) > 0);
        }
        if (ruleType === 'PACK' || ruleType === 'COMBO') {
            if (!targetItem || components.length === 0) return false;
            const targetVariantIds = (targetItemDetails?.variations ?? []).map((v) => v.user_product_id.toString());
            const everyVariantValid = targetVariantIds.every((id) => {
                const m = mappings.find((x) => x.targetVariantId === id);
                if (!m) return false;
                if (m.strategy === 'EXPLICIT') {
                    if (ruleType === 'PACK') return (m.sourceMatches?.length ?? 0) >= 1;
                    return (m.sourceMatches?.length ?? 0) === components.length; // COMBO: one variant per component
                }
                if (m.strategy === 'DYNAMIC_SIZE') {
                    return !!m.matchSize?.trim() && availableSizes.length > 0;
                }
                return false;
            });
            return everyVariantValid;
        }
        return true;
    }, [activeStep, ruleType, targetItem, components, targetItemDetails?.variations, mappings, availableSizes]);

    const handleSave = async () => {
        if (!targetItem) return;

        setLoading(true);
        setError(null);
        try {
            let mappingsToSave = mappings;

            if (ruleType === 'FULL') {
                let targetDetails = targetItemDetails;
                if (!targetDetails) {
                    targetDetails = await dataService.getItemDetails(targetItem.id);
                    setTargetItemDetails(targetDetails);
                }
                const targetVars = targetDetails?.variations ?? [];
                const fullMappings: VariantMapping[] = targetVars.map(targetVar => ({
                    targetVariantId: targetVar.user_product_id.toString(),
                    targetSku: targetVar.sku || '',
                    strategy: 'EXPLICIT' as const,
                    sourceMatches: []
                }));
                mappingsToSave = fullMappings;
            }

            // Validación: todas las variantes destino deben tener mapeo válido
            if (ruleType === 'PACK' || ruleType === 'COMBO') {
                let detailsForValidation = targetItemDetails;
                if (!detailsForValidation) {
                    detailsForValidation = await dataService.getItemDetails(targetItem.id);
                    setTargetItemDetails(detailsForValidation);
                }
                const targetVariantIds = new Set(
                    (detailsForValidation?.variations ?? []).map(v => v.user_product_id.toString())
                );
                const validMappingIds = new Set(
                    mappingsToSave.filter(m => {
                        if (m.strategy === 'EXPLICIT') return m.sourceMatches.length > 0;
                        if (m.strategy === 'DYNAMIC_SIZE') return !!m.matchSize?.trim();
                        return false;
                    }).map(m => m.targetVariantId)
                );
                const orphanIds = [...targetVariantIds].filter(id => !validMappingIds.has(id));
                if (orphanIds.length > 0) {
                    setError('Faltan variantes por asignar. Por favor complete el mapeo para todas las variantes (Manual con al menos un SKU o Dinámico con talle).');
                    return;
                }
            }

            // Build payload: backend expects packQuantity, strategy, matchSize, sourceMatches
            const payloadMappings = mappingsToSave.map(m => ({
                targetVariantId: m.targetVariantId,
                targetSku: m.targetSku,
                packQuantity: m.customPackQuantity ?? undefined,
                strategy: m.strategy,
                matchSize: m.matchSize ?? undefined,
                sourceMatches: m.sourceMatches.map((sm): RuleSourceMatchPayload => ({
                    sourceItemId: sm.sourceItemId,
                    sourceVariantId: sm.sourceVariantId.startsWith(GROUP_OPTION_PREFIX) ? null : sm.sourceVariantId,
                    sourceSku: sm.sourceSku,
                    quantity: sm.quantity
                }))
            }));

            const targetSku = targetItem.variations?.[0]?.sku ?? targetItem.id ?? '';
            const payloadComponents: RuleComponent[] = ruleType === 'FULL' ? [] : components.map((c) => ({
                sourceItemId: c.sourceItem.id,
                quantity: c.quantity,
            }));
            const derivedDefaultPackQuantity =
                ruleType === 'PACK' && components[0] ? components[0].quantity : 1;
            const hasMissingSku = ruleType === 'FULL' && skuValidationResults?.some(r => !r.exists);

            const rule: StockRule = {
                targetItemId: targetItem.id,
                targetTitle: targetItem.title ?? '',
                targetThumbnail: targetItem.thumbnail ?? undefined,
                targetSku,
                ruleType,
                ...(ruleType === 'FULL' && { isIncomplete: hasMissingSku }),
                defaultPackQuantity: derivedDefaultPackQuantity,
                components: payloadComponents,
                mappings: payloadMappings as VariantMapping[],
            };

            await dataService.saveStockRule(rule);
            navigate('/rules');
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
                                {(targetItem.shipping?.logistic_type === 'fulfillment' || targetItem.logisticsType === 'fulfillment') && (
                                    <Alert severity="warning" sx={{ mt: 2 }}>
                                        ⚠️ Publicación FULL. Solo se actualizará el stock de tu depósito local (Seller Address).
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
        <RuleComponentsStep
            ruleType={ruleType}
            targetTitle={targetItem?.title}
            components={components}
            onComponentsChange={setComponents}
            onAddSource={handleAddSource}
        />
    );

    /** FULL only: step "Validar SKUs" — list SKUs and Znube validation result, show warnings for missing. */
    const renderFullValidateStep = () => {
        const variations = targetItemDetails?.variations ?? [];
        const missingSkus = skuValidationResults?.filter(r => !r.exists).map(r => r.sku) ?? [];
        const loadingValidation = ruleType === 'FULL' && activeStep === 1 && variations.length > 0 && skuValidationResults === null;

        return (
            <Box>
                <Typography variant="h6" gutterBottom>Validar SKUs en Znube</Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                    Las variantes del artículo objetivo se validan contra el stock en Znube. Si un SKU no existe en Znube, la regla se guardará como incompleta y podrás completarla cuando el SKU esté dado de alta.
                </Typography>
                {loadingValidation && <Typography color="text.secondary">Validando SKUs...</Typography>}
                <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                    <Table size="small">
                        <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                            <TableRow>
                                <TableCell><strong>SKU</strong></TableCell>
                                <TableCell><strong>Estado en Znube</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {variations.map((v) => {
                                const sku = v.sku?.trim() ?? '';
                                const result = skuValidationResults?.find(r => r.sku.trim().toLowerCase() === sku.toLowerCase());
                                const exists = result?.exists ?? false;
                                return (
                                    <TableRow key={v.user_product_id}>
                                        <TableCell>{sku || '(sin SKU)'}</TableCell>
                                        <TableCell>
                                            {skuValidationResults === null ? '—' : exists ? 'OK' : 'No encontrado'}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
                {missingSkus.length > 0 && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                        Los siguientes SKUs no están en Znube: <strong>{missingSkus.join(', ')}</strong>. La regla se guardará como incompleta.
                    </Alert>
                )}
            </Box>
        );
    };

    const renderStep3 = () => {
        const sourceOptionsForPack = getSourceOptionsForPack();
        const defaultPackQty = components[0]?.quantity ?? 1;
        const sourceItemForFull = components[0]?.sourceItem ?? null;

        return (
            <Box>
                <Typography variant="h6" gutterBottom>Mapeo de variantes</Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                    {ruleType === 'PACK' && 'Asigne la variante de la publicación Source a cada variante objetivo (Manual) o use coincidencia por talle (Dinámico).'}
                    {ruleType === 'COMBO' && 'Para cada variante objetivo, elija la variante de cada publicación Source que la compone.'}
                </Typography>

                <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                        <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                            <TableRow>
                                <TableCell><strong>Variante objetivo</strong></TableCell>
                                <TableCell><strong>Fuentes</strong></TableCell>
                                {ruleType === 'PACK' && <TableCell width={100}><strong>Cant. pack</strong></TableCell>}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {targetItemDetails?.variations.map((targetVar) => {
                                const targetVarId = targetVar.user_product_id.toString();
                                const mapping = mappings.find((m) => m.targetVariantId === targetVarId);
                                return (
                                    <RuleVariantRow
                                        key={targetVarId}
                                        targetVar={targetVar}
                                        targetVarId={targetVarId}
                                        mapping={mapping}
                                        ruleType={ruleType}
                                        sourceOptionsForPack={sourceOptionsForPack}
                                        availableSizes={availableSizes}
                                        defaultPackQuantity={defaultPackQty}
                                        componentsForCombo={components}
                                        sourceItemForFull={sourceItemForFull}
                                        onStrategyChange={handleStrategyChange}
                                        onMatchSizeChange={handleMatchSizeChange}
                                        onPackSingleSelect={handlePackSingleSelect}
                                        onComboVariantSelect={handleComboVariantSelect}
                                        onCustomPackQuantityChange={handleCustomPackQuantityChange}
                                    />
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
                <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/rules')}>
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
                    {activeStep === 1 && ruleType === 'FULL' && renderFullValidateStep()}
                    {activeStep === 1 && ruleType !== 'FULL' && renderStep2()}
                    {activeStep === 2 && renderStep3()}
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
                                        disabled={loading || !canSave}
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
