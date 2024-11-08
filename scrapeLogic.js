const puppeteer = require('puppeteer');
require('dotenv').config();

async function scrapeWozAndMonument(address, adresseerbaarId) {
  const browser = await puppeteer.launch();

  try {
    const wozValuePromise = async () => {
      const page = await browser.newPage();
    page.setDefaultNavigationTimeout(9000)

      await page.goto('https://www.wozwaardeloket.nl/', { waitUntil: 'load' });
      await page.waitForSelector('#kaart-bekijken-btn');
      await page.click('#kaart-bekijken-btn');

      await page.type('#ggcSearchInput', address);
      await page.waitForSelector('#ggcSuggestionList-0');
      await page.click('#ggcSuggestionList-0');

//        await page.waitForTimeout(5000);
//         await delay(10000);
   await page.waitForSelector('.waarden-row')
      const wozValue = await page.$eval('.waarden-row', el => el.innerText);
      await page.close();
      let result

      if(wozValue){
        result = wozValue
      } else{
      result = 'Not found'
      }

      return wozValue;
    };

    const energyIndexPromise = async () => {
      const page = await browser.newPage();
      await page.goto('https://www.ep-online.nl/Energylabel/Search', { waitUntil: 'load' });
      await page.type('#SearchValue', adresseerbaarId);
      await page.click('#searchButton');

      const elementExists = await page.waitForSelector('.se-result-item-nta');
      const energyIndex = elementExists ? await page.$eval('.se-result-item-nta', el => el.innerText.split('EI')[1].split('EI')[0].replace(/\s+/g, '')) : 'Not found';
      await page.close();
      return energyIndex;
    };

   const monumentValuePromise = async (address) => {
       return '';

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


        const [woz, energyIndex, monument] = await Promise.all([wozValuePromise(), energyIndexPromise(), monumentValuePromise()]);
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
