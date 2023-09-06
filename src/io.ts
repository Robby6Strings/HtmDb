import path from "path"
import { pathToFileURL } from "url"
import fs from "fs"

export function readTable(tableName: string) {
  return fs.promises.readFile(
    pathToFileURL(path.join("tables", tableName + ".html")),
    "utf8"
  )
}

export function writeTable(tableName: string, table: string) {
  return fs.promises.writeFile(
    pathToFileURL(path.join("tables", tableName + ".html")),
    table
  )
}
