const express = require('express')
const axios = require('axios')
const dotenv = require('dotenv')
const { chats } = require('./data/data')

const app = express()
dotenv.config()

app.get('/', (req, res) => {
  res.send('API is running')
})

///////////////////////
app.use(express.json()) // parse JSON request bodies

app.post('/api/search', (req, res) => {
  const { postcode, houseNumber, houseLetter } = req.body

  const energyLabelUrl =
    'https://public.ep-online.nl/api/v3/PandEnergieLabel/Adres?postcode=6222TD&huisnummer=2&huisletter=i'

  const energyLabelConfig = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: process.env.ENERGY_LABEL_API_KEY,
    },
  }

  const bagUrl =
    'https://api.bag.kadaster.nl/lvbag/viewerbevragingen/v2/adressen/?expand=true&postcode=6222TD&huisnummer=2&inclusiefEindStatus=true'

  const bagConfig = {
    headers: {
      accept: 'application/hal+json',
      'X-Api-Key': process.env.BAG_API_KEY,
    },
  }

  const requests = [
    axios.get(energyLabelUrl, energyLabelConfig).catch(() => ({})),
    axios.get(bagUrl, bagConfig).catch(() => ({})),
  ]

  Promise.all(requests)
    .then((responses) => {
      const errors = responses.filter(
        (response) => !response.data || response.data.error
      )
      if (errors.length > 0) {
        const errorMessages = errors.map((error) => {
          if (error.message === 'el-error') {
            return 'The first request failed'
          } else if (error.message === 'bag-error') {
            return 'The BAG request failed'
          } else {
            return 'Error. The address is incorrect or the house can not be found in the database.'
          }
        })
        res.json({
          errors: errorMessages,
          data: responses
            .filter((response) => response.data && !response.data.error)
            .map((response) => response.data),
        })
      } else {
        res.json({
          data: responses.map((response) => response.data),
        })
      }
    })
    .catch((error) => {
      console.log(error)
      res.status(500).json({
        errors: ['An internal server error occurred'],
      })
    })
})

const PORT = process.env.PORT || 7000

app.listen(PORT, console.log(`Server stared on PORT ${PORT}`))
