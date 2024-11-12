// import { build } from 'vite'
// import './style.scss'
import axios from 'axios'
import { startResultAnimation } from './js/resultAnimation.js'
import { createRecord } from './js/resultsHistory'
import { render } from './js/resultsHistory'


// register the service worker
// if ('serviceWorker' in navigator && 'SyncManager' in window) {
//   navigator.serviceWorker.register('../sw.js')
//   // navigator.serviceWorker.register('../sw.js')

//     .then((registration) => {
//       console.log('Service Worker registered with scope:', registration.scope);
//     }).catch((error) => {
//       console.error('Service Worker registration failed:', error);
//     });
// }

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
  });
}


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
//const sharingLabel = document.querySelector('#sharing-label')
//const sharingInput = document.querySelector('#sharing')
//let isSharing = false

//function hideSharing() {
//  sharingLabel.style.position = 'absolute'
//  sharingLabel.style.visibility = 'hidden'
//  sharingInput.style.position = 'absolute'
//  sharingInput.style.visibility = 'hidden'
//  isSharing = false
//}
//
//function setSharingVisible() {
//  sharingLabel.style.position = 'relative'
//  sharingLabel.style.visibility = 'visible'
//  sharingInput.style.position = 'relative'
//  sharingInput.style.visibility = 'visible'
//  isSharing = true
//}

//hideSharing()

//if (outdoorSpace) {
//  if (outdoorSpace.value === 'Shared') {
//    setSharingVisible()
//  } else {
//    hideSharing()
//  }
//
//  outdoorSpace.addEventListener('change', (e) => {
//    if (outdoorSpace.value === 'Shared') {
//      sharingLabel.style.position = 'relative'
//      sharingLabel.style.visibility = 'visible'
//      sharingInput.style.position = 'relative'
//      sharingInput.style.visibility = 'visible'
//      isSharing = true
//    } else {
//      sharingLabel.style.position = 'absolute'
//      sharingLabel.style.visibility = 'hidden'
//      sharingInput.style.position = 'absolute'
//      sharingInput.style.visibility = 'hidden'
//      isSharing = false
//    }
//  })
//}

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
//      sharing: document.getElementById('sharing').value,
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
//      document.getElementById('sharing').value = formData.sharing || '';
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
//  document.getElementById('sharing').value ='';
  document.getElementById('kitchen').value ='Bare/small';
  document.getElementById('bathroom').value = 'Bare/small';
  document.getElementById('periodSignedContract').value = 'July 2024 - December 2024';
//  hideSharing()
})

////////////////////////////////////////////////////////////////////
//form that sends and retrieves data from backend
/////////////////////////////////////////////////////////////////////

form.addEventListener('submit', (event) => {
  event.preventDefault();
  document.querySelector('.dummy-element').scrollIntoView();

  if (isRequesting) {
    return;
  }

  isRequesting = true;

  // Show loader and hide other elements
  loaderAndErrorContainer.style.visibility = 'visible';
  loaderAndErrorContainer.style.position = 'relative';
  loader.style.display = 'block';
  textInfo.style.display = 'none';
  addressForm.style.display = 'none';

  saveFormData();

  // Gather user inputs
  const postcode = document.querySelector('#postcode').value.replace(/\s+/g, '').toUpperCase();
  const houseNumber = document.querySelector('#house-number').value.replace(/\s+/g, '');
  const houseLetter = document.querySelector('#house-letter').value.replace(/\s+/g, '');
  const houseAddition = document.querySelector('#house-addition').value.replace(/\s+/g, '');
  const numberOfRooms = document.querySelector('#number-of-rooms').value;
  const outdoorSpaceValue = outdoorSpace.value;
  const kitchen = document.querySelector('#kitchen').value;
  const bathroom = document.querySelector('#bathroom').value;
  const periodSignedContract = document.querySelector('#periodSignedContract').value;

  const postParameters = {
    postcode,
    houseNumber,
    houseLetter,
    houseAddition,
    numberOfRooms,
    outdoorSpaceValue,
    kitchen,
    bathroom,
    periodSignedContract,
  };

  makeRequest(postParameters);
});

