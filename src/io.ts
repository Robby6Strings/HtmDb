import path from "path"
import { pathToFileURL } from "url"
import fs from "fs"

export function fileUrlFromTableName(tableName: string) {
  return pathToFileURL(path.join("tables", tableName + ".html"))
}

export function readTable(tableName: string) {
  return fs.promises.readFile(fileUrlFromTableName(tableName), "utf8")
}

export function writeTable(tableName: string, table: string) {
  return fs.promises.writeFile(fileUrlFromTableName(tableName), table)
}
