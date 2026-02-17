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
  Box,
  Typography,
  TablePagination,
  Chip,
  Avatar,
  Tooltip,
  Stack,
  Link,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  BrokenImage as BrokenImageIcon,
  Inventory2 as InventoryIcon,
  LocalShipping as LogisticsIcon,
} from '@mui/icons-material';
import type { StockRule, RuleComponent, MeliItem } from '../models/types';

const ML_ITEM_BASE = 'https://articulo.mercadolibre.com.ar';

interface StockRulesTableProps {
  rules: StockRule[];
  onDeleteRule: (targetItemId: string) => void;
  onEdit: (targetItemId: string) => void;
}

/** Tipo badge colors per Spec 2.2: FULL=Blue, PACK=Green, COMBO=Purple */
function getTipoColor(ruleType: string): 'primary' | 'success' | 'secondary' {
  switch (ruleType) {
    case 'FULL':
      return 'primary';
    case 'PACK':
      return 'success';
    case 'COMBO':
      return 'secondary';
    default:
      return 'primary';
  }
}

/** True if target is FULL and has fulfillment logistics (show badge). */
function showLogisticsBadge(rule: StockRule): boolean {
  if (rule.ruleType !== 'FULL') return false;
  const lt = rule.targetItem?.shipping?.logistic_type ?? rule.targetItem?.logisticsType ?? '';
  return String(lt).toLowerCase() === 'fulfillment' || String(lt).toLowerCase() === 'full';
}

function TargetCell({ row }: { row: StockRule }) {
  const title = row.targetItem?.title ?? row.targetTitle ?? row.targetItemId;
  const href = `${ML_ITEM_BASE}/${row.targetItemId}`;

  return (
    <TableCell>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
        <Avatar
          variant="rounded"
          src={row.targetThumbnail ?? undefined}
          alt={title}
          sx={{ width: 48, height: 48, flexShrink: 0 }}
        >
          <BrokenImageIcon />
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Link
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            variant="subtitle2"
            sx={{ fontWeight: 600, display: 'block' }}
          >
            {title}
          </Link>
          <Typography variant="caption" color="text.secondary">
            {row.targetItemId}
          </Typography>
          {showLogisticsBadge(row) && (
            <Chip
              icon={<LogisticsIcon sx={{ fontSize: 14 }} />}
              label="Fulfillment"
              size="small"
              color="primary"
              variant="outlined"
              sx={{ mt: 0.5 }}
            />
          )}
        </Box>
      </Box>
    </TableCell>
  );
}

function ComponentsCell({ row }: { row: StockRule }) {
  return (
    <TableCell sx={{ maxWidth: 380 }}>
      <Stack spacing={1}>
        {row.components.map((comp: RuleComponent) => {
          const source = row.sourceItems?.find((i: MeliItem) => i.id === comp.sourceItemId);
          const title = source?.title ?? comp.sourceItemId;
          const truncated = title.length > 50 ? `${title.slice(0, 50)}…` : title;

          return (
            <Box
              key={comp.sourceItemId}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                py: 0.25,
              }}
            >
              <Avatar
                src={source?.thumbnail}
                variant="rounded"
                sx={{ width: 36, height: 36 }}
              >
                <InventoryIcon fontSize="small" />
              </Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="body2" noWrap title={title}>
                  {truncated}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {comp.sourceItemId}
                </Typography>
              </Box>
              <Chip
                label={`x${comp.quantity}`}
                size="small"
                color="default"
                sx={{ fontWeight: 700, flexShrink: 0 }}
              />
            </Box>
          );
        })}
      </Stack>
    </TableCell>
  );
}

function StockRuleRow({
  row,
  onDeleteRule,
  onEdit,
}: {
  row: StockRule;
  onDeleteRule: (targetItemId: string) => void;
  onEdit: (targetItemId: string) => void;
}) {
  return (
    <TableRow>
      <TargetCell row={row} />
      <ComponentsCell row={row} />
      <TableCell align="center" width={100}>
        <Chip
          label={row.ruleType}
          size="small"
          color={getTipoColor(row.ruleType)}
          sx={{ fontWeight: 600 }}
        />
      </TableCell>
      <TableCell align="right" width={120}>
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <Tooltip title="Editar Regla">
            <IconButton size="small" onClick={() => onEdit(row.targetItemId)} color="primary">
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar Regla">
            <IconButton size="small" onClick={() => onDeleteRule(row.targetItemId)} color="error">
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </TableCell>
    </TableRow>
  );
}

export const StockRulesTable: React.FC<StockRulesTableProps> = ({
  rules,
  onDeleteRule,
  onEdit,
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rules.length) : 0;
  const visibleRules = rules.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Paper sx={{ width: '100%', mb: 2 }}>
      <TableContainer>
        <Table aria-label="Reglas de stock" size="small">
          <TableHead>
            <TableRow>
              <TableCell>Publicación Objetivo</TableCell>
              <TableCell>Componentes</TableCell>
              <TableCell align="center" width={100}>
                Tipo
              </TableCell>
              <TableCell align="right" width={120}>
                Acciones
              </TableCell>
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
                <TableCell colSpan={4} />
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
