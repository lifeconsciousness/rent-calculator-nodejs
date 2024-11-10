const puppeteer = require('puppeteer')
require('dotenv').config()

async function scrapeWozAndMonument(address, adresseerbaarId) {
  const browser = await puppeteer.launch();

  const wozValuePromise1 = async (address) => {

    const page = await browser.newPage()

    await page.goto('https://www.wozwaardeloket.nl/', { waitUntil: 'load' })

    await page.waitForSelector('#kaart-bekijken-btn');
    await page.click('#kaart-bekijken-btn');

    await page.waitForSelector('#ggcSearchInput');
    await page.type('#ggcSearchInput', address)

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
      const listExists = await waitForSelectorWithTimeout('#ggcSuggestionList-0', 8000)

      if (listExists) {
        await page.click('#ggcSuggestionList-0')
        await page.waitForSelector('.waarden-row')
        wozValue = await page.$eval('.waarden-row', (element) => element.innerText)
      } else {
        wozValue = 'Not found'
      }
    } catch (error) {
      console.log("Error in WOZ value promise " + error)
    }

    console.log("Got woz found: " + wozValue);

    return wozValue
  }

  const wozValuePromise = async (addressVar) => {
        const page = await browser.newPage();
//        page.setDefaultNavigationTimeout(10000)
        console.log(addressVar)


    console.log("1")

        await page.goto('https://www.wozwaardeloket.nl/', { waitUntil: 'load' });
//        await page.goto('https://www.wozwaardeloket.nl/');

    console.log("2")


//        await page.waitForSelector('#kaart-bekijken-btn');
//        await page.click('#kaart-bekijken-btn');
//
        const kaartBekijkenButton = await page.$('#kaart-bekijken-btn')
            if (kaartBekijkenButton) {
              await kaartBekijkenButton.click()
            }

    console.log("3")


        await page.waitForSelector('#ggcSearchInput');
        await page.type('#ggcSearchInput', addressVar);

        await page.waitForSelector('#ggcSuggestionList-0');
//        await page.waitForSelector('#ggcSuggestionList');
        await page.click('#ggcSuggestionList-0');

    console.log("4")

        await page.waitForSelector('.waarden-row')
//        await page.waitForSelector('.wozwaarde-waarde')

        const wozValue = await page.$eval('.waarden-row', el => el.innerText);
        await page.close();
        let result

        if(wozValue){
          result = wozValue
        } else{
        result = 'Not found'
        }

        return wozValue;
      };


  const monumentValuePromise = async (address) => {
    return ''

    const page = await browser.newPage()

    await page.goto('https://monumentenregister.cultureelerfgoed.nl', { waitUntil: 'load'})

    await page.waitForSelector('#edit-tekst--2')
    await page.type('#edit-tekst--2', address)

    await page.waitForSelector('#edit-submit-register-of-monuments--2')
    await page.click('#edit-submit-register-of-monuments--2')

    await page.waitForSelector('#content')
    const monumentValue = await page.$eval('#content', (el) => el.innerText)
    return monumentValue
  }

  const energyIndexPromise = async (adresseerbaarId) => {
    return 'Not found'

    const page = await browser.newPage()

    await page.goto('https://www.ep-online.nl/Energylabel/Search', { waitUntil: 'load'})

    await page.waitForSelector('#SearchValue')
    await page.type('#SearchValue', adresseerbaarId)

    await page.waitForSelector('#searchButton')
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


      const elementExists = await waitForSelectorWithTimeout('.se-result-item-nta', 2000)

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

    console.log("got energy index: " + energyIndex)

    return energyIndex
  }

  let woz
  let monument
  let energyIndex

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


module.exports = scrapeWozAndMonument
