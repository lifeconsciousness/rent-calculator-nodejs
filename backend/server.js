const express = require('express')
const axios = require('axios')
const dotenv = require('dotenv')
// const { chats } = require('./data/mock-data.js')
const puppeteer = require('puppeteer')
const { google } = require('googleapis')
const { Mutex } = require('async-mutex')

const app = express()
dotenv.config()

app.get('/', (req, res) => {
  res.send('API is running')
})

////////////////////////////////////////
//getting info about the house and executing all calculating functions

app.use(express.json()) // parse JSON request bodies

//route to request data about the building from multiple API's and send it to the frontend
app.post('/api/search', (req, res) => {
  const { postcode, houseNumber, houseLetter, houseAddition, numberOfRooms, outdoorSpace, kitchenDesc, bathroomDecs } =
    req.body

  //test address: 6227SP 27 A02

  //address with Energy Index: 8021AP 4

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
  energyLabelUrl.searchParams.set('postcode', '8021AP')
  energyLabelUrl.searchParams.set('huisnummer', '4')
  energyLabelUrl.searchParams.set('huisletter', '')
  energyLabelUrl.searchParams.set('huisnummertoevoeging', '')
  // const energyLabelUrl = new URL('https://public.ep-online.nl/api/v3/PandEnergieLabel/Adres')
  // energyLabelUrl.searchParams.set('postcode', '6227SP')
  // energyLabelUrl.searchParams.set('huisnummer', '27')
  // energyLabelUrl.searchParams.set('huisletter', 'A')
  // energyLabelUrl.searchParams.set('huisnummertoevoeging', '02')

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
  scrapeWozValue('62200-98077SP 27 A 02')
    .then((wozValue) => {
      woz = wozValue
      return Promise.all(requests)
    })
    .then((responses) => {
      data = responses.map((response) => response.data)

      area = data[0]._embedded.adressen[0]._embedded.adresseerbaarObject.verblijfsobject.verblijfsobject.oppervlakte
      buildYear = data[0]._embedded.adressen[0]._embedded.panden[0].pand.oorspronkelijkBouwjaar
      energyLabel = data[1][0].labelLetter
      energyLabelIssueDate = data[1][0].registratiedatum.split('T')[0]
      wozDate = woz.split('\t')[0]
      ///////////////////I think woz date is not needed
      wozValue = woz.split('\t')[1].replace('.', '').replace(' euro', '')
      return calculateRentPrice(
        area,
        buildYear,
        energyLabel,
        energyLabelIssueDate,
        wozValue,
        numberOfRooms,
        outdoorSpace,
        kitchenDesc,
        bathroomDecs
      )
    })
    .then((rentPrice) => {
      data.push(woz)
      data.push(rentPrice)
      res.json(data)

      // result = []
      // result.push(area, buildYear, energyLabel, energyLabelIssueDate, wozDate, wozValue, rentPrice)
      // res.json(result)
    })
    .catch((error) => {
      console.error(error)
    })

  // Promise.all(requests)
  //   .then((responses) => {
  //     const data = responses.map((response) => response.data)
  //     res.json(data)
  //   })
  //   .catch((error) => {
  //     console.log(error)
  //   })
})

/////////////////////////////////////////////////////////////////////////////////////
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

  //search the needed information in html file
  // const html = await page.content()
  // console.log(html)

  await browser.close()
  return wozValue
}

function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time)
  })
}
/////////////////////////////////////////////////////////////////////////////////////////////
//sending and retrieving data from google sheets

async function calculateRentPrice(area, buildYear, energyLabel, energyLabelIssueDate, wozValue) {
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: 'https://www.googleapis.com/auth/spreadsheets',
  })

  const spreadsheetId = process.env.SPREADSHEET_ID
  const client = await auth.getClient()
  const googleSheets = google.sheets({ version: 'v4', auth: client })

  // Acquire the lock
  const sheetMutex = new Mutex()
  const release = await sheetMutex.acquire()

  try {
    //set the value of cells
    // await googleSheets.spreadsheets.values.update({
    //   auth,
    //   spreadsheetId,
    //   range: 'Independent calculator!A1:B1',
    //   valueInputOption: 'USER_ENTERED',
    //   resource: {
    //     values: [['2', '4']],
    //   },
    // })

    //cell value request
    const getResultingValue = await googleSheets.spreadsheets.values.get({
      auth,
      spreadsheetId,
      range: 'Independent calculator!Q5:Q7',
    })
    // console.log(getResultingValue.data.values[0][0])
    return getResultingValue.data.values[0][0]
  } finally {
    release()
  }
}

// calculateRentPrice().then((res) => console.log(res))

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const PORT = process.env.PORT || 7000

app.listen(PORT, console.log(`Server stared on PORT ${PORT}`))
