import { Schema, createTable } from "./lib/schema"

export const person = createTable({
  name: "person",
  columns: {
    id: {
      type: "number",
    },
    name: {
      type: "string",
    },
    age: {
      type: "number",
    },
  },
})

export const car = createTable({
  name: "car",
  columns: {
    id: {
      type: "number",
    },
    make: {
      type: "string",
    },
    model: {
      type: "string",
    },
    ownerId: {
      type: "number",
    },
  },
})

export const address = createTable({
  name: "address",
  columns: {
    id: {
      type: "number",
    },
    street: {
      type: "string",
    },
    city: {
      type: "string",
    },
    state: {
      type: "string",
    },
    zip: {
      type: "string",
    },
    personId: {
      type: "number",
    },
  },
})

export const dbSchema: Schema = {
  person,
  car,
  address,
}
