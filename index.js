const puppeteer = require("puppeteer")

const filePath = "file://" + __dirname + "/tables/"

const eq = (a, b) => `${a}="${b}"`

async function main() {
  const res = await queryTable("person", { where: [eq("name", "Bob")] })
  console.log(res)
}

async function queryTable(tableName, predicates = {}) {
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

  const res = await page.evaluate((query) => {
    const rows = Array.from(document.querySelectorAll(query))
    return rows.map((row) => {
      const attributes = Array.from(row.attributes)
      return attributes.reduce((acc, { name, value }) => {
        acc[name] = value
        return acc
      }, {})
    })
  }, query)

  await browser.close()
  return res
}

main()
