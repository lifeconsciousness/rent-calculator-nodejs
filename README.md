
# Rent calculator and house info lookup

Web-application that calculates the approximate max legal price of any property that is used for living in the Netherlands. User can look up different information about the house such as total area, build year, WOZ value, energy label and energy Index. The application scrapes data from multiple publicly open databases, shows it and calculates the result based on it.


## Features

- Calculates rent price in the Netherlands
- Displays information about the property
- Shows all previous requests with according info


## Demo

<a href='https://rentcalculator.onrender.com' target='_blank'>Live version🏠</a>

## How to run the application locally

Put .env in the root directory. Format:

`PORT = 10000`
`ENERGY_LABEL_API_KEY =` 
`BAG_API_KEY =`
`SPREADSHEET_ID =`
`GOOGLE_APPLICATION_CREDENTIALS =`
`NODE_ENV = production OR development`

`npm i` to install dependencies

`npm start` to start the server

`cd frontend && npm run dev` to start the frontend 

## Descirption of main javascript files

- server.js: server set up with express, has endpoint that takes address entered by the user and finds the data about it. Has multiple API requests.
- scrapeLogic.js: has functions that scrape websites listed below, to obtain information about the house.
- calculateRentPrice.js: sends API/scraped data to the spreadsheet that calculates the result
- main.js: makes an API call and displays the result in the frontend, has miscelaneous code for remembering last form input, loading animation, etc.

## Resources that were used to obtain data

- <a href="https://www.kadaster.nl/zakelijk/producten/adressen-en-gebouwen/bag-api-individuele-bevragingen">BAG API</a>
- <a href="https://epbdwebservices.rvo.nl/">Energy label API</a>
- <a href="https://www.ep-online.nl/Energylabel/Search">Energy index lookup website</a>
- <a href="https://www.wozwaardeloket.nl/">WOZ-waarde website</a>
- <a href="https://monumentenregister.cultureelerfgoed.nl/">Rijksmonumentenregister website</a>

## Screenshots
Main input form

[![screenshot1.png](https://i.postimg.cc/fb4jHN5j/screenshot1.png)](https://postimg.cc/Xr8CJtRp)

Results display

[![screenshot2.png](https://i.postimg.cc/K8RSFnPv/screenshot2.png)](https://postimg.cc/NKqPk2CW)

Records of previous requests

[![screenshot3.png](https://i.postimg.cc/xTGBK9QH/screenshot3.png)](https://postimg.cc/2V6HYRV8)




