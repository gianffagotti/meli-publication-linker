import React, { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Collapse,
    Box,
    Typography,
    TablePagination,
    Chip,
    Avatar,
    Tooltip,
    Stack,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText
} from '@mui/material';
import {
    KeyboardArrowDown as KeyboardArrowDownIcon,
    KeyboardArrowUp as KeyboardArrowUpIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Inventory2 as InventoryIcon,
    BrokenImage as BrokenImageIcon
} from '@mui/icons-material';
import type { StockRule } from '../models/types';

interface StockRulesTableProps {
    rules: StockRule[];
    onDeleteRule: (targetItemId: string) => void;
    onEdit: (targetItemId: string) => void;
}

/** Summary label for rule (e.g. "Pack x3", "Híbrida", "Espejo"). */
function getRuleSummary(row: StockRule): string {
    switch (row.ruleType) {
        case 'FULL': return 'Espejo';
        case 'PACK': {
            const hasPool = row.mappings?.some(m => (m.sourceMatches?.length ?? 0) > 1);
            return hasPool ? 'Híbrida' : `Pack x${row.defaultPackQuantity ?? 1}`;
        }
        case 'COMBO': return 'Combo';
        default: return row.ruleType;
    }
}

const StockRuleRow: React.FC<{
    row: StockRule;
    onDeleteRule: (targetItemId: string) => void;
    onEdit: (targetItemId: string) => void;
}> = ({ row, onDeleteRule, onEdit }) => {
    const [open, setOpen] = useState(false);

    const getRuleColor = (type: string) => {
        switch (type) {
            case 'FULL': return 'success';
            case 'PACK': return 'primary';
            case 'COMBO': return 'secondary';
            default: return 'default';
        }
    };

    return (
        <React.Fragment>
            <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                <TableCell width={50}>
                    <IconButton
                        aria-label="expand row"
                        size="small"
                        onClick={() => setOpen(!open)}
                    >
                        {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                </TableCell>
                <TableCell component="th" scope="row" width={80}>
                    <Avatar
                        variant="rounded"
                        src={row.targetThumbnail || undefined}
                        alt={row.targetTitle}
                        sx={{ width: 50, height: 50 }}
                    >
                        <BrokenImageIcon />
                    </Avatar>
                </TableCell>
                <TableCell>
                    <Typography variant="subtitle2" component="div" sx={{ fontWeight: 'bold' }}>
                        {row.targetTitle || row.targetItemId}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        ID: {row.targetItemId}
                    </Typography>
                </TableCell>
                <TableCell align="center" width={140}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                        <Chip
                            label={row.ruleType}
                            size="small"
                            color={getRuleColor(row.ruleType)}
                            variant="outlined"
                            sx={{ fontWeight: 'bold' }}
                        />
                        <Typography variant="caption" color="text.secondary">
                            {getRuleSummary(row)}
                        </Typography>
                    </Box>
                </TableCell>

                <TableCell align="right" width={120}>
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Tooltip title="Editar Regla">
                            <IconButton
                                size="small"
                                onClick={() => onEdit(row.targetItemId)}
                                color="primary"
                            >
                                <EditIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar Regla">
                            <IconButton
                                size="small"
                                onClick={() => onDeleteRule(row.targetItemId)}
                                color="error"
                            >
                                <DeleteIcon />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 1, bgcolor: 'grey.50', borderRadius: 1, p: 2 }}>
                            <Typography variant="subtitle2" gutterBottom component="div" color="text.secondary">
                                Receta / Componentes
                            </Typography>
                            <List dense>
                                {row.components.map((comp) => {
                                    // Try to find hydrated details if available
                                    const details = row.sourceItems?.find(i => i.id === comp.sourceItemId);
                                    return (
                                        <ListItem key={comp.sourceItemId}>
                                            <ListItemAvatar>
                                                <Avatar src={details?.thumbnail} variant="rounded">
                                                    <InventoryIcon />
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={details?.title || comp.sourceItemId}
                                                secondary={`ID: ${comp.sourceItemId} | SKU: ${details?.variations?.[0]?.sku || 'N/A'}`}
                                            />
                                            <Chip
                                                label={`x${comp.quantity}`}
                                                size="small"
                                                sx={{ fontWeight: 'bold' }}
                                            />
                                        </ListItem>
                                    );
                                })}
                            </List>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </React.Fragment >
    );
};

export const StockRulesTable: React.FC<StockRulesTableProps> = ({
    rules,
    onDeleteRule,
    onEdit
}) => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const handleChangePage = (_: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Avoid a layout jump when reaching the last page with empty rows.
    const emptyRows =
        page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rules.length) : 0;

    const visibleRules = rules.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage,
    );

    return (
        <Paper sx={{ width: '100%', mb: 2 }}>
            <TableContainer>
                <Table aria-label="collapsible table" size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell width={50} />
                            <TableCell width={80}>Imagen</TableCell>
                            <TableCell>Publicación Objetivo (Combo/Pack)</TableCell>
                            <TableCell align="center" width={120}>Tipo</TableCell>

                            <TableCell align="right" width={120}>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {visibleRules.map((row) => (
                            <StockRuleRow
                                key={row.targetItemId}
                                row={row}
                                onDeleteRule={onDeleteRule}
                                onEdit={onEdit}
                            />
                        ))}
                        {emptyRows > 0 && (
                            <TableRow style={{ height: 53 * emptyRows }}>
                                <TableCell colSpan={6} />
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={rules.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Filas por página"
            />
        </Paper>
    );
};
