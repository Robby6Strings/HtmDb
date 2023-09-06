import fs from "fs"
import { pathToFileURL } from "node:url"
import path from "path"
import jsdom from "jsdom"
const { JSDOM } = jsdom

type PredicateOptions = {
  where?: string[]
  limit?: number
}

export async function select(
  tableName: string,
  predicates: PredicateOptions = {}
) {
  const table = readTable(tableName)
  const dom = new JSDOM(table)

  const { where, limit } = predicates
  const whereSelector = where ? where.map((w) => `[${w}]`).join("") : ""
  const limitSelector = limit ? `:nth-child(-n+${limit})` : ""
  const query = `table tr${whereSelector}${limitSelector}`

  return Array.from(dom.window.document.querySelectorAll(query)).map((row) => {
    return Array.from(row.attributes).reduce((acc, { name, value }) => {
      acc[name] = value
      return acc
    }, {} as any)
  })
}

function readTable(tableName: string) {
  return fs.readFileSync(
    pathToFileURL(path.join("tables", tableName + ".html")),
    "utf8"
  )
}

function writeTable(tableName: string, table: string) {
  fs.writeFileSync(
    pathToFileURL(path.join("tables", tableName + ".html")),
    table
  )
}

export async function upsert(tableName: string, values: any) {
  const tableStr = readTable(tableName)
  const dom = new JSDOM(tableStr)
  const table = dom.window.document.querySelector("table")!
  const tBody = table.tBodies[0]

  let max = parseInt(table.getAttribute("max") || "0")
  let maxChanged = false

  const vals = Array.isArray(values) ? values : [values]

  for (const val of vals) {
    if ("id" in val) {
      const row = table.querySelector(`tr[id="${val.id}"]`)
      if (row) {
        // update
        for (const key in val) {
          if (key === "id") continue
          row.setAttribute(key, val[key])
        }
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
    }

    if (maxChanged) table.setAttribute("max", max.toString())

    writeTable(tableName, dom.window.document.body.innerHTML)
  }
}
