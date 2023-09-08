import { Table, TableColumn, TableConfig } from "./schema"

export type PredicateOptions = {
  where?: Predicate[]
  limit?: number
  //with?: Join<any>[]
}

export type Join<TC extends TableConfig> = [Table<TC>, Predicate]

export type Predicate = {
  a: PredicateValue
  b: PredicateValue
  operator: Operator
}

export type Operator = "=" | "!=" | ">" | "<" | ">=" | "<="
export type PredicateValue =
  | string
  | number
  | boolean
  | Date
  | null
  | TableColumn<any>

export const eq = (a: PredicateValue, b: PredicateValue) => {
  return createPredicate(a, b, "=")
}

export const neq = (a: PredicateValue, b: PredicateValue) => {
  return createPredicate(a, b, "!=")
}

export const gt = (a: PredicateValue, b: PredicateValue) => {
  return createPredicate(a, b, ">")
}

export const lt = (a: PredicateValue, b: PredicateValue) => {
  return createPredicate(a, b, "<")
}

export const gte = (a: PredicateValue, b: PredicateValue) => {
  return createPredicate(a, b, ">=")
}

export const lte = (a: PredicateValue, b: PredicateValue) => {
  return createPredicate(a, b, "<=")
}

function createPredicate(
  a: PredicateValue,
  b: PredicateValue,
  operator: Operator
): Predicate {
  return {
    a,
    b,
    operator,
  }
}
