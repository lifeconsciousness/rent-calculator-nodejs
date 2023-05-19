// import { build } from 'vite'
import './style.scss'
import axios from 'axios'

/*

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
let isRequesting = false

//actions on submit
form.addEventListener('submit', (event) => {
  event.preventDefault()

  if (isRequesting) {
    return
  } else {
    isRequesting = true
    loader.style.display = 'block'
    loader.style.opacity = 1
    result.innerHTML = ''

    //////////values from inputs
    //6227 SP 27 A02
    //address
    let postcode = document.querySelector('#postcode').value.replace(/\s+/g, '')
    let houseNumber = document.querySelector('#house-number').value.replace(/\s+/g, '')
    let houseLetter = document.querySelector('#house-letter').value.replace(/\s+/g, '')
    let houseAddition = document.querySelector('#house-addition').value.replace(/\s+/g, '')
    // let postcode = document.querySelector('#postcode').value
    // let houseNumber = document.querySelector('#house-number').value
    // let houseLetter = document.querySelector('#house-letter').value
    // let houseAddition = document.querySelector('#house-addition').value

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
          result.innerHTML += data.errMessage
        } else {
          const area = `Area: ${data.area}`
          const buildYear = `Area: ${data.buildYear} <br/>`

          // result.innerHTML += area
          // result.innerHTML += buildYear
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

*/

//setting the overflow to visible when animation ends

const typingElement = document.querySelector('.typing')
const price = document.querySelector('.price')

// Get the amount of charaters
const textWidth = typingElement.innerText.length - 4
typingElement.style.width = `${textWidth}ch`
// console.log(textWidth)

typingElement.addEventListener('animationend', () => {
  typingElement.style.overflow = 'visible'
  typingElement.style.border = 'none'
  price.style.animation = 'hover-delay .6s forwards'
})
