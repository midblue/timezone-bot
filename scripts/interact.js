const db = require('./db')
const format = require('./format')
const get = require('./get')

const MINIMUM_LAST_SEEN_TIME_SPAN = 2 * 60 * 60 * 1000 // first number is hours
const MINIMUM_TIMEZONE_DIFFERENCE = 3 // hours

module.exports = {
  help (msg) {
    msg.channel.send(`Valid commands:

\`!time <city or country name>\` to see the current time in a specific place.
\`!set <city or country name>\` to set your timezone.
\`!users\` to see all users' set timezones.
\`!help\` to show this message.`)
  },

  at (msg, atsInMessage, senderTimezoneOffset) {
    if (!senderTimezoneOffset) return
    for (let id of atsInMessage) {
      const userInfo = db.get(id)
      if (!userInfo || !userInfo.lastSeen) continue
      const msSince = Date.now() - new Date(userInfo.lastSeen).getTime()
      if (
        msSince >= MINIMUM_LAST_SEEN_TIME_SPAN
        && Math.abs(senderTimezoneOffset - userInfo.offset) >= MINIMUM_TIMEZONE_DIFFERENCE
      ) {
        db.update(id)
        msg.channel.send(`\`It's ${format.currentTimeAt(userInfo.location)} for ${userInfo.username}. (${userInfo.timezoneName})\``)
      }
    }
  },

  async set (msg) {
    const regex = /!set (.*)/g
    const location = regex.exec(msg.content)
    if (location && location[1]) {
      const foundTimezone = await get.timezoneFromLocation(location[1])
      if (foundTimezone) {
        db.update(msg.author.id, { ...foundTimezone, username: msg.author.username })
        msg.channel.send(`Time zone for ${msg.author.username} set to ${foundTimezone.timezoneName}.`)
      }
      else
        msg.channel.send(`Time zone lookup failed.`)
    }
    else
      msg.channel.send(`Use this command in the format \`!set <city or country name>\` to set your timezone.`)
  },

  async timeAt (msg) {
    const regex = /!time (.*)/g
    const location = regex.exec(msg.content)
    if (!location) {
      msg.channel.send(`Use this command in the format \`!time <city or country name>\` to see the current time there.`)
      return
    }
    const foundTimezone = await get.timezoneFromLocation(location[1])
    if (foundTimezone) {
      msg.channel.send(`\`\`\`${format.timezone(foundTimezone)}\`\`\``)
    }
    else {
      msg.channel.send(`No timezone found for ${location[1]}.`)
    }
  },

  listUsers (msg) {
    const allUsers = db.getAll()
    const timezonesWithUsers = Object.values(allUsers)
      .reduce((acc, user) => {
        const timezoneName = user.timezoneName
        if(!acc[timezoneName]) {
          acc[timezoneName] = {
            locale: user.location,
            label: `${user.timezoneName} (UTC ${user.offset >= 0 ? '+' : ''}${user.offset})`,
            usernames: []
          }
        }
        acc[timezoneName].usernames.push(user.username)
        return acc
      }, {})

    const outputString = Object.values(timezonesWithUsers)
      .reduce((acc, timezone) => {
        const header = `${format.currentTimeAt(timezone.locale, true)} - ${timezone.label}`
        const body = '\n  ' + timezone.usernames.join('\n  ') + '\n\n'
        return acc + header + body
      }, '')

    msg.channel.send(`\`\`\`${outputString}\`\`\``)
  }
}
