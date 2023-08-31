const puppeteer = require("puppeteer")

const filePath = "file://" + __dirname + "/../tables/"

const eq = (a: string, b: string) => `${a}="${b}"`

async function main() {
  const res = await queryTable("person", { where: [eq("name", "Bob")] })
  console.log(res)
}

type PredicateOptions = {
  where?: string[]
  limit?: number
}

async function queryTable(
  tableName: string,
  predicates: PredicateOptions = {}
) {
  const browser = await puppeteer.launch({
    headless: "new",
  })
  const page = await browser.newPage()
  await page.goto(filePath + tableName + ".html")
  await page.waitForSelector("table")

  const { where, limit } = predicates
  const whereSelector = where ? where.map((w) => `[${w}]`).join("") : ""
  const limitSelector = limit ? `:nth-child(-n+${limit})` : ""
  const query = `table tr${whereSelector}${limitSelector}`

  const res = await page.evaluate((query: string) => {
    return Array.from(document.querySelectorAll(query)).map((row) => {
      return Array.from(row.attributes).reduce((acc, { name, value }) => {
        acc[name] = value
        return acc
      }, {} as any)
    })
  }, query)

  await browser.close()
  return res
}

main()
