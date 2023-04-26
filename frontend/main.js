// import { build } from 'vite'
import './style.scss'
import axios from 'axios'

const display = document.querySelector('.display')
const form = document.querySelector('form')

form.addEventListener('submit', (event) => {
  event.preventDefault()

  display.innerHTML = 'loading'

  //values from inputs
  const postcode = document.querySelector('#postcode').value
  const houseNumber = document.querySelector('#house-number').value
  const houseLetter = document.querySelector('#house-letter').value
  const houseAddition = document.querySelector('#house-addition').value

  //data that is going to be retrieved from api's and used for rent price calculations
  let area = null
  let buildYear = null
  let energyLabel = null
  let energyLabelIssueDate = null
  let wozValue = null
  let wozDate = null

  let bagApiMessage = ``
  let elApiMessage = ``
  let wozMessage = ``

  axios
    .post('/api/search', { postcode, houseNumber, houseLetter, houseAddition })
    .then((response) => {
      const data = response.data
      console.log(data)

      //BAG api
      if (data[0] === null) {
        bagApiMessage = 'Bag api error'
      } else {
        area = data[0]._embedded.adressen[0]._embedded.adresseerbaarObject.verblijfsobject.verblijfsobject.oppervlakte
        buildYear = data[0]._embedded.adressen[0]._embedded.panden[0].pand.oorspronkelijkBouwjaar

        bagApiMessage = `House area: ${area} sq.m <br/> Build year: ${buildYear} <br/>`
      }

      //Energy label API
      if (data[1] === null) {
        bagApiMessage = 'Energy label api error'
      } else {
        energyLabel = data[1][0].labelLetter
        energyLabelIssueDate = data[1][0].registratiedatum

        elApiMessage = `Energy label: ${energyLabel} <br/> En. label issue date (registratiedatum): ${energyLabelIssueDate} <br/>`
      }

      //WOZ data
      if (data[3] === null) {
        wozMessage = 'WOZ data retrieving error'
      } else {
        wozValue = '4'
        wozDate = '3'

        wozMessage = `WOZ value: ${wozValue} eur <br/>  WOZ date: ${wozDate}`
      }

      //diplaying information on the website
      display.innerHTML = `${bagApiMessage} ${elApiMessage} ${wozMessage}`

      //build year, area, etc can be used here later for the calculations
      console.log(energyLabel)
    })
    .catch((error) => {
      console.error(error)
    })
})
