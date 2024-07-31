const express = require('express')
const axios = require('axios')
const dotenv = require('dotenv')
const scrapeLogic = require('./scrapeLogic.js')
const calculateRentPrice = require('./backend/functions/calculateRentPrice.js')
const path = require('path')
const cron = require('node-cron')
const cors = require('cors')

const app = express()
// app.use(cors({ origin: '*' }))
dotenv.config()

app.use(express.json()) // parse JSON request bodies

//route to request data about the building from multiple API's and send it to the frontend
app.post('/api/search', async (req, res) => {
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
    periodSignedContract
  } = req.body

  let addressString
  if (houseLetter !== '' && houseAddition !== '') {
    addressString = `${postcode} ${houseNumber} ${houseLetter} ${houseAddition}`
  }
  if (houseLetter === '' && houseAddition !== '') {
    addressString = `${postcode} ${houseNumber} ${houseAddition}`
  }
  if (houseAddition === '' && houseLetter !== '') {
    addressString = `${postcode} ${houseNumber} ${houseLetter}`
  }
  if (houseAddition === '' && houseLetter === '') {
    addressString = `${postcode} ${houseNumber}`
  }

  //setting the parameters of request url

  //parameters for BAG API
  const bagUrl = new URL('https://api.bag.kadaster.nl/lvbag/viewerbevragingen/v2/adressen')
  bagUrl.searchParams.set('expand', 'true')

  bagUrl.searchParams.set('postcode', postcode)
  bagUrl.searchParams.set('huisnummer', houseNumber)
  if (houseLetter !== '') {
    bagUrl.searchParams.set('huisletter', houseLetter)
  }
  if (houseAddition !== '') {
    bagUrl.searchParams.set('huisnummertoevoeging', houseAddition)
  }

  const bagConfig = {
    headers: {
      accept: 'application/hal+json',
      'X-Api-Key': process.env.BAG_API_KEY,
    },
  }

  // parameters for energy label API
  const energyLabelUrl = new URL('https://public.ep-online.nl/api/v3/PandEnergieLabel/Adres')
  energyLabelUrl.searchParams.set('postcode', postcode)
  energyLabelUrl.searchParams.set('huisnummer', houseNumber)
  if (houseLetter !== '') {
    energyLabelUrl.searchParams.set('huisletter', houseLetter)
  }
  if (houseAddition !== '') {
    energyLabelUrl.searchParams.set('huisnummertoevoeging', houseAddition)
  }

  const energyLabelConfig = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: process.env.ENERGY_LABEL_API_KEY,
    },
  }

  //DO NOT change order of requests because correct results display depends on it
  const requests = [
    axios.get(bagUrl, bagConfig).catch(() => {
      return {}
    }),
    axios.get(energyLabelUrl, energyLabelConfig).catch(() => {
      return {}
    }),
  ]

  //executing the woz searching function and writing all other requests into json file to be displayed in frontend
  ///////////////////////////////////////////////////////////////////////////////////////

  //variables declaration
  let area
  let buildYear
  let energyLabelTemp
  let energyLabel
  let city
  let addressId
  let streetNameFromApi
  let houseNumberFromApi
  let houseLetterFromApi
  let houseAdditionFromApi
  let postcodeFromApi
  let woz
  let monument
  let wozValue
  let isMonument
  let energyIndex
  let errMessage =
    'Error. Check if your address is correct. <br/> If you still get the same error, try reloading the page/closing and opening your browser. <br/> If none of these methods work, try using our <a href="https://1drv.ms/x/s!AhS9UiEeuDTxgoA79X98W0bwNUdOFA?e=LwPAgd" target="_blank">Calculator Spreadsheet</a>'

  await Promise.all(requests)
    .then(async (responses) => {
      const data = responses.map((response) => response.data)
      // console.log(data)

      if (!data[0]?._embedded?.adressen?.[0]) {
        try {
          const resolved = await Promise.reject('Address not found')
          return ''
        } catch (err) {
          return console.log("Error in getting the data except from WOZ: " + err)
        }
      }

      area = data[0]?._embedded?.adressen[0]._embedded.adresseerbaarObject.verblijfsobject.verblijfsobject.oppervlakte
      buildYear = data[0]?._embedded?.adressen[0]._embedded.panden[0].pand.oorspronkelijkBouwjaar

      energyLabelTemp = data[1]
      energyLabelTemp !== undefined ? (energyLabel = energyLabelTemp[0]?.labelLetter) : (energyLabel = 'Not found')

      city = data[0]?._embedded?.adressen[0].woonplaatsNaam
      addressId = data[0]?._embedded?.adressen[0].adresseerbaarObjectIdentificatie

      streetNameFromApi = data[0]?._embedded?.adressen[0]?.openbareRuimteNaam
      houseNumberFromApi = data[0]?._embedded?.adressen[0]?.huisnummer
      houseLetterFromApi = data[0]?._embedded?.adressen[0]?.huisletter
      houseAdditionFromApi = data[0]?._embedded?.adressen[0]?.huisnummertoevoeging
      postcodeFromApi = data[0]?._embedded?.adressen[0]?.postcode

      return scrapeLogic(addressString, addressId)
      // return ['DJ 100000', false, 'Not found']
    })
    .then(async (result) => {
      try {
        woz = result[0]
      } catch (error) {
        errMessage =
          'You might see this error because you are using Firefox. In cases where the WOZ value does not appear: sometimes the database is not accessible for anyone. It often happens during weekends. If you get a result that says "no WOZ data" try again on Monday. if it still happens. Send me an email (info@rentbuster.nl)'
      }
      monument = result[1] === '' ? 'No' : 'Yes'
      console.log("Is a monument: " + result[1])

      wozValue = woz ? woz.split('\t')[1].replace(/\./g, '').replace(' euro', '') : 'Not found'
      isMonument = monument
      energyIndex = result[2]

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
        city,
        isMonument,
        energyIndex,
        periodSignedContract
      )
    })
    .then((result) => {
      console.log("Result: " + result)
      console.log("Data from API: street name: " + streetNameFromApi + " house number: " + houseNumberFromApi + " house letter: " +  houseLetterFromApi + " house addition: " +  houseAdditionFromApi + " postcode: " +  postcodeFromApi)

      res.json({
        area,
        buildYear,
        energyLabel,
        energyIndex,
        wozValue,
        city,
        isMonument,
        result,
        streetNameFromApi,
        houseNumberFromApi,
        houseLetterFromApi,
        houseAdditionFromApi,
        postcodeFromApi,
      })
    })
    .catch((error) => {
      console.log("Error in sending the result to frontend: " + error)
      return Promise.reject(error)
    })
    .catch((error) => {
      console.log(error)
      res.json({ errMessage })
    })
})

////////////////////////////////////////ping server every 14 minutes

function pingServer() {
  const serverUrl = 'https://rentcalculator.onrender.com'

  axios
    .get(serverUrl)
    .then((response) => {
      // console.log('Server pinged successfully')
    })
    .catch((error) => {
      console.error('Error pinging server:', error)
    })
}

cron.schedule('*/10 * * * *', pingServer)

//////////////////////////////////////////////////////////////////////

//deployment
const __dirname1 = path.resolve()
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname1, '/dist')))

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname1, 'dist', 'index.html'))
  })
} else {
  app.get('/', (req, res) => {
    res.send('API is running')
  })
}

const PORT = process.env.PORT || 10000

app.listen(PORT, console.log(`Server stared on PORT ${PORT}`))
