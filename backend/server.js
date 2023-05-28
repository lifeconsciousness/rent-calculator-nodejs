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

  const postcodeValue = postcode.toUpperCase()

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
  // console.log(addressString)

  //setting the parameters of request url

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

  // bagUrl.searchParams.set('postcode', '1017EL')
  // bagUrl.searchParams.set('huisnummer', '538')
  // bagUrl.searchParams.set('huisnummertoevoeging', 'O')

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
  energyLabelUrl.searchParams.set('postcode', postcode)
  energyLabelUrl.searchParams.set('huisnummer', houseNumber)
  if (houseLetter !== '') {
    energyLabelUrl.searchParams.set('huisletter', houseLetter)
  }
  if (houseAddition !== '') {
    energyLabelUrl.searchParams.set('huisnummertoevoeging', houseAddition)
  }

  // energyLabelUrl.searchParams.set('postcode', '3024RC')
  // energyLabelUrl.searchParams.set('huisnummer', '136')
  // energyLabelUrl.searchParams.set('huisletter', '')
  // energyLabelUrl.searchParams.set('huisnummertoevoeging', '')

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

  scrapeWozAndMonument(addressString)
    // scrapeWozAndMonument('6227 SP 27 A02')
    // scrapeWozAndMonument('1017 EL 538 O')
    .then((result) => {
      woz = result[0]
      monument = result[1] === '' ? 'No' : 'Yes'
      return Promise.all(requests)
    })
    .then(async (responses) => {
      data = responses.map((response) => response.data)
      // console.log(data)

      if (!data[0]?._embedded?.adressen?.[0]) {
        try {
          const resolved = await Promise.reject('Address not found')
          return ''
        } catch (err) {
          return console.log(err)
        }
      }
      // .then((responses) => {
      //   data = responses.map((response) => response.data)
      //   console.log(data)

      //   if (!data[0]?._embedded?.adressen?.[0]) {
      //     return Promise.reject('Address not found')
      //       .then((resolved) => '')
      //       .catch((err) => console.log(err))
      //   }

      area = data[0]?._embedded?.adressen[0]._embedded.adresseerbaarObject.verblijfsobject.verblijfsobject.oppervlakte
      buildYear = data[0]?._embedded?.adressen[0]._embedded.panden[0].pand.oorspronkelijkBouwjaar

      energyLabelTemp = data[1]
      energyLabelTemp !== undefined ? (energyLabel = energyLabelTemp[0]?.labelLetter) : (energyLabel = 'Not found')

      wozValue = woz ? woz.split('\t')[1].replace(/\./g, '').replace(' euro', '') : 'Not found'

      city = data[0]?._embedded?.adressen[0].woonplaatsNaam
      isMonument = monument
      addressId = data[0]?._embedded?.adressen[0].adresseerbaarObjectIdentificatie

      streetNameFromApi = data[0]?._embedded?.adressen[0]?.openbareRuimteNaam
      houseNumberFromApi = data[0]?._embedded?.adressen[0]?.huisnummer
      houseLetterFromApi = data[0]?._embedded?.adressen[0]?.huisletter
      houseAdditionFromApi = data[0]?._embedded?.adressen[0]?.huisnummertoevoeging
      postcodeFromApi = data[0]?._embedded?.adressen[0]?.postcode

      return scrapeEnergyIndex(addressId)
    })
    .then((energyIndexValue) => {
      energyIndex = energyIndexValue

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
      console.log(error)
      return Promise.reject(error)
    })
    .catch((error) => {
      console.log(error)
      const errMessage =
        'Error. Check if your address is correct. <br/> If you still get the same error, try reloading the page/closing and opening your browser. <br/> If none of these methods work, try using our calculator spreadsheet: *INSERT LINK WITH ANCHOR TAG HERE*'
      res.json({ errMessage })
    })
})

// scrapeWozAndMonument('6220SP 27 A 02') // use this address to test WOZ error
// scrapeWozAndMonument('1017 EL 538 O').then((res) => console.log(res))

// scrapeEnergyIndex('0363010000701271').then((res) => console.log(res)) //not working, returns empty string
// scrapeEnergyIndex('0193010000101063').then((res) => console.log(res)) //working request

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const PORT = process.env.PORT || 7000

app.listen(PORT, console.log(`Server stared on PORT ${PORT}`))
