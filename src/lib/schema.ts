
export type {
    ColumnConfig , TableConfig , TableColumn ,
    TableColumns , Schema , Table
}

export { createTable }

import { symbol_internal } from '.'


type ColumnConfig = {
    type : 'boolean' | 'datetime' | 'string' | 'number' | 'date'
}

type TableConfig = {
    columns : Record<string,ColumnConfig>
    name : string
}

type Schema = Record<string,Table<any>>


type TableColumn<T extends TableConfig> = {
    table : T[ 'name' ]
    type : T[ 'columns' ][ keyof T[ 'columns' ]][ 'type' ]
    name : keyof T[ 'columns' ]
}


type TableColumns<T extends TableConfig> = {
    [ Key in keyof T[ 'columns' ]]: TableColumn<T>
}

type Table<T extends TableConfig> = TableColumns<T> & {
    [ symbol_internal ] : TableConfig
}


function createTable <Type extends TableConfig> ( config : Type ) : Table<Type> {
    return Object
        .entries(config.columns)
        .reduce(( account , [ key ] ) => ({

            ... account ,

            [ key ] : {
                table : config.name ,
                type : config.columns[ key ].type ,
                name : key
            }
        }),{
            [ symbol_internal ] : config
        } as Table<Type>
    )
}
