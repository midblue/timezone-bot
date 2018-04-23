require('dotenv').config()
const Discord = require('discord.js')
const client = new Discord.Client()
const timeZones = require('./timezones.json')

const relevantTimeZones = '!tst !pdt !cdt !edt'

client.on('ready', () => {
  console.log('Ready!')
})

function buildDateForTimezone(timeZone) {
  const localeString = new Date().toLocaleTimeString(undefined, {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })

  const singleDigitHourRegex = / ([0-9]{1}):[0-9]+/
  return localeString.replace(singleDigitHourRegex, match => {
      if (match) return ' 0' + match.trim()
  })
}

function formattedTimeZones (localTimes) {
  const longest = localTimes
    .reduce((longestLabel, t) => {
      return t.abbr.length + t.timeZone.length > longestLabel
        ? t.abbr.length + t.timeZone.length : longestLabel
    }, 0)

  return localTimes.map(t => {
    let paddedTimeZone = t.timeZone
    while (t.abbr.length + paddedTimeZone.length < longest)
      paddedTimeZone += ' '
    return `(${t.abbr}) ${paddedTimeZone}  ${t.time}`
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

function parseTimeZoneCommands (messageText) {
  let timeZonesInMessage = []
  const lowerCaseMessage = messageText.toLowerCase()
  const timeZoneRegex = /!([a-z]{2,4})/g
  let regexedTimeZone = timeZoneRegex.exec(lowerCaseMessage)
  while (regexedTimeZone) {
    const foundTimeZone = timeZones
      .find(t => t.abbr.toLowerCase() === regexedTimeZone[1])
    if (foundTimeZone)
      timeZonesInMessage.push(foundTimeZone)
    regexedTimeZone = timeZoneRegex.exec(lowerCaseMessage)
  }
  return timeZonesInMessage
}

client.on('message', msg => {
  const usefulInfo = {
    content: msg.content,
    id: msg.author.id,
    username: msg.author.username,
    bot: msg.author.bot,
  }
  // console.log(usefulInfo)

  const atsInMessage = parseAts(msg.content)
  if (atsInMessage.length > 0)
    console.log(atsInMessage)

  const timeZonesInMessage = (msg.content.indexOf('!all') >= 0)
    ? parseTimeZoneCommands(relevantTimeZones)
    : parseTimeZoneCommands(msg.content)

  if (timeZonesInMessage.length === 0) return

  const localTimes = timeZonesInMessage.map(zone => {
    const localTime = buildDateForTimezone(
      zone.utc.find(u => u.indexOf('Etc/GMT') === -1)
    )
    return {
      abbr: zone.abbr,
      timeZone: zone.value.substring(0, zone.value.indexOf('Standard Time') - 1),
      time: localTime
    }
  })

  msg.channel.send(`\`\`\`${formattedTimeZones(localTimes).join(`\n`)}\`\`\``)

})

client.login(process.env.DISCORD_KEY)
