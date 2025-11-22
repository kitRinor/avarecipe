import { PgTable } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { createFilterSchema } from './queryUtils/filter';
import { createSortSchema } from './queryUtils/sort';



const commonKeys = ['id', 'createdAt', 'updatedAt'] as const;

/**
 * 📄 Base GetListQuery Schema
 * Defines common query parameters for list endpoints (limit, offset, sort, order).
 * usage:
 *   app.get('/', zValidator('query', baseQueryForGetList(avatars, {
 *     sortKeys: ['id', 'createdAt'],
 *     sortDefaultKey: 'createdAt',
 *     filterKeys: ['id', 'name', 'userId'],
 *   })), async (c) => {
 *     // logic
 *   })
 */
export function baseQueryForGetList <T extends PgTable>(
  table:T, 
  option: {
    sortKeys?: (keyof T['_']['columns'])[],
    sortDefaultKey?: keyof T['_']['columns'],
    filterKeys?: (keyof T['_']['columns'])[]
  } = {}
) {
  const { 
    sortKeys = [...commonKeys] as (keyof T['_']['columns'])[],
    sortDefaultKey = 'createdAt' as keyof T['_']['columns'],
    filterKeys = [...commonKeys] as (keyof T['_']['columns'])[]
  } = option;
  return z.object({
    // Pagination: limit (default 20, max 100)
    // z.coerce.number() converts string "20" to number 20 automatically.
    limit: z.coerce.number().min(1).max(100).default(20),

    // Pagination: offset (default 0)
    offset: z.coerce.number().min(0).default(0),

    // Sort Order: asc or desc (default desc)
    order: z.enum(['asc', 'desc']).default('desc'),

    // Sort Column: defaults to common keys (id, createdAt, updatedAt)
    // Can be overwritten or extended in specific routes using .extend()
    sort: createSortSchema(table, sortKeys, sortDefaultKey),
    filter: createFilterSchema(table, filterKeys)
  })
  .optional();
}

