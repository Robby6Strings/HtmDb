import { HtmlDb } from "./lib"
import { eq, inArr, neq } from "./lib/predicate"
import { car, dbSchema, person } from "./schema"

const db = new HtmlDb(dbSchema)

async function selectExample() {
  const queryStart = performance.now()
  const res = await db.select(person, {
    where: [inArr(person.id, [1, 2, 3])],
    with: [[car, [eq(car.ownerId, person.id)]]],
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
        name: "James",
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
  //upsertExample()
})()
