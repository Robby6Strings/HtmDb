import path from "path"
import fs from "fs"
import { pathToFileURL } from "url"
import jsdom from "jsdom"
const { JSDOM } = jsdom

import { Join, Predicate, PredicateOptions, PredicateValue } from "./predicate"
import { Schema, Table, TableColumn, TableConfig } from "./schema"

export const symbol_internal = Symbol("_")

export function join<TC extends TableConfig>(
  table: Table<TC>,
  predicate: Predicate
): Join<TC> {
  return [table, predicate]
}

function isTableColumn(value: PredicateValue): value is TableColumn<any> {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    "table" in value
  )
}

export class HtmlDb {
  constructor(private readonly schema: Schema) {}

  public async select<T extends Table<any>>(
    tableRef: T,
    predicates: PredicateOptions = {}
  ) {
    const tableStr = await this.readTable(tableRef[symbol_internal].name)
    const dom = new JSDOM(tableStr)
    const table = dom.window.document.querySelector("table")!

    const filteredRows = Array.from(table.rows).filter((row) => {
      return predicates.where?.every((predicate) => {
        const a = this.resolveValue(predicate.a, row)
        const b = this.resolveValue(predicate.b, row)

        const conversionType = this.getConversionType(predicate.a, predicate.b)

        if (a === null || b === null) {
          if (predicate.operator === "=") {
            return a === b
          } else if (predicate.operator === "!=") {
            return a !== b
          } else {
            return false
          }
        }

        const [a_norm, b_norm] = [
          this.typeCast(a.toString(), conversionType),
          this.typeCast(b.toString(), conversionType),
        ]

        switch (predicate.operator) {
          case "=":
            return a_norm === b_norm
          case "!=":
            return a_norm !== b_norm
          case ">":
            return a_norm > b_norm
          case "<":
            return a_norm < b_norm
          case ">=":
            return a_norm >= b_norm
          case "<=":
            return a_norm <= b_norm
        }
      })
    })

    return filteredRows
      .slice(0, predicates.limit || Infinity)
      .map((row) => this.rowToKv(row))
  }

  public async upsert<T extends Table<any>>(
    tableRef: T,
    rows: Record<keyof T["columns"], any>[],
    returnRows = false
  ) {
    const tableStr = await this.readTable(tableRef[symbol_internal].name)
    const dom = new JSDOM(tableStr)
    const table = dom.window.document.querySelector("table")!
    let maxId = parseInt(table.getAttribute("max") || "0")

    const res = []

    for (const item of rows) {
      if ("id" in item) {
        const existingRow = dom.window.document.getElementById(
          item.id as string
        )

        if (existingRow) {
          for (const [key, value] of Object.entries(item)) {
            if (key === "id") continue
            existingRow.setAttribute(key, value)
          }
          returnRows && res.push(this.rowToKv(existingRow))
          continue
        }
      }

      const newRow = table.insertRow()
      newRow.id = "id" in item ? (item.id as string) : (++maxId).toString()
      maxId = Math.max(maxId, parseInt(newRow.id))

      for (const [key, value] of Object.entries(item)) {
        if (key === "id") continue
        newRow.setAttribute(key, value)
      }
      returnRows && res.push(this.rowToKv(newRow))
    }
    table.setAttribute("max", maxId.toString())
    await this.writeTable(tableRef[symbol_internal].name, table)
    return returnRows ? res : undefined
  }

  private getConversionType(predA: PredicateValue, predB: PredicateValue) {
    if (isTableColumn(predA)) {
      return predA.type
    } else if (isTableColumn(predB)) {
      return predB.type
    } else {
      return "string"
    }
  }

  private typeCast(value: string, type: string) {
    switch (type) {
      case "number":
        return Number(value)
      case "boolean":
        return Boolean(value)
      case "date":
        return new Date(value)
      default:
        return value
    }
  }

  private resolveValue(
    value: PredicateValue,
    row: Element
  ): string | number | boolean | Date | null {
    if (isTableColumn(value)) {
      return row.getAttribute(value.name as string)
    }
    return value
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
