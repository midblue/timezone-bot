const axios = require('axios')
const db = require('../db/firestore')
const { standardizeTimezoneName } = require('../scripts/commonFunctions')
const timezoneCodes = require('../scripts/timezoneCodes')

const geocodeUrlBase = `https://maps.googleapis.com/maps/api/geocode/json?key=${process.env.GOOGLE_API_KEY}`
const timezoneUrlBase = `https://maps.googleapis.com/maps/api/timezone/json?key=${process.env.GOOGLE_API_KEY}`

module.exports = (location) => {
  if (!location) return

  location = location
    .replace(/[<>\[\]()]/gi, '')
    .replace(/[_　]/gi, ' ')
    .replace(/@!?\d* */gi, '')

  // check for UTC command
  const UTCMatch = /^(?:utc|gmt) ?(\+|-)? ?(\d*)/gi.exec(location)
  if (UTCMatch) {
    // todo fix "UTC8" bug
    const offset = UTCMatch[2]
      ? parseInt(UTCMatch[2]) * (UTCMatch[1] === '-' ? -1 : 1) // signs on these are intentionally inverted because this world is hell: https://en.wikipedia.org/wiki/Tz_database#Area (swapped back now because people seemed to be having issues)
      : 0
    if (offset > 14 || offset < -12) return

    const offsetInverted = offset * -1
    const locationData = {
      timezoneName: `UTC${offset < 0 ? offset : '+' + offset}`,
      location: `Etc/GMT${
        offsetInverted < 0 ? offsetInverted : '+' + offsetInverted
      }`,
    }
    return locationData
  }

  // check for literal timezone code
  const timezoneCodeName = location.replace(/\s*/g, '').toUpperCase()
  const foundTimezoneCode = timezoneCodes[timezoneCodeName]
  if (foundTimezoneCode !== undefined) {
    const locationData = {
      timezoneName: timezoneCodeName,
      location: `Etc/GMT${
        foundTimezoneCode >= 0 ? '+' : ''
      }${foundTimezoneCode}`
        .replace('+', '.')
        .replace('-', '+')
        .replace('.', '-'), // swap + and -,
    }
    return locationData
  }

  return new Promise(async (resolve, reject) => {
    const savedData = await db.getLocation(location)
    if (savedData) return resolve(savedData)
    try {
      console.log(`Making new API request for ${location}`)
      const foundLatLon = await axios
        .get(`${geocodeUrlBase}&address=${location}`)
        .then((res) =>
          res.data.results ? res.data.results[0].geometry.location : null,
        )
        .catch((e) => console.log)
      if (!foundLatLon) resolve()
      const foundTimezone = await axios
        .get(
          `${timezoneUrlBase}&location=${foundLatLon.lat},${
            foundLatLon.lng
          }&timestamp=${Date.now() / 1000}`,
        )
        .then((res) => res.data)
        .catch((e) => console.log)
      if (foundTimezone.status === 'OK') {
        const result = {
          timezoneName: standardizeTimezoneName(foundTimezone.timeZoneName),
          location: foundTimezone.timeZoneId,
        }
        db.setLocation({ locationName: location, locationSettings: result })
        return resolve(result)
      }
      resolve()
    } catch (e) {
      resolve()
      console.log('Google API get error:', e)
    }
  })
}