async function makeRequest(postParameters) {
  try {
    const response = await axios.post('/api/search', postParameters);
    handleSuccess(response.data);
  } catch (error) {
    console.error("Request failed:", error);

    loader.style.display = 'none';
    isRequesting = false;

    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      const registration = await navigator.serviceWorker.ready;
      await saveRequestToQueue('/api/search', 'POST', postParameters); // Queue the request
      await registration.sync.register('syncSearchRequest'); // Register for sync
      console.log("Background sync registered for failed request.");

      result.innerHTML = 'Request failed, background sync registered. The request will be retried when you are online.';
    } else {
      console.log("Background Sync not supported, try to resubmit when online.");
      result.innerHTML = 'Error. Check if your address is correct and try again.';
    }

    errorDisplay.innerHTML = "There was a problem with your request. Please check the details and try again.";
    backButton.classList.add('button-visible-error');
  }
}

function handleSuccess(data) {
  loader.style.display = 'none';
  isRequesting = false;

  if (data.errMessage) {
    // Show the error message
    errorDisplay.innerHTML = data.errMessage;
    backButton.classList.add('button-visible-error');
  } else {
    // Unhide elements and display results
    displayContainer.style.position = 'relative';
    displayContainer.style.visibility = 'visible';
    blur.style.visibility = 'visible';
    loaderAndErrorContainer.style.visibility = 'hidden';
    loaderAndErrorContainer.style.position = 'absolute';

    document.querySelector('.previous-requests-container').style.marginTop = '2em';

    // Display calculation results
    const resultElement = document.querySelector('#result');
    const resultText = document.querySelector('.contact-info');
    const result = Math.ceil(parseFloat(data.result));
    let resultValue = Number.isNaN(result) ? 'unknown' : `±${result} eur`;
    resultElement.innerText = resultValue;

    startResultAnimation();

    // Display custom messages based on result
    if (Number.isNaN(result)) {
      resultText.innerHTML = 'Try using our <a href="https://docs.google.com/spreadsheets/d/1F4OwREupVtWmzfWkL0Xk77ZkTwVRz1WCL6C-aAUHov0/edit?gid=1374918462#gid=1374918462" target="_blank">Calculator Spreadsheet</a>.';
    } else if (result > 808) {
      resultText.innerHTML = '<p>As the rent price is above the liberalization limit, your landlord has the right to set this price...</p>';
    }

    // Display address and other property details
    document.querySelector('#address').innerText = `Address: ${data.streetNameFromApi || ''} ${data.houseNumberFromApi || ''} ${data.houseLetterFromApi || ''} ${data.houseAdditionFromApi || ''} ${data.postcodeFromApi || ''}, ${data.city}`;

    document.querySelector('#area').innerText = `Total area: ${data.area} sq.m`;
    document.querySelector('#buildYear').innerText = `Build year: ${data.buildYear}`;
    document.querySelector('#woz').innerText = data.wozValue === 'Not found' ? 'WOZ value not found.' : `WOZ value of property: ${data.wozValue} eur`;
    document.querySelector('#energyLabel').innerText = `Energy label: ${data.energyLabel}`;
    document.querySelector('#energyIndex').innerText = `Energy index: ${data.energyIndex}`;
    document.querySelector('#monument').innerText = `Property is rijksmonument: ${data.isMonument}`;

    createRecord({ resultInRecord: `Result: ${resultValue}`, address: `${data.streetNameFromApi || ''} ${data.houseNumberFromApi || ''}`, area: `Total area: ${data.area} sq.m`, year: `Build year: ${data.buildYear}`, woz: data.wozValue, el: data.energyLabel, ei: data.energyIndex, monument: data.isMonument });
  }
}

