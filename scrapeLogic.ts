const puppeteer = require('puppeteer')
require('dotenv').config()

async function scrapeWozAndMonument(address, adresseerbaarId) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--disable-setuid-sandbox', '--no-sandbox'],
    executablePath:
      process.env.NODE_ENV === 'production' ? process.env.PUPPETEER_EXECUTABLE_PATH : puppeteer.executablePath(),
  })
  // const browser = await puppeteer.launch({
  //   args: ['--disable-setuid-sandbox', '--no-sandbox', '--single-process', '--no-zygote'],
  //   executablePath:
  //     process.env.NODE_ENV === 'production' ? process.env.PUPPETEER_EXECUTABLE_PATH : puppeteer.executablePath(),
  // })

  const wozValuePromise = async (address) => {
    // WOZ scraping logic

    const page = await browser.newPage()
    // page.setDefaultNavigationTimeout(200000)
    page.waitForNavigation({ timeout: 150000, waitUntil: 'domcontentloaded' })

    await page.goto('https://www.wozwaardeloket.nl/')
    // await page.goto('https://www.wozwaardeloket.nl/', {
    //   waitUntil: 'load',
    //   timeout: 0,
    // })
    //maybe unnecessary delay before doing some actions on website
    await delay(Math.random() * 30 + 1)

    //clicking the button 'ga verder'
    // await page.waitForSelector('#kaart-bekijken-btn')

    // const myData = await page.$eval('#kaart-bekijken-btn', (el) => el.innerText)
    // console.log(myData)
    // await page.waitForFunction(() => {
    //   const button = document.querySelector('#kaart-bekijken-btn')
    //   return button && button.isConnected
    // })

    // await page.click('#kaart-bekijken-btn')

    //MOST STABLE VARIANT OF CLICK UP TO DATE

    // const kaartBekijkenButton = await page.$('#kaart-bekijken-btn')
    // if (kaartBekijkenButton) {
    //   await kaartBekijkenButton.click()
    // }

    await page.$eval('#kaart-bekijken-btn', (elem) => (elem as HTMLElement).click())

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

        const result = await Promise.race([selectorPromise, timeoutPromise]) //wait for either selector or timeout to resolve
        clearTimeout(timeout)
        resolveFunc(null) // Resolving the timeout promise to prevent unhandled promise rejection
        return result
      }

      const listExists = await waitForSelectorWithTimeout('#ggcSuggestionList-0', 22000)

      if (listExists) {
        await page.click('#ggcSuggestionList-0')
        await page.waitForSelector('.waarden-row')
        wozValue = await page.$eval('.waarden-row', (element) => element.innerText)
      } else {
        wozValue = 'Not found'
      }
    } catch (error) {
      console.log(error)
    }

    return wozValue
  }

  const monumentValuePromise = async (address) => {
    // Monument scraping logic

    const page = await browser.newPage()
    page.setDefaultNavigationTimeout(30000)

    await page.goto('https://monumentenregister.cultureelerfgoed.nl', {
      waitUntil: 'load',
      timeout: 0,
    })
    await delay(Math.random() * 30 + 1)

    await page.waitForSelector('#edit-tekst--2')
    await page.type('#edit-tekst--2', address)
    await delay(Math.random() * 30 + 1)

    await page.waitForSelector('#edit-submit-register-of-monuments--2')
    await page.click('#edit-submit-register-of-monuments--2')
    await delay(Math.random() * 30 + 1)

    await page.waitForSelector('#content')
    const monumentValue = await page.$eval('#content', (el) => el.innerText)
    return monumentValue
  }

  const energyIndexPromise = async (adresseerbaarId) => {
    // Energy index scraping logic

    const page = await browser.newPage()
    page.setDefaultNavigationTimeout(40000)

    await page.goto('https://www.ep-online.nl/Energylabel/Search', {
      waitUntil: 'load',
      timeout: 0,
    })
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

      const elementExists = await waitForSelectorWithTimeout('.se-result-item-nta', 20000)

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

    return energyIndex
  }

  let woz
  let monument
  let energyIndex

  await Promise.all([wozValuePromise(address), monumentValuePromise(address), energyIndexPromise(adresseerbaarId)])
    .then(([wozValue, monumentValue, energyIndexValue]) => {
      woz = wozValue
      monument = monumentValue
      energyIndex = energyIndexValue
    })
    .catch((error) => {
      console.error(error)
    })

  browser.close()
  return [woz, monument, energyIndex]
}

function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time)
  })
}

module.exports = scrapeWozAndMonument
