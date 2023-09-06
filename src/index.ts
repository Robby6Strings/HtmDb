import { select } from "./ops"
import { gte, lte } from "./predicate"

async function main() {
  const queryStart = performance.now()

  const res = await select("person", {
    where: [lte("id", "5"), gte("id", "2")],
    limit: 3,
  })

  console.log(res, performance.now() - queryStart + "ms elapsed")
}

main()
