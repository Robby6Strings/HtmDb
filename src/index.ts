import { select } from "./ops"
import { gt, lte } from "./predicate"

async function main() {
  const queryStart = performance.now()

  const res = await select("person", {
    where: [lte("id", "5"), gt("id", "2")],
  })

  console.log(res, performance.now() - queryStart + "ms elapsed")
}

main()
