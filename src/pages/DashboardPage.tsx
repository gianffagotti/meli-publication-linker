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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import axios from 'axios';
import { dataService } from '../services/apiFactory';
import type { DashboardLogEntry, DiscoverFullRulesStatus } from '../models/types';

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
  for (let i = 0; i < 7; i++) {
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
  const [discoverStatus, setDiscoverStatus] = useState<DiscoverFullRulesStatus | null>(null);
  const [discoverActionLoading, setDiscoverActionLoading] = useState(false);
  const [discoverMessage, setDiscoverMessage] = useState<{ severity: 'success' | 'warning' | 'error' | 'info'; text: string } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const loadLogs = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const list = await dataService.getDashboardLogs(
        date,
        severity || undefined,
        category || undefined,
        signal
      );
      if (signal?.aborted) return;
      setLogs(list);
    } catch (err) {
      if (signal?.aborted) return;
      setError(err instanceof Error ? err.message : 'Error al cargar logs.');
      setLogs([]);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [date, severity, category]);

  React.useEffect(() => {
    const ac = new AbortController();
    loadLogs(ac.signal);
    return () => ac.abort();
  }, [loadLogs]);

  const loadDiscoverStatus = useCallback(async (signal?: AbortSignal) => {
    try {
      const status = await dataService.getDiscoverFullRulesStatus(signal);
      if (signal?.aborted) return;
      setDiscoverStatus(status);
    } catch (err) {
      if (signal?.aborted) return;
      setDiscoverStatus(null);
    }
  }, []);

  React.useEffect(() => {
    const ac = new AbortController();
    loadDiscoverStatus(ac.signal);
    return () => ac.abort();
  }, [loadDiscoverStatus]);

  React.useEffect(() => {
    if (!discoverStatus?.isRunning) return;
    const interval = setInterval(() => {
      loadDiscoverStatus();
    }, 180000);
    return () => clearInterval(interval);
  }, [discoverStatus?.isRunning, loadDiscoverStatus]);

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
    setDiscoverActionLoading(true);
    setDiscoverMessage(null);
    setError(null);
    try {
      await dataService.runDiscoverFullRules();
      setDiscoverMessage({ severity: 'success', text: 'Job iniciado en background.' });
      setDate(formatDateForApi(new Date()));
      await loadDiscoverStatus();
      await loadLogs();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        const data = err.response?.data as { message?: string; mode?: string };
        const modeLabel = data?.mode === 'automatic' ? 'automático' : data?.mode === 'manual' ? 'manual' : 'actual';
        setDiscoverMessage({ severity: 'warning', text: data?.message ?? `Ya se está ejecutando (${modeLabel}).` });
        await loadDiscoverStatus();
        return;
      }
      setDiscoverMessage({ severity: 'error', text: err instanceof Error ? err.message : 'Error al ejecutar descubrimiento.' });
    } finally {
      setDiscoverActionLoading(false);
      setConfirmOpen(false);
    }
  };

  const handleCancelDiscover = async () => {
    setDiscoverActionLoading(true);
    setDiscoverMessage(null);
    try {
      await dataService.cancelDiscoverFullRules(discoverStatus?.runId ?? undefined);
      setDiscoverMessage({ severity: 'warning', text: 'Cancelación solicitada. No se hace rollback.' });
      await loadDiscoverStatus();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setDiscoverMessage({ severity: 'info', text: 'No hay ejecución activa para cancelar.' });
        await loadDiscoverStatus();
        return;
      }
      setDiscoverMessage({ severity: 'error', text: err instanceof Error ? err.message : 'Error al cancelar.' });
    } finally {
      setDiscoverActionLoading(false);
      setCancelOpen(false);
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
          {discoverStatus?.isRunning && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {discoverStatus.mode === 'automatic'
                ? 'El proceso automático de descubrimiento FULL se está ejecutando.'
                : 'El proceso manual de descubrimiento FULL se está ejecutando.'}
            </Alert>
          )}
          <Button
            variant="contained"
            startIcon={discoverActionLoading ? <CircularProgress size={20} color="inherit" /> : <AutoAwesomeIcon />}
            onClick={() => setConfirmOpen(true)}
            disabled={discoverActionLoading || Boolean(discoverStatus?.isRunning)}
          >
            {discoverActionLoading ? 'Ejecutando...' : 'Descubrir reglas FULL'}
          </Button>
          <Button
            variant="outlined"
            color="warning"
            sx={{ ml: 2 }}
            disabled={!discoverStatus?.isRunning || discoverActionLoading}
            onClick={() => setCancelOpen(true)}
          >
            Cancelar
          </Button>
          {discoverStatus?.lastResult && !discoverStatus?.isRunning && (
            <Alert severity={discoverStatus.lastResult.status === 'completed' ? 'success' : 'warning'} sx={{ mt: 2 }}>
              Último resultado: procesadas {discoverStatus.lastResult.processed}, reglas creadas {discoverStatus.lastResult.created},
              incompletas {discoverStatus.lastResult.incomplete}. Estado: {discoverStatus.lastResult.status}.
            </Alert>
          )}
          {discoverMessage && (
            <Alert severity={discoverMessage.severity} sx={{ mt: 2 }} onClose={() => setDiscoverMessage(null)}>
              {discoverMessage.text}
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
            <Button
              variant="outlined"
              size="small"
              onClick={() => loadLogs()}
              disabled={loading}
            >
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
              {logs.map((entry, index) => {
                const key = entry.partitionKey && entry.rowKey
                  ? `${entry.partitionKey}|${entry.rowKey}`
                  : `log-${index}`;
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
                          <Box component="div" sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', mt: 0.5 }}>
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
                        secondaryTypographyProps={{ component: 'div' }}
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

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirmar descubrimiento FULL</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Este proceso puede tardar varios minutos. Si son pocas reglas, se recomienda editarlas manualmente.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={discoverActionLoading}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleDiscoverFullRules} disabled={discoverActionLoading}>
            Ejecutar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={cancelOpen} onClose={() => setCancelOpen(false)}>
        <DialogTitle>Cancelar descubrimiento FULL</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Al cancelar, no se hace rollback de lo ya actualizado. Siempre podés editar una regla manualmente buscándola.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelOpen(false)} disabled={discoverActionLoading}>
            Volver
          </Button>
          <Button variant="contained" color="warning" onClick={handleCancelDiscover} disabled={discoverActionLoading}>
            Cancelar proceso
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
