
export { symbol_internal , HtmlDb }

import { TableColumn , Schema , Table } from './schema'
import { pathToFileURL } from 'node:url'
import jsdom from 'jsdom'
import path from 'node:path'
import fs from 'node:fs'

import {
  PredicateOptions ,PredicateValue,
  PrimitiveType , PrimitiveValue
} from './predicate'


const { JSDOM } = jsdom


const symbol_internal = Symbol('_')


function isTableColumn ( value : PredicateValue ) : value is TableColumn<any> {
    return typeof value === 'object'
        && !! value
        && Object.hasOwn(value,'name')
        && Object.hasOwn(value,'table')
}


function isValidPrimitive ( value : any ) : value is PrimitiveValue {
    return typeof value === 'boolean'
        || typeof value === 'string'
        || typeof value === 'number'
        || value instanceof Date
        || value === null
}


class HtmlDb {

    constructor ( private readonly schema : Schema ){

        const entries = Object
            .entries(this.schema)

        for ( const [ tableName ] of entries )
            this.readTable(tableName).catch(() => {
                console.log(`Table ${ tableName } not found, creating...`)
                this.createTable(tableName)
            })
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

                if( a_norm === null || b_norm === null )
                    switch ( predicate.operator ){
                    default : return false
                    case '!=' : return a_norm !== b_norm
                    case '=' : return a_norm === b_norm
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

                switch ( predicate.operator ){
                case '<=' : return a_norm <= b_norm
                case '!=' : return a_norm !== b_norm
                case '>=' : return a_norm >= b_norm
                case '<' : return a_norm < b_norm
                case '=' : return a_norm === b_norm
                case '>' : return a_norm > b_norm
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

                            if (Array.isArray(a_norm) || Array.isArray(b_norm)) {
                                throw new Error("Must provide array with 'in' operator")
                            }

                            if (a_norm === null || b_norm === null) {
                                throw new Error("Unable to evaluate predicate with null value")
                            }

                            switch (pred.operator) {
                            case "=":

                                if (a_norm === b_norm) {
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
                                }

                                break
                            case "!=":

                                if (a_norm !== b_norm) {
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
                                }
                                break

                            case ">":

                                if (a_norm > b_norm) {
                                    console.log(">", a_norm, b_norm)
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
                                }
                                break

                            case "<":

                                if (a_norm < b_norm) {
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
                                }

                                break

                            case ">=":

                                if (a_norm >= b_norm) {

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
                                }

                                break

                            case "<=":

                                if (a_norm <= b_norm) {
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
                                }

                                break
                            }
                        }
                    }
                }
            }
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


    private getConversionType (
        a : PredicateValue ,
        b : PredicateValue
    ){

        if( isTableColumn(a) )
            return a.type

        if( isTableColumn(b) )
            return b.type

        if( isValidPrimitive(a) )
            return typeof a as PrimitiveType

        if( isValidPrimitive(b) )
            return typeof b as PrimitiveType

        throw new Error(`Unable to determine conversion type`)
    }

    private typeCast (
        value : PrimitiveValue | Array<PrimitiveValue> ,
        type : PrimitiveType
    ){
        return ( Array.isArray(value) )
            ? value.map(( item ) => this.simpleTypeCast(item,type))
            : this.simpleTypeCast(value,type)
    }


    private simpleTypeCast (
        value : PrimitiveValue ,
        type : PrimitiveType
    ) : PrimitiveValue {

        if( value === null )
            return value

        switch ( type ){
        default : return value
        case 'datetime' : return new Date(value.toString())
        case 'boolean' : return Boolean(value)
        case 'number' : return Number(value)
        case 'date' : return new Date(value.toString())
        }
    }


    private resolveValue (
        value : PredicateValue ,
        row : Element
    ){

        if( isTableColumn(value) )
            return row.getAttribute(value.name as string)

        return value
    }


    private rowToKv ( row : Element ){
        return Array
            .from(row.attributes)
            .reduce(( account , { value , name } ) => ({
                ... account ,
                [ name ] : value
            }),{} as Record<string,string> )
    }

    private fileUrlFromTableName(tableName: string) {
        return pathToFileURL(path.join("tables", tableName + ".html"))
    }

    private readTable(tableName: string) {
        return fs.promises.readFile(this.fileUrlFromTableName(tableName), "utf8")
    }


    private writeTable (
        name : string ,
        element : HTMLTableElement
    ){

        const file = this
            .fileUrlFromTableName(name)

        const html = element.outerHTML

        return fs.promises
            .writeFile(file,html)
    }


    private async createTable ( tableName : string ){

        const { window } = new JSDOM()

        const table = window.document
            .createElement('table')

        table.setAttribute('max','0')

        await this.writeTable(tableName,table)

        return table.outerHTML
    }
}
