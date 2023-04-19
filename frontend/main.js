import './style.scss'
import axios from 'axios'

const display = document.querySelector('.display')
const form = document.querySelector('form')

form.addEventListener('submit', (event) => {
  event.preventDefault()

  const postcode = document.querySelector('#postcode').value
  const houseNumber = document.querySelector('#house-number').value
  const houseLetter = document.querySelector('#house-letter').value

  axios
    .post('/api/search', { postcode, houseNumber, houseLetter })
    .then((response) => {
      const data = response.data
      // Display the retrieved data to the user
      display.innerText = data
      console.log(data)
    })
    .catch((error) => {
      console.error(error)
    })
})
