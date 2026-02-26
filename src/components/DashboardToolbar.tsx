import React from 'react';
import {
    Box,
    TextField,
    Button,
    InputAdornment,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import { Search as SearchIcon, Add as AddIcon } from '@mui/icons-material';
import type { RuleType } from '../models/types';

export type RuleTypeFilter = '' | RuleType;

interface DashboardToolbarProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    /** Filtro por tipo de regla: '' = Todos, 'FULL' | 'PACK' | 'COMBO' */
    ruleTypeFilter?: RuleTypeFilter;
    onRuleTypeFilterChange?: (value: RuleTypeFilter) => void;
    onNewLink: () => void;
}

export const DashboardToolbar: React.FC<DashboardToolbarProps> = ({
    searchTerm,
    onSearchChange,
    ruleTypeFilter = '',
    onRuleTypeFilterChange,
    onNewLink
}) => {
    return (
        <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 4,
            gap: 2,
            flexWrap: 'wrap'
        }}>
            <TextField
                placeholder="Buscar por título o MLA (objetivo o componentes)..."
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                sx={{ minWidth: 300, bgcolor: 'white' }}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon color="action" />
                        </InputAdornment>
                    ),
                }}
            />
            {onRuleTypeFilterChange && (
                <FormControl size="small" sx={{ minWidth: 140, bgcolor: 'white' }}>
                    <InputLabel id="rule-type-filter-label">Tipo de regla</InputLabel>
                    <Select
                        labelId="rule-type-filter-label"
                        value={ruleTypeFilter}
                        label="Tipo de regla"
                        onChange={(e) => onRuleTypeFilterChange(e.target.value as RuleTypeFilter)}
                    >
                        <MenuItem value="">Todos</MenuItem>
                        <MenuItem value="FULL">FULL</MenuItem>
                        <MenuItem value="PACK">PACK</MenuItem>
                        <MenuItem value="COMBO">COMBO</MenuItem>
                    </Select>
                </FormControl>
            )}
            <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={onNewLink}
                size="large"
            >
                Nueva Regla
            </Button>
        </Box>
    );
};
