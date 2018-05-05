const redis = require('redis').createClient()

const logger = require('./log.js')
const log = logger('cache', 'magenta')
const err = logger('cache', 'red')
const debug = logger('cache', 'magenta', true)

const A_DAY_IN_SECONDS = 24 * 60 * 60

redis.on('connect', () => log('Connected to Redis'))
redis.on('error', (e) => err('Redis error:', e))

// the cache in this app only saves { location: timezone } pairs, and only for 24hr
// periods. the reasoning here is that the timezones might change with daylight
// savings, etc. so we just keep them in local memory and refresh them every 
// day. {location: lat/lng) pairs will never change, so we can leave those in
// permanent storage in the DB.

module.exports = {

	getTimezone(key) {
		debug('getTimezone', key)
		if (!key) return
		return new Promise((resolve, reject) => {
			redis.get(key.toLowerCase(), (e, timezoneObj) => {
				if (e) {
					err('Redis error:', e)
					resolve()
				}
				resolve(timezoneObj ? JSON.parse(timezoneObj) : null)
			})
		})
	},

	setTimezone (key, timezoneObj) {
		debug('setTimezone', key)
		if (!key) return
		return new Promise((resolve, reject) => {
			redis.set(key.toLowerCase(), JSON.stringify(timezoneObj), 'EX', A_DAY_IN_SECONDS)
		})
	},

}