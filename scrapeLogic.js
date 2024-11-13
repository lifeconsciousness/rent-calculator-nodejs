const puppeteer = require('puppeteer');
require('dotenv').config();

async function scrapeWozAndMonument(address, adresseerbaarId) {
  // const browser = await puppeteer.launch();

  const browser = await puppeteer.launch({
    headless: true, // Optional, to see the browser in action
    userDataDir: './user_data', // Directory where session data is stored
    args: ['--no-sandbox'] // Add any other desired launch arguments
  });

  try {
    const wozValuePromise = async () => {
      const page = await browser.newPage();
//    page.setDefaultNavigationTimeout(9000)

      // await page.setContent(html)

      await page.setRequestInterception(true);

      page.on('request', (request) => {
          if (['image', 'stylesheet', 'font'].indexOf(request.resourceType()) !== -1) {
              request.abort();
          } else {
              request.continue();
          }
      });

      await page.goto('https://www.wozwaardeloket.nl/', { waitUntil: 'load' });
      // await page.goto('https://www.wozwaardeloket.nl/');

      await page.waitForSelector('#kaart-bekijken-btn');
      await page.click('#kaart-bekijken-btn');

      await page.type('#ggcSearchInput', address);
      await page.waitForSelector('#ggcSuggestionList-0');
      await page.click('#ggcSuggestionList-0');

      await page.waitForSelector('.waarden-row')
      const wozValue = await page.$eval('.waarden-row', el => el.innerText);
      await page.close();

      return wozValue || 'Not found';
    };

    const energyIndexPromise = async (adresseerbaarId) => {
      // return 'Not found'
      const page = await browser.newPage();
      
      await page.setRequestInterception(true);

      page.on('request', (request) => {
          if (['image', 'stylesheet', 'font'].indexOf(request.resourceType()) !== -1) {
              request.abort();
          } else {
              request.continue();
          }
      });
    
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
          energyIndex = /\bEI\b/.test(container) ? container.split('EI')[1].trim() : 'Not found';
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

const delay = (time) => new Promise(resolve => setTimeout(resolve, time));

module.exports = scrapeWozAndMonument;