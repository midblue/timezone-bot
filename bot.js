// todo
/*
save server counts/dates
set times for non-users
*/

// test realm is 605053799404666880
// https://discord.com/api/oauth2/authorize?client_id=723017262369472603&permissions=75840&scope=bot

require('dotenv').config()
const Discord = require('discord.js')
const client = new Discord.Client({
  messageCacheMaxSize: 2,
  messageCacheLifetime: 30,
  messageSweepInterval: 60,
  disabledEvents: [
    // 'GUILD_ROLE_CREATE',
    // 'GUILD_ROLE_DELETE',
    // 'GUILD_ROLE_UPDATE',
    'GUILD_BAN_ADD',
    'GUILD_BAN_REMOVE',
    'GUILD_EMOJIS_UPDATE',
    'GUILD_INTEGRATIONS_UPDATE',
    'CHANNEL_PINS_UPDATE',
    'PRESENCE_UPDATE',
    'TYPING_START',
    'VOICE_STATE_UPDATE',
    'VOICE_SERVER_UPDATE',
  ],
})
// const commonFunctions = require('./scripts/commonFunctions')
const addedToServer = require('./events/addedToServer')
const kickedFromServer = require('./events/kickedFromServer')
const privateMessage = require('./events/receivePrivateMessage')
const guildMessage = require('./events/receiveGuildMessage')
const otherMemberLeaveServer = require('./events/otherMemberLeaveServer')

const launchTime = Date.now()
let messagesScannedSinceLastAnnounce = 0
const announceTimeSpanInHours = 0.5
setInterval(async () => {
  if (messagesScannedSinceLastAnnounce > 0) {
    console.log(
      `. . . . ${messagesScannedSinceLastAnnounce} messages watched in ${announceTimeSpanInHours} hours. (Running for ${Math.round(
        (Date.now() - launchTime) / 60 / 60 / 1000,
      )} hours in ${(await client.guilds.cache.array()).length} guilds)`,
    )
  }
  messagesScannedSinceLastAnnounce = 0
}, Math.round(announceTimeSpanInHours * 60 * 60 * 1000))

client.on('error', (e) => console.log('Discord.js error:', e.message))
client.on('ready', async () => {
  console.log(
    `Logged in as ${client.user.tag} in ${
      (await client.guilds.cache.array()).length
    } guilds`,
  )
  client.user.setActivity('t!info', { type: 'LISTENING' })
})

client.on('message', async (msg) => {
  messagesScannedSinceLastAnnounce++
  if (!msg.author || msg.author.id === process.env.BOT_ID || msg.author.bot)
    return
  if (!msg.guild || !msg.guild.available) return privateMessage(msg)
  return guildMessage(msg, client)
})

// added to a server
client.on('guildCreate', addedToServer)

// removed from a server
client.on('guildDelete', kickedFromServer)

// other user leaves a guild
client.on('guildMemberRemove', otherMemberLeaveServer)

client.login(process.env.DISCORD_TOKEN)
