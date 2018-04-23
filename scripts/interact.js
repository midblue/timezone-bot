const timezones = require('../timezones.json')
const db = require('./db')
const format = require('./format')

const referenceText = `

Timezone code reference: https://www.timeanddate.com/time/zones/`

const helpText = `Valid commands:

\`!<timezone code>\` to see the current time in a specific timezone.
\`!all\` to see everyone's timezone on the server (requires them to set their timezone).
\`!set <timezone code>\` to set your timezone.
\`!help\` to show this message (duh).${referenceText}`

module.exports = {
  help (msg) {
    msg.channel.send(helpText)
  },

  at (msg, atsInMessage) {
    console.log(atsInMessage)
  },

  set (msg) {
    const regex = /!set.* (\w{2,5})/g
    const timezoneToSet = regex.exec(msg.content)
    if (timezoneToSet && timezoneToSet[1]) {
      const foundTimezone = timezones.find(t => t.abbr.toLowerCase() === timezoneToSet[1])
      if (foundTimezone) {
        db.update({ id: msg.author.id, timezone: foundTimezone })
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

}
