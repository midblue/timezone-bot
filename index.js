require('dotenv').config()
const discordClient = new (require('discord.js')).Client()
const get = require('./scripts/get')
const db = require('./scripts/db')
const interact = require('./scripts/interact')

const logger = require('./scripts/log.js')
const log = logger('index', 'cyan')
const err = logger('index', 'red')
const debug = logger('index', 'cyan', true)

const BOT_ID = process.env.BOT_ID.toString()

discordClient.on('ready', (e) => log('Connected to Discord'))
discordClient.on('error', (e) => err('Discord.js error:', e.message))
discordClient.login(process.env.DISCORD_KEY)

discordClient.on('message', async msg => {
  if (msg.author.id === BOT_ID) return

  const isServer = msg.guild != undefined
  const senderUsername = isServer ?
    msg.guild.members.find('id', msg.author.id).nickname || msg.author.username :
    msg.author.username
  const serverId = get.serverId(msg)

  // Respond to help command
  if (msg.content.indexOf(`!help`) === 0) {
    updateTimeStamp(msg, serverId, senderUsername)
    return interact.help(msg)
  }

  // Respond to a request for a user's own timezone
  if (msg.content.indexOf(`!me`) === 0) {
    updateTimeStamp(msg, serverId, senderUsername)
    return interact.me(msg, senderUsername)
  }

  // Respond to smooch
  if (msg.content.indexOf(`!smooch`) === 0) {
    updateTimeStamp(msg, serverId, senderUsername)
    return msg.channel.send(`💋💋💋💋💋💋😘😘😘😘💏`)
  }

  // Respond with timezone for @'d user if relevant
  const atsInMessage = get.atsInMessage(msg.content)
  if (atsInMessage.length > 0)
    return interact.at(msg, atsInMessage)

  // Unset user timezone
  if (msg.content.indexOf(`!unset`) === 0) return interact.unset(msg, senderUsername)

  // Set user timezone
  if (msg.content.indexOf(`!set`) === 0) return interact.set(msg, senderUsername)

  // List all users with set timezones in server
  if (msg.content.indexOf(`!users`) === 0 || msg.content.indexOf(`!all`) === 0) {
    updateTimeStamp(msg, serverId, senderUsername)
    return interact.listUsers(msg, )
  }

  // Respond to location time query
  if (msg.content.indexOf(`!time`) === 0) return interact.timeAt(msg)

  // For all other messages, update user last seen timestamp
  updateTimeStamp(msg, serverId, senderUsername)

})

async function updateTimeStamp (msg, serverId, senderUsername) {
  if (await db.getUserLastSeenInServer(msg.author.id, serverId)) {
    db.updateUser(
      msg.author.id,
      serverId,
      { username: senderUsername }
    )
  }
}