const express = require('express')
const axios = require('axios')
const dotenv = require('dotenv')
const scrapeEnergyIndex = require('./functions/scrapeEnergyIndex.js')
const scrapeWozAndMonument = require('./functions/scrapeWozAndMonument.js')
const calculateRentPrice = require('./functions/calculateRentPrice.js')

const app = express()
dotenv.config()

app.get('/', (req, res) => {
  res.send('API is running')
})

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
  } = req.body

  // test address: 6227SP 27 A02
  // address with Energy Index: 8021AP 4

  //setting the parameters of request url
  const bagUrl = new URL('https://api.bag.kadaster.nl/lvbag/viewerbevragingen/v2/adressen')
  bagUrl.searchParams.set('expand', 'true')
  // bagUrl.searchParams.set('postcode', '1017EL')
  // bagUrl.searchParams.set('huisnummer', '538')
  // bagUrl.searchParams.set('huisnummertoevoeging', 'O')

  bagUrl.searchParams.set('postcode', '8021AP')
  bagUrl.searchParams.set('huisnummer', '4')
  bagUrl.searchParams.set('huisletter', 'C')

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

  //executing the woz searching function and writing all other requests into json file to be displayed in frontend
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  scrapeWozAndMonument('6227 SP 27 A02')
    // scrapeWozAndMonument('1017 EL 538 O')
    .then((result) => {
      woz = result[0]
      monument = result[1] === '' ? 'No' : 'Yes'
      return Promise.all(requests)
    })
    .then((responses) => {
      data = responses.map((response) => response.data)

      area = data[0]._embedded.adressen[0]._embedded.adresseerbaarObject.verblijfsobject.verblijfsobject.oppervlakte
      buildYear = data[0]._embedded.adressen[0]._embedded.panden[0].pand.oorspronkelijkBouwjaar
      energyLabel = data[1][0].labelLetter
      wozValue = woz.split('\t')[1].replace(/\./g, '').replace(' euro', '')
      city = data[0]._embedded.adressen[0].woonplaatsNaam
      isMonument = monument

      addressId = data[0]._embedded.adressen[0].adresseerbaarObjectIdentificatie

      return scrapeEnergyIndex(addressId)
    })
    .then((energyIndex) => {
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
        energyIndex
      )
    })
    .then((result) => {
      console.log(result)
      res.json({ area, buildYear, energyLabel, result })
    })
    .catch((error) => {
      console.log(error)
    })
})

// scrapeWozAndMonument('62200-98077SP 27 A 02') // use this address to test WOZ error
// scrapeWozAndMonument('1017 EL 538 O').then((res) => console.log(res))

// scrapeEnergyIndex('0363010000701271').then((res) => console.log(res)) //not working, returns empty string
// scrapeEnergyIndex('0193010000101063').then((res) => console.log(res)) //working request

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const PORT = process.env.PORT || 7000

app.listen(PORT, console.log(`Server stared on PORT ${PORT}`))
