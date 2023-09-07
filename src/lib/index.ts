import path from "path"
import fs from "fs"
import { pathToFileURL } from "url"
import jsdom from "jsdom"
const { JSDOM } = jsdom

import { PredicateOptions } from "./predicate"
import { Schema, Table, TableConfig } from "./schema"

export const symbol_internal = Symbol("_")

export class HtmlDb {
  constructor(private readonly schema: Schema) {}

  public async select<U extends TableConfig, T extends Table<U>>(
    tableRef: T,
    predicates: PredicateOptions<U> = {}
  ) {
    const tableStr = await this.readTable(tableRef[symbol_internal].name)
    const dom = new JSDOM(tableStr)
    const table = dom.window.document.querySelector("table")!

    const { where, limit } = predicates

    const limitSelector = limit ? `:nth-child(-n+${limit})` : ""

    const equalityOps =
      where?.filter((w) => w.operator === "=" || w.operator === "!=") || []

    const whereSelector =
      equalityOps.length > 0
        ? equalityOps
            .map((w) => {
              const { key, value, operator } = w
              if (operator === "=") return `[${key.toString()}="${value}"]`
              if (operator === "!=")
                return `:not([${key.toString()}="${value}"])`
            })
            .join("")
        : ""

    const rangeOps =
      where?.filter((w) => w.operator !== "=" && w.operator !== "!=") || []

    if (rangeOps.length > 0) {
      let rows = Array.from(table.querySelectorAll("tr"))

      for (const op of rangeOps) {
        const { key, value, operator } = op

        rows = rows.filter((row) => {
          const rowVal =
            key === "id" ? row.id : row.getAttribute(key.toString())
          if (!rowVal) return false
          if (operator === ">") return parseInt(rowVal) > parseInt(value)
          if (operator === "<") return parseInt(rowVal) < parseInt(value)
          if (operator === ">=") return parseInt(rowVal) >= parseInt(value)
          if (operator === "<=") return parseInt(rowVal) <= parseInt(value)
        })
      }

      const res = rows.map((row) => this.rowToKv(row))
      if (limit) return res.slice(0, limit)
      return res
    }

    const res = Array.from(
      table.querySelectorAll(`tr${whereSelector}${limitSelector}`)
    ).map((row) => this.rowToKv(row))

    return res
  }

  public async upsert<U extends TableConfig, T extends Table<U>>(
    tableRef: T,
    rows: Partial<Record<keyof T, string>>[],
    returnRows = false
  ) {
    const tableStr = await this.readTable(tableRef[symbol_internal].name)
    const document = new JSDOM(tableStr).window.document
    const table = document.querySelector("table")!

    const res = []

    for (const item of rows) {
      if ("id" in item) {
        // try to find matching row and update it. if we can't find it, insert a new row with the key
        const row = document.getElementById(item.id as string)
        if (row) {
          for (const [key, value] of Object.entries(item)) {
            if (key === "id") continue
            row.setAttribute(key, (value as any).toString())
          }
          if (returnRows) res.push(this.rowToKv(row))
          continue
        }
      }

      // insert a new row
      const newRow = document.createElement("tr")
      for (const [key, value] of Object.entries(item)) {
        if (key === "id") {
          newRow.id = (value as any).toString()
          continue
        }
        newRow.setAttribute(key, (value as any).toString())
      }
      table.appendChild(newRow)
      if (returnRows) res.push(this.rowToKv(newRow))
    }

    await this.writeTable(tableRef[symbol_internal].name, table)

    return returnRows ? res : undefined
  }

  private rowToKv(row: Element): Record<string, string> {
    return Array.from(row.attributes).reduce((acc, { name, value }) => {
      acc[name] = value
      return acc
    }, {} as any)
  }

  private fileUrlFromTableName(tableName: string) {
    return pathToFileURL(path.join("tables", tableName + ".html"))
  }

  private readTable(tableName: string) {
    return fs.promises.readFile(this.fileUrlFromTableName(tableName), "utf8")
  }

  private writeTable(tableName: string, tableElement: HTMLTableElement) {
    return fs.promises.writeFile(
      this.fileUrlFromTableName(tableName),
      tableElement.outerHTML
    )
  }
}
