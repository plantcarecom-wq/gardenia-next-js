export const normalizeCategoryCode = (input: string): string => {
  const code = input
    .trim()
    .toUpperCase()
    // Collapse any run of whitespace/symbols (spaces, "&", "-", etc.) into a
    // single underscore, e.g. "Pots & Planters" -> "POTS_PLANTERS",
    // "Air-Purifying Plants" -> "AIR_PURIFYING_PLANTS".
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (!code) {
    throw new Error('Code must contain at least one letter or number.');
  }

  return code;
};
