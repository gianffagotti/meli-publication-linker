import React, { useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Collapse,
  Alert,
  Chip,
  CircularProgress,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { dataService } from '../services/apiFactory';
import type { DashboardLogEntry } from '../models/types';

const SEVERITIES = ['', 'Info', 'Warning', 'Error'];
const CATEGORIES = ['', 'FullRuleDiscovery', 'StockSync'];

function formatDateForApi(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getLast30Days(): { value: string; label: string }[] {
  const items: { value: string; label: string }[] = [];
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const value = formatDateForApi(d);
    const label = i === 0 ? 'Hoy' : i === 1 ? 'Ayer' : value;
    items.push({ value, label });
  }
  return items;
}

const DATE_OPTIONS = getLast30Days();

export const DashboardPage: React.FC = () => {
  const [date, setDate] = useState<string>(() => formatDateForApi(new Date()));
  const [severity, setSeverity] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [logs, setLogs] = useState<DashboardLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [discoverRunning, setDiscoverRunning] = useState(false);
  const [discoverResult, setDiscoverResult] = useState<{ processed: number; created: number; incomplete: number } | null>(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await dataService.getDashboardLogs(
        date,
        severity || undefined,
        category || undefined
      );
      setLogs(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar logs.');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [date, severity, category]);

  React.useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleMarkRead = async (entry: DashboardLogEntry) => {
    try {
      await dataService.markDashboardLogRead(entry.partitionKey, entry.rowKey);
      setLogs((prev) =>
        prev.map((e) =>
          e.partitionKey === entry.partitionKey && e.rowKey === entry.rowKey
            ? { ...e, isRead: true }
            : e
        )
      );
    } catch {
      // ignore
    }
  };

  const handleDiscoverFullRules = async () => {
    setDiscoverRunning(true);
    setDiscoverResult(null);
    setError(null);
    try {
      const result = await dataService.runDiscoverFullRules();
      setDiscoverResult({ processed: result.processed, created: result.created, incomplete: result.incomplete });
      setDate(formatDateForApi(new Date()));
      await loadLogs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al ejecutar descubrimiento.');
    } finally {
      setDiscoverRunning(false);
    }
  };

  const toggleExpand = (pk: string, rk: string) => {
    const key = `${pk}|${rk}`;
    setExpandedKey((prev) => (prev === key ? null : key));
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 3 }}>
        Dashboard de Sincronización
      </Typography>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Descubrir reglas FULL
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Escanea publicaciones Fulfillment en MELI y crea reglas FULL cuando los SKUs existen en Znube.
          </Typography>
          <Button
            variant="contained"
            startIcon={discoverRunning ? <CircularProgress size={20} color="inherit" /> : <AutoAwesomeIcon />}
            onClick={handleDiscoverFullRules}
            disabled={discoverRunning}
          >
            {discoverRunning ? 'Ejecutando...' : 'Descubrir reglas FULL'}
          </Button>
          {discoverResult && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Procesadas: {discoverResult.processed}, reglas creadas: {discoverResult.created}, incompletas: {discoverResult.incomplete}.
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Logs
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Fecha</InputLabel>
              <Select
                value={date}
                label="Fecha"
                onChange={(e) => setDate(e.target.value)}
              >
                {DATE_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Severidad</InputLabel>
              <Select
                value={severity}
                label="Severidad"
                onChange={(e) => setSeverity(e.target.value)}
              >
                {SEVERITIES.map((s) => (
                  <MenuItem key={s || '_'} value={s}>
                    {s || 'Todas'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Categoría</InputLabel>
              <Select
                value={category}
                label="Categoría"
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <MenuItem key={c || '_'} value={c}>
                    {c || 'Todas'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant="outlined" size="small" onClick={loadLogs} disabled={loading}>
              {loading ? 'Cargando...' : 'Actualizar'}
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {loading && logs.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : logs.length === 0 ? (
            <Typography color="text.secondary">No hay logs para esta fecha o filtros.</Typography>
          ) : (
            <List dense disablePadding>
              {logs.map((entry) => {
                const key = `${entry.partitionKey}|${entry.rowKey}`;
                const isExpanded = expandedKey === key;
                const severityColor =
                  entry.severity === 'Error' ? 'error' : entry.severity === 'Warning' ? 'warning' : 'default';
                return (
                  <React.Fragment key={key}>
                    <ListItem
                      sx={{
                        bgcolor: entry.isRead ? 'action.hover' : undefined,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <IconButton size="small" onClick={() => toggleExpand(entry.partitionKey, entry.rowKey)}>
                        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                      <ListItemText
                        primary={entry.message}
                        secondary={
                          <Box component="span" sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', mt: 0.5 }}>
                            <Chip size="small" label={entry.severity || 'Info'} color={severityColor} />
                            {entry.category && <Chip size="small" label={entry.category} variant="outlined" />}
                            {entry.timestamp && (
                              <Typography component="span" variant="caption" color="text.secondary">
                                {new Date(entry.timestamp).toLocaleString()}
                              </Typography>
                            )}
                          </Box>
                        }
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                      <ListItemSecondaryAction>
                        {!entry.isRead && (
                          <IconButton
                            size="small"
                            title="Marcar como leído"
                            onClick={() => handleMarkRead(entry)}
                          >
                            <CheckCircleOutlineIcon fontSize="small" />
                          </IconButton>
                        )}
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                      <Box sx={{ pl: 4, pr: 2, py: 1, bgcolor: 'grey.50' }}>
                        {entry.details && (
                          <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {entry.details}
                          </Typography>
                        )}
                        {entry.entityIds?.length > 0 && (
                          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                            IDs: {entry.entityIds.join(', ')}
                          </Typography>
                        )}
                        {!entry.details && (!entry.entityIds?.length) && (
                          <Typography variant="caption" color="text.secondary">Sin detalles</Typography>
                        )}
                      </Box>
                    </Collapse>
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
