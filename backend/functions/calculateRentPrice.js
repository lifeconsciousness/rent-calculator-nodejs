const { google } = require('googleapis')
const { Mutex } = require('async-mutex')

//sending and retrieving data from google sheets

async function calculateRentPrice(
  area,
  buildYear,
  energyLabel,
  wozValue,
  numberOfRooms,
  outdoorSpaceValue,
  sharedPeople,
  kitchen,
  bathroom,
  city,
  isMonument,
  energyIndex
) {
  console.log(
    area,
    buildYear,
    energyLabel,
    wozValue,
    numberOfRooms,
    outdoorSpaceValue,
    sharedPeople,
    kitchen,
    bathroom,
    city,
    isMonument,
    energyIndex
  )

  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: 'https://www.googleapis.com/auth/spreadsheets',
  })

  const spreadsheetId = process.env.SPREADSHEET_ID
  const client = await auth.getClient()
  const googleSheets = google.sheets({ version: 'v4', auth: client })

  // Acquire the lock
  const sheetMutex = new Mutex()
  const release = await sheetMutex.acquire()

  try {
    //determine the parameter for the according cells
    let amountPeopleShared
    let sharedArea

    if (sharedPeople === undefined) {
      amountPeopleShared = ''
      sharedArea = ''
    } else {
      amountPeopleShared = sharedPeople
      sharedArea = area / amountPeopleShared
    }

    let isAmsOrUtr
    if (city === 'Amsterdam' || city === 'Utrecht') {
      isAmsOrUtr = 'Yes'
    } else {
      isAmsOrUtr = 'No'
    }

    let energyLabelTemp
    if (energyLabel === 'A++') {
      energyLabelTemp = "'++"
    }
    if (energyLabel === 'A+') {
      energyLabelTemp = "'+"
    }

    const energyLabelValue = energyIndex === '' ? energyLabelTemp : 'None'

    //set the value of cells
    await googleSheets.spreadsheets.values.batchUpdate({
      auth,
      spreadsheetId,
      resource: {
        data: [
          {
            range: 'Independent calculator!K8',
            values: [[numberOfRooms]],
          },
          {
            range: 'Independent calculator!K10',
            values: [[area]],
          },
          {
            range: 'Independent calculator!K12',
            values: [[outdoorSpaceValue]],
          },
          {
            range: 'Independent calculator!Q12',
            values: [[amountPeopleShared]],
          },
          {
            range: 'Independent calculator!L12',
            values: [[sharedArea]],
          },
          {
            range: 'Independent calculator!K14',
            values: [[kitchen]],
          },
          {
            range: 'Independent calculator!K18',
            values: [[bathroom]],
          },
          {
            range: 'Independent calculator!K21',
            values: [[wozValue]],
          },
          {
            range: 'Independent calculator!K23',
            values: [[buildYear]],
          },
          {
            range: 'Independent calculator!K25',
            values: [[isAmsOrUtr]],
          },
          {
            range: 'Independent calculator!L6',
            values: [[isMonument]],
          },
          {
            range: 'Independent calculator!R22',
            values: [[energyLabelValue]],
          },
          {
            range: 'Independent calculator!R24',
            values: [[energyIndex]],
          },
        ],
        valueInputOption: 'USER_ENTERED',
      },
    })

    //cell value request
    const getResultingValue = await googleSheets.spreadsheets.values.get({
      auth,
      spreadsheetId,
      range: 'Independent calculator!Q5:Q7',
    })
    return getResultingValue.data.values[0][0]
  } finally {
    release()
  }
}

module.exports = calculateRentPrice