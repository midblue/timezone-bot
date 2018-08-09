const axios = require('axios')

const logger = require('./log.js')
const log = logger('google', 'cyan')
const err = logger('google', 'red')
const debug = logger('google', 'cyan', true)

const geocodeUrlBase = `https://maps.googleapis.com/maps/api/geocode/json?key=${process.env.GOOGLE_API_KEY}`
const timezoneUrlBase = `https://maps.googleapis.com/maps/api/timezone/json?key=${process.env.GOOGLE_API_KEY}`

const A_DAY = 24 * 60 * 60 * 1000
const MAX_API_CALLS = 2500
let geocodeCallsToday = 0,
		timezoneCallsToday = 0

setInterval(() => {
	geocodeCallsToday = 0
	timezoneCallsToday = 0
}, A_DAY)

module.exports = {

	getCoords(searchString) {
		debug('getCoords', searchString)
		if (geocodeCallsToday++ > MAX_API_CALLS) {
			err('Google API call limit hit! No further API calls available.', searchString)
			resolve()
		}
		return new Promise(async (resolve, reject) => {
			const foundLatLon = await axios
				.get(`${geocodeUrlBase}&address=${searchString}`)
				.then(res => res.data.results ? res.data.results[0].geometry.location : null)
				.catch(e => console.log)
			if (!foundLatLon) {
				log('No location found for', searchString)
				resolve()
			}
			resolve( [foundLatLon.lat, foundLatLon.lng] )
		})
	},

	getTimezone (lat, lng) {
		debug('getTimezone', lat, lng)
		return new Promise (async (resolve, reject) => {
			if (timezoneCallsToday++ > MAX_API_CALLS) {
				err('Google API call limit hit! No further API calls available.', lat, lng)
				resolve()
			}
			const foundTimezone = await axios
				.get(`${timezoneUrlBase}&location=${lat},${lng}&timestamp=${Date.now() / 1000}`)
				.then(res => res.data)
				.catch(e => console.log)
			if (!foundTimezone.status === 'OK') {
				log('No timezone found for', lat, lng)
				resolve()
			}
			resolve({
				timezoneName: foundTimezone.timeZoneName,
				offset: foundTimezone.rawOffset / 60 / 60,
				location: foundTimezone.timeZoneId,
			})
		})
	},

}