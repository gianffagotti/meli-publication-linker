import React, { useEffect, useState } from 'react';
import {
  Box,
  CircularProgress,
  Alert,
  Button,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../services/apiFactory';
import type { StockRule } from '../models/types';
import { StockRulesTable } from '../components/StockRulesTable';
import { DashboardToolbar, type RuleTypeFilter } from '../components/DashboardToolbar';
import { SearchOff as SearchOffIcon } from '@mui/icons-material';

export const RulesListPage: React.FC = () => {
  const navigate = useNavigate();
  const [rules, setRules] = useState<StockRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [ruleTypeFilter, setRuleTypeFilter] = useState<RuleTypeFilter>('');

  const fetchRules = async () => {
    setLoading(true);
    try {
      const data = await dataService.getStockRules();
      setRules(data);
    } catch (err) {
      console.error(err);
      setError('Error al cargar las reglas de stock');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleEditRule = (targetItemId: string) => {
    navigate(`/rules/edit/${targetItemId}`);
  };

  const handleDeleteRule = async (targetItemId: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta regla?')) {
      try {
        await dataService.deleteStockRule(targetItemId);
        await fetchRules();
      } catch (err) {
        console.error(err);
        setError('Error al eliminar la regla');
      }
    }
  };

  /** Filter by rule type + deep search: match Target (title or MLA ID) OR any Component (title or MLA ID). */
  const filteredRules = rules.filter((rule) => {
    if (ruleTypeFilter && rule.ruleType !== ruleTypeFilter) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    const targetTitle = (rule.targetItem?.title ?? rule.targetTitle ?? '').toLowerCase();
    const targetMatch =
      targetTitle.includes(term) || rule.targetItemId.toLowerCase().includes(term);
    if (targetMatch) return true;
    const sourceMatch = rule.components.some((comp) => {
      const source = rule.sourceItems?.find((i) => i.id === comp.sourceItemId);
      const srcTitle = (source?.title ?? '').toLowerCase();
      return srcTitle.includes(term) || comp.sourceItemId.toLowerCase().includes(term);
    });
    return sourceMatch;
  });

  return (
    <Box>
      <DashboardToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        ruleTypeFilter={ruleTypeFilter}
        onRuleTypeFilterChange={setRuleTypeFilter}
        onNewLink={() => navigate('/rules/new')}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {filteredRules.length > 0 ? (
            <StockRulesTable
              rules={filteredRules}
              onDeleteRule={handleDeleteRule}
              onEdit={handleEditRule}
            />
          ) : (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                mt: 8,
                opacity: 0.7,
              }}
            >
              <SearchOffIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                {searchTerm
                  ? 'No se encontraron reglas que coincidan con su búsqueda'
                  : 'No se encontraron reglas'}
              </Typography>
              {searchTerm && (
                <Button sx={{ mt: 1 }} onClick={() => setSearchTerm('')}>
                  Limpiar Búsqueda
                </Button>
              )}
            </Box>
          )}
        </>
      )}
    </Box>
  );
};
