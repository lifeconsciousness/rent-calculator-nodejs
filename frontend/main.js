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
      console.log(data)

      let area = null
      let buildYear = null
      let energyLabel = null
      let energyLabelIssueDate = null

      let bagApiMessage = ``
      let elApiMessage = ``

      if (data[0] === null) {
        bagApiMessage = 'Bag api error'
      } else {
        area =
          data[0]._embedded.adressen[0]._embedded.adresseerbaarObject
            .verblijfsobject.verblijfsobject.oppervlakte

        bagApiMessage = `House area: ${area} <br/> Build year: `
      }

      display.innerHTML = `${bagApiMessage} ${elApiMessage}`
    })
    .catch((error) => {
      console.error(error)
    })
})
