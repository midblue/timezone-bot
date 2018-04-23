require('dotenv').config()
const Discord = require('discord.js')
const discordClient = new Discord.Client()
const timezones = require('./timezones.json')
const fs = require('fs')
const savedUsers = require('./data/users.json')
console.log(`Loaded ${Object.keys(savedUsers).length} saved users.`)

discordClient.on('ready', () => {
  console.log('Ready!')
})

function buildDateForTimezone(timezone) {
  const localeString = new Date().toLocaleTimeString(undefined, {
    timezone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
  const singleDigitHourRegex = / ([0-9]{1}):[0-9]+/
  return localeString.replace(singleDigitHourRegex, match => {
      if (match) return ' 0' + match.trim()
  })
}

function formattedTimezones (localTimes) {
  const longest = localTimes
    .reduce((longestLabel, t) => {
      return t.abbr.length + t.timezone.length > longestLabel
        ? t.abbr.length + t.timezone.length : longestLabel
    }, 0) + 1
  return localTimes.map(t => {
    let paddedTimezone = t.timezone + ':'
    while (t.abbr.length + paddedTimezone.length < longest)
      paddedTimezone += ' '
    return `(${t.abbr}) ${paddedTimezone} ${t.time}`
  })
}

function parseAts (messageText) {
  let atsInMessage = []
  const atRegex = /\<\@\!?(\d*)\>*/g
  let regexedAts = atRegex.exec(messageText)
  while (regexedAts) {
    atsInMessage.push(regexedAts[1])
    regexedAts = atRegex.exec(messageText)
  }
  return atsInMessage
}

function parseTimezoneCommands (messageText) {
  let timezonesInMessage = []
  const lowerCaseMessage = messageText.toLowerCase()
  const timezoneRegex = /!([a-z]{2,5})/g
  let regexedTimezone = timezoneRegex.exec(lowerCaseMessage)
  while (regexedTimezone) {
    const foundTimezone = timezones
      .find(t => t.abbr.toLowerCase() === regexedTimezone[1])
    if (foundTimezone)
      timezonesInMessage.push(foundTimezone)
    regexedTimezone = timezoneRegex.exec(lowerCaseMessage)
  }
  return timezonesInMessage
}

function getRelevantTimezonesToServer (serverOrChannelObject) {
  let relevantTimezones = []
  const userIdsInCurrentServer = serverOrChannelObject.recipient
    ? [serverOrChannelObject.recipient.id]
    : serverOrChannelObject.members.keyArray()
  Object.keys(savedUsers)
    .map(k => {
      if (
        userIdsInCurrentServer.find(i => i === k)
        && !relevantTimezones.find(z => z.value === savedUsers[k].value)
      ) {
        relevantTimezones.push(savedUsers[k])
      }
    })
  return relevantTimezones.sort((a, b) => a.offset > b.offset)
}

function updateUserTimezone (settings) {
  savedUsers[settings.id] = settings.timezone
  fs.writeFile("./data/users.json", JSON.stringify(savedUsers), 'utf8', e => {
    if (e) return console.log(e)
  })
}

discordClient.on('message', async msg => {
  if (msg.author.bot) return

  // Respond to help command
  if (msg.content.indexOf('!help') === 0) {
    msg.channel.send(`Valid commands:

\`!<timezone code>\` to see the current time in a specific timezone.
\`!all\` to see everyone's timezone on the server (requires them to set their timezone).
\`!set <timezone code>\` to set your timezone.
\`!help\` to show this message (duh).

Timezone code reference: https://www.timeanddate.com/time/zones/`)
  }

  const serverOrChannelObject = msg.guild || msg.channel

  const atsInMessage = parseAts(msg.content)
  if (atsInMessage.length > 0)
    console.log(atsInMessage)

  // Set user timezone
  if (msg.content.indexOf('!set') === 0) {
    const regex = /!set.* (\w{2,5})/g
    const timezoneToSet = regex.exec(msg.content)
    if (timezoneToSet && timezoneToSet[1]) {
      const foundTimezone = timezones.find(t => t.abbr.toLowerCase() === timezoneToSet[1])
      if (foundTimezone) {
        updateUserTimezone({ id: msg.author.id, timezone: foundTimezone })
        msg.channel.send(`Time zone for ${msg.author.username} set to ${foundTimezone.value}.`)
      }
      else {
        msg.channel.send(`Time zone code ${timezoneToSet[1]} not found. Reference: https://www.timeanddate.com/time/zones/`)
      }
    }
    else
      msg.channel.send(`Use this command in the format \`!set <timezone code>\` to set your timezone.

Reference: https://www.timeanddate.com/time/zones/`)
    return
  }

  // Respond to user timezone query
  const timezonesInMessage = (msg.content.indexOf('!all') >= 0)
    ? getRelevantTimezonesToServer(serverOrChannelObject)
    : parseTimezoneCommands(msg.content)

  if (timezonesInMessage.length === 0) {
    if (msg.content.indexOf('!all') >= 0)
      msg.channel.send(`No users have registered their timezone in this channel. Use \`!set <timezone code>\` to set your timezone.

Reference: https://www.timeanddate.com/time/zones/`)
    return //console.log('No valid timezones to send.')
  }

  // console.log(timezonesInMessage.map(t => t.value))

  const localTimes = timezonesInMessage.map(zone => {
    const localTime = buildDateForTimezone(
      zone.utc.find(u => u.indexOf('Etc/GMT') === -1)
    )
    return {
      abbr: zone.abbr,
      timezone: zone.value.substring(0, zone.value.indexOf('Standard Time') - 1),
      time: localTime
    }
  })

  msg.channel.send(`\`\`\`${
    formattedTimezones(localTimes)
      .join(`\n`)
      .substring(0, 1996)
    }\`\`\``)

})

discordClient.login(process.env.DISCORD_KEY)
