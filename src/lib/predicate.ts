
export {
    PredicateOptions , PrimitiveValue , PrimitiveType ,
    PredicateValue , Predicate , Operator
}

export { inArr , lte , gte , neq , gt , lt , eq }

import { TableConfig , TableColumn , Table } from './schema'


interface PredicateOptions {
    where ?: Array<Predicate>
    limit ?: number
    with ?: Array<Join<any>>
}

type Join<TC extends TableConfig> = [
    Table<TC> , Array<Predicate> , string?
]

interface Predicate {
    operator : Operator
    a : PredicateValue
    b : PredicateValue
}


type Operator =
    | '!='
    | '>='
    | '<='
    | 'in'
    | '>'
    | '='
    | '<'

type PrimitiveValue =
    | boolean
    | string
    | number
    | Date
    | null

type PrimitiveType =
    | 'datetime'
    | 'boolean'
    | 'string'
    | 'number'
    | 'date'
    | 'null'


type PredicateValue =
    | Array<PrimitiveValue>
    | PrimitiveValue
    | TableColumn<any>


const eq = ( a : PredicateValue , b : PredicateValue ) =>
    createPredicate('=',a,b)

const neq = ( a : PredicateValue , b : PredicateValue ) =>
    createPredicate('!=',a,b)

const gt = ( a : PredicateValue , b : PredicateValue ) =>
    createPredicate('>',a,b)

const lt = ( a : PredicateValue , b : PredicateValue ) =>
    createPredicate('<',a,b)

const gte = ( a : PredicateValue , b : PredicateValue ) =>
    createPredicate('>=',a,b)

const lte = ( a : PredicateValue , b : PredicateValue ) =>
    createPredicate('<=',a,b)

const inArr = ( a : TableColumn<any> , b : Array<PrimitiveValue> ) =>
    createPredicate('in',a,b)


const createPredicate = (
    operator : Operator ,
    a : PredicateValue ,
    b : PredicateValue
) => ({ operator , b , a }) satisfies Predicate
