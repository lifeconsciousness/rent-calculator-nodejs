// import { build } from 'vite'
import './style.scss'
import axios from 'axios'

const display = document.querySelector('.display')
const loader = document.querySelector('.loader')
const result = document.querySelector('.result')
const form = document.querySelector('form')

//displaying/hiding input field depending on the value of other
const outdoorSpace = document.querySelector('#outdoor')
const sharingLabel = document.querySelector('#sharing-label')
const sharingInput = document.querySelector('#sharing')
let isSharing = false
outdoorSpace.addEventListener('change', (e) => {
  if (outdoorSpace.value === 'Shared') {
    sharingLabel.style.display = 'block'
    sharingInput.style.display = 'block'
    isSharing = true
  } else {
    sharingLabel.style.display = 'none'
    sharingInput.style.display = 'none'
    isSharing = false
  }
})
let isSuccess

//actions on submit
form.addEventListener('submit', (event) => {
  event.preventDefault()

  loader.style.display = 'block'
  loader.style.opacity = 1
  result.innerHTML = ''

  //////////values from inputs

  //address
  const postcode = document.querySelector('#postcode').value
  const houseNumber = document.querySelector('#house-number').value
  const houseLetter = document.querySelector('#house-letter').value
  const houseAddition = document.querySelector('#house-addition').value

  //house parameters
  const numberOfRooms = document.querySelector('#number-of-rooms').value
  const outdoorSpaceValue = outdoorSpace.value
  let sharedPeople = document.querySelector('#sharing').value
  if (isSharing) {
  }
  const kitchen = document.querySelector('#kitchen').value
  const bathroom = document.querySelector('#bathroom').value

  //data that is going to be retrieved from api's and used for rent price calculations
  let area = null
  let buildYear = null
  let energyLabel = null
  let energyLabelIssueDate = null
  let wozValue = null
  let wozDate = null
  let energyIndex = null

  //messages to display the info about a house
  let bagApiMessage = ``
  let elApiMessage = ``
  let wozMessage = ``

  // const postParameters = {
  //   postcode,
  //   houseNumber,
  //   houseLetter,
  //   houseAddition,
  //   numberOfRooms,
  //   outdoorSpaceValue,
  //   sharedPeople,
  //   kitchen,
  //   bathroom,
  // }

  const postParameters = isSharing
    ? {
        postcode,
        houseNumber,
        houseLetter,
        houseAddition,
        numberOfRooms,
        outdoorSpaceValue,
        sharedPeople,
        kitchen,
        bathroom,
      }
    : {
        postcode,
        houseNumber,
        houseLetter,
        houseAddition,
        numberOfRooms,
        outdoorSpaceValue,
        kitchen,
        bathroom,
      }

  axios
    .post('/api/search', postParameters)
    .then((response) => {
      const data = response.data
      console.log(data)

      //BAG api
      if (data[0]) {
        if (data[0] === null) {
          bagApiMessage = 'Bag api error'
        } else {
          area = data[0]._embedded.adressen[0]._embedded.adresseerbaarObject.verblijfsobject.verblijfsobject.oppervlakte
          buildYear = data[0]._embedded.adressen[0]._embedded.panden[0].pand.oorspronkelijkBouwjaar

          bagApiMessage = `House area: ${area} sq.m <br/> Build year: ${buildYear} <br/>`
        }
      }

      //Energy label API
      if (data[1]) {
        if (data[1] === null) {
          bagApiMessage = 'Energy label api error'
        } else {
          energyLabel = data[1][0].labelLetter
          energyLabelIssueDate = data[1][0].registratiedatum.split('T')[0]

          elApiMessage = `Energy label: ${energyLabel} <br/> En. label issue date (registratiedatum): ${energyLabelIssueDate} <br/>`
        }
      }

      //WOZ data
      if (data[2]) {
        if (data[2] === null) {
          wozMessage = 'WOZ data retrieving error'
        } else {
          wozDate = data[2].split('\t')[0]
          wozValue = data[2].split('\t')[1].replace('.', '')

          wozMessage = `WOZ most recent value: ${wozValue} <br/>  WOZ date: ${wozDate}`
        }
      }

      //diplaying information on the website
      loader.style.display = 'none'
      // document.querySelector('#address-form').display = 'none'
      result.innerHTML += `${bagApiMessage} ${elApiMessage} ${wozMessage}`

      //build year, area, etc can be used here later for the calculations
    })
    .catch((error) => {
      console.error(error)
      loader.style.display = 'none'
      result.innerHTML = 'Error. Check if your address is correct.'
    })
})
