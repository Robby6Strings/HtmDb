import { symbol_internal } from "."

export type ColumnConfig = {
  type: "string" | "number" | "boolean"
}

export type TableConfig = {
  name: string
  key: string
  columns: Record<string, ColumnConfig>
}

export type Schema = {
  [key: string]: Table<any>
}

export type TableColumnsRecord<T extends TableConfig> = {
  [k in keyof T["columns"]]: k
}

export type Table<T extends TableConfig> = {
  [k in keyof T["columns"]]: k
} & {
  [symbol_internal]: TableConfig
}

export function createTable<T extends TableConfig>(tableConfig: T): Table<T> {
  return Object.entries(tableConfig.columns).reduce(
    (acc, [key]) => {
      return {
        ...acc,
        [key]: key,
      }
    },
    { [symbol_internal]: tableConfig } as Table<T>
  )
}

// const person = createTable({
//   name: "person",
//   key: "id",
//   columns: {
//     id: {
//       type: "number",
//     },
//     name: {
//       type: "string",
//     },
//     age: {
//       type: "number",
//     },
//   },
// })
