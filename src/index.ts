import fs from "fs"
import { pathToFileURL } from "node:url"
import path from "path"
import jsdom from "jsdom"
const { JSDOM } = jsdom

const eq = (a: string, b: string) => `${a}="${b}"`

async function main() {
  const queryStart = performance.now()
  const res = await queryTable("person", {
    where: [eq("id", "1")],
  })
  console.log(res, performance.now() - queryStart + "ms elapsed")
}

type PredicateOptions = {
  where?: string[]
  limit?: number
}

async function queryTable(
  tableName: string,
  predicates: PredicateOptions = {}
) {
  const file = fs.readFileSync(
    pathToFileURL(path.join("tables", tableName + ".html")),
    "utf8"
  )

  const dom = new JSDOM(file)

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

main()
