import { useMemo } from 'react';
import type { MeliItem } from '../models/types';

/**
 * Parses size from a SKU: split by '#' and take the last segment (trimmed).
 * Returns null if sku is missing, empty, or has no '#' (no size detectable).
 */
export function parseSizeFromSku(sku: string | null | undefined): string | null {
  if (sku == null || sku === '') return null;
  const idx = sku.lastIndexOf('#');
  if (idx < 0) return null;
  const segment = sku.slice(idx + 1).trim();
  return segment === '' ? null : segment;
}

/**
 * Extracts unique sizes from one or more source items by parsing variation SKUs.
 * Uses parseSizeFromSku (split by '#', last segment). Variations without '#' in SKU are ignored.
 * Returns a sorted array of unique sizes, e.g. ['S', 'M', 'L', 'XL'].
 */
function getUniqueSizesFromItems(items: MeliItem[]): string[] {
  const set = new Set<string>();
  for (const item of items) {
    const variations = item.variations ?? [];
    for (const v of variations) {
      const sku = v.sku ?? '';
      const size = parseSizeFromSku(sku);
      if (size != null) set.add(size);
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}

/**
 * Hook that returns unique sizes parsed from the given source item(s).
 * Accepts a single MeliItem or an array. Uses variation.sku, split by '#', last segment = size.
 * Safe when SKU has no '#' (those variations are ignored). Result is stable and sorted.
 */
export function useSourceSizes(sourceItemOrItems: MeliItem | MeliItem[] | null | undefined): string[] {
  return useMemo(() => {
    if (sourceItemOrItems == null) return [];
    const items = Array.isArray(sourceItemOrItems) ? sourceItemOrItems : [sourceItemOrItems];
    return getUniqueSizesFromItems(items);
  }, [sourceItemOrItems]);
}
