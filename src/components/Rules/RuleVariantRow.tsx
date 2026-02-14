import React, { useState } from 'react';
import {
    TableRow,
    TableCell,
    Typography,
    Stack,
    Chip,
    TextField,
    Button,
    Autocomplete,
    Checkbox,
    Box,
    ToggleButtonGroup,
    ToggleButton,
    FormControl,
    Select,
    MenuItem,
    InputLabel,
} from '@mui/material';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import type { MeliVariation, VariantMapping, RuleSourceMatch, RuleType, MappingStrategy } from '../../models/types';

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
    allSourceOptions: SourceOption[];
    /** Sizes parsed from source item SKUs (split by '#', last segment). For Dynamic strategy dropdown. */
    availableSizes: string[];
    ruleType: RuleType;
    defaultPackQuantity: number;
    onAddSources: (targetVarId: string, options: SourceOption[], quantity: number) => void;
    onRemoveSource: (targetVarId: string, matchIndex: number) => void;
    onMappingQuantityChange: (targetVarId: string, sourceItemId: string, sourceVariantId: string, quantity: number) => void;
    onCustomPackQuantityChange: (targetVarId: string, value: number | '') => void;
    onApplyToAll: (targetVarId: string) => void;
    onStrategyChange?: (targetVarId: string, strategy: MappingStrategy) => void;
    onMatchSizeChange?: (targetVarId: string, matchSize: string) => void;
}

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

