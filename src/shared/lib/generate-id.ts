import { nanoid } from 'nanoid';

/**
 * Generates the public-facing ID used as every collection's primary key
 * (_id) and every field that references one. Opaque, non-sequential,
 * non-guessable, URL-safe — nanoid's default alphabet/length (21 chars from
 * A-Za-z0-9_-) gives collision odds low enough to need no coordination
 * between parallel serverless instances, unlike Snowflake-style schemes.
 */
export function generateId(): string {
  return nanoid();
}
