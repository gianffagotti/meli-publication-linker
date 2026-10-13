import React, { useState, useEffect, useMemo } from 'react';
import { Autocomplete, TextField, CircularProgress, Box, Avatar } from '@mui/material';
import { debounce } from '@mui/material/utils';
import { dataService } from '../../services/apiFactory';
import type { MeliItem } from '../../models/types';
import { itemSearchMetaLine, itemSearchName, itemSearchSecondaryTitle } from './itemSearchDisplay';

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
        if (value && inputValue === itemSearchName(value)) {
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
            setInputValue(itemSearchName(value));
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
            getOptionLabel={(option) => itemSearchName(option)}
            filterOptions={(x) => x}
            options={options}
            loading={loading}
            onChange={(_, newValue) => {
                setValue(newValue);
                onSelect(newValue);
            }}
            renderOption={(props, option) => {
                const { key, ...otherProps } = props;
                const name = itemSearchName(option) || 'Sin Título';
                const secondary = itemSearchSecondaryTitle(option);
                const meta = itemSearchMetaLine(option);
                return (
                    <li key={key} {...otherProps}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                            <Avatar
                                src={option.thumbnail || ''}
                                alt={name}
                                variant="square"
                                sx={{ width: 44, height: 44, flexShrink: 0 }}
                            />
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Box component="span" sx={{ display: 'block', wordWrap: 'break-word', fontWeight: 'bold' }}>
                                    {name}
                                </Box>
                                {secondary && (
                                    <Box component="span" sx={{ display: 'block', wordWrap: 'break-word' }}>
                                        {secondary}
                                    </Box>
                                )}
                                <Box component="span" sx={{ display: 'block', color: 'text.secondary', fontSize: '0.85rem' }}>
                                    {meta}
                                </Box>
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
