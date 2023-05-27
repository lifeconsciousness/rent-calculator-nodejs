// import { build } from 'vite'
import './style.scss'
import axios from 'axios'
import { startResultAnimation } from './js/resultAnimation.js'
import { createRecord } from './js/resultsHistory'
import { render } from './js/resultsHistory'

render()

//displaying/hiding input field depending on the value of other
const outdoorSpace = document.querySelector('#outdoor')
const sharingLabel = document.querySelector('#sharing-label')
const sharingInput = document.querySelector('#sharing')
let isSharing = false

if (outdoorSpace) {
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
}

// window.onpopstate = function (event) {
//   // Reload the page
//   location.reload()
// }

const backButton = document.querySelector('.back-button')
backButton.onclick = (e) => {
  location.reload()
}

////////////////////getting data from backend and displaying it

const landeContainer = document.querySelector('.loader-and-error-container')
const errorDisplay = document.querySelector('.error-display')
const loader = document.querySelector('.loader')
const result = document.querySelector('.result')
const form = document.querySelector('form')
const displayContainer = document.querySelector('.display-container')
const blur = document.querySelector('#blur')
const addressForm = document.querySelector('#address-form')
const textInfo = document.querySelector('.text-info')

//actions on form submit
let isRequesting = false

////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////

form.addEventListener('submit', (event) => {
  event.preventDefault()

  if (isRequesting) {
    return
  } else {
    isRequesting = true
    landeContainer.style.visibility = 'visible'
    landeContainer.style.position = 'relative'
    loader.style.display = 'block'
    textInfo.style.display = 'none'
    addressForm.style.display = 'none'

    //////////values from inputs
    //address
    let postcode = document.querySelector('#postcode').value.replace(/\s+/g, '')
    let houseNumber = document.querySelector('#house-number').value.replace(/\s+/g, '')
    let houseLetter = document.querySelector('#house-letter').value.replace(/\s+/g, '')
    let houseAddition = document.querySelector('#house-addition').value.replace(/\s+/g, '')

    //house parameters
    let numberOfRooms = document.querySelector('#number-of-rooms').value
    let outdoorSpaceValue = outdoorSpace.value
    let sharedPeople = document.querySelector('#sharing').value
    if (isSharing && sharedPeople === '') {
      sharedPeople = 1
    }
    let kitchen = document.querySelector('#kitchen').value
    let bathroom = document.querySelector('#bathroom').value

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

        loader.style.display = 'none'
        isRequesting = false

        //after getting the data hide form, other text, and show list with data about the house (calculations were based on this data:) and result
        //also display back button

        if (data.errMessage) {
          console.log(data.errMessage)
          errorDisplay.innerHTML = data.errMessage
          backButton.classList.add('button-visible-error')
        } else {
          displayContainer.style.position = 'relative'
          displayContainer.style.visibility = 'visible'
          blur.style.visibility = 'visible'
          landeContainer.style.visibility = 'hidden'
          landeContainer.style.position = 'absolute'

          document.querySelector('.previous-requests-container').style.marginTop = '2em'

          //displaying the result of calculations
          const resultElement = document.querySelector('#result')
          const resultText = document.querySelector('.contact-info')

          const result = Math.ceil(parseFloat(data.result))
          resultElement.innerText = `${result} eur`
          startResultAnimation()

          if (result > 800) {
            resultText.innerHTML = 'Landlord has a right to set this price, therefore it cannot be reduced.'
          }

          //displaying the address
          const streetName = data.streetNameFromApi !== undefined ? data.streetNameFromApi : ''
          const houseNumber = data.houseNumberFromApi !== undefined ? data.houseNumberFromApi : ''
          const houseLetter = data.houseLetterFromApi !== undefined ? data.houseLetterFromApi : ''
          const houseAddition = data.houseAdditionFromApi !== undefined ? data.houseAdditionFromApi : ''
          const housePostcode = data.postcodeFromApi !== undefined ? data.postcodeFromApi : ''
          const address = `${streetName} ${houseNumber} ${houseLetter} ${houseAddition} ${housePostcode}, ${data.city}`
          document.querySelector('#address').innerText = `Address: ${address}`

          const resultInRecord = `Result: ${result} eur`
          const area = `Total area: ${data.area} sq.m`
          const year = `Build year: ${data.buildYear}`
          const woz = `WOZ value of property: ${data.wozValue} eur`
          const el = `Energy label: ${data.energyLabel}`
          const ei = `Energy index: ${data.energyIndex}`
          const monument = `Property is rijksmonument: ${data.isMonument}`

          //displaying info about the property
          document.querySelector('#area').innerText = area
          document.querySelector('#buildYear').innerText = year
          document.querySelector('#woz').innerText = woz
          document.querySelector('#energyLabel').innerText = el
          document.querySelector('#energyIndex').innerText = ei
          document.querySelector('#monument').innerText = monument

          createRecord({ resultInRecord, address, area, year, woz, el, ei, monument })
        }
      })
      .catch((error) => {
        console.error(error)
        loader.style.display = 'none'
        result.innerHTML = 'Error. Check if your address is correct.'
        result.innerHTML += ``
      })
  }
})
