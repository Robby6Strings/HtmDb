import { HtmlDb } from "./lib"
import { gte, lte, eq } from "./lib/predicate"
import { dbSchema, person } from "./schema"

const db = new HtmlDb(dbSchema)

async function selectExample() {
  const queryStart = performance.now()
  const res = await db.select(person, {
    where: [gte(person.id, "15")],
  })
  console.log(res)
  console.log(
    `selectExample complete - ${performance.now() - queryStart + "ms elapsed"}`
  )
}

async function upsertExample() {
  const queryStart = performance.now()
  const res = await db.upsert(
    person,
    [
      {
        id: "1",
        name: "Bob",
      },
    ],
    true
  )
  console.log(res)
  console.log(
    `upsertExample complete - ${performance.now() - queryStart + "ms elapsed"}`
  )
}

;(() => {
  selectExample()
  upsertExample()
})()
