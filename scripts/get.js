const api = require('./googleapi')
const db = require('./db')
const cache = require('./cache')

const logger = require('./log.js')
const log = logger('get', 'green')
const err = logger('get', 'red')
const debug = logger('get', 'green', true)

const fuse = require('fuse.js')
const fuseOptions = {
  shouldSort: true,
  location: 0,
  threshold: 0.45,
  distance: 60,
  maxPatternLength: 20,
  minMatchCharLength: 2,
  keys: [ 'username' ],
}

module.exports = {

  serverId (msg) {
    return msg.guild ?
      msg.guild.id :
      msg.channel.id ?
        'c' + msg.channel.id :
        'u' + msg.channel.recipient.id
  },

  atsInMessage (messageText) {
    let atsInMessage = []
    const atRegex = /\<\@\!?(\d*)\>*/g
    let regexedAts = atRegex.exec(messageText)
    while (regexedAts) {
      atsInMessage.push(regexedAts[1])
      regexedAts = atRegex.exec(messageText)
    }
    return atsInMessage
  },

  async userInMessage (searchString, users) {
    const fuzzySearch = new fuse(users, fuseOptions)
    const foundUser = fuzzySearch.search(searchString)
    if (!foundUser || foundUser.length < 1 || !foundUser[0].username) return
    return await db.getUserByUsername(foundUser[0].username)
  },

  timezoneFromLocation ({ location, lat, lng }) {
    debug('timezoneFromLocation', location)
    return new Promise(async (resolve, reject) => {
      if (!location && (!lat || !lng)) resolve()
      // check cache
      const cachedTimezone = await cache.getTimezone(location)
      if (cachedTimezone && cachedTimezone.timezoneName)
        return resolve(cachedTimezone)

      let coords = [lat, lng]
      if ((!lat || !lng) && location) {
        // check db
        coords = await db.getCoords(location)

        // if all else fails, go for API
        if (!coords) {
          coords = await api.getCoords(location)
          // save coords in db
          db.setCoords(location, coords)
        }
      }
      if (!coords || !coords[0]) resolve()
      
      const timezone = await api.getTimezone(...coords)
      if (!timezone) resolve()
      // save timezone in cache
      cache.setTimezone(location, timezone)
      resolve(timezone)
    })
  },

  async userFullData (userId, serverId) {
    debug('userFullData')
    const data = await db.getUser(userId, serverId)
    if (!data) return
    const timezone = await this.timezoneFromLocation({
        lat: data.lat, lng: data.lng, location: data.location
      }) || {}
    const spread = {}
    for (let key in data)
      spread[key] = data[key]
    return {
      ...spread,
      ...timezone
    }
  },
  

}
