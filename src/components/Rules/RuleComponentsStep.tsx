import React from 'react';
import {
    Box,
    Grid,
    Typography,
    Alert,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    TextField,
    Avatar,
    Divider,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { ItemSearch } from '../Shared/ItemSearch';
import type { MeliItem, RuleType } from '../../models/types';

export interface RuleComponentWithItem {
    sourceItem: MeliItem;
    quantity: number;
}

interface RuleComponentsStepProps {
    ruleType: RuleType;
    targetTitle?: string;
    components: RuleComponentWithItem[];
    onComponentsChange: (components: RuleComponentWithItem[]) => void;
    onAddSource: (item: MeliItem | null) => void;
}

export const RuleComponentsStep: React.FC<RuleComponentsStepProps> = ({
    ruleType,
    targetTitle,
    components,
    onComponentsChange,
    onAddSource,
}) => {
    const handleRemoveSource = (itemId: string) => {
        onComponentsChange(components.filter((c) => c.sourceItem.id !== itemId));
    };

    const handleQuantityChange = (itemId: string, qty: number) => {
        const value = Math.max(1, Math.floor(qty));
        onComponentsChange(
            components.map((c) =>
                c.sourceItem.id === itemId ? { ...c, quantity: value } : c
            )
        );
    };

    return (
        <Grid container spacing={3}>
            <Grid size={12}>
                <Typography variant="h6" gutterBottom>
                    Componentes para: <strong>{targetTitle ?? '—'}</strong>
                </Typography>
                <Alert severity="info" sx={{ mb: 2 }}>
                    {ruleType === 'PACK' &&
                        'Seleccione la publicación unitaria (Source). La cantidad se define por componente abajo.'}
                    {ruleType === 'FULL' &&
                        'Seleccione la publicación equivalente (1 a 1 por SKU).'}
                    {ruleType === 'COMBO' &&
                        'Agregue las publicaciones que componen el combo. Indique la cantidad de cada una.'}
                </Alert>

                <Box sx={{ mb: 3 }}>
                    <ItemSearch
                        label="Buscar Publicación MELI (Source)..."
                        onSelect={onAddSource}
                    />
                </Box>

                <Paper variant="outlined">
                    <List>
                        {components.map((comp, index) => (
                            <React.Fragment key={comp.sourceItem.id}>
                                <ListItem>
                                    <Box sx={{ mr: 2 }}>
                                        <Avatar
                                            src={comp.sourceItem.thumbnail}
                                            variant="rounded"
                                        />
                                    </Box>
                                    <ListItemText
                                        primary={comp.sourceItem.title ?? comp.sourceItem.id}
                                        secondary={`ID: ${comp.sourceItem.id}`}
                                    />
                                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                                        <TextField
                                            label="Unidades"
                                            type="number"
                                            size="small"
                                            value={comp.quantity}
                                            onChange={(e) =>
                                                handleQuantityChange(
                                                    comp.sourceItem.id,
                                                    parseInt(e.target.value, 10) || 1
                                                )
                                            }
                                            sx={{ width: 100 }}
                                            disabled={ruleType === 'FULL'}
                                            inputProps={{ min: 1 }}
                                            helperText={
                                                ruleType !== 'FULL'
                                                    ? `Esta regla usa ${comp.quantity} unidad(es) de esta publicación`
                                                    : undefined
                                            }
                                        />
                                    </Box>
                                    <ListItemSecondaryAction>
                                        <IconButton
                                            edge="end"
                                            aria-label="eliminar"
                                            onClick={() => handleRemoveSource(comp.sourceItem.id)}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </ListItemSecondaryAction>
                                </ListItem>
                                {index < components.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                        {components.length === 0 && (
                            <ListItem>
                                <ListItemText
                                    primary="No hay componentes. Busque y agregue publicaciones MELI (Source)."
                                    sx={{ color: 'text.secondary', textAlign: 'center' }}
                                />
                            </ListItem>
                        )}
                    </List>
                </Paper>
            </Grid>
        </Grid>
    );
};
