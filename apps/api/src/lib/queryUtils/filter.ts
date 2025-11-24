import { z } from 'zod';
import { eq, ne, lt, lte, gt, gte, inArray, like, ilike, type SQL, getTableColumns, and } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import { Column } from 'drizzle-orm';
import { CheckFn, ParsePayload } from 'zod/v4/core';
import { th } from 'zod/locales';




/**
 * クエリパラメータからDrizzleの条件式配列を生成する
 * table: Drizzleのテーブル定義
 * query: req.valid('query') で受け取ったオブジェクト
 * filterUserId: 特定のユーザーのアイテムに絞る場合のuserId
 */
export function generateCondition<T extends PgTable>(
  table: T,
  filter: string[],
  filterUserId?: string, // 追加の固定フィルタ条件 (例: userId=xxx)
): SQL | undefined {
  const conditions: SQL[] = [];
  const columns = getTableColumns(table);
  // 固定フィルタ条件があれば追加
  if (filterUserId && 'userId' in table) {
    // @ts-ignore
    conditions.push(eq(table['userId'] , filterUserId));
  }

  for (const filterStr of filter) {
    const parsed = parseFilterStr(filterStr);
    if (!parsed) {
      continue; // 無効なフィルタ文字列はスキップ
    }
    const {key, op, value} = parsed;
    // カラムが存在しない場合はスキップ
    if (!(key in columns)) {
      continue;
    }
    const condition = createCondition( columns[key], op, value );
    if (condition) {
      conditions.push(condition);
    }
  }


  const combined = and(...conditions);
  return combined;
}


const operators: {
  [key: string]: (key: Column, value: any) => SQL;
} = { 
  "=": eq, 
  "==": eq, 
  "!=": ne, 
  "<": lt, 
  "<=": lte, 
  ">": gt, 
  ">=": gte, 
  "like": like, 
  "ilike": ilike, 
  "in": inArray
};

const filterRegex = /^(\w+)(=|==|!=|<=|<|>=|>| like | ilike | in )(.+)$/;


export function createCheckRegex(allowedKeys: string[]) {
  const pattern = filterRegex.source.replace('(\\w+)', `(${allowedKeys.join('|')})`);
  return new RegExp(pattern);
}

function parseFilterStr(filterStr: string): { key: string; op: keyof typeof operators; value: string } | null {
  const match = filterStr.match(filterRegex);
  if (!match) {
    return null;
  }
  return { 
    key: match[1], 
    op: match[2] as keyof typeof operators, 
    value: match[3] 
  };
}

function createCondition( col: Column, op: keyof typeof operators, value: string ): SQL {
  const opFn = operators[op];
  // For 'in' operator, split value by comma
  if (op === 'in') {
    const values = value.split(',').map(v => v.trim());
    
    return opFn(col, values) as SQL;
  }
  return opFn(col, value) as SQL;
}