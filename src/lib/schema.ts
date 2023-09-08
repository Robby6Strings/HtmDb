import { symbol_internal } from "."

export type ColumnConfig = {
  type: "string" | "number" | "boolean" | "date" | "datetime"
}

export type TableConfig = {
  name: string
  columns: Record<string, ColumnConfig>
}

export type Schema = {
  [key: string]: Table<any>
}

export type TableColumn<T extends TableConfig> = {
  name: keyof T["columns"]
  table: T["name"]
  type: T["columns"][keyof T["columns"]]["type"]
}

export type TableColumns<T extends TableConfig> = {
  [k in keyof T["columns"]]: TableColumn<T>
}

export type Table<T extends TableConfig> = TableColumns<T> & {
  [symbol_internal]: TableConfig
}

export function createTable<T extends TableConfig>(tableConfig: T): Table<T> {
  return Object.entries(tableConfig.columns).reduce(
    (acc, [key]) => {
      return {
        ...acc,
        [key]: {
          name: key,
          table: tableConfig.name,
          type: tableConfig.columns[key].type,
        },
      }
    },
    { [symbol_internal]: tableConfig } as Table<T>
  )
}
