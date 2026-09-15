import { integer, sqliteTable, text as sqliteText } from "drizzle-orm/sqlite-core"
import {
  boolean,
  integer as pgInteger,
  jsonb,
  pgTable,
  serial,
  text as pgText,
  timestamp,
} from "drizzle-orm/pg-core"

import { schemaSpec, toSnake, type ColumnSpec } from "./schema.spec"

export type Dialect = "sqlite" | "pg"

type AnyColumn = ReturnType<typeof sqliteText>

function applyModifiers(col: any, spec: ColumnSpec): AnyColumn {
  let c = col
  if (spec.notNull) c = c.notNull()
  if (spec.unique) c = c.unique()
  if (spec.default !== undefined) c = c.default(spec.default)
  return c as AnyColumn
}

function sqliteColumn(dbName: string, spec: ColumnSpec): AnyColumn {
  switch (spec.kind) {
    case "textPk":
      return sqliteText(dbName).primaryKey()
    case "autoPk":
      return integer(dbName).primaryKey({ autoIncrement: true })
    case "bool":
      return applyModifiers(integer(dbName, { mode: "boolean" }), spec)
    case "int":
      return applyModifiers(integer(dbName), spec)
    case "timestamp":
      return applyModifiers(integer(dbName, { mode: "timestamp" }), spec)
    case "json":
      return applyModifiers(sqliteText(dbName, { mode: "json" }), spec)
    default:
      return applyModifiers(sqliteText(dbName), spec)
  }
}

function pgColumn(dbName: string, spec: ColumnSpec): AnyColumn {
  switch (spec.kind) {
    case "textPk":
      return pgText(dbName).primaryKey()
    case "autoPk":
      return serial(dbName).primaryKey()
    case "bool":
      return applyModifiers(boolean(dbName), spec)
    case "int":
      return applyModifiers(pgInteger(dbName), spec)
    case "timestamp":
      return applyModifiers(timestamp(dbName), spec)
    case "json":
      return applyModifiers(jsonb(dbName), spec)
    default:
      return applyModifiers(pgText(dbName), spec)
  }
}

/** 从 spec 派生 drizzle 表集合（键为 camelCase，供查询与 better-auth）。 */
export function buildTables(dialect: Dialect): Record<string, unknown> {
  const build = dialect === "pg" ? pgColumn : sqliteColumn
  const table = (dialect === "pg" ? pgTable : sqliteTable) as (
    name: string,
    columns: Record<string, AnyColumn>,
  ) => unknown
  const tables: Record<string, unknown> = {}
  for (const [key, tableSpec] of Object.entries(schemaSpec)) {
    const columns: Record<string, AnyColumn> = {}
    for (const [colKey, colSpec] of Object.entries(tableSpec.columns)) {
      columns[colKey] = build(toSnake(colKey), colSpec)
    }
    tables[key] = table(toSnake(key), columns)
  }
  return tables
}
const SQLITE_TYPES: Record<string, string> = {
  textPk: "TEXT PRIMARY KEY",
  autoPk: "INTEGER PRIMARY KEY AUTOINCREMENT",
  bool: "INTEGER",
  int: "INTEGER",
  timestamp: "INTEGER",
  json: "TEXT",
  text: "TEXT",
}

const PG_TYPES: Record<string, string> = {
  textPk: "TEXT PRIMARY KEY",
  autoPk: "SERIAL PRIMARY KEY",
  bool: "BOOLEAN",
  int: "INTEGER",
  timestamp: "TIMESTAMP",
  json: "JSONB",
  text: "TEXT",
}

function defaultLiteral(value: boolean | number, dialect: Dialect): string {
  if (typeof value === "boolean") {
    if (dialect === "pg") return value ? "true" : "false"
    return value ? "1" : "0"
  }
  return String(value)
}

function columnDdl(colKey: string, spec: ColumnSpec, dialect: Dialect): string {
  const types = dialect === "pg" ? PG_TYPES : SQLITE_TYPES
  const parts = [`"${toSnake(colKey)}"`, types[spec.kind]]
  if (spec.kind !== "textPk" && spec.kind !== "autoPk") {
    if (spec.notNull) parts.push("NOT NULL")
    if (spec.unique) parts.push("UNIQUE")
    if (spec.default !== undefined) parts.push(`DEFAULT ${defaultLiteral(spec.default, dialect)}`)
  }
  if (spec.references) {
    const target = toSnake(spec.references.table)
    parts.push(`REFERENCES "${target}"("${toSnake(spec.references.column)}")`)
    if (spec.references.onDelete === "cascade") parts.push("ON DELETE CASCADE")
  }
  return parts.join(" ")
}

/** 从 spec 派生建表 + 索引 DDL（幂等），dialect 各一份。 */
export function buildDdl(dialect: Dialect): string {
  const statements: string[] = []
  for (const [key, tableSpec] of Object.entries(schemaSpec)) {
    const table = toSnake(key)
    const cols = Object.entries(tableSpec.columns).map(([k, s]) => columnDdl(k, s, dialect))
    statements.push(`CREATE TABLE IF NOT EXISTS "${table}" (\n  ${cols.join(",\n  ")}\n);`)
    for (const index of tableSpec.indexes ?? []) {
      const cols2 = index.columns.map(toSnake)
      const name = `idx_${table}_${cols2.join("_")}`
      statements.push(
        `CREATE INDEX IF NOT EXISTS "${name}" ON "${table}"(${cols2.map((c) => `"${c}"`).join(", ")});`,
      )
    }
  }
  return statements.join("\n")
}
