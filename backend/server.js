const express = require('express')
const axios = require('axios')
const dotenv = require('dotenv')
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
  const {
    postcode,
    houseNumber,
    houseLetter,
    houseAddition,
    numberOfRooms,
    outdoorSpaceValue,
    sharedPeople,
    kitchen,
    bathroom,
  } = req.body

  //test address: 6227SP 27 A02
  //address with Energy Index: 8021AP 4
  // scrapeWozValue('62200-98077SP 27 A 02')  use this address to test WOZ error

  const bagUrl = new URL('https://api.bag.kadaster.nl/lvbag/viewerbevragingen/v2/adressen')
  bagUrl.searchParams.set('expand', 'true')
  bagUrl.searchParams.set('postcode', '1017EL')
  bagUrl.searchParams.set('huisnummer', '538')
  bagUrl.searchParams.set('huisnummertoevoeging', 'O')
  // bagUrl.searchParams.set('huisletter', 'O')

  // bagUrl.searchParams.set('expand', 'true')
  // bagUrl.searchParams.set('postcode', '6227SP')
  // bagUrl.searchParams.set('huisnummer', '27')
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
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  scrapeWozValue('6227 SP 27 A02')
    // scrapeWozValue('1017 EL 538 O')
    .then((result) => {
      woz = result
      return Promise.all(requests)
    })
    // Promise.all(requests)
    .then((responses) => {
      const data = responses.map((response) => response.data)
      res.json(data)

      const area =
        data[0]._embedded.adressen[0]._embedded.adresseerbaarObject.verblijfsobject.verblijfsobject.oppervlakte
      const buildYear = data[0]._embedded.adressen[0]._embedded.panden[0].pand.oorspronkelijkBouwjaar
      const energyLabel = data[1][0].labelLetter
      const wozValue = woz.split('\t')[1].replace(/\./g, '').replace(' euro', '')
      const city = data[0]._embedded.adressen[0].woonplaatsNaam

      return calculateRentPrice(
        area,
        buildYear,
        energyLabel,
        wozValue,
        numberOfRooms,
        outdoorSpaceValue,
        sharedPeople,
        kitchen,
        bathroom,
        city
      )
    })
    .then((result) => {
      console.log(result)
    })
    .catch((error) => {
      console.log(error)
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

  /////////////////////////////////when it doesn't appear after 30 seconds make the function return undefined
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

// scrapeWozValue('6227 SP 27 A02').then((res) => console.log(res))

/////////////////////////////////////////////////////////////////////////////////////////////
//sending and retrieving data from google sheets

async function calculateRentPrice(
  area,
  buildYear,
  energyLabel,
  wozValue,
  numberOfRooms,
  outdoorSpaceValue,
  sharedPeople,
  kitchen,
  bathroom,
  city
) {
  console.log(
    area,
    buildYear,
    energyLabel,
    wozValue,
    numberOfRooms,
    outdoorSpaceValue,
    sharedPeople,
    kitchen,
    bathroom,
    city
  )

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
    let amountPeopleShared
    let sharedArea

    if (sharedPeople === undefined) {
      amountPeopleShared = ''
      sharedArea = ''
    } else {
      amountPeopleShared = sharedPeople
      sharedArea = area / amountPeopleShared
    }

    let isAmsOrUtr
    if (city === 'Amsterdam' || city === 'Utrecht') {
      isAmsOrUtr = 'Yes'
    } else {
      isAmsOrUtr = 'No'
    }

    //set the value of cells
    await googleSheets.spreadsheets.values.batchUpdate({
      auth,
      spreadsheetId,
      resource: {
        data: [
          {
            range: 'Independent calculator!K8',
            values: [[numberOfRooms]],
          },
          {
            range: 'Independent calculator!K10',
            values: [[area]],
          },
          {
            range: 'Independent calculator!K12',
            values: [[outdoorSpaceValue]],
          },
          {
            range: 'Independent calculator!Q12',
            values: [[amountPeopleShared]],
          },
          {
            range: 'Independent calculator!L12',
            values: [[sharedArea]],
          },
          {
            range: 'Independent calculator!K14',
            values: [[kitchen]],
          },
          {
            range: 'Independent calculator!K18',
            values: [[bathroom]],
          },
          {
            range: 'Independent calculator!K21',
            values: [[wozValue]],
          },
          {
            range: 'Independent calculator!K23',
            values: [[buildYear]],
          },
          {
            range: 'Independent calculator!K25',
            values: [[isAmsOrUtr]],
          },
        ],
        valueInputOption: 'USER_ENTERED',
      },
    })

    //cell value request
    const getResultingValue = await googleSheets.spreadsheets.values.get({
      auth,
      spreadsheetId,
      range: 'Independent calculator!Q5:Q7',
    })
    return getResultingValue.data.values[0][0]
  } finally {
    release()
  }
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const PORT = process.env.PORT || 7000

app.listen(PORT, console.log(`Server stared on PORT ${PORT}`))
