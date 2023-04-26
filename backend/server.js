const express = require('express')
const axios = require('axios')
const dotenv = require('dotenv')
const { chats } = require('./data/data')
const puppeteer = require('puppeteer')

const app = express()
dotenv.config()

app.get('/', (req, res) => {
  res.send('API is running')
})

////////////////////////////////////////
//getting info about the house

app.use(express.json()) // parse JSON request bodies

//route to request data about the building from multiple API's and send it to the frontend
app.post('/api/search', (req, res) => {
  const { postcode, houseNumber, houseLetter, houseAddition } = req.body

  //test address: 6227SP 27 A02

  //address with Energy Index: 8021AP, 4

  const bagUrl = new URL('https://api.bag.kadaster.nl/lvbag/viewerbevragingen/v2/adressen')
  bagUrl.searchParams.set('expand', 'true')
  bagUrl.searchParams.set('postcode', '6227SP')
  bagUrl.searchParams.set('huisnummer', '27')
  bagUrl.searchParams.set('huisletter', 'A')
  bagUrl.searchParams.set('huisnummertoevoeging', '02')

  //use this case to debug the error when the address wasn't found
  // bagUrl.searchParams.set('postcode', '6222TD')
  // bagUrl.searchParams.set('huisnummer', '2')
  // bagUrl.searchParams.set('huisletter', 'A')
  // bagUrl.searchParams.set('huisnummertoevoeging', '02')

  const bagConfig = {
    headers: {
      accept: 'application/hal+json',
      'X-Api-Key': process.env.BAG_API_KEY,
    },
  }

  const energyLabelUrl = new URL('https://public.ep-online.nl/api/v3/PandEnergieLabel/Adres')
  energyLabelUrl.searchParams.set('postcode', '6227SP')
  energyLabelUrl.searchParams.set('huisnummer', '27')
  energyLabelUrl.searchParams.set('huisletter', 'A')
  energyLabelUrl.searchParams.set('huisnummertoevoeging', '02')

  const energyLabelConfig = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: process.env.ENERGY_LABEL_API_KEY,
    },
  }

  //returning an empty object in case of error to then check in order which request has failed and display according info
  //DO NOT change order of requests because correct errors display depends on it
  const requests = [
    axios.get(bagUrl, bagConfig).catch(() => {
      return {}
    }),
    axios.get(energyLabelUrl, energyLabelConfig).catch(() => {
      return {}
    }),
  ]

  let woz = null

  //executing the woz searching function and writing all other requests into json file to be displayed in frontend
  // scrapeWozValue('6227SP 27 A 02')
  //   // scrapeWozValue('62A 21')
  //   .then((wozValue) => {
  //     woz = wozValue
  //     return Promise.all(requests)
  //   })
  //   .then((responses) => {
  //     const data = responses.map((response) => response.data)
  //     data.push(woz)
  //     res.json(data)
  //   })
  //   .catch((error) => {
  //     console.error(error)
  //   })

  Promise.all(requests)
    .then((responses) => {
      const data = responses.map((response) => response.data)
      res.json(data)
    })
    .catch((error) => {
      console.log(error)
    })
})

///////////////////////////////////////////
//Scraping the woz value

async function scrapeWozValue(address) {
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
  await page.waitForSelector('#ggcSuggestionList-0')
  await page.click('#ggcSuggestionList-0')

  await delay(Math.random() * 30 + 1)
  //extracting the WOZ data
  try {
    await page.waitForSelector('.waarden-row')
  } catch (error) {
    console.log('Selector not found, skipping further:', error)
    return
  }
  const wozValue = await page.$eval('.waarden-row', (element) => element.innerText)

  // const html = await page.content()
  // console.log(html)

  await browser.close()
  return wozValue
  // return '10'
}

function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time)
  })
}

////////////////////////////////////

const PORT = process.env.PORT || 7000

app.listen(PORT, console.log(`Server stared on PORT ${PORT}`))
