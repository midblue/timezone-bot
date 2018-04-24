require('dotenv').config()
const discordClient = new (require('discord.js')).Client()
const parse = require('./scripts/parse')
const db = require('./scripts/db')
const interact = require('./scripts/interact')

// TODO !time @<name>, !set by city name

const BOT_ID = '437598259330940939'

discordClient.on('ready', (e) => console.log('Connected to Discord'))
discordClient.on('error', (e) => console.log('Discord.js error:', e.message))
discordClient.login(process.env.DISCORD_KEY)

discordClient.on('message', async msg => {
  if (msg.author.id === BOT_ID) return

  const isServer = msg.guild != undefined

  let userTimezoneOffset
  if (db.lastSeen(msg.author.id)) {
    const updatedUserData = db.update(
      msg.author.id,
      {
        username: isServer
          ? msg.guild.members.find('id', msg.author.id).nickname || msg.author.username
          : msg.author.username,
      }
    )
    userTimezoneOffset = updatedUserData.offset
  }

  // Respond to help command
  if (msg.content.indexOf('!help') === 0) return interact.help(msg)

  // Respond to smooch
  if (msg.content.indexOf('!smooch') === 0) return msg.channel.send(`💋💋💋💋💋💋😘😘😘😘💏`)

  // Note timezone for @'d user if relevant
  const atsInMessage = parse.ats(msg.content)
  if (atsInMessage.length > 0) return interact.at(msg, atsInMessage, userTimezoneOffset)

  // Set user timezone
  if (msg.content.indexOf('!set') === 0) return interact.set(msg)

  // List all users with timezones
  if (msg.content.indexOf('!users') === 0) return interact.listUsers(msg)

  // Respond to user timezone query
  const timezonesInMessage = (msg.content.indexOf('!all') >= 0)
    ? db.timezonesIn(msg.guild || msg.channel)
    : parse.timezoneCommands(msg.content)
  if (timezonesInMessage.length > 0) return interact.list(msg, timezonesInMessage)

})
