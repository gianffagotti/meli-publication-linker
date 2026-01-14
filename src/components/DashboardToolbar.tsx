import React from 'react';
import {
    Box,
    TextField,
    Button,
    InputAdornment
} from '@mui/material';
import { Search as SearchIcon, Add as AddIcon } from '@mui/icons-material';

interface DashboardToolbarProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    onNewLink: () => void;
}

export const DashboardToolbar: React.FC<DashboardToolbarProps> = ({
    searchTerm,
    onSearchChange,
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
                placeholder="Search by Title or SKU..."
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
            <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={onNewLink}
                size="large"
            >
                NEW LINK
            </Button>
        </Box>
    );
};
