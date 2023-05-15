const puppeteer = require('puppeteer')

async function scrapeWozAndMonument(address) {
  const browser = await puppeteer.launch({ headless: 'new' }) // or false if you want to see the browser
  const page = await browser.newPage()

  await page.goto('https://www.wozwaardeloket.nl/')
  //maybe unnecessary delay before doing some actions on website
  await delay(Math.random() * 30 + 1)

  //clicking the button 'ga verder'
  await page.waitForSelector('#kaart-bekijken-btn')
  const myData = await page.$eval('#kaart-bekijken-btn', (el) => el.innerText)
  console.log(myData)
  await page.click('#kaart-bekijken-btn')

  await delay(Math.random() * 30 + 1)
  //typing the address and choosing the first address suggestion
  await page.type('#ggcSearchInput', address)

  //if there's no ggcsuggestion list woz value is empty
  let wozValue

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

    const listExists = await waitForSelectorWithTimeout('#ggcSuggestionList-0', 10000)

    // const listExists = await Promise.race([
    //   page.waitForSelector('#ggcSuggestionList-0'),
    //   new Promise((resolve) => {
    //     setTimeout(() => resolve(null), 1000)
    //   }),
    // ])

    if (listExists) {
      await page.click('#ggcSuggestionList-0')
      await page.waitForSelector('.waarden-row')
      wozValue = await page.$eval('.waarden-row', (element) => element.innerText)
    } else {
      wozValue = ''
    }
  } catch (error) {
    console.log(error)
  }

  /////////////////////////////////////////////////////////////////////////////////scraping rijksmonument value

  const monumentPage = await browser.newPage()

  await monumentPage.goto('https://monumentenregister.cultureelerfgoed.nl')
  await delay(Math.random() * 30 + 1)

  await monumentPage.waitForSelector('#edit-tekst--2')
  await monumentPage.type('#edit-tekst--2', address)
  await delay(Math.random() * 30 + 1)

  await monumentPage.waitForSelector('#edit-submit-register-of-monuments--2')
  await monumentPage.click('#edit-submit-register-of-monuments--2')
  await delay(Math.random() * 30 + 1)

  await monumentPage.waitForSelector('#content')
  const content = await monumentPage.$eval('#content', (el) => el.innerText)

  await browser.close()
  return [wozValue, content]
}

function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time)
  })
}

module.exports = scrapeWozAndMonument
