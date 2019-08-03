require('dotenv').config()
const discordClient = new (require('discord.js')).Client()
const get = require('./scripts/get')
const db = require('./scripts/db')
const interact = require('./scripts/interact')

const BOT_ID = process.env.BOT_ID

discordClient.on('ready', e => {
  console.log('Connected to Discord')
  discordClient.user.setActivity('!help', { type: 'LISTENING' })
})
discordClient.on('error', e => console.log('Discord.js error:', e.message))
discordClient.login(process.env.DISCORD_KEY)

discordClient.on('guildMemberRemove', member => {
  db.remove(member.id || member.user.id)
})

discordClient.on('message', async msg => {
  if (msg.author.id == BOT_ID) return

  const isServer = msg.channel.guild !== undefined
  if (isServer) msg.guild = msg.channel.guild

  const senderUsername = isServer
    ? msg.guild.members.find(member => member.user.id === msg.author.id)
        .nickname || msg.author.username
    : msg.author.username

  let userTimezoneOffset
  if (db.lastSeen(msg.author.id)) {
    const updatedUserData = db.update(msg.author.id, {
      username: senderUsername,
    })
    userTimezoneOffset = updatedUserData.offset
  }

  // Respond to help command
  if (msg.content.indexOf(`!help`) === 0 || msg.content.indexOf(`!h`) === 0)
    return interact.help(msg)

  // Respond to a request for a user's own timezone
  if (msg.content.indexOf(`!me`) === 0 || msg.content.indexOf(`!m`) === 0)
    return interact.me(msg, senderUsername)

  // Delete self from the list
  if (msg.content.indexOf(`!removeme`) === 0 || msg.content.indexOf(`!r`) === 0)
    return interact.removeMe(msg, senderUsername)

  // Respond to smooch
  if (msg.content.indexOf(`!smooch`) === 0)
    return msg.channel.send(`💋💋💋💋💋💋😘😘😘😘`)

  // Note timezone for @'d user if relevant
  const atsInMessage = get.ats(msg.content)
  if (atsInMessage.length > 0)
    return interact.at(msg, atsInMessage, userTimezoneOffset)

  // Set user timezone
  if (msg.content.indexOf(`!set`) === 0 || msg.content.indexOf(`!s`) === 0)
    return interact.set(msg)

  // List all users with timezones
  if (
    msg.content.indexOf(`!users`) === 0 ||
    msg.content.indexOf(`!all`) === 0 ||
    msg.content.indexOf(`!u`) === 0 ||
    msg.content.indexOf(`!a`) === 0
  )
    return interact.listUsers(msg)

  // Respond to location-only time query
  if (msg.content.indexOf(`!timein`) === 0 || msg.content.indexOf(`!ti `) === 0)
    return interact.timeIn(msg)

  // Respond to location or user time query
  if (msg.content.indexOf(`!time`) === 0 || msg.content.indexOf(`!t`) === 0)
    return interact.time(msg)
})
