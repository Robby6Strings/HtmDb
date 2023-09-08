import path from "path"
import fs from "fs"
import { pathToFileURL } from "url"
import jsdom from "jsdom"
const { JSDOM } = jsdom

import {
  PredicateOptions,
  PredicateValue,
  PrimitiveType,
  PrimitiveValue,
} from "./predicate"
import { Schema, Table, TableColumn, TableConfig } from "./schema"

export const symbol_internal = Symbol("_")

function isTableColumn(value: PredicateValue): value is TableColumn<any> {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    "table" in value
  )
}

function isValidPrimitive(value: any): value is PrimitiveValue {
  return (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value instanceof Date ||
    value === null
  )
}

export class HtmlDb {
  constructor(private readonly schema: Schema) {
    for (const [tableName] of Object.entries(this.schema)) {
      this.readTable(tableName).catch(() => {
        console.log(`Table ${tableName} not found, creating...`)
        this.createTable(tableName)
      })
    }
  }

  public async select<T extends Table<any>>(
    tableRef: T,
    predicates: PredicateOptions = {}
  ) {
    const tableStr = await this.readTable(tableRef[symbol_internal].name)
    const dom = new JSDOM(tableStr)
    const table = dom.window.document.querySelector("table")!

    const filteredRows = Array.from(table.rows).filter((row) => {
      return (
        predicates.where?.every((predicate) => {
          const a = this.resolveValue(predicate.a, row)
          const b = this.resolveValue(predicate.b, row)
          const conversionType = this.getConversionType(
            predicate.a,
            predicate.b
          )

          const [a_norm, b_norm] = [
            this.typeCast(a, conversionType),
            this.typeCast(b, conversionType),
          ]

          if (a_norm === null || b_norm === null) {
            if (predicate.operator === "=") {
              return a_norm === b_norm
            } else if (predicate.operator === "!=") {
              return a_norm !== b_norm
            } else {
              return false
            }
          }
          if (Array.isArray(a_norm))
            throw new Error("Cannot provide array as lhs")

          if (predicate.operator === "in") {
            if (!Array.isArray(b_norm)) {
              throw new Error("Must provide an array with 'in' operator")
            } else if (Array.isArray(a_norm)) {
              throw new Error("'in' operator rhs must be array of primitives")
            }
            return b_norm.includes(a_norm)
          }

          if (Array.isArray(a_norm) || Array.isArray(b_norm)) {
            throw new Error("Must provide array with 'in' operator")
          }

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
        }) || !predicates.where
      )
    })

    const res: Record<string, string>[] = filteredRows
      .slice(0, predicates.limit || Infinity)
      .map((row) => this.rowToKv(row))

    if (predicates.with) {
      const _res = res as Record<string, string | Record<string, string>[]>[]
      const extraTables = await Promise.all(
        predicates.with.map(async ([table]) => {
          const tblData = await this.readTable(table[symbol_internal].name)
          return {
            name: table[symbol_internal].name,
            data: tblData,
          }
        })
      )

      for (let [tbl, preds, alias] of predicates.with) {
        const _alias = (alias ?? tbl[symbol_internal].name) as string
        const { name, data } = extraTables.shift()!
        const dom = new JSDOM(data)
        const table = dom.window.document.querySelector("table")!
        const rows = Array.from(table.querySelectorAll("tr"))

        for (const pred of preds) {
          let ctxColumn: TableColumn<any> | undefined
          let localColumn: TableColumn<any> | undefined

          if (!isTableColumn(pred.a) && !isTableColumn(pred.b)) {
            throw new Error("Must provide at least one table column")
          }
          if (isTableColumn(pred.a)) {
            if (pred.a.table === tableRef[symbol_internal].name) {
              ctxColumn = pred.a
            } else if (pred.a.table === name) {
              localColumn = pred.a
            }
          }
          if (isTableColumn(pred.b)) {
            if (pred.b.table === tableRef[symbol_internal].name) {
              ctxColumn = pred.b
            } else if (pred.b.table === name) {
              localColumn = pred.b
            }
          }

          if (!localColumn) {
            throw new Error(
              "Unable to determine local table column for 'with' predicate"
            )
          }

          for (const row of rows) {
            const localVal =
              localColumn.name === "id"
                ? row.id
                : (this.resolveValue(localColumn, row) as PrimitiveValue)

            if (localVal === null) continue

            if (ctxColumn) {
              const colName = ctxColumn.name as string
              // find matching rows in ctx table, assign to _res[_alias]
              _res.forEach((r) => {
                if (
                  this.typeCast(r[colName] as string, localColumn!.type) !=
                  localVal
                )
                  return

                if (typeof r[_alias] === "string")
                  throw new Error(
                    "subquery selection alias conflicts with existing column"
                  )
                if (!Array.isArray(r[_alias])) r[_alias] = []
                ;(r[_alias] as Record<string, string>[]).push(this.rowToKv(row))
              })
            } else {
              // no ctx column, evaluate predicate against rows
              const [a, b] = [
                this.resolveValue(pred.a, row),
                this.resolveValue(pred.b, row),
              ]

              const conversionType = this.getConversionType(pred.a, pred.b)
              const [a_norm, b_norm] = [
                this.typeCast(a, conversionType),
                this.typeCast(b, conversionType),
              ]

              if (pred.operator !== "in") {
                if (Array.isArray(a_norm) || Array.isArray(b_norm)) {
                  throw new Error("Array without 'in' operator")
                }
              }

              if (a_norm === null || b_norm === null) {
                throw new Error("Unable to evaluate predicate with null value")
              }

              const addToResults = () =>
                _res.forEach((r) => {
                  if (typeof r[_alias] === "string")
                    throw new Error(
                      "subquery selection alias conflicts with existing column"
                    )
                  if (!Array.isArray(r[_alias])) r[_alias] = []
                  ;(r[_alias] as Record<string, string>[]).push(
                    this.rowToKv(row)
                  )
                })

              switch (pred.operator) {
                case "in":
                  let arr: PrimitiveValue[]
                  let notArr: PrimitiveValue
                  if (Array.isArray(a_norm)) {
                    arr = a_norm
                    notArr = b_norm as PrimitiveValue
                  } else {
                    arr = b_norm as PrimitiveValue[]
                    notArr = a_norm
                  }
                  if (arr.includes(notArr)) {
                    addToResults()
                  }

                case "=":
                  if (a_norm === b_norm) {
                    addToResults()
                  }
                  break
                case "!=":
                  if (a_norm !== b_norm) {
                    addToResults()
                  }
                  break
                case ">":
                  if (a_norm > b_norm) {
                    addToResults()
                  }
                  break
                case "<":
                  if (a_norm < b_norm) {
                    addToResults()
                  }
                  break
                case ">=":
                  if (a_norm >= b_norm) {
                    addToResults()
                  }
                  break
                case "<=":
                  if (a_norm <= b_norm) {
                    addToResults()
                  }
                  break
              }
            }
          }
        }
      }
      return res as Record<string, string | Record<string, string>[]>[]
    }

    return res
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

  private getConversionType(
    predA: PredicateValue,
    predB: PredicateValue
  ): PrimitiveType {
    if (isTableColumn(predA)) {
      return predA.type
    } else if (isTableColumn(predB)) {
      return predB.type
    } else {
      if (isTableColumn(predA)) return predA.type
      if (isTableColumn(predB)) return predB.type
      if (isValidPrimitive(predA)) return typeof predA as PrimitiveType
      if (isValidPrimitive(predB)) return typeof predB as PrimitiveType
      throw new Error("Unable to determine conversion type")
    }
  }

  private typeCast(
    value: PrimitiveValue | PrimitiveValue[],
    type: PrimitiveType
  ): PrimitiveValue | PrimitiveValue[] {
    if (value === null) return null
    if (Array.isArray(value)) {
      return value.map((v) => {
        if (v === null) return null
        switch (type) {
          case "number":
            return Number(v)
          case "boolean":
            return Boolean(v)
          case "date":
            return new Date(v.toString())
          case "datetime":
            return new Date(v.toString())
          default:
            return v
        }
      })
    }
    switch (type) {
      case "number":
        return Number(value)
      case "boolean":
        return Boolean(value)
      case "date":
        return new Date(value.toString())
      case "datetime":
        return new Date(value.toString())
      default:
        return value
    }
  }

  private resolveValue(
    value: PredicateValue,
    row: Element
  ): PrimitiveValue | PrimitiveValue[] {
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

  private async createTable(tableName: string) {
    const table = new JSDOM().window.document.createElement("table")
    table.setAttribute("max", "0")
    await this.writeTable(tableName, table)
    return table.outerHTML
  }
}
