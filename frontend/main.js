// import { build } from 'vite'
import './style.scss'
import axios from 'axios'

const display = document.querySelector('.display')
const loader = document.querySelector('.loader')
const result = document.querySelector('.result')
const form = document.querySelector('form')

form.addEventListener('submit', (event) => {
  event.preventDefault()

  loader.style.display = 'block'
  loader.style.opacity = 1
  result.innerHTML = ''

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
        let wozDate = data[3].split('\t')[0]
        let wozValue = data[3].split('\t')[1].split('.')[0]

        wozMessage = `WOZ most recent value: ${wozValue} eur <br/>  WOZ date: ${wozDate}`
      }

      //diplaying information on the website
      loader.style.display = 'none'
      result.innerHTML += `${bagApiMessage} ${elApiMessage} ${wozMessage}`

      //build year, area, etc can be used here later for the calculations
    })
    .catch((error) => {
      console.error(error)
    })
})
