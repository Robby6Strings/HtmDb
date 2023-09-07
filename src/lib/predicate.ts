import { TableConfig } from "./schema"

export type PredicateOptions<T extends TableConfig> = {
  where?: Predicate<T>[]
  limit?: number
  with?: Join[]
}
export type Join = [name: string, callback: (row: any) => boolean]

export type Predicate<T extends TableConfig> = {
  key: keyof T["columns"]
  value: string
  operator: Operator
}

export type Operator = "=" | "!=" | ">" | "<" | ">=" | "<="

export const eq = <T extends TableConfig>(
  key: keyof T["columns"],
  val: string
): Predicate<T> => {
  return createPredicate<T>(key, val, "=")
}

export const notEq = <T extends TableConfig>(
  key: keyof T["columns"],
  val: string
): Predicate<T> => {
  return createPredicate<T>(key, val, "!=")
}

export const gt = <T extends TableConfig>(
  key: keyof T["columns"],
  val: string
): Predicate<T> => {
  return createPredicate<T>(key, val, ">")
}

export const lt = <T extends TableConfig>(
  key: keyof T["columns"],
  val: string
): Predicate<T> => {
  return createPredicate<T>(key, val, "<")
}

export const gte = <T extends TableConfig>(
  key: keyof T["columns"],
  val: string
): Predicate<T> => {
  return createPredicate<T>(key, val, ">=")
}

export const lte = <T extends TableConfig>(
  key: keyof T["columns"],
  val: string
): Predicate<T> => {
  return createPredicate<T>(key, val, "<=")
}

function createPredicate<T extends TableConfig>(
  key: keyof T["columns"],
  value: string,
  operator: Operator
) {
  return {
    key,
    value,
    operator,
  }
}
