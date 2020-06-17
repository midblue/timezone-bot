const axios = require('axios')
const db = require('../db/firestore')

const geocodeUrlBase = `https://maps.googleapis.com/maps/api/geocode/json?key=${process.env.GOOGLE_API_KEY}`
const timezoneUrlBase = `https://maps.googleapis.com/maps/api/timezone/json?key=${process.env.GOOGLE_API_KEY}`

module.exports = location => {
  if (!location) return

  // check for UTC command
  const UTCMatch = /^(?:utc|gmt)(\+|-)?(\d*)/gi.exec(location)
  if (UTCMatch)
    return {
      timezoneName: UTCMatch[0].toUpperCase(),
      offset: UTCMatch[2]
        ? parseInt(UTCMatch[2]) * (UTCMatch[1] === '-' ? 1 : -1) // signs on these are intentionally inverted because this world is hell: https://en.wikipedia.org/wiki/Tz_database#Area
        : 0,
      location: `Etc/${UTCMatch[0].toUpperCase().replace('UTC', 'GMT')}`,
    }

  return new Promise(async (resolve, reject) => {
    const savedData = await db.getLocation(location)
    if (savedData) return resolve(savedData)
    try {
      console.log(`Making new API request for ${location}`)
      const foundLatLon = await axios
        .get(`${geocodeUrlBase}&address=${location}`)
        .then(res =>
          res.data.results ? res.data.results[0].geometry.location : null,
        )
        .catch(e => console.log)
      if (!foundLatLon) resolve()
      const foundTimezone = await axios
        .get(
          `${timezoneUrlBase}&location=${foundLatLon.lat},${
            foundLatLon.lng
          }&timestamp=${Date.now() / 1000}`,
        )
        .then(res => res.data)
        .catch(e => console.log)
      if (foundTimezone.status === 'OK') {
        const result = {
          timezoneName: foundTimezone.timeZoneName,
          offset: foundTimezone.rawOffset / 60 / 60,
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