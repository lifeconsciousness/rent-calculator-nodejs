// import { build } from 'vite'
import './style.scss'
import axios from 'axios'
import { startResultAnimation } from './js/resultAnimation.js'
import { createRecord } from './js/resultsHistory'
import { render } from './js/resultsHistory'

//modal window
const isFirstTimeModalWindow = localStorage.getItem('isFirstTimeModalWindow') || 'first'

if (isFirstTimeModalWindow === 'first') {
  document.querySelector('.modal-guide').style.opacity = '1'
  const buttons = Array.from(document.querySelectorAll('.close-modal'))
  document.body.style.overflowY = 'hidden'
  buttons.map((button) => {
    button.addEventListener('click', (e) => {
      document.querySelector('.modal-guide').style.display = 'none'
      localStorage.setItem('isFirstTimeModalWindow', 'not first')
      document.body.style.overflowY = 'visible'
    })
  })
} else {
  document.querySelector('.modal-guide').style.display = 'none'
  document.body.style.overflowY = 'visible'
}

//render the list of previous requests
render()

//displaying/hiding input field whether outdoor space is shared or not
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

//button to refresh the page and return back to form
const backButton = document.querySelector('.back-button')
backButton.onclick = (e) => {
  location.reload()
}

//different elements on the page
const landeContainer = document.querySelector('.loader-and-error-container')
const errorDisplay = document.querySelector('.error-display')
const loader = document.querySelector('.loader')
const result = document.querySelector('.result')
const form = document.querySelector('form')
const displayContainer = document.querySelector('.display-container')
const blur = document.querySelector('.blur')
const addressForm = document.querySelector('#address-form')
const textInfo = document.querySelector('.text-info')

//actions on form submit
let isRequesting = false

// for testing loader
// landeContainer.style.visibility = 'visible'
// landeContainer.style.position = 'relative'
// loader.style.display = 'block'
// blurLoader.style.visibility = 'visible'

////////////////////////////////////////////////////////////////////
//form that sends and retrieves data from backend
/////////////////////////////////////////////////////////////////////

form.addEventListener('submit', (event) => {
  event.preventDefault()
  // document.querySelector('.rentbuster-logo').scrollIntoView()
  document.querySelector('.dummy-element').scrollIntoView()

  if (isRequesting) {
    return
  } else {
    isRequesting = true
    //switch the elements on the page to loader
    landeContainer.style.visibility = 'visible'
    landeContainer.style.position = 'relative'
    loader.style.display = 'block'
    textInfo.style.display = 'none'
    addressForm.style.display = 'none'

    //user inputs

    //address
    const postcode = document.querySelector('#postcode').value.replace(/\s+/g, '').toUpperCase()
    const houseNumber = document.querySelector('#house-number').value.replace(/\s+/g, '')
    const houseLetter = document.querySelector('#house-letter').value.replace(/\s+/g, '')
    const houseAddition = document.querySelector('#house-addition').value.replace(/\s+/g, '')

    //house parameters
    const numberOfRooms = document.querySelector('#number-of-rooms').value
    const outdoorSpaceValue = outdoorSpace.value
    let sharedPeople = document.querySelector('#sharing').value
    if (isSharing && sharedPeople === '') {
      sharedPeople = 1
    }
    const kitchen = document.querySelector('#kitchen').value
    const bathroom = document.querySelector('#bathroom').value

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

        if (data.errMessage) {
          //showing the error
          console.log(data.errMessage)
          errorDisplay.innerHTML = data.errMessage
          backButton.classList.add('button-visible-error')
        } else {
          //unhiding elements that show the result
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
          let resultValue
          if (Number.isNaN(result)) {
            resultValue = `unknown`
          } else {
            resultValue = `${result} eur`
          }
          resultElement.innerText = resultValue

          //circle the result
          startResultAnimation()

          //displaying different messages depending on the result number
          if (Number.isNaN(result)) {
            resultText.innerHTML =
              'One or multiple parameters of the property were not found, hence the rent price cannot be calculated. Contact <a href="mailto:info@rentbuster.nl">info@rentbuster.nl</a>'
          }
          if (result > 800) {
            resultText.innerHTML =
              'Landlord has a right to set this price, therefore it cannot be reduced. For more details contact <a href="mailto:info@rentbuster.nl">info@rentbuster.nl</a>'
          }

          //displaying the address
          const streetName = data.streetNameFromApi !== undefined ? data.streetNameFromApi : ''
          const houseNumber = data.houseNumberFromApi !== undefined ? data.houseNumberFromApi : ''
          const houseLetter = data.houseLetterFromApi !== undefined ? data.houseLetterFromApi : ''
          const houseAddition = data.houseAdditionFromApi !== undefined ? data.houseAdditionFromApi : ''
          const housePostcode = data.postcodeFromApi !== undefined ? data.postcodeFromApi : ''
          const address = `${streetName} ${houseNumber} ${houseLetter} ${houseAddition} ${housePostcode}, ${data.city}`
          document.querySelector('#address').innerText = `Address: ${address}`

          //displaying all other data about the house
          const resultInRecord = `Result: ${resultValue}`
          const area = `Total area: ${data.area} sq.m`
          const year = `Build year: ${data.buildYear}`
          let woz
          if (data.wozValue === 'Not found') {
            woz = `WOZ value of property: ${data.wozValue}`
            resultText.innerHTML =
              'WOZ value was not found. Contact <a href="mailto:info@rentbuster.nl">info@rentbuster.nl</a>'
          } else {
            woz = `WOZ value of property: ${data.wozValue} eur`
          }
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

          //record in previous requests section
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
