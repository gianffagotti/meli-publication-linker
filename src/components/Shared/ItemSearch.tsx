import React, { useState, useEffect, useMemo } from 'react';
import { Autocomplete, TextField, CircularProgress, Box, Avatar } from '@mui/material';
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
    const [value, setValue] = useState<MeliItem | null>(null);

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

        // Skip search when input was filled by selecting an option (avoids double search)
        if (value && inputValue === (value.title || '')) {
            setLoading(false);
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
    }, [inputValue, fetchItems, value]);

    // Sync input to selected value when an item is chosen (keeps controlled Autocomplete consistent)
    useEffect(() => {
        if (value != null) {
            setInputValue(value.title || '');
        }
    }, [value]);

    return (
        <Autocomplete
            id="asynchronous-item-search"
            fullWidth
            value={value ?? null}
            inputValue={inputValue}
            onInputChange={(_, newInputValue) => {
                setInputValue(newInputValue);
            }}
            open={open}
            onOpen={() => {
                setOpen(true);
            }}
            onClose={() => {
                setOpen(false);
            }}
            isOptionEqualToValue={(option, val) => option.id === val.id}
            getOptionLabel={(option) => `${option.title || ''}`}
            filterOptions={(x) => x}
            options={options}
            loading={loading}
            onChange={(_, newValue) => {
                setValue(newValue);
                onSelect(newValue);
            }}
            renderOption={(props, option) => {
                const { key, ...otherProps } = props;
                return (
                    <li key={key} {...otherProps}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar
                                src={option.thumbnail || ''}
                                alt={option.title || ''}
                                variant="square"
                                sx={{ width: 44, height: 44, flexShrink: 0 }}
                            />
                            <Box component="span" sx={{ flex: 1, minWidth: 0, wordWrap: 'break-word', fontWeight: 'bold' }}>
                                {option.title || 'Sin Título'}
                            </Box>
                        </Box>
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
