// import { build } from 'vite'
import './style.scss'
import axios from 'axios'
import { startResultAnimation } from './js/resultAnimation.js'

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

window.onpopstate = function (event) {
  // Reload the page
  location.reload()
}

const backButton = document.querySelector('.back-button')
backButton.onclick = (e) => {
  location.reload()
}

////////////////////getting data from backend and displaying it

// startResultAnimation()

const landeContainer = document.querySelector('.loader-and-error-container')
const errorDisplay = document.querySelector('.error-display')
const loader = document.querySelector('.loader')
const result = document.querySelector('.result')
const form = document.querySelector('form')
const displayContainer = document.querySelector('.display-container')
const blur = document.querySelector('#blur')
const addressForm = document.querySelector('#address-form')
const textInfo = document.querySelector('.text-info')

// startResultAnimation()

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
          blur.style.visibility = 'visible'
          displayContainer.style.visibility = 'visible'
          landeContainer.style.visibility = 'hidden'
          landeContainer.style.position = 'absolute'

          //displaying the result of calculations
          const result = Math.ceil(parseFloat(data.result))
          const resultElement = document.querySelector('#result')
          // document.querySelector('#result').innerText = `${result} eur`
          console.log(resultElement)
          resultElement.innerText = `${result} eur`
          startResultAnimation()

          //displaying the address
          const streetName = data.streetNameFromApi !== undefined ? data.streetNameFromApi : ''
          const houseNumber = data.houseNumberFromApi !== undefined ? data.houseNumberFromApi : ''
          const houseLetter = data.houseLetterFromApi !== undefined ? data.houseLetterFromApi : ''
          const houseAddition = data.houseAdditionFromApi !== undefined ? data.houseAdditionFromApi : ''
          const housePostcode = data.postcodeFromApi !== undefined ? data.postcodeFromApi : ''
          document.querySelector(
            '#address'
          ).innerText = `Address: ${streetName} ${houseNumber} ${houseLetter} ${houseAddition} ${housePostcode}, ${data.city}`

          //displaying info about the property
          document.querySelector('#area').innerText = `Total area: ${data.area}`
          document.querySelector('#buildYear').innerText = `Build year: ${data.buildYear}`
          document.querySelector('#woz').innerText = `WOZ value of property: ${data.wozValue}`
          document.querySelector('#energyLabel').innerText = `Energy label: ${data.energyLabel}`
          document.querySelector('#energyIndex').innerText = `Energy index: ${data.energyIndex}`
          document.querySelector('#monument').innerText = `Property is rijksmonument: ${data.isMonument}`
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
