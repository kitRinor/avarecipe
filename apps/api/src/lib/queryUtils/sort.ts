import { asc, desc, getTableColumns, type SQL } from "drizzle-orm";
import type { PgTable } from 'drizzle-orm/pg-core';
import z from "zod";

export function createSortSchema<T extends PgTable>(
  table: T,
  pickKeys: (keyof T['_']['columns'])[],
  defaultKey: keyof T['_']['columns']
) {
  const columns = getTableColumns(table);
  if (!(defaultKey in columns)) {
    defaultKey = pickKeys.length > 0 ? pickKeys[0] : Object.keys(columns)[0] as keyof T['_']['columns'];
  }
  return z.enum(pickKeys as string[]).default(defaultKey as string);
}

export function generateSorting<T extends PgTable>(
  table: T,
  order: 'asc' | 'desc',
  sort: string,
): SQL {
  const column = getTableColumns(table)[sort];
  if (order === 'asc') {
    return asc(column);
  } else {
    return desc(column);
  }
} 