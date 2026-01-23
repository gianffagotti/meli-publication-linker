import React, { useState, useEffect, useMemo } from 'react';
import { Autocomplete, TextField, CircularProgress, Box, Avatar, Grid } from '@mui/material';
import { debounce } from '@mui/material/utils';
import { dataService } from '../../services/apiFactory';
import type { MeliItem } from '../../models/types';

interface ItemSearchProps {
    label: string;
    onSelect: (item: MeliItem | null) => void;
}

export const ItemSearch: React.FC<ItemSearchProps> = ({ label, onSelect }) => {
    const [open, setOpen] = useState(false);
    const [options, setOptions] = useState<readonly MeliItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [inputValue, setInputValue] = useState('');

    const fetchItems = useMemo(
        () =>
            debounce(async (request: { input: string }, callback: (results?: readonly MeliItem[]) => void) => {
                try {
                    const results = await dataService.searchItems(request.input);
                    callback(results);
                } catch (error) {
                    console.error("Error searching items:", error);
                    callback([]);
                }
            }, 500),
        [],
    );

    useEffect(() => {
        let active = true;

        if (inputValue === '') {
            setOptions(options.length > 0 ? options : []);
            return undefined;
        }

        setLoading(true);

        fetchItems({ input: inputValue }, (results?: readonly MeliItem[]) => {
            if (active) {
                let newOptions: readonly MeliItem[] = [];

                if (results) {
                    newOptions = [...results];
                }

                setOptions(newOptions);
                setLoading(false);
            }
        });

        return () => {
            active = false;
        };
    }, [inputValue, fetchItems]);

    return (
        <Autocomplete
            id="asynchronous-item-search"
            fullWidth
            open={open}
            onOpen={() => {
                setOpen(true);
            }}
            onClose={() => {
                setOpen(false);
            }}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            getOptionLabel={(option) => `${option.title || ''}`}
            options={options}
            loading={loading}
            onInputChange={(_, newInputValue) => {
                setInputValue(newInputValue);
            }}
            onChange={(_, newValue) => {
                onSelect(newValue);
            }}
            renderOption={(props, option) => {
                // Extract key from props to avoid spreading it into li
                const { key, ...otherProps } = props;
                return (
                    <li key={key} {...otherProps}>
                        <Grid container alignItems="center">
                            {/* @ts-ignore */}
                            <Grid item sx={{ display: 'flex', width: 44 }}>
                                <Avatar src={option.thumbnail || ''} alt={option.title || ''} variant="square" />
                            </Grid>
                            {/* @ts-ignore */}
                            <Grid item sx={{ width: 'calc(100% - 44px)', wordWrap: 'break-word' }}>
                                <Box component="span" sx={{ fontWeight: 'bold' }}>
                                    {option.title || 'No Title'}
                                </Box>
                            </Grid>
                        </Grid>
                    </li>
                );
            }}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label}
                    variant="outlined"
                    InputProps={{
                        ...params.InputProps,
                        style: { fontSize: '1.1rem' }, // Slightly larger text
                        endAdornment: (
                            <React.Fragment>
                                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                            </React.Fragment>
                        ),
                    }}
                    InputLabelProps={{
                        style: { fontSize: '1.1rem' } // Match label size
                    }}
                />
            )}
        />
    );
};
