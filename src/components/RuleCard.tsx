import React, { useState } from 'react';
import {
    Card,
    CardHeader,
    CardMedia,
    CardContent,
    CardActions,
    Collapse,
    Typography,
    Chip,
    IconButton,
    List,
    ListItem,
    ListItemAvatar,
    Avatar,
    Stack,
    Tooltip,
    Box
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    ExpandMore as ExpandMoreIcon,
    Inventory2 as InventoryIcon,
    DeleteSweep as DeleteSweepIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import type { StockRuleGroup } from '../models/types';

interface RuleCardProps {
    ruleGroup: StockRuleGroup;
    onEditChild: (motherId: string, childId: string) => void;
    onDeleteGroup: (id: string) => void;
    onDeleteRule: (motherId: string, childId: string) => void;
}

interface ExpandMoreProps extends React.ComponentProps<typeof IconButton> {
    expand: boolean;
}

const ExpandMore = styled((props: ExpandMoreProps) => {
    const { expand, ...other } = props;
    return <IconButton {...other} />;
})(({ theme, expand }) => ({
    transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
    marginLeft: 'auto',
    transition: theme.transitions.create('transform', {
        duration: theme.transitions.duration.shortest,
    }),
}));

export const RuleCard: React.FC<RuleCardProps> = ({ ruleGroup, onEditChild, onDeleteGroup, onDeleteRule }) => {
    const [expanded, setExpanded] = useState(false);

    // Calculate rule summaries
    const fullCount = ruleGroup.rules.filter(r => r.type === 'FULL').length;
    const packCount = ruleGroup.rules.filter(r => r.type === 'PACK').length;

    // Group rules by childItemId
    const childGroups = ruleGroup.rules.reduce((acc, rule) => {
        if (!acc[rule.childItemId]) {
            acc[rule.childItemId] = {
                childItemId: rule.childItemId,
                childTitle: rule.childTitle,
                childSku: rule.childSku,
                rules: []
            };
        }
        acc[rule.childItemId].rules.push(rule);
        return acc;
    }, {} as Record<string, { childItemId: string, childTitle?: string, childSku?: string, rules: typeof ruleGroup.rules }>);

    const uniqueChildren = Object.values(childGroups);

    const handleExpandClick = () => {
        setExpanded(!expanded);
    };

    return (
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardHeader
                action={
                    <Tooltip title="Eliminar Grupo">
                        <IconButton onClick={() => onDeleteGroup(ruleGroup.motherItemId)} color="error">
                            <DeleteSweepIcon />
                        </IconButton>
                    </Tooltip>
                }
                title={
                    <Typography variant="subtitle1" noWrap title={ruleGroup.motherTitle} sx={{ fontWeight: 'bold' }}>
                        {ruleGroup.motherTitle || 'Producto Desconocido'}
                    </Typography>
                }
                subheader={`Publicaciones Vinculadas: ${uniqueChildren.length}`}
            />

            <CardMedia
                component="img"
                height="150"
                image={ruleGroup.motherThumbnail || 'https://via.placeholder.com/200'}
                alt={ruleGroup.motherTitle}
                sx={{ objectFit: 'contain', p: 1, bgcolor: 'white' }}
            />

            <CardContent sx={{ flexGrow: 1, py: 1 }}>
                <Stack direction="row" spacing={1} sx={{ mt: 1, mb: 1 }}>
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

            <CardActions disableSpacing>
                <ExpandMore
                    expand={expanded}
                    onClick={handleExpandClick}
                    aria-expanded={expanded}
                    aria-label="mostrar más"
                >
                    <ExpandMoreIcon />
                </ExpandMore>
            </CardActions>

            <Collapse in={expanded} timeout="auto" unmountOnExit>
                <CardContent sx={{ pt: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                        Publicaciones Vinculadas:
                    </Typography>
                    <List dense disablePadding>
                        {uniqueChildren.map((child) => (
                            <ListItem
                                key={child.childItemId}
                                sx={{
                                    bgcolor: 'background.paper',
                                    mb: 1,
                                    borderRadius: 1,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    p: 1,
                                    '&:hover': {
                                        bgcolor: 'action.hover',
                                    }
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                    <ListItemAvatar sx={{ minWidth: 40 }}>
                                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'grey.100', color: 'text.secondary' }}>
                                            <InventoryIcon sx={{ fontSize: 18 }} />
                                        </Avatar>
                                    </ListItemAvatar>

                                    <Box sx={{ flexGrow: 1, minWidth: 0, mr: 1 }}>
                                        <Tooltip title={child.childTitle || ''}>
                                            <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
                                                {child.childTitle || 'Publicación Desconocida'}
                                            </Typography>
                                        </Tooltip>
                                    </Box>

                                    <Stack direction="row" spacing={0} sx={{ flexShrink: 0 }}>
                                        <Tooltip title="Editar Reglas">
                                            <IconButton
                                                size="small"
                                                onClick={() => onEditChild(ruleGroup.motherItemId, child.childItemId)}
                                                sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Eliminar Enlace">
                                            <IconButton
                                                size="small"
                                                onClick={() => onDeleteRule(ruleGroup.motherItemId, child.childItemId)}
                                                sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Stack>
                                </Box>
                            </ListItem>
                        ))}
                    </List>
                </CardContent>
            </Collapse>
        </Card>
    );
};
