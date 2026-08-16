import { z } from 'zod';

// Matches generateId()'s output: nanoid's default 21-character, URL-safe
// alphabet (A-Za-z0-9_-). Every collection's _id (and every field that
// references one) is one of these, so this is the one place that knows the
// concrete shape of an ID.
const ID_PATTERN = /^[A-Za-z0-9_-]{21}$/;

/**
 * Zod schema for a public entity ID passed as a string (body fields, query
 * params). Rejecting malformed values here means a bad ID never reaches
 * Mongoose, which would otherwise throw a CastError and surface as a generic
 * 500 instead of a proper 400.
 */
export const idSchema = z.string().regex(ID_PATTERN, 'Invalid ID format');

export function isValidId(id: string): boolean {
  return ID_PATTERN.test(id);
}
