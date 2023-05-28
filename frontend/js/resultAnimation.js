///////////////////////////////////////manipulating the result string animation
export function startResultAnimation() {
  const rentPrice = document.querySelector('.rent-price')
  const maxLegalPrice = document.querySelector('.max-legal-price')
  const price = document.querySelector('.price')

  let isSmallScreen = screen.width <= 415 ? true : false

  // Get the amount of charaters
  let textWidth
  if (!isSmallScreen) {
    rentPrice.classList.add('typing')
    maxLegalPrice.classList.remove('typing')
    maxLegalPrice.classList.remove('typing-price')

    textWidth = rentPrice.innerText.length - 4

    rentPrice.style.width = `${textWidth}ch`
    // price.style.opacity = '1 !important'

    //old eventlistener
    rentPrice.addEventListener('animationend', () => {
      rentPrice.style.overflow = 'visible'
      rentPrice.style.border = 'none'
      price.style.animation = 'hover-delay .8s forwards'
    })
  } else {
    rentPrice.classList.remove('typing')
    maxLegalPrice.classList.add('typing')
    // price.classList.add('typing-price')
    price.style.marginLeft = '200px'
    price.style.margin = '0 auto'
    price.style.opacity = '0'

    textWidth = maxLegalPrice.innerText.length - 4

    maxLegalPrice.style.width = `${textWidth}ch`

    maxLegalPrice.addEventListener('animationend', () => {
      if (!isSmallScreen) {
        maxLegalPrice.style.overflow = 'visible'
        maxLegalPrice.style.border = 'none'
        price.style.animation = 'hover-delay .8s forwards'
      } else {
        maxLegalPrice.style.border = 'none'
        writePrice()
      }
    })

    function writePrice() {
      price.classList.add('typing-price')

      price.addEventListener('animationend', () => {
        price.style.overflow = 'visible'
        price.style.border = 'none'

        price.style.animation = 'hover-delay .8s forwards'
      })
    }
  }
}

// startResultAnimation()
