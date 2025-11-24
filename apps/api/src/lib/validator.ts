import { PgTable } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { createCheckRegex } from './queryUtils/filter';



const commonKeys = ['createdAt','updatedAt', 'id' ] as const;

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
    sortKeys?: [keyof T['_']['columns'], ...(keyof T['_']['columns'])[]],
    filterKeys?: (keyof T['_']['columns'])[]
  } = {}
) {
  const { 
    sortKeys = [...commonKeys] ,
    filterKeys = [...commonKeys]
  } = option;
  
  return z.object({
    // Pagination: limit (default 20, max 100)
    limit: z.coerce.number().min(1).max(100).default(20),
    // Pagination: offset (default 0)
    offset: z.coerce.number().min(0).default(0),
    // Sort Order: asc or desc (default desc)
    order: z.enum(['asc', 'desc']).default('desc'),

    sort: z.enum(sortKeys as [string, ...string[]]).default(sortKeys[0] as string),

    filter: z.union([
        z.string().regex(createCheckRegex(filterKeys as string[])),
        z.array(z.string().regex(createCheckRegex(filterKeys as string[])))   
      ])
      .transform((v) => (Array.isArray(v) ? v : [v]))
      .optional()
      .default([]),

    // Can be overwritten or extended in specific routes using .extend()
    // sort: createSortSchema(table, sortKeys, sortDefaultKey),
    // filter: createFilterSchema(table, filterKeys)
  })
}

