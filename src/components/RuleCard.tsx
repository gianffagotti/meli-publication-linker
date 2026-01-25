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
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Stack,
    Tooltip
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
    onEdit: (id: string) => void;
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

export const RuleCard: React.FC<RuleCardProps> = ({ ruleGroup, onEdit, onEditChild, onDeleteGroup, onDeleteRule }) => {
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
                    <Tooltip title="Delete Group">
                        <IconButton onClick={() => onDeleteGroup(ruleGroup.motherItemId)} color="error">
                            <DeleteSweepIcon />
                        </IconButton>
                    </Tooltip>
                }
                title={
                    <Typography variant="subtitle1" noWrap title={ruleGroup.motherTitle} sx={{ fontWeight: 'bold' }}>
                        {ruleGroup.motherTitle || 'Unknown Product'}
                    </Typography>
                }
                subheader={`Linked Publications: ${uniqueChildren.length}`}
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
                <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => onEdit(ruleGroup.motherItemId)}
                >
                    Edit Group
                </Button>
                <ExpandMore
                    expand={expanded}
                    onClick={handleExpandClick}
                    aria-expanded={expanded}
                    aria-label="show more"
                >
                    <ExpandMoreIcon />
                </ExpandMore>
            </CardActions>

            <Collapse in={expanded} timeout="auto" unmountOnExit>
                <CardContent sx={{ pt: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                        Linked Publications:
                    </Typography>
                    <List dense disablePadding>
                        {uniqueChildren.map((child) => (
                            <ListItem
                                key={child.childItemId}
                                secondaryAction={
                                    <Stack direction="row" spacing={0.5}>
                                        <Tooltip title="Edit Child Rules">
                                            <IconButton
                                                edge="end"
                                                aria-label="edit"
                                                size="small"
                                                onClick={() => onEditChild(ruleGroup.motherItemId, child.childItemId)}
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete Link">
                                            <IconButton
                                                edge="end"
                                                aria-label="delete"
                                                size="small"
                                                onClick={() => onDeleteRule(ruleGroup.motherItemId, child.childItemId)}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Stack>
                                }
                                sx={{
                                    bgcolor: 'background.paper',
                                    mb: 1,
                                    borderRadius: 1,
                                    border: '1px solid',
                                    borderColor: 'divider'
                                }}
                            >
                                <ListItemAvatar>
                                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'grey.300' }}>
                                        <InventoryIcon sx={{ fontSize: 20, color: 'grey.700' }} />
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={
                                        <Typography variant="body2" noWrap title={child.childTitle}>
                                            {child.childTitle || 'Unknown Child'}
                                        </Typography>
                                    }
                                    secondary={
                                        <Stack direction="column" spacing={0.5}>
                                            <Typography variant="caption" color="text.secondary">
                                                SKU: {child.childSku || 'N/A'}
                                            </Typography>
                                            <Stack direction="row" spacing={0.5}>
                                                {child.rules.map((r, i) => (
                                                    <Chip
                                                        key={i}
                                                        label={`${r.type} x${r.packQuantity}`}
                                                        size="small"
                                                        variant="outlined"
                                                        color={r.type === 'FULL' ? 'primary' : 'secondary'}
                                                        sx={{ height: 20, fontSize: '0.65rem' }}
                                                    />
                                                ))}
                                            </Stack>
                                        </Stack>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                </CardContent>
            </Collapse>
        </Card>
    );
};
