/** Token de SKU o texto comparado sin espacios ni diferencia de mayúsculas. */
export function normalizeSkuToken(value: string): string {
    return value.trim().toUpperCase();
}
