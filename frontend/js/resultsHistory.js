const linksContainer = document.querySelector('.all-links-container')
let playAnimationAfterShortening = false

//keys for the local storage
const INDEX_LOCAL_STORAGE_KEY = 'indexKey'
const HISTORY_OBJECT_LOCAL_STORAGE_KEY = 'historyObjectKey'

//onload it either gets value from storage or assigns 0/empty array
let historyElementIndex = JSON.parse(localStorage.getItem(INDEX_LOCAL_STORAGE_KEY)) || 0
let historyElementsArray = JSON.parse(localStorage.getItem(HISTORY_OBJECT_LOCAL_STORAGE_KEY)) || []

//creates history record object, pushes it to the array
function createRecord(request) {
  let currentTime = getTimeAndDate()

  let historyObject = createLinkHistoryObject(request, currentTime)
  historyElementsArray.push(historyObject)

  historyElementIndex++
  //   buttonCanCopy = true
  playAnimationAfterShortening = true

  //   checkButtonState()
  saveAndRender()
}

function getTimeAndDate() {
  let dateObj = new Date()
  let currentTime
  let zeroBeforeMinutes
  let zeroBeforeMonths
  if (dateObj.getMinutes() <= 9) {
    zeroBeforeMinutes = ':0'
  } else {
    zeroBeforeMinutes = ':'
  }
  if (dateObj.getMonth() <= 9) {
    zeroBeforeMonths = '0'
  } else {
    zeroBeforeMonths = ''
  }

  currentTime = `${dateObj.getHours()}${zeroBeforeMinutes}${dateObj.getMinutes()}\n${dateObj.getDate()}.${zeroBeforeMonths}${
    dateObj.getMonth() + 1
  }.${dateObj.getFullYear().toString().substring(2)}`

  return currentTime
}

//returns an object with the unique id, old link, and shortened one
function createLinkHistoryObject(request, currentTime) {
  return {
    id: historyElementIndex,
    mainRequest: request,
    time: currentTime,
  }
}

function saveAndRender() {
  save()
  render()
}

function save() {
  localStorage.setItem(INDEX_LOCAL_STORAGE_KEY, historyElementIndex)
  localStorage.setItem(HISTORY_OBJECT_LOCAL_STORAGE_KEY, JSON.stringify(historyElementsArray))
}

//first the function clears links container, then creates DOM elements and assings array objects values to them
function render() {
  clearElement(linksContainer)
  for (let i = historyElementsArray.length - 1; i >= 0; i--) {
    let container = document.createElement('div')
    container.classList.add('prev-link-and-result')
    if (playAnimationAfterShortening) {
      container.classList.add('container-animation')
      playAnimationAfterShortening = false
    }
    linksContainer.appendChild(container)

    let bothLinks = document.createElement('div')
    bothLinks.classList.add('bothLinks')
    container.appendChild(bothLinks)

    let display = document.createElement('div')
    display.classList.add('prev-link')
    display.innerText = historyElementsArray[i].mainRequest
    // display.addEventListener('click', copyText)
    // display.addEventListener('touchend', copyText)
    bothLinks.appendChild(display)

    // let resLink = document.createElement('div')
    // resLink.classList.add('result-link')
    // resLink.innerText = historyElementsArray[i].shortLink
    // resLink.addEventListener('click', copyText)
    // resLink.addEventListener('touchend', copyText)
    // bothLinks.appendChild(resLink)

    let dateAndDelete = document.createElement('div')
    dateAndDelete.classList.add('date-and-delete')
    container.appendChild(dateAndDelete)

    let deleteIcon = document.createElement('img')
    deleteIcon.classList.add('trashBin')
    deleteIcon.src = './img/trash.png'
    deleteIcon.dataset.index = historyElementsArray[i].id
    deleteIcon.addEventListener('click', deleteElement)
    dateAndDelete.appendChild(deleteIcon)

    let date = document.createElement('p')
    date.classList.add('date')
    date.innerText = historyElementsArray[i].time
    dateAndDelete.appendChild(date)
  }
}

function clearElement(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild)
  }
}

//make render function not to render element that was deleted
function deleteElement(event) {
  if (event.target.classList.contains('trashBin')) {
    let elementToDelete = event.target.dataset.index

    let parentalContainer = upTo(event.target, 'prev-link-and-result')
    parentalContainer.classList.add('delete-animation')

    deleteAnimationDelay(elementToDelete)
  }
}

function deleteAnimationDelay(delEl) {
  setTimeout(function () {
    deleteAfterDelay(delEl)
  }, 650)
  // timeout = setTimeout(function () {
  //   deleteAfterDelay(delEl)
  // }, 650)
}
function deleteAfterDelay(elementToDelete) {
  historyElementsArray = historyElementsArray.filter((element) => element.id != elementToDelete)
  // message.innerHTML = 'Element deleted'
  // returnPreviousMesage()
  saveAndRender()
}

//searches for the DOM element higher in ierarchy
function upTo(el, tagName) {
  while (el && el.parentNode) {
    el = el.parentNode

    if (el.classList.contains(tagName)) {
      return el
    }
  }
  return null
}

// createRecord('abaibabb')

/////////////////accordion

const accordions = document.querySelectorAll('.accordion')

for (let i = 0; i < accordions.length; i++) {
  accordions[i].addEventListener('click', (e) => {
    accordions[i].classList.toggle('active')
  })
}
