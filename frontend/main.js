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
  // if (isSharing) {
  // }
  const kitchen = document.querySelector('#kitchen').value
  const bathroom = document.querySelector('#bathroom').value

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

      if ((data.length = 1)) {
        result.innerHTML += data[0]
      }

      loader.style.display = 'none'
      // document.querySelector('#address-form').display = 'none'

      result.innerHTML += ``
    })
    .catch((error) => {
      console.error(error)
      loader.style.display = 'none'
      result.innerHTML = 'Error. Check if your address is correct.'
      result.innerHTML += ``
    })
})
