const axios = require('axios')

const geocodeUrlBase = `https://maps.googleapis.com/maps/api/geocode/json?key=${process.env.GOOGLE_API_KEY}`
const timezoneUrlBase = `https://maps.googleapis.com/maps/api/timezone/json?key=${process.env.GOOGLE_API_KEY}`

module.exports = {
  ats (messageText) {
    let atsInMessage = []
    const atRegex = /\<\@\!?(\d*)\>*/g
    let regexedAts = atRegex.exec(messageText)
    while (regexedAts) {
      atsInMessage.push(regexedAts[1])
      regexedAts = atRegex.exec(messageText)
    }
    return atsInMessage
  },

  timezoneFromLocation (location) {
    return new Promise (async (resolve, reject) => {
      try {
        const foundLatLon = await axios
          .get(`${geocodeUrlBase}&address=${location}`)
          .then(res => res.data.results ? res.data.results[0].geometry.location : null)
          .catch(e => console.log)
        if (!foundLatLon) resolve()
        const foundTimezone = await axios
          .get(`${timezoneUrlBase}&location=${foundLatLon.lat},${foundLatLon.lng}&timestamp=${Date.now() / 1000}`)
          .then(res => res.data)
          .catch(e => console.log)
        if (foundTimezone.status === 'OK') {
          resolve({
            timezoneName: foundTimezone.timeZoneName,
            offset: foundTimezone.rawOffset / 60 / 60,
            location: foundTimezone.timeZoneId,
          })
        }
        resolve()
      } catch (e) {
        resolve()
        console.log('Google API get error:', e)
      }
    })
  },

}
