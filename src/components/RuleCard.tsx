import React from 'react';
import {
    Card,
    CardActionArea,
    CardMedia,
    CardContent,
    Typography,
    Box,
    Chip,
    IconButton,
    Stack
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import type { StockRuleGroup } from '../models/types';

interface RuleCardProps {
    ruleGroup: StockRuleGroup;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
}

export const RuleCard: React.FC<RuleCardProps> = ({ ruleGroup, onEdit, onDelete }) => {
    // Calculate rule summaries
    const fullCount = ruleGroup.rules.filter(r => r.type === 'FULL').length;
    const packCount = ruleGroup.rules.filter(r => r.type === 'PACK').length;

    return (
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <CardActionArea onClick={() => onEdit(ruleGroup.motherItemId)} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                <CardMedia
                    component="img"
                    height="200"
                    image={ruleGroup.motherThumbnail || 'https://via.placeholder.com/200'}
                    alt={ruleGroup.motherTitle}
                    sx={{ objectFit: 'contain', p: 2, bgcolor: 'white' }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                    <Typography gutterBottom variant="h6" component="div" noWrap title={ruleGroup.motherTitle}>
                        {ruleGroup.motherTitle || 'Unknown Product'}
                    </Typography>

                    <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                        {fullCount > 0 && (
                            <Chip
                                label={`${fullCount} FULL`}
                                size="small"
                                color="primary"
                                variant="outlined"
                            />
                        )}
                        {packCount > 0 && (
                            <Chip
                                label={`${packCount} PACK`}
                                size="small"
                                color="secondary"
                                variant="outlined"
                            />
                        )}
                    </Stack>
                </CardContent>
            </CardActionArea>

            <Box sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(255,255,255,0.8)', borderRadius: 1 }}>
                <IconButton
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit(ruleGroup.motherItemId);
                    }}
                    aria-label="edit"
                >
                    <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                    size="small"
                    color="error"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(ruleGroup.motherItemId);
                    }}
                    aria-label="delete"
                >
                    <DeleteIcon fontSize="small" />
                </IconButton>
            </Box>
        </Card>
    );
};
