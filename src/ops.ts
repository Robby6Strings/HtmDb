import jsdom from "jsdom"
import { Predicate, PredicateOptions } from "./predicate"
import { readTable, writeTable } from "./io"
const { JSDOM } = jsdom

function rowToKv(row: Element): Record<string, string> {
  return Array.from(row.attributes).reduce((acc, { name, value }) => {
    acc[name] = value
    return acc
  }, {} as any)
}

export async function select(
  tableName: string,
  predicates: PredicateOptions = {}
) {
  const tableStr = await readTable(tableName)
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
            if (operator === "=") return `[${key}="${value}"]`
            if (operator === "!=") return `:not([${key}="${value}"])`
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
        const rowVal = key === "id" ? row.id : row.getAttribute(key)
        if (!rowVal) return false
        if (operator === ">") return parseInt(rowVal) > parseInt(value)
        if (operator === "<") return parseInt(rowVal) < parseInt(value)
        if (operator === ">=") return parseInt(rowVal) >= parseInt(value)
        if (operator === "<=") return parseInt(rowVal) <= parseInt(value)
      })
    }

    return rows.map((row) => rowToKv(row))
  }

  const query = `table tr${whereSelector}${limitSelector}`

  return Array.from(table.querySelectorAll(query)).map((row) => rowToKv(row))
}

export async function upsert(
  tableName: string,
  values: any,
  returning: boolean = true
) {
  const tableStr = await readTable(tableName)
  const dom = new JSDOM(tableStr)
  const table = dom.window.document.querySelector("table")!
  const tBody = table.tBodies[0]

  let max = parseInt(table.getAttribute("max") || "0")
  let maxChanged = false

  const vals = Array.isArray(values) ? values : [values]
  const returnVals = []

  for (const val of vals) {
    if ("id" in val) {
      const row = table.querySelector(`tr[id="${val.id}"]`)
      if (row) {
        // update
        for (const key in val) {
          if (key === "id") continue
          row.setAttribute(key, val[key])
        }
        if (returning) returnVals.push(rowToKv(row))
      } else {
        // insert
        const newRow = dom.window.document.createElement("tr")

        for (const key in val) {
          if (key === "id") {
            newRow.setAttribute("id", val[key])
            max = Math.max(max, parseInt(val[key]))
            maxChanged = true
            continue
          }
          newRow.setAttribute(key, val[key])
        }
        tBody.appendChild(newRow)
        if (returning) returnVals.push(rowToKv(newRow))
      }
    } else {
      // insert
      const newRow = dom.window.document.createElement("tr")
      newRow.setAttribute("id", (max + 1).toString())
      max++
      maxChanged = true

      for (const key in val) {
        newRow.setAttribute(key, val[key])
      }
      tBody.appendChild(newRow)
      if (returning) returnVals.push(rowToKv(newRow))
    }

    if (maxChanged) table.setAttribute("max", max.toString())

    writeTable(tableName, dom.window.document.body.innerHTML)

    if (returning) return returnVals
  }
}
