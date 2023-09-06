export type PredicateOptions = {
  where?: Predicate[]
  limit?: number
}

export type Predicate = {
  key: string
  value: string
  operator: Operator
}

export type Operator =
  | "="
  | "!="
  | ">"
  | "<"
  | ">="
  | "<="
  | "contains"
  | "startsWith"
  | "endsWith"

export const eq = (a: string, b: string): Predicate => {
  return {
    key: a,
    value: b,
    operator: "=",
  }
}

export const notEq = (a: string, b: string): Predicate => {
  return {
    key: a,
    value: b,
    operator: "!=",
  }
}

export const gt = (a: string, b: string): Predicate => {
  return {
    key: a,
    value: b,
    operator: ">",
  }
}

export const lt = (a: string, b: string): Predicate => {
  return {
    key: a,
    value: b,
    operator: "<",
  }
}

export const gte = (a: string, b: string): Predicate => {
  return {
    key: a,
    value: b,
    operator: ">=",
  }
}

export const lte = (a: string, b: string): Predicate => {
  return {
    key: a,
    value: b,
    operator: "<=",
  }
}
