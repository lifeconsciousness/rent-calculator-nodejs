// import { build } from 'vite'
// import './style.scss'
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
loadFormData()

//displaying/hiding input field whether outdoor space is shared or not
const outdoorSpace = document.querySelector('#outdoor')
const sharingLabel = document.querySelector('#sharing-label')
const sharingInput = document.querySelector('#sharing')
let isSharing = false

function hideSharing() {
  sharingLabel.style.position = 'absolute'
  sharingLabel.style.visibility = 'hidden'
  sharingInput.style.position = 'absolute'
  sharingInput.style.visibility = 'hidden'
  isSharing = false
}

function setSharingVisible() {
  sharingLabel.style.position = 'relative'
  sharingLabel.style.visibility = 'visible'
  sharingInput.style.position = 'relative'
  sharingInput.style.visibility = 'visible'
  isSharing = true
}

if (outdoorSpace) {
  if (outdoorSpace.value === 'Shared') {
    setSharingVisible()
  } else {
    hideSharing()
  }

  outdoorSpace.addEventListener('change', (e) => {
    if (outdoorSpace.value === 'Shared') {
      sharingLabel.style.position = 'relative'
      sharingLabel.style.visibility = 'visible'
      sharingInput.style.position = 'relative'
      sharingInput.style.visibility = 'visible'
      isSharing = true
    } else {
      sharingLabel.style.position = 'absolute'
      sharingLabel.style.visibility = 'hidden'
      sharingInput.style.position = 'absolute'
      sharingInput.style.visibility = 'hidden'
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
const loaderAndErrorContainer = document.querySelector('.loader-and-error-container')
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

function saveFormData() {
  const formData = {
      postcode: document.getElementById('postcode').value,
      houseNumber: document.getElementById('house-number').value,
      houseLetter: document.getElementById('house-letter').value,
      houseAddition: document.getElementById('house-addition').value,

      numberOfRooms: document.getElementById('number-of-rooms').value,
      outdoor: document.getElementById('outdoor').value,
      sharing: document.getElementById('sharing').value,
      kitchen: document.getElementById('kitchen').value,
      bathroom: document.getElementById('bathroom').value,
      periodSignedContract: document.getElementById('periodSignedContract').value,

  };
  localStorage.setItem('formData', JSON.stringify(formData));
}

// Function to load form data from localStorage
function loadFormData() {
  const formData = JSON.parse(localStorage.getItem('formData'));
  if (formData) {
      document.getElementById('postcode').value = formData.postcode || '';
      document.getElementById('house-number').value = formData.houseNumber || '';
      document.getElementById('house-letter').value = formData.houseLetter || '';
      document.getElementById('house-addition').value = formData.houseAddition || '';

      document.getElementById('number-of-rooms').value = formData.numberOfRooms || '';
      document.getElementById('outdoor').value = formData.outdoor || 'No';
      document.getElementById('sharing').value = formData.sharing || '';
      document.getElementById('kitchen').value = formData.kitchen || 'Bare/small';
      document.getElementById('bathroom').value = formData.bathroom || 'Bare/small';
      document.getElementById('periodSignedContract').value = formData.periodSignedContract || 'July 2024 - December 2024';
  }
}

document.getElementById('clear-form-button').addEventListener('click', () => {
  document.getElementById('postcode').value = '';
  document.getElementById('house-number').value = '';
  document.getElementById('house-letter').value = '';
  document.getElementById('house-addition').value = '';

  document.getElementById('number-of-rooms').value = '';
  document.getElementById('outdoor').value ='No';
  document.getElementById('sharing').value ='';
  document.getElementById('kitchen').value ='Bare/small';
  document.getElementById('bathroom').value = 'Bare/small';
  document.getElementById('periodSignedContract').value = 'July 2024 - December 2024';
  hideSharing()
})

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
    loaderAndErrorContainer.style.visibility = 'visible'
    loaderAndErrorContainer.style.position = 'relative'
    loader.style.display = 'block'
    textInfo.style.display = 'none'
    addressForm.style.display = 'none'
    saveFormData()

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
      sharedPeople = 0
    }
    const kitchen = document.querySelector('#kitchen').value
    const bathroom = document.querySelector('#bathroom').value
    const periodSignedContract = document.querySelector('#periodSignedContract').value

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
          periodSignedContract,
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
          periodSignedContract,
        }

    axios
      .post('/api/search', postParameters)
      .then((response) => {
        const data = response.data
        console.log("Data received in frontend: " + data)

        loader.style.display = 'none'
        isRequesting = false

        if (data.errMessage) {
          //showing the error
          console.log("Error message received from backend: " + data.errMessage)
          errorDisplay.innerHTML = data.errMessage
          backButton.classList.add('button-visible-error')
        } else {
          //unhiding elements that show the result
          displayContainer.style.position = 'relative'
          displayContainer.style.visibility = 'visible'
          blur.style.visibility = 'visible'
          loaderAndErrorContainer.style.visibility = 'hidden'
          loaderAndErrorContainer.style.position = 'absolute'

          document.querySelector('.previous-requests-container').style.marginTop = '2em'

          //displaying the result of calculations
          const resultElement = document.querySelector('#result')
          const resultText = document.querySelector('.contact-info')

          const result = Math.ceil(parseFloat(data.result))
          let resultValue
          if (Number.isNaN(result)) {
            resultValue = `unknown`
          } else {
            resultValue = `±${result} eur`
          }
          resultElement.innerText = resultValue

          //circle the result
          startResultAnimation()

          //displaying different messages depending on the result number
          if (Number.isNaN(result)) {
            resultText.innerHTML =
              'Try searching the same address again. If second request is not successful, try using our <a href="https://1drv.ms/x/s!AhS9UiEeuDTxgoA79X98W0bwNUdOFA?e=LwPAgd" target="_blank">Calculator Spreadsheet</a>'
          }
          if (result > 808) {
            // resultText.innerHTML =
            //   'Landlord has a right to set this price, therefore it cannot be reduced. For more details contact <a href="mailto:info@rentbuster.nl">info@rentbuster.nl</a>'
            resultText.innerHTML =
              '<p>As the rent price is above the liberalization limit of 808 euro (2023) or 879 euro (July 2024) or 1150 euro (for contracts signed after July 1 2024), whatever price your landlord makes you pay now is considered to be (legally) reasonable. There is not much you can do about this as any Huurcommissie case will likely be unsuccessful. If you are very close to the limit for the year you moved in (+/- 100 euro) the calculator may be inaccurate enough that I need to take a closer look to be sure (email me <a href="mailto:info@rentbuster.nl">info@rentbuster.nl</a>) If the calculated price is above 1150 euro, your home is 100sqm+ with an energy label better than A</p>'
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
              'WOZ value was not found. Try refreshing the page and searching again. If not successful, contact <a href="mailto:info@rentbuster.nl">info@rentbuster.nl</a>'
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
