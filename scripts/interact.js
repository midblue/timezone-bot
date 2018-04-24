const timezones = require('../timezones.json')
const db = require('./db')
const format = require('./format')

const MINIMUM_LAST_SEEN_TIME_SPAN = 2 * 60 * 60 * 1000 // first number is hours
const MINIMUM_TIMEZONE_DIFFERENCE = 3 // hours

const referenceText = `

Timezone code reference: https://www.timeanddate.com/time/zones/`

const helpText = `Valid commands:

\`!<timezone code>\` to see the current time in a specific timezone.
\`!set <timezone code>\` to set your timezone.
\`!users\` to see all users' set timezones.
\`!all\` to see everyone's timezone on the server (requires them to set their timezone).
\`!help\` to show this message (duh).${referenceText}`

module.exports = {
  help (msg) {
    msg.channel.send(helpText)
  },

  at (msg, atsInMessage, senderTimezoneOffset) {
    if (!senderTimezoneOffset) return
    for (let id of atsInMessage) {
      const userInfo = db.get(id)
      if (!userInfo || !userInfo.lastSeen) continue
      const msSince = Date.now() - new Date(userInfo.lastSeen).getTime()
      console.log('span since last seen:', msSince)
      console.log('timezone span:', Math.abs(senderTimezoneOffset - userInfo.offset))
      if (
        msSince >= MINIMUM_LAST_SEEN_TIME_SPAN
        && Math.abs(senderTimezoneOffset - userInfo.offset) >= MINIMUM_TIMEZONE_DIFFERENCE
      ) {
        db.update(id)
        msg.channel.send(`\`It's ${
            format.currentTimeAt(
              userInfo.utc.find(u => u.indexOf('Etc/GMT') === -1),
              false // no leading zero
            )
          } for ${userInfo.username}. (${userInfo.value})\``)
      }
    }
  },

  set (msg) {
    const regex = /!set (\w{2,5})/g
    const timezoneToSet = regex.exec(msg.content)
    if (timezoneToSet && timezoneToSet[1]) {
      const foundTimezone = timezones.find(t => t.abbr.toLowerCase() === timezoneToSet[1].toLowerCase())
      if (foundTimezone) {
        db.update(msg.author.id, { ...foundTimezone, username: msg.author.username })
        msg.channel.send(`Time zone for ${msg.author.username} set to ${foundTimezone.value}.`)
      }
      else
        msg.channel.send(`Time zone code ${timezoneToSet[1]} not found.${referenceText}`)
    }
    else
      msg.channel.send(`Use this command in the format \`!set <timezone code>\` to set your timezone.${referenceText}`)
  },

  list (msg, timezonesInMessage) {
    if (timezonesInMessage.length === 0) {
      if (msg.content.indexOf('!all') >= 0)
        msg.channel.send(`No users have registered their timezone in this channel. Use \`!set <timezone code>\` to set your timezone.${referenceText}`)
      return
    }
    const localTimes = timezonesInMessage.map(zone => {
      return {
        abbr: zone.abbr,
        timezone: zone.value.substring(0, zone.value.indexOf('Standard Time') - 1),
        location: zone.utc.find(u => u.indexOf('Etc/GMT') === -1)
      }
    })
    msg.channel.send(`\`\`\`${
      format.timezones(localTimes)
        .join(`\n`)
        .substring(0, 1996)
      }\`\`\``)
  },

  listUsers (msg) {
    const allUsers = db.getAll()
    const timezonesWithUsers = Object.values(allUsers)
      .sort((a, b) => a.offset > b.offset)
      .reduce((acc, user) => {
        const timezoneCode = user.abbr
        if(!acc[timezoneCode]) {
          acc[timezoneCode] = {
            locale: user.utc.find(u => u.indexOf('Etc/GMT') === -1),
            label: user.text,
            usernames: []
          }
        }
        acc[timezoneCode].usernames.push(user.username)
        return acc
      }, {})

    const outputString = Object.values(timezonesWithUsers)
      .reduce((acc, timezone) => {
        const header = `${format.currentTimeAt(timezone.locale, true)} - ${timezone.label}`
        const body = '\n  ' + timezone.usernames.join('\n  ') + '\n'
        return acc + header + body
      }, '')

    msg.channel.send(`\`\`\`${outputString}\`\`\``)
  }
}
