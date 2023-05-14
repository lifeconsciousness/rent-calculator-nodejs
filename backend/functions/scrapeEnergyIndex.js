const puppeteer = require('puppeteer')

async function scrapeEnergyIndex(adresseerbaarId) {
  const browser = await puppeteer.launch({ headless: 'new' })
  const page = await browser.newPage()

  await page.goto('https://www.ep-online.nl/Energylabel/Search')
  await delay(Math.random() * 30 + 1)

  await page.waitForSelector('#SearchValue')
  await delay(Math.random() * 30 + 1)
  await page.type('#SearchValue', adresseerbaarId)

  await page.waitForSelector('#searchButton')
  await page.click('#searchButton')

  await delay(Math.random() * 30 + 1)

  // const containerExists = await page?.$('.se-result-item-nta')
  let energyIndex

  try {
    const element = await Promise.race([
      page.waitForSelector('.se-result-item-nta'),
      new Promise((resolve) => setTimeout(() => resolve(null), 4000)),
    ])

    if (element) {
      const container = await page.$eval('.se-result-item-nta', (element) => element.innerText)
      if (/\bEI\b/.test(container)) {
        energyIndex = container.split('EI')[1].split('EI')[0].replace(/\s+/g, '')
      } else {
        energyIndex = ''
      }
    } else {
      energyIndex = ''
    }
  } catch (error) {
    console.error(error)
  }

  await browser.close()
  return energyIndex
}

function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time)
  })
}

module.exports = scrapeEnergyIndex
