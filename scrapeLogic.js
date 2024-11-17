const { isNumber } = require('puppeteer');
const puppeteer = require('puppeteer');
require('dotenv').config();

async function scrapeWozAndMonument(address, adresseerbaarId, streetNameFromApi, houseNumberFromApi, houseLetterFromApi, houseAdditionFromApi, postcodeFromApi) {
  // const browser = await puppeteer.launch();

  const browser = await puppeteer.launch({
    headless: true, // Optional, to see the browser in action
    userDataDir: './user_data', // Directory where session data is stored
    args: ['--no-sandbox', '--disable-setuid-sandbox'] // Add any other desired launch arguments
  });

  try {
    const wozValuePromise = async () => {
      const page = await browser.newPage();

      await page.setViewport({ width: 800, height: 600, deviceScaleFactor: 1 });
      await page.setRequestInterception(true);

      await page.evaluateOnNewDocument(() => {
        HTMLCanvasElement.prototype.getContext = () => null;  // Disable canvas rendering
      });

      page.on('request', (request) => {
          if (['image', 'stylesheet', 'font', 'media'].indexOf(request.resourceType()) !== -1) {
              request.abort();
          } else {
              request.continue();
          }
      });      

      await page.goto('https://www.wozwaardeloket.nl/', { waitUntil: 'domcontentloaded' });
      // await page.goto('https://www.wozwaardeloket.nl/', { waitUntil: 'load' });
      // await page.goto('https://www.wozwaardeloket.nl/');

      await page.waitForSelector('#kaart-bekijken-btn');
      await page.click('#kaart-bekijken-btn');

      // const input = `${streetNameFromApi} ${houseNumberFromApi}, ${postcodeFromApi}`
      const input = `${postcodeFromApi} ${houseNumberFromApi}`


      // houseAdditionFromApi = ' ' + houseAdditionFromApi || ''
      houseAdditionFromApi = houseAdditionFromApi || ''
      if (houseAdditionFromApi) ' ' + houseAdditionFromApi

      houseLetterFromApi = houseLetterFromApi || ''

      let fullAddress;
      let fullAddressAnother;

      if(isNumber(houseAdditionFromApi)){
        fullAddress = `${streetNameFromApi} ${houseNumberFromApi}${houseLetterFromApi}-${houseAdditionFromApi}, ${postcodeFromApi}`
        fullAddressAnother = `${streetNameFromApi} ${houseNumberFromApi}${houseLetterFromApi}${houseAdditionFromApi}, ${postcodeFromApi}`
      } else {
        fullAddress = `${streetNameFromApi} ${houseNumberFromApi}${houseLetterFromApi}${houseAdditionFromApi}, ${postcodeFromApi}`
        fullAddressAnother = `${streetNameFromApi} ${houseNumberFromApi}${houseLetterFromApi}-${houseAdditionFromApi}, ${postcodeFromApi}`
      }

      console.log("FULL address: " + fullAddress)

      // console.log("INput:" + input)
      console.log("Full address from API: " + fullAddress)

      await page.type('#ggcSearchInput', fullAddress);

      // LOOP THROUGH THE LIST AND MATCH THE RESULT USING .CONTAINS

      await page.waitForSelector('#ggcSuggestionList');


      // await page.waitForSelector('#resultaat-suggest-show-all');
      const showAllButtonSelector = '#resultaat-suggest-show-all';

      try {
        await page.waitForSelector(showAllButtonSelector, { timeout: 1000 }); 

        console.log('"Show All" button found, proceeding...');
        await page.click(showAllButtonSelector);
      } catch (error) {
          // console.log('"Show All" button not found, continuing without error.');
      }


      // click on "see all" button if it's present
      try {
        await page.waitForSelector(showAllButtonSelector, { timeout: 1000 }); 

        console.log('"Show All" button found, proceeding...');
        await page.click(showAllButtonSelector);
      } catch (error) {
          // console.log('"Show All" button not found, continuing without error.');
      }

      // Find all buttons inside #ggcSuggestionList and click the one that matches `fullAddress`
      const buttonFound1 = await page.evaluate((fullAddress, fullAddressAnother) => {
          const container = document.querySelector('#ggcSuggestionList');
          if (!container) return false;
  
          const buttons = container.querySelectorAll('button');  // Get all buttons in the container
  
          for (let button of buttons) {
              if (button.innerText.includes(fullAddress) || button.innerText.includes(fullAddressAnother)) {
              // if (button.innerText.includes(fullAddress)) {

                  button.click();  // Click the button if it contains the target text
                  return true;  
              }
          }
          return false;  // Return false if no matching button was found
      }, fullAddress);
  
      if (buttonFound1) {
          console.log(`Button with text "${fullAddress}" was clicked.`);
      } else {
        // if wasn't able to match, select first element in the list
        await page.waitForSelector('#ggcSuggestionList-0');
        await page.click('#ggcSuggestionList-0');
      }

      // await page.waitForSelector('.waarden-row')
      await page.waitForSelector('.waarden-row', { visible: false });
      const wozValue = await page.$eval('.waarden-row', el => el.innerText);
      await page.close();

      return wozValue.split('\t')[1].replace(/\./g, '').replace(' euro', '') || 'Not found';
    };


    function isNumber(value) {
      return /^\d+$/.test(value); 
    }

    const energyIndexPromise = async (adresseerbaarId) => {
      // return 'Not found'

      const page = await browser.newPage();
      await page.setViewport({ width: 800, height: 600, deviceScaleFactor: 1 });
      
      await page.setRequestInterception(true);

      page.on('request', (request) => {
          if (['image', 'stylesheet', 'font'].indexOf(request.resourceType()) !== -1) {
              request.abort();
          } else {
              request.continue();
          }
      });
    
      // await page.goto('https://www.ep-online.nl/Energylabel/Search', { waitUntil: 'domcontentloaded' });
      await page.goto('https://www.ep-online.nl/Energylabel/Search', { waitUntil: 'load' });

      
  
      // Type into search field and click the search button
      await page.waitForSelector('#SearchValue');
      await page.type('#SearchValue', adresseerbaarId);
  
      await page.waitForSelector('#searchButton');
      await page.click('#searchButton');
  
      // Wait for the result selector with a 2-second timeout
      const elementExists = await page.waitForSelector('.se-result-item-nta', { timeout: 2000 }).catch(() => null);
  
      let energyIndex;
      if (elementExists) {
        // Extract and parse the energy index text
        const container = await page.$eval('.se-result-item-nta', el => el.innerText);

        const match = container.match(/\bEI\s*(\d+[\.,]?\d*)/); // Match "EI" followed by a number (with optional decimals)

        if (match) {
          energyIndex = match[1].replace(/\s+/g, '');  // Extract the number after "EI" and remove spaces
        } else {
          energyIndex = 'Not found';
        }

      } else {
        energyIndex = 'Not found';
      }
  
      console.log("Got energy index:", energyIndex);
      await page.close();
      return energyIndex;
    };
    


     // should return "Yes"/"No if the building is rijksmonument or not"
   const monumentValuePromise = async (address) => {
       return 'No';

        // FOLLOWING CODE NEEDS TO BE FIXED
           const page = await browser.newPage();

           await page.goto('https://monumentenregister.cultureelerfgoed.nl', {
               waitUntil: 'domcontentloaded'
           });

           await page.waitForSelector('#edit-tekst--2');
           await page.type('#edit-tekst--2', address);

           await page.waitForSelector('#edit-submit-register-of-monuments--2');
           await page.click('#edit-submit-register-of-monuments--2');

           await page.waitForNavigation({ waitUntil: 'domcontentloaded' });

           await page.waitForSelector('#content');
           const monumentValue = await page.$eval('#content', el => el.innerText);
            await page.close()

           return monumentValue;


   };


        const [woz, energyIndex, monument] = await Promise.all([wozValuePromise(), energyIndexPromise(adresseerbaarId), monumentValuePromise()]);
        await browser.close();
//        const monument = 'No';  // Default value for monument
        return { woz, energyIndex, monument};
      } catch (error) {
        console.error('Error scraping data:', error);
        await browser.close();
        throw error;
      }
    }



module.exports = scrapeWozAndMonument;