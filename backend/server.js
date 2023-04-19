const express = require('express')
const axios = require('axios')
const dotenv = require('dotenv')
const { chats } = require('./data/data')

const app = express()
dotenv.config()

app.get('/', (req, res) => {
  res.send('API is running')
})

/////////////////////////
app.use(express.json()) // parse JSON request bodies

app.post('/api/search', (req, res) => {
  const { postcode, houseNumber, houseLetter } = req.body

  const energyLabelUrl =
    'https://public.ep-online.nl/api/v3/PandEnergieLabel/Adres?postcode=6222TD&huisnummer=2&huisletter='

  const energyLabelConfig = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: process.env.ENERGY_LABEL_API_KEY,
    },
  }

  const requests = [axios.get(energyLabelUrl, energyLabelConfig)]

  Promise.all(requests)
    .then((responses) => {
      const data = responses.map((response) => response.data)
      res.json(data)
    })
    .catch((error) => {
      console.log(error)
      res.json(
        'Error. The address is incorrect or the house can not be found in the database.'
      )
    })
})

//working request code
// app.post('/api/search', (req, res) => {
//   const { postcode, houseNumber, houseLetter } = req.body

//   const url =
//     'https://public.ep-online.nl/api/v3/PandEnergieLabel/Adres?postcode=6222TD&huisnummer=2&huisletter='

//   const config = {
//     headers: {
//       'Content-Type': 'application/json',
//       Authorization: process.env.ENERGY_LABEL_API_KEY,
//     },
//   }

//   axios
//     .get(url, config)
//     .then((response) => {
//       res.json(response.data) // send the retrieved data back to the frontend as a JSON response
//     })
//     .catch((error) => {
//       console.log(error)
//       res.json(
//         'Error. The address is incorrect or the house can not be found in the database.'
//       )
//     })
// })
////////////////////////

const PORT = process.env.PORT || 7000

app.listen(PORT, console.log(`Server stared on PORT ${PORT}`))
