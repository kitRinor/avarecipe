import { z } from 'zod';
import { eq, ne, lt, lte, gt, gte, inArray, like, ilike, type SQL, getTableColumns, and } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';




// ---------------------------------------------------------
// 1. Schema Generator (Zod)
// ---------------------------------------------------------

// 1つのフィールドに対するフィルタ定義を作るヘルパー（内部用）
const createSingleFilter = <T extends z.ZodTypeAny>(zodType: T) => {
  return z.union([
    zodType, // ?price=100 (直接一致)
    z.object({
      eq: zodType.optional(),
      ne: zodType.optional(),
      lt: zodType.optional(),
      lte: zodType.optional(),
      gt: zodType.optional(),
      gte: zodType.optional(),
      like: z.string().optional(), // likeは常に文字列
      ilike: z.string().optional(),
      in: z.union([z.array(zodType), z.string()]).optional(), // 配列またはカンマ区切り文字列
    }).optional(),
  ]).optional();
};

/**
 * ✨ 自動スキーマ生成関数
 * シンプルな型の定義 ({ name: z.string() }) を渡すと、
 * フィルタ機能付きのZodオブジェクト ({ name: { eq: ... } }) を返します。
 */
export const createFilterSchema = <T extends PgTable>(
  table: T,
  pickKeys: (keyof T['_']['columns'])[]
) => {
  const shape = createTableFilterDef(table, pickKeys);
  const newShape: any = {};
  for (const key in shape) {
    newShape[key] = createSingleFilter(shape[key]);
  }

  return z.object(newShape).optional(); // z.object({ ... }) を返す
};

/**
 * 🏭 テーブル定義からフィルタ用のZod定義を自動生成する
 * @param table Drizzleのテーブル定義
 * @param pickKeys (オプション) 許可するカラム名の配列。指定しない場合は全カラム対象（非推奨）
 */
const createTableFilterDef = <T extends PgTable>(
  table: T,
  pickKeys: (keyof T['_']['columns'])[]
) => {
  const columns = getTableColumns(table);
  const definition: Record<string, z.ZodTypeAny> = {};

  // 対象のカラムキーを決定
  const keys = pickKeys;

  for (const key of keys) {
    const col = columns[key as string];
    if (!col) continue;

    // カラムのデータ型(dataType)を見て、適切なZod型を割り当てる
    // ※ クエリパラメータは全部文字列で来るので、coerceやtransformが必要
    switch (col.dataType) {
      case 'number':
        definition[key as string] = z.coerce.number();
        break;
      case 'boolean':
        // ?flag=true / ?flag=false を boolean に変換
        definition[key as string] = z
          .enum(['true', 'false'])
          .transform((v) => v === 'true');
        break;
      case 'date':
        // 日付は文字列として受け取る (バリデーション厳密化も可能)
        definition[key as string] = z.string();
        break;
      case 'string':
      default:
        definition[key as string] = z.string();
        break;
    }
  }

  return definition;
};



const operators = { eq, ne, lt, lte, gt, gte, like, ilike, in: inArray };

/**
 * クエリパラメータからDrizzleの条件式配列を生成する
 * table: Drizzleのテーブル定義
 * query: req.valid('query') で受け取ったオブジェクト
 * filterUserId: 特定のユーザーのアイテムに絞る場合のuserId
 */
export function generateCondition<T extends PgTable>(
  table: T,
  filter: Record<string, any> | undefined,
  filterUserId?: string, // 追加の固定フィルタ条件 (例: userId=xxx)
): SQL | undefined {
  const conditions: SQL[] = [];
  const columns = getTableColumns(table);
  // 固定フィルタ条件があれば追加
  if (filterUserId && 'userId' in table) {
    // @ts-ignore
    conditions.push(eq(table['userId'] , filterUserId));
  }

  // クエリの中身を走査
  for (const [key, value] of Object.entries(filter || {})) {
    // 1. テーブルに存在しないカラム、または値がない場合はスキップ
    // (これにより limit や sort などの無関係なパラメータは自動的に無視されます)
    if (value === undefined || value === null || !(key in table)) continue;

    // @ts-ignore
    const column = table[key];

    // 2. 値がオブジェクトでない場合 ( ?category=cloth ) -> 等価検索
    if (typeof value !== 'object' || Array.isArray(value)) {
      conditions.push(eq(column, value));
      continue;
    }

    // 3. オペレータ付きの場合 ( ?price[gt]=100 )
    for (const [op, opValue] of Object.entries(value)) {
      if (opValue === undefined) continue;
      
      const operatorFunc = operators[op as keyof typeof operators];
      if (operatorFunc) {
        // in演算子の特別対応 (カンマ区切り文字列への対応などが必要ならここで整形)

        //@ts-ignore
        conditions.push(operatorFunc(column, opValue));
      }
    }
  }

  const combined = and(...conditions);
  return combined;
}