const puppeteer = require('puppeteer')

async function scrapeEnergyIndex(adresseerbaarId) {
  const browser = await puppeteer.launch({ headless: 'new' })
  const page = await browser.newPage()

  await page.goto('https://www.ep-online.nl/Energylabel/Search')
  await delay(Math.random() * 18 + 1)

  await page.waitForSelector('#SearchValue')
  await delay(Math.random() * 18 + 1)
  await page.type('#SearchValue', adresseerbaarId)

  await page.waitForSelector('#searchButton')
  await delay(Math.random() * 18 + 1)
  await page.click('#searchButton')

  let energyIndex

  try {
    let timeout

    const waitForSelectorWithTimeout = async (selector, timeoutMs) => {
      let resolveFunc
      const timeoutPromise = new Promise((resolve) => {
        resolveFunc = resolve
        timeout = setTimeout(() => resolve(null), timeoutMs)
      })

      const selectorPromise = page.waitForSelector(selector)

      const result = await Promise.race([selectorPromise, timeoutPromise])
      clearTimeout(timeout)
      resolveFunc(null) // Resolving the timeout promise to prevent unhandled promise rejection
      return result
    }

    const elementExists = await waitForSelectorWithTimeout('.se-result-item-nta', 25000)

    // console.log(elementExists)

    // const element = await Promise.race([
    //   page.waitForSelector('.se-result-item-nta'),
    //   new Promise((resolve) => setTimeout(() => resolve(null), 4000)),
    // ])

    if (elementExists) {
      const container = await page.$eval('.se-result-item-nta', (element) => element.innerText)
      if (/\bEI\b/.test(container)) {
        energyIndex = container.split('EI')[1].split('EI')[0].replace(/\s+/g, '')
      } else {
        energyIndex = 'Not found'
      }
    } else {
      energyIndex = 'Not found'
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
