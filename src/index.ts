import { select, upsert } from "./ops"
import { eq, notEq } from "./predicate"

async function main() {
  const queryStart = performance.now()
  const res = await upsert("person", [
    {
      id: "1",
      name: "Simon",
      age: "25",
    },
  ])

  // const res = await select("person", {
  //   where: [eq("id", "1")],
  // })

  console.log(res, performance.now() - queryStart + "ms elapsed")
}

main()
