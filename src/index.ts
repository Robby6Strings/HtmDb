import { select, upsert } from "./ops"

const eq = (a: string, b: string) => `${a}="${b}"`

async function selectPerson() {
  return await select("person", {
    where: [eq("id", "1")],
  })
}

async function insertPerson() {
  await upsert("person", [
    {
      id: "1",
      name: "Simon",
      age: "25",
    },
    {
      id: "33",
      name: "Rob",
      age: "30",
    },
  ])
}

async function main() {
  const queryStart = performance.now()
  const res = await insertPerson()
  console.log(res, performance.now() - queryStart + "ms elapsed")
}

main()
