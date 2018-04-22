require('dotenv').config()
const Discord = require('discord.js')
const client = new Discord.Client()

client.on('ready', () => {
  console.log('Ready!')
})

const timeZones = {
  jst: {
      timezone: 'Asia/Tokyo',
      label: 'Japan'
  },
  pst: {
      timezone: 'America/Los_Angeles',
      label: 'US West'
  },
  cst: {
      timezone: 'America/Chicago',
      label: 'US Central'
  },
  est: {
      timezone: 'America/New_York',
      label: 'US East'
  },
}

function buildDateForTimezone(timeZone) {
  const localeString = new Date().toLocaleTimeString(undefined, {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });

  const singleDigitHourRegex = / ([0-9]{1}):[0-9]+/
  return localeString.replace(singleDigitHourRegex, match => {
      if(match) return ' 0' + match.trim();
  });
}

function buildOutputStringForTimezone(timezoneCode) {
    const locale = timeZones[timezoneCode];
    if(!locale) return '';

    const localTime = buildDateForTimezone(locale.timezone);
    const label = locale.label;
    return `\`\`\`${label}: ${localTime}\`\`\``
}

function formattedTimeZones (localTimes) {
  const longest = localTimes
    .reduce((longestLabel, t) => {
      return t.timeZone.length > longestLabel ? t.timeZone.length : longestLabel
    }, 0)
  return localTimes.map(t => {
    let paddedTimeZone = t.timeZone
    while (paddedTimeZone.length < longest) paddedTimeZone += ' '
    return `${paddedTimeZone}  ${t.time}`;
  })
}

client.on('message', msg => {
  const usefulInfo = {
    content: msg.content,
    id: msg.author.id,
    username: msg.author.username,
    bot: msg.author.bot,
  }
  // console.log(usefulInfo)
  let atsInMessage = []
  const atRegex = /\<\@\!?(\d*)\>*/g
  let regexedAts = atRegex.exec(msg.content)
  while (regexedAts) {
    atsInMessage.push(regexedAts[1])
    regexedAts = atRegex.exec(msg.content)
  }
  if (atsInMessage.length > 0) console.log(atsInMessage)

  if (msg.content.indexOf('!jst') >= 0) {
    msg.channel.send(buildOutputStringForTimezone('jst'))
  }

  if (msg.content.indexOf('!pst') >= 0) {
    msg.channel.send(buildOutputStringForTimezone('pst'))
  }

  if (msg.content.indexOf('!cst') >= 0) {
    msg.channel.send(buildOutputStringForTimezone('cst') + ' :ok_hand:')
  }

  if (msg.content.indexOf('!est') >= 0) {
    msg.channel.send(buildOutputStringForTimezone('est'))
  }

  if(msg.content === '!all') {
    const localTimes = Object.keys(timeZones).map(zone => {
      const localTime = buildDateForTimezone(timeZones[zone].timezone)
      return {
        timeZone: timeZones[zone].label,
        time: localTime
      }
    })
    msg.channel.send(`\`\`\`${formattedTimeZones(localTimes).join(`\n`)}\`\`\``)
  }
})

client.login(process.env.DISCORD_KEY)
