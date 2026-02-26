import React from 'react';
import {
    TableRow,
    TableCell,
    Typography,
    Stack,
    FormControl,
    Select,
    MenuItem,
    InputLabel,
    Box,
    ToggleButtonGroup,
    ToggleButton,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import type { MeliVariation, VariantMapping, RuleType, MappingStrategy } from '../../models/types';
import type { RuleComponentWithItem } from './RuleComponentsStep';

export interface SourceOption {
    sourceItemId: string;
    sourceVariantId: string;
    sourceSku: string;
    label: string;
}

interface RuleVariantRowProps {
    targetVar: MeliVariation;
    targetVarId: string;
    mapping: VariantMapping | undefined;
    ruleType: RuleType;
    /** PACK: options from the single source publication */
    sourceOptionsForPack?: SourceOption[];
    /** PACK: sizes from source SKUs for Dynamic mode */
    availableSizes?: string[];
    /** PACK: default quantity from component (Step 2) */
    defaultPackQuantity?: number;
    /** COMBO: source publications from Step 2 */
    componentsForCombo?: RuleComponentWithItem[];
    /** FULL: single source publication for SKU comparison */
    sourceItemForFull?: { id: string; variations?: MeliVariation[] } | null;
    onStrategyChange?: (targetVarId: string, strategy: MappingStrategy) => void;
    onMatchSizeChange?: (targetVarId: string, matchSize: string) => void;
    /** PACK Manual: select single variant */
    onPackSingleSelect?: (targetVarId: string, option: SourceOption | null) => void;
    /** COMBO: select variant for a source publication */
    onComboVariantSelect?: (targetVarId: string, sourceItemId: string, sourceVariantId: string) => void;
    onCustomPackQuantityChange?: (targetVarId: string, value: number | '') => void;
}

export const RuleVariantRow: React.FC<RuleVariantRowProps> = ({
    targetVar,
    targetVarId,
    mapping,
    ruleType,
    sourceOptionsForPack = [],
    availableSizes = [],
    defaultPackQuantity = 1,
    componentsForCombo = [],
    sourceItemForFull = null,
    onStrategyChange,
    onMatchSizeChange,
    onPackSingleSelect,
    onComboVariantSelect,
    onCustomPackQuantityChange,
}) => {
    const strategy = mapping?.strategy ?? 'EXPLICIT';
    const sourceMatches = mapping?.sourceMatches ?? [];
    const matchSize = mapping?.matchSize ?? '';
    const isExplicit = strategy === 'EXPLICIT';
    const isDynamic = strategy === 'DYNAMIC_SIZE';

    // --- PACK: single selected variant ---
    const packSelectedOption =
        isExplicit && sourceMatches[0]
            ? sourceOptionsForPack.find(
                (o) =>
                    o.sourceItemId === sourceMatches[0].sourceItemId &&
                    o.sourceVariantId === sourceMatches[0].sourceVariantId
            ) ?? null
            : null;

    const handleStrategyChange = (_: React.MouseEvent<HTMLElement>, newStrategy: MappingStrategy | null) => {
        if (newStrategy != null && onStrategyChange) onStrategyChange(targetVarId, newStrategy);
    };

    const handlePackSingleSelect = (option: SourceOption | null) => {
        onPackSingleSelect?.(targetVarId, option);
    };

    // --- FULL: match status (case insensitive per spec) ---
    const fullMatchSku = sourceItemForFull?.variations?.some(
        (v) => v.sku && targetVar.sku && v.sku.toLowerCase() === targetVar.sku.toLowerCase()
    );
    const fullMatchStatus = targetVar.sku
        ? fullMatchSku
            ? 'match'
            : 'no-match'
        : 'no-sku';

    if (ruleType === 'FULL') {
        return (
            <TableRow>
                <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                        {targetVar.description ?? targetVar.sku}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {targetVar.sku || 'Sin SKU'}
                    </Typography>
                </TableCell>
                <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        {fullMatchStatus === 'match' && (
                            <>
                                <CheckCircleOutlineIcon color="success" fontSize="small" />
                                <Typography variant="body2" color="success.main">
                                    Match: SKU coincide con la publicación Source
                                </Typography>
                            </>
                        )}
                        {fullMatchStatus === 'no-match' && (
                            <>
                                <WarningAmberIcon color="warning" fontSize="small" />
                                <Typography variant="body2" color="warning.dark">
                                    Sin coincidencia. Esta variante será ignorada.
                                </Typography>
                            </>
                        )}
                        {fullMatchStatus === 'no-sku' && (
                            <Typography variant="body2" color="text.secondary">
                                Sin SKU
                            </Typography>
                        )}
                    </Stack>
                </TableCell>
            </TableRow>
        );
    }

    if (ruleType === 'COMBO') {
        return (
            <TableRow>
                <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                        {targetVar.description ?? targetVar.sku}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {targetVar.sku || 'No SKU'}
                    </Typography>
                </TableCell>
                <TableCell>
                    <Stack spacing={1.5} sx={{ py: 0.5 }}>
                        {componentsForCombo.map((comp) => {
                            const variations = comp.sourceItem.variations ?? [];
                            const selectedMatch = sourceMatches.find((m) => m.sourceItemId === comp.sourceItem.id);
                            const selectedVariantId = selectedMatch?.sourceVariantId ?? '';
                            const options = variations.map((v) => ({
                                value: v.user_product_id.toString(),
                                label: v.sku ? `${v.sku} – ${v.description ?? ''}`.trim() || v.sku : (v.description ?? v.user_product_id),
                            }));
                            return (
                                <Box key={comp.sourceItem.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                    <Typography variant="body2" sx={{ minWidth: 140 }}>
                                        {comp.sourceItem.title ?? comp.sourceItem.id}
                                    </Typography>
                                    <FormControl size="small" sx={{ minWidth: 200 }}>
                                        <InputLabel id={`combo-${targetVarId}-${comp.sourceItem.id}`}>
                                            Variante
                                        </InputLabel>
                                        <Select
                                            labelId={`combo-${targetVarId}-${comp.sourceItem.id}`}
                                            value={selectedVariantId}
                                            label="Variante"
                                            onChange={(e) =>
                                                onComboVariantSelect?.(targetVarId, comp.sourceItem.id, e.target.value)
                                            }
                                        >
                                            <MenuItem value="">
                                                <em>Seleccionar variante...</em>
                                            </MenuItem>
                                            {options.map((opt) => (
                                                <MenuItem key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <Typography variant="caption" color="text.secondary">
                                        × {comp.quantity}
                                    </Typography>
                                </Box>
                            );
                        })}
                    </Stack>
                </TableCell>
            </TableRow>
        );
    }

    // --- PACK ---
    return (
        <TableRow>
            <TableCell>
                <Typography variant="body2" fontWeight="medium">
                    {targetVar.description ?? targetVar.sku}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {targetVar.sku || 'No SKU'}
                </Typography>
            </TableCell>
            <TableCell>
                <Stack spacing={1} sx={{ py: 0.5 }}>
                    {onStrategyChange && (
                        <ToggleButtonGroup
                            value={strategy}
                            exclusive
                            onChange={handleStrategyChange}
                            size="small"
                            sx={{ alignSelf: 'flex-start' }}
                        >
                            <ToggleButton value="EXPLICIT" aria-label="Manual por variante">
                                Manual
                            </ToggleButton>
                            <ToggleButton value="DYNAMIC_SIZE" aria-label="Dinámico por talle">
                                Dinámico (Talle)
                            </ToggleButton>
                        </ToggleButtonGroup>
                    )}

                    {isExplicit && (
                        <FormControl size="small" sx={{ minWidth: 260 }}>
                            <InputLabel id={`pack-single-${targetVarId}`}>Variante de la publicación Source</InputLabel>
                            <Select
                                labelId={`pack-single-${targetVarId}`}
                                value={packSelectedOption ? `${packSelectedOption.sourceItemId}:${packSelectedOption.sourceVariantId}` : ''}
                                label="Variante de la publicación Source"
                                onChange={(e) => {
                                    const val = e.target.value as string;
                                    if (!val) {
                                        handlePackSingleSelect(null);
                                        return;
                                    }
                                    const opt = sourceOptionsForPack.find(
                                        (o) => `${o.sourceItemId}:${o.sourceVariantId}` === val
                                    );
                                    handlePackSingleSelect(opt ?? null);
                                }}
                            >
                                <MenuItem value="">
                                    <em>Seleccionar variante...</em>
                                </MenuItem>
                                {sourceOptionsForPack.map((opt) => (
                                    <MenuItem key={`${opt.sourceItemId}-${opt.sourceVariantId}`} value={`${opt.sourceItemId}:${opt.sourceVariantId}`}>
                                        {opt.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}

                    {isDynamic && (
                        <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">
                            <FormControl size="small" sx={{ minWidth: 180 }}>
                                <InputLabel id={`match-size-${targetVarId}`}>Talle (Source)</InputLabel>
                                <Select
                                    labelId={`match-size-${targetVarId}`}
                                    value={matchSize}
                                    label="Talle (Source)"
                                    onChange={(e) => onMatchSizeChange?.(targetVarId, e.target.value)}
                                >
                                    <MenuItem value="">
                                        <em>Seleccionar...</em>
                                    </MenuItem>
                                    {availableSizes.map((s) => (
                                        <MenuItem key={s} value={s}>{s}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            {availableSizes.length === 0 && (
                                <Typography variant="caption" color="warning.main">
                                    No hay talles en los SKUs de origen (formato CODIGO#TALLE).
                                </Typography>
                            )}
                        </Stack>
                    )}
                </Stack>
            </TableCell>
            {ruleType === 'PACK' && (
                <TableCell width={100}>
                    <FormControl size="small" sx={{ width: 80 }}>
                        <Select
                            value={mapping?.customPackQuantity ?? ''}
                            displayEmpty
                            onChange={(e) =>
                                onCustomPackQuantityChange?.(
                                    targetVarId,
                                    (e.target.value as string | number) === '' ? '' : Number(e.target.value)
                                )
                            }
                            renderValue={(v) => ((v as string | number) === '' ? defaultPackQuantity : v)}
                        >
                            <MenuItem value="">
                                <em>{defaultPackQuantity} (default)</em>
                            </MenuItem>
                            {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                                <MenuItem key={n} value={n}>{n}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </TableCell>
            )}
        </TableRow>
    );
};
