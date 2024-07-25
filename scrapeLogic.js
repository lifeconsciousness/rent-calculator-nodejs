const puppeteer = require('puppeteer')
require('dotenv').config()
// const { Builder, By, Key, until } = require('selenium-webdriver')
// const chrome = require('selenium-webdriver/chrome')

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

  ////////////////////selenium

  // const wozValuePromise = async (address) => {
  //   // WOZ scraping logic
  //   let wozValue

  //   const options = new chrome.Options()
  //   options.addArguments('--headless')
  //   const driver = new Builder().forBrowser('chrome').setChromeOptions(options).build()

  //   await driver.manage().setTimeouts({ implicit: 300000 })

  //   await driver.get('https://www.wozwaardeloket.nl/')
  //   await delay(Math.random() * 30 + 1)

  //   const kaartBekijkenButton = await driver.findElement(By.css('#kaart-bekijken-btn'))
  //   await kaartBekijkenButton.click()
  //   await delay(Math.random() * 30 + 1)

  //   const inputField = await driver.findElement(By.css('#ggcSearchInput'))
  //   await inputField.sendKeys(address)
  //   await delay(Math.random() * 30 + 1)

  //   const suggestionElements = await driver.findElements(By.css('#ggcSuggestionList-0'))
  //   if (suggestionElements.length > 0) {
  //     const suggestion = suggestionElements[0]
  //     await suggestion.click()

  //     await driver.wait(until.elementLocated(By.css('.waarden-row')))
  //     const waardenRow = await driver.findElement(By.css('.waarden-row'))
  //     wozValue = await waardenRow.getAttribute('innerText')
  //   } else {
  //     wozValue = 'Not found'
  //   }

  //   return wozValue
  // }

  /////////////////////puppeteer

  const wozValuePromise = async (address) => {
    // WOZ scraping logic

    const page = await browser.newPage()
    page.setDefaultNavigationTimeout(300000)
    // page.waitForNavigation({ timeout: 150000, waitUntil: 'domcontentloaded' })

    // await page.goto('https://www.wozwaardeloket.nl/')
    await page.goto('https://www.wozwaardeloket.nl/', {
      waitUntil: 'load',
      timeout: 300000,
    })
    //maybe unnecessary delay before doing some actions on website
    await delay(Math.random() * 30 + 1)

    // clicking the button 'ga verder'
    // await page.waitForSelector('#kaart-bekijken-btn')

    // const myData = await page.$eval('#kaart-bekijken-btn', (el) => el.innerText)
    // console.log(myData)
    // await page.waitForFunction(() => {
    //   const button = document.querySelector('#kaart-bekijken-btn')
    //   return button && button.isConnected
    // })

    // await page.click('#kaart-bekijken-btn')

    // page.waitForNavigation({ timeout: 150000, waitUntil: 'domcontentloaded' })

    const kaartBekijkenButton = await page.$('#kaart-bekijken-btn')
    if (kaartBekijkenButton) {
      await kaartBekijkenButton.click()
    }

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

      // page.waitForNavigation({ timeout: 150000, waitUntil: 'domcontentloaded' })
      const listExists = await waitForSelectorWithTimeout('#ggcSuggestionList-0', 222000)

      if (listExists) {
        await page.click('#ggcSuggestionList-0')
        // page.waitForNavigation({ timeout: 150000, waitUntil: 'domcontentloaded' })
        await page.waitForSelector('.waarden-row')
        wozValue = await page.$eval('.waarden-row', (element) => element.innerText)
      } else {
        wozValue = 'Not found'
      }
    } catch (error) {
      console.log("Error in WOZ value promise " + error)
    }

    console.log("Woz found: " + wozValue);

    return wozValue
  }

  ////////////////////puppeteer

  const monumentValuePromise = async (address) => {
    return false
    // Monument scraping logic

    const page = await browser.newPage()
    page.setDefaultNavigationTimeout(300000)

    await page.goto('https://monumentenregister.cultureelerfgoed.nl', {
      waitUntil: 'load',
      timeout: 300000,
    })
    page.waitForNavigation({ timeout: 300000, waitUntil: 'domcontentloaded' })

    await delay(Math.random() * 30 + 1)

    await page.waitForSelector('#edit-tekst--2')
    await page.type('#edit-tekst--2', address)
    await delay(Math.random() * 30 + 1)

    page.waitForNavigation({ timeout: 300000, waitUntil: 'domcontentloaded' })

    await page.waitForSelector('#edit-submit-register-of-monuments--2')
    await page.click('#edit-submit-register-of-monuments--2')
    await delay(Math.random() * 30 + 1)

    page.waitForNavigation({ timeout: 300000, waitUntil: 'domcontentloaded' })

    await page.waitForSelector('#content')
    const monumentValue = await page.$eval('#content', (el) => el.innerText)
    return monumentValue
  }

  const energyIndexPromise = async (adresseerbaarId) => {
    // Energy index scraping logic

    const page = await browser.newPage()
    page.setDefaultNavigationTimeout(26000)

    await page.goto('https://www.ep-online.nl/Energylabel/Search', {
      waitUntil: 'load',
      timeout: 0,
    })
    await delay(Math.random() * 18 + 1)
    // page.waitForNavigation({ timeout: 150000, waitUntil: 'domcontentloaded' })

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

      // page.waitForNavigation({ timeout: 150000, waitUntil: 'domcontentloaded' })

      const elementExists = await waitForSelectorWithTimeout('.se-result-item-nta', 14000)

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

  // .catch((error) => {
  //   console.error("Failed to fetch WOZ value:", error);
  //   return null; 
  // })

  await Promise.all([wozValuePromise(address), monumentValuePromise(address), energyIndexPromise(adresseerbaarId)])
    .then(async ([wozValue, monumentValue, energyIndexValue]) => {
      woz = wozValue
      monument = monumentValue
      energyIndex = energyIndexValue
    })
    .catch((error) => {
      console.error(error)
    })

    // commented this just recently
  browser.close()

  return [woz, monument, energyIndex]
}

function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time)
  })
}

module.exports = scrapeWozAndMonument
