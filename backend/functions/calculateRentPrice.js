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
  energyIndex,
  periodSignedContract
) {
  console.log(
    "Area: " + area,
    "Build year " + buildYear,
    "Energy label:" + energyLabel,
    "WOZ value: " + wozValue,
    "Number of rooms: " + numberOfRooms,
    "Outdoorspacevalue: " + outdoorSpaceValue,
    "Shared people: " + sharedPeople,
    "Kitchen: " + kitchen,
    "Bathroom: " + bathroom,
    "City: " + city,
    "Is monument: " + isMonument,
    "Energy index: " + energyIndex,
    "Contract is signed before July 2024: " + periodSignedContract,
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
    //determine the parameters for the according cells
    let amountPeopleShared
    let sharedArea

    if (sharedPeople === undefined) {
      amountPeopleShared = ''
      sharedArea = ''
    } else {
      amountPeopleShared = sharedPeople
      sharedArea = area / (amountPeopleShared + 1)
    }

    let isAmsOrUtr
    if (city === 'Amsterdam' || city === 'Utrecht') {
      isAmsOrUtr = 'Yes'
    } else {
      isAmsOrUtr = 'No'
    }

    //values that sheet accepts
    let energyLabelTemp
    energyLabelTemp = energyLabel
    console.log(`energy label: ${energyLabel} temp: ${energyLabelTemp}`)

    if (energyLabel.includes('A++')) {
      energyLabelTemp = "'++"
    }
    if (energyLabel.includes('A+')) {
      energyLabelTemp = "'+"
    }
    // if (energyLabel === 'A++') {
    //   energyLabelTemp = "'++"
    // }
    // if (energyLabel === 'A+') {
    //   energyLabelTemp = "'+"
    // }
    if (energyLabel === 'Not found') {
      energyLabelTemp = 'None'
    }
    // else {
    //   energyLabelTemp = energyLabel
    // }

    const energyLabelValue = energyIndex === 'Not found' ? energyLabelTemp : 'None'
    const energyIndexValue = energyIndex === 'Not found' ? '' : energyIndex

    console.log(`energy label value: ${energyLabelValue}`)

    //cells and according data put into them
    const setCells = [
      {
        range: 'Independent calculator!K5',
        values: [[periodSignedContract]],
      },
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
        values: [[energyIndexValue]],
      },
    ]

    const clearCells = [
      {
        range: 'Independent calculator!K5',
        values: [['July 2024 - December 2024']],
      },
      {
        range: 'Independent calculator!K8',
        values: [['']],
      },
      {
        range: 'Independent calculator!K10',
        values: [['']],
      },
      {
        range: 'Independent calculator!K12',
        values: [['']],
      },
      {
        range: 'Independent calculator!Q12',
        values: [['']],
      },
      {
        range: 'Independent calculator!L12',
        values: [['']],
      },
      {
        range: 'Independent calculator!K14',
        values: [['Bare/Small']],
      },
      {
        range: 'Independent calculator!K18',
        values: [['Bare/Small']],
      },
      {
        range: 'Independent calculator!K21',
        values: [['']],
      },
      {
        range: 'Independent calculator!K23',
        values: [['']],
      },
      {
        range: 'Independent calculator!K25',
        values: [['No']],
      },
      {
        range: 'Independent calculator!L6',
        values: [['No']],
      },
      {
        range: 'Independent calculator!R22',
        values: [['None']],
      },
      {
        range: 'Independent calculator!R24',
        values: [['']],
      },
    ]

    // clear cells
    await googleSheets.spreadsheets.values.batchUpdate({
      auth,
      spreadsheetId,
      resource: {
        data: clearCells,
        valueInputOption: 'USER_ENTERED',
      },
    })

    //set the value of cells
    await googleSheets.spreadsheets.values.batchUpdate({
      auth,
      spreadsheetId,
      resource: {
        data: setCells,
        valueInputOption: 'USER_ENTERED',
      },
    })

    //result value request
    const getResultingValue = await googleSheets.spreadsheets.values.get({
      auth,
      spreadsheetId,
      range: 'Independent calculator!Q5:Q7',
    })
    const result = getResultingValue.data.values[0][0]

    return result
  } finally {
    release()
  }
}

module.exports = calculateRentPrice
