import jsdom from "jsdom"
import { PredicateOptions } from "./predicate"
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
  const whereSelector = where
    ? where
        .map((w) => {
          const { key, value, operator } = w
          if (operator === "=") return `[${key}="${value}"]`
          if (operator === "!=") return `:not([${key}="${value}"])`
          if (operator === ">") return `[${key}^="${value}"]`
          if (operator === "<") return `[${key}$="${value}"]`
          if (operator === ">=")
            return `[${key}^="${value}"],[${key}="${value}"]`
          if (operator === "<=")
            return `[${key}$="${value}"],[${key}="${value}"]`
          if (operator === "contains") return `[${key}*="${value}"]`
          if (operator === "startsWith") return `[${key}^="${value}"]`
          if (operator === "endsWith") return `[${key}$="${value}"]`
        })
        .join("")
    : ""
  const limitSelector = limit ? `:nth-child(-n+${limit})` : ""
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