export const RuleVariantRow: React.FC<RuleVariantRowProps> = ({
    targetVar,
    targetVarId,
    mapping,
    allSourceOptions,
    availableSizes,
    ruleType,
    defaultPackQuantity,
    onAddSources,
    onRemoveSource,
    onMappingQuantityChange,
    onCustomPackQuantityChange,
    onApplyToAll,
    onStrategyChange,
    onMatchSizeChange,
}) => {
    const [multiSelectValue, setMultiSelectValue] = useState<SourceOption[]>([]);

    const strategy = mapping?.strategy ?? 'EXPLICIT';
    const sourceMatches = mapping?.sourceMatches ?? [];
    const matchSize = mapping?.matchSize ?? '';
    const isPool = sourceMatches.length > 1;
    const isExplicit = strategy === 'EXPLICIT';
    const isDynamic = strategy === 'DYNAMIC_SIZE';

    // Exclude already-assigned options from the multi-select
    const availableOptions = allSourceOptions.filter(
        (opt) => !sourceMatches.some(
            (sm) => sm.sourceItemId === opt.sourceItemId && sm.sourceVariantId === opt.sourceVariantId
        )
    );

    const handleMultiSelectChange = (_: React.SyntheticEvent, value: SourceOption[]) => {
        if (value.length === 0) return;
        const quantity = ruleType === 'COMBO' ? 1 : defaultPackQuantity;
        onAddSources(targetVarId, value, quantity);
        setMultiSelectValue([]); // Reset after adding
    };

    const handleStrategyChange = (_: React.MouseEvent<HTMLElement>, newStrategy: MappingStrategy | null) => {
        if (newStrategy != null && onStrategyChange) onStrategyChange(targetVarId, newStrategy);
    };

    const canApplyToAll = isExplicit ? sourceMatches.length > 0 : isDynamic && !!matchSize;

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
                    {/* Strategy toggle: only for PACK/COMBO with handler */}
                    {(ruleType === 'PACK' || ruleType === 'COMBO') && onStrategyChange && (
                        <ToggleButtonGroup
                            value={strategy}
                            exclusive
                            onChange={handleStrategyChange}
                            size="small"
                            sx={{ alignSelf: 'flex-start' }}
                        >
                            <ToggleButton value="EXPLICIT" aria-label="Manual por SKU">
                                Manual (SKU)
                            </ToggleButton>
                            <ToggleButton value="DYNAMIC_SIZE" aria-label="Dinámico por talle">
                                Dinámico (Talle)
                            </ToggleButton>
                        </ToggleButtonGroup>
                    )}

                    {isExplicit && (
                        <Stack direction="row" flexWrap="wrap" gap={0.5} alignItems="center">
                            {isPool && (
                                <Chip
                                    label="Surtido/Pool"
                                    size="small"
                                    color="secondary"
                                    sx={{ mr: 0.5 }}
                                />
                            )}
                            {sourceMatches.map((sm: RuleSourceMatch, idx: number) => (
                                <Chip
                                    key={`${sm.sourceItemId}-${sm.sourceVariantId}-${idx}`}
                                    label={ruleType === 'COMBO' ? `${sm.sourceSku} × ${sm.quantity}` : sm.sourceSku}
                                    size="small"
                                    onDelete={() => onRemoveSource(targetVarId, idx)}
                                    sx={{ mb: 0.5 }}
                                />
                            ))}
                            <Autocomplete
                                multiple
                                size="small"
                                options={availableOptions}
                                value={multiSelectValue}
                                onChange={handleMultiSelectChange}
                                getOptionLabel={(opt) => opt.label}
                                isOptionEqualToValue={(a, b) =>
                                    a.sourceItemId === b.sourceItemId && a.sourceVariantId === b.sourceVariantId
                                }
                                renderOption={(props, option, { selected }) => (
                                    <li {...props} key={`${option.sourceItemId}-${option.sourceVariantId}`}>
                                        <Checkbox
                                            icon={icon}
                                            checkedIcon={checkedIcon}
                                            style={{ marginRight: 8 }}
                                            checked={selected}
                                        />
                                        {option.label}
                                    </li>
                                )}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        placeholder="+ Agregar SKUs"
                                        sx={{ minWidth: 220 }}
                                    />
                                )}
                                sx={{ minWidth: 220, display: 'inline-flex' }}
                                disableCloseOnSelect
                            />
                        </Stack>
                    )}

                    {isDynamic && (
                        <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">
                            {matchSize && (
                                <Chip
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                    label={`Dinámico: Todos los "${matchSize}"`}
                                />
                            )}
                            <FormControl size="small" sx={{ minWidth: 180 }}>
                                <InputLabel id={`match-size-${targetVarId}`}>Hacer match con talle</InputLabel>
                                <Select
                                    labelId={`match-size-${targetVarId}`}
                                    value={matchSize}
                                    label="Hacer match con talle"
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
                                    No se detectaron talles en los SKUs de origen (usar formato CODIGO#TALLE).
                                </Typography>
                            )}
                        </Stack>
                    )}

                    {ruleType === 'COMBO' && isExplicit && sourceMatches.length > 0 && (
                        <Box sx={{ mt: 0.5 }}>
                            {sourceMatches.map((sm, idx) => (
                                <TextField
                                    key={`qty-${targetVarId}-${idx}`}
                                    size="small"
                                    type="number"
                                    label={`Cant. ${sm.sourceSku}`}
                                    value={sm.quantity}
                                    onChange={(e) =>
                                        onMappingQuantityChange(
                                            targetVarId,
                                            sm.sourceItemId,
                                            sm.sourceVariantId,
                                            parseInt(e.target.value, 10) || 1
                                        )
                                    }
                                    inputProps={{ min: 1 }}
                                    sx={{ width: 80, mr: 1, mt: 0.5 }}
                                />
                            ))}
                        </Box>
                    )}
                </Stack>
            </TableCell>
            {ruleType === 'PACK' && (
                <TableCell width={100}>
                    <TextField
                        size="small"
                        type="number"
                        placeholder={`${defaultPackQuantity}`}
                        value={mapping?.customPackQuantity ?? ''}
                        onChange={(e) =>
                            onCustomPackQuantityChange(
                                targetVarId,
                                e.target.value === '' ? '' : parseInt(e.target.value, 10)
                            )
                        }
                        inputProps={{ min: 1 }}
                        sx={{ width: 70 }}
                    />
                </TableCell>
            )}
            <TableCell width={120}>
                <Button
                    size="small"
                    variant="outlined"
                    disabled={!canApplyToAll}
                    onClick={() => onApplyToAll(targetVarId)}
                >
                    Aplicar a todas
                </Button>
            </TableCell>
        </TableRow>
    );
};
