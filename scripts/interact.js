const db = require('./db')
const format = require('./format')
const get = require('./get')

const logger = require('./log.js')
const log = logger('interact', 'blue')
const err = logger('interact', 'red')
const debug = logger('interact', 'blue', true)

const MINIMUM_LAST_SEEN_TIME_SPAN = 2 * 60 * 60 * 1000 // first number is hours
const MINIMUM_TIMEZONE_DIFFERENCE = 3 // hours

module.exports = {
  help (msg) {
    msg.channel.send(`Valid commands:

\`!time <user, city, or country name>\` to see the current time for a specific user or in a specific place.
\`!set <city or country name>\` to set your own timezone.
\`!users\` or \`!all\` to see all users' set timezones.
\`!help\` to show this message.`)
  },

  async at (msg, atsInMessage) {
    debug('at')
    const serverId = get.serverId(msg)
    const senderTimezoneOffset = await get.userFullData(msg.author.id, serverId).offset
    if (!senderTimezoneOffset) return
    for (let id of atsInMessage) {
      const userInfo = await get.userFullData(id, serverId)
      debug('interact.at', userInfo)
      if (!userInfo || !userInfo.lastSeen) continue
      // Date.now() returns the date from a UTC time, so as long as
      // lastSeen is calculated from UTC as well, this should be accurate
      const msSince = Date.now() - new Date(userInfo.lastSeen).getTime()
      if (
        msSince >= MINIMUM_LAST_SEEN_TIME_SPAN
        && Math.abs(senderTimezoneOffset - userInfo.offset) >= MINIMUM_TIMEZONE_DIFFERENCE
      ) {
        db.updateUser(id)
        msg.channel.send(`\`It's ${format.currentTimeAt(userInfo.location)} for ${userInfo.username}. (${userInfo.timezoneName})\``)
      }
    }
  },

  async me(msg, senderUsername) {
    debug('me')
    const userInfo = await get.userFullData(msg.author.id, get.serverId(msg))
    if (!userInfo.offset)
      return msg.channel.send(`No timezone has been set for ${senderUsername}.`)
    msg.channel.send(`\`It's ${format.currentTimeAt(userInfo.location)} for ${userInfo.username}. (${userInfo.timezoneName})\``)
  },

  unset(msg, senderUsername) {
    debug('unset')
    db.updateUser(msg.author.id, get.serverId(msg), {
      location: null,
      username: senderUsername
    })
    msg.channel.send(`Unset time zone for ${senderUsername}.`)
  },

  async set(msg, senderUsername) {
    debug('set')
    const regex = /!set (.*)/g
    const location = regex.exec(msg.content)
    if (location && location[1]) {
      db.updateUser(msg.author.id, get.serverId(msg), {
        username: senderUsername,
        location: location[1]
      })
      const foundTimezone = await get.timezoneFromLocation({ location: location[1] })
      if (foundTimezone) {
        msg.channel.send(`Time zone for ${msg.author.username} set to ${foundTimezone.timezoneName}.`)
      }
      else
        msg.channel.send(`Time zone lookup failed.`)
    }
    else
      msg.channel.send(`Use this command in the format \`!set <city or country name>\` to set your timezone.`)
  },

  async timeAt(msg) {
    debug('timeAt')
    const regex = /!time (.*)/g
    const searchString = regex.exec(msg.content)
    if (!searchString || !searchString[1]) {
      msg.channel.send(`Use this command in the format \`!time <user, city, or country name>\` to see the current time there.`)
      return
    }

    // first, assume it's a username and compare it to the users in the server
    const users = msg.guild ?
      msg.guild.members.map(m => ({ username: m.nickname })) :
      [{ username: msg.author.username }]
    let foundUserInServer = await get.userInMessage(searchString[1], users)

    if (foundUserInServer && foundUserInServer.location) {
      const { location, lat, lng } = foundUserInServer
      const foundTimezone = get.timezoneFromLocation(location, lat, lng)
      msg.channel.send(`\`It's ${format.currentTimeAt(foundTimezone.location)} for ${foundTimezone.username}. (${foundTimezone.timezoneName})\``)
    }
    else if (foundUserInServer)
      return msg.channel.send(`No timezone listed for user ${foundUsername}.`)

    // then, take a swing at it being a location
    else {
      const foundTimezone = await get.timezoneFromLocation({
        location: searchString[1]
      })
      if (!foundTimezone)
        return msg.channel.send(`No timezone found for ${searchString[1]}.`)
      msg.channel.send(`\`\`\`${format.timezone(foundTimezone)}\`\`\``)
    }
  },

  async listUsers(msg) {
    debug('listUsers')
    let savedUsers
  
    if (msg.guild)
      savedUsers = await db.getUsersInServer(get.serverId(msg))
    else
      savedUsers = [await db.getUser(msg.author.id, get.serverId(msg))]

    const allUsersTimezonePromises = []
    for (let user of savedUsers) {
      if (user.location || user.lat || user.lng)
        allUsersTimezonePromises.push({
          ...(await get.timezoneFromLocation({ 
            location: user.location,
            lat: user.lat,
            lng: user.lng
          })),
          username: user.username
        })
    }
    
    Promise.all(allUsersTimezonePromises)
      .then(allUsersTimezones => {
        const outputString = format.usersByTimezone(allUsersTimezones)
        if (!outputString)
          return msg.channel.send(`No users in this server have added their timezone yet. Use \`!set <city or country name>\` to set your timezone.`)
        msg.channel.send(`\`\`\`${outputString}\`\`\``)
      })
  }
}
