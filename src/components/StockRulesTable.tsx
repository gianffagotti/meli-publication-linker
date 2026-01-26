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
    Stack
} from '@mui/material';
import {
    KeyboardArrowDown as KeyboardArrowDownIcon,
    KeyboardArrowUp as KeyboardArrowUpIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    DeleteSweep as DeleteSweepIcon,
    Inventory2 as InventoryIcon,
    BrokenImage as BrokenImageIcon
} from '@mui/icons-material';
import type { StockRuleGroup, StockRule } from '../models/types';

interface StockRulesTableProps {
    rules: StockRuleGroup[];
    onDeleteGroup: (motherId: string) => void;
    onDeleteRule: (motherId: string, childId: string) => void;
    onEdit: (motherId: string, childId: string) => void;
}

const StockRuleRow: React.FC<{
    row: StockRuleGroup;
    onDeleteGroup: (motherId: string) => void;
    onDeleteRule: (motherId: string, childId: string) => void;
    onEdit: (motherId: string, childId: string) => void;
}> = ({ row, onDeleteGroup, onDeleteRule, onEdit }) => {
    const [open, setOpen] = useState(false);

    // Group rules by childItemId to avoid duplicates in the expanded view if any
    // Although the backend likely returns one rule per child-mother pair usually, 
    // but let's follow the pattern in RuleCard just in case or simplify if we assume unique.
    // The requirement says "One row = One 'Mother' publication".
    // "Inner Table" showing "Child items".

    // Let's group by childItemId like in RuleCard to be safe and consistent.
    const childGroups = row.rules.reduce((acc, rule) => {
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
    }, {} as Record<string, { childItemId: string, childTitle?: string, childSku?: string, rules: StockRule[] }>);

    const uniqueChildren = Object.values(childGroups);

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
                        src={row.motherThumbnail}
                        alt={row.motherTitle}
                        sx={{ width: 50, height: 50 }}
                    >
                        <BrokenImageIcon />
                    </Avatar>
                </TableCell>
                <TableCell>
                    <Typography variant="subtitle2" component="div" sx={{ fontWeight: 'bold' }}>
                        {row.motherTitle || 'Producto Desconocido'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        ID: {row.motherItemId}
                    </Typography>
                </TableCell>
                <TableCell align="center" width={120}>
                    <Chip
                        label={`${uniqueChildren.length} Linked`}
                        size="small"
                        color="primary"
                        variant="outlined"
                    />
                </TableCell>
                <TableCell align="right" width={120}>
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Tooltip title="Eliminar Grupo">
                            <IconButton
                                size="small"
                                onClick={() => onDeleteGroup(row.motherItemId)}
                                color="error"
                            >
                                <DeleteSweepIcon />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 1, bgcolor: 'grey.50', borderRadius: 1, p: 2 }}>
                            <Typography variant="h6" gutterBottom component="div">
                                Publicaciones Hijas
                            </Typography>
                            <Table size="small" aria-label="purchases">
                                <TableHead>
                                    <TableRow>
                                        <TableCell width={60}>Img</TableCell>
                                        <TableCell>Título</TableCell>
                                        <TableCell>Tipo</TableCell>
                                        <TableCell align="right">Regla (N:1)</TableCell>
                                        <TableCell align="right">Acciones</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {uniqueChildren.map((childGroup) => (
                                        <TableRow key={childGroup.childItemId}>
                                            <TableCell component="th" scope="row">
                                                <Avatar
                                                    sx={{ width: 32, height: 32, bgcolor: 'grey.200' }}
                                                >
                                                    <InventoryIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                                                </Avatar>
                                            </TableCell>
                                            <TableCell>{childGroup.childTitle || 'Desconocido'}</TableCell>
                                            <TableCell>
                                                {(() => {
                                                    const totalQuantity = childGroup.rules.length;
                                                    const ruleType = childGroup.rules.length > 0 ? childGroup.rules[0].type : '';

                                                    return (
                                                        <Chip
                                                            label={`${totalQuantity} ${ruleType}`}
                                                            size="small"
                                                            color={ruleType === 'FULL' ? 'primary' : 'secondary'}
                                                            variant="outlined"
                                                            sx={{ height: 24, fontSize: '0.75rem', fontWeight: 'bold' }}
                                                        />
                                                    );
                                                })()}
                                            </TableCell>
                                            <TableCell align="right">
                                                <Stack direction="column" spacing={0.5} alignItems="flex-end">
                                                    <Typography variant="caption" display="block">
                                                        x{childGroup.rules[0].packQuantity || '-'}
                                                    </Typography>
                                                </Stack>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Tooltip title="Editar Regla">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => onEdit(row.motherItemId, childGroup.childItemId)}
                                                        sx={{ color: 'primary.main' }}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Desvincular (Eliminar Regla)">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => onDeleteRule(row.motherItemId, childGroup.childItemId)}
                                                        sx={{ color: 'error.main' }}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </React.Fragment >
    );
};

export const StockRulesTable: React.FC<StockRulesTableProps> = ({
    rules,
    onDeleteGroup,
    onDeleteRule,
    onEdit
}) => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const handleChangePage = (event: unknown, newPage: number) => {
        console.log(event);
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
                            <TableCell>Publicación Madre</TableCell>
                            <TableCell align="center" width={120}>Vínculos</TableCell>
                            <TableCell align="right" width={120}>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {visibleRules.map((row) => (
                            <StockRuleRow
                                key={row.motherItemId}
                                row={row}
                                onDeleteGroup={onDeleteGroup}
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
