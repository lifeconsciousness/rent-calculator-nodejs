const requestsContainer = document.querySelector('.all-requests-container')
let playAnimationAfterShortening = false

//keys for the local storage
const INDEX_LOCAL_STORAGE_KEY = 'indexKey'
const HISTORY_OBJECT_LOCAL_STORAGE_KEY = 'historyObjectKey'

//on load it either gets value from storage or assigns 0/empty array
let historyElementIndex = JSON.parse(localStorage.getItem(INDEX_LOCAL_STORAGE_KEY)) || 0
let historyElementsArray = JSON.parse(localStorage.getItem(HISTORY_OBJECT_LOCAL_STORAGE_KEY)) || []

//creates history record object, pushes it to the array
export function createRecord(request) {
  let currentTime = getTimeAndDate()

  let historyObject = createLinkHistoryObject(request, currentTime)
  historyElementsArray.push(historyObject)

  historyElementIndex++
  playAnimationAfterShortening = true

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
export function render() {
  clearElement(requestsContainer)

  if (historyElementsArray.length === 0) {
    requestsContainer.innerText = 'Here you are going to see all your previous requests'
  }

  for (let i = historyElementsArray.length - 1; i >= 0; i--) {
    let accordion = document.createElement('div')
    accordion.classList.add('accordion')
    accordion.addEventListener('click', (e) => {
      accordion.classList.toggle('active')
    })

    requestsContainer.appendChild(accordion)

    let container = document.createElement('div')
    container.classList.add('accordion-head')
    if (playAnimationAfterShortening) {
      container.classList.add('container-animation')
      playAnimationAfterShortening = false
    }
    accordion.appendChild(container)

    let indicatorAndAddress = document.createElement('div')
    indicatorAndAddress.classList.add('indicator-and-address')
    container.appendChild(indicatorAndAddress)

    const indicator = document.createElement('div')
    indicator.classList.add('accordion-indicator')
    indicatorAndAddress.appendChild(indicator)

    let display = document.createElement('div')
    display.classList.add('address-in-accordion')
    display.innerText = historyElementsArray[i].mainRequest.address
    indicatorAndAddress.appendChild(display)

    let dateAndDelete = document.createElement('div')
    dateAndDelete.classList.add('date-and-delete')
    container.appendChild(dateAndDelete)

    // let deleteIcon = document.createElement('button')
    // deleteIcon.classList.add('trashBin')
    // deleteIcon.innerText = 'X'
    let deleteIcon = document.createElement('img')
    deleteIcon.classList.add('trashBin')
    // deleteIcon.src = 'img/trash.png'
    deleteIcon.src = 'trash.png'
    deleteIcon.dataset.index = historyElementsArray[i].id
    deleteIcon.addEventListener('click', (e) => {
      deleteElement(e)
    })

    dateAndDelete.appendChild(deleteIcon)

    let date = document.createElement('p')
    date.classList.add('date')
    date.innerText = historyElementsArray[i].time
    dateAndDelete.appendChild(date)

    let content = document.createElement('div')
    content.classList.add('content')
    content.innerHTML = `<br />
    ${historyElementsArray[i].mainRequest.resultInRecord}<br />
    ${historyElementsArray[i].mainRequest.area}<br />
    ${historyElementsArray[i].mainRequest.year}<br />
    ${historyElementsArray[i].mainRequest.woz}<br />
    ${historyElementsArray[i].mainRequest.el}<br />
    ${historyElementsArray[i].mainRequest.ei}<br />
    ${historyElementsArray[i].mainRequest.monument}<br />
    &nbsp;`
    accordion.appendChild(content)
  }

  //accordion content dropdown
  document.querySelectorAll('.accordion-head').forEach((button) => {
    button.addEventListener('click', (e) => {
      //prevent animation when trash bin is clicked
      if (e.target.classList.contains('trashBin')) {
        return
      } else {
        const accordionContent = button.nextElementSibling
        button.classList.toggle('active')
        if (button.classList.contains('active')) {
          accordionContent.style.maxHeight = accordionContent.scrollHeight + 1000 + 'px'
          accordionContent.style.overflow = 'visible'
        } else {
          accordionContent.style.maxHeight = 0
          accordionContent.style.overflow = 'hidden'
        }
      }
    })
  })
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

    let parentalContainer = upTo(event.target, 'accordion-head')
    parentalContainer.classList.add('delete-animation')

    deleteAnimationDelay(elementToDelete)
  }
}

function deleteAnimationDelay(delEl) {
  setTimeout(function () {
    deleteAfterDelay(delEl)
  }, 650)
}
function deleteAfterDelay(elementToDelete) {
  historyElementsArray = historyElementsArray.filter((element) => element.id != elementToDelete)
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

render()

////remove arrow when accordion is visible

const arrowObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      document.querySelector('.arrow-down').classList.add('fadeIn')
    } else {
      document.querySelector('.arrow-down').classList.remove('fadeIn')
      document.querySelector('.arrow-down').classList.add('.arrow-down')
    }
  })
})

arrowObserver.observe(document.querySelector('.all-requests-container'))
