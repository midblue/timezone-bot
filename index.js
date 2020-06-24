require('dotenv').config()
const Discord = require('discord.js')
const client = new Discord.Client()
const addedToServer = require('./events/addedToServer')
const kickedFromServer = require('./events/kickedFromServer')
const privateMessage = require('./events/receivePrivateMessage')
const guildMessage = require('./events/receiveGuildMessage')
const sayToLeagueOfLosers = require('./actions/sayToLeagueOfLosers')
const otherMemberLeaveServer = require('./events/otherMemberLeaveServer')

const launchTime = Date.now()
let messagesScannedSinceLastAnnounce = 0
const announceTimeSpanInHours = 3
setInterval(async () => {
  if (messagesScannedSinceLastAnnounce > 0) {
    console.log(
      `${messagesScannedSinceLastAnnounce} messages watched in ${announceTimeSpanInHours} hours. (Running for ${Math.round(
        (Date.now() - launchTime) / 60 / 60 / 1000,
      )} hours in ${(await client.guilds.cache.array()).length} guilds)`,
    )
  }
  messagesScannedSinceLastAnnounce = 0
}, Math.round(announceTimeSpanInHours * 60 * 60 * 1000))

client.on('error', e => console.log('Discord.js error:', e.message))
client.on('ready', async () => {
  console.log(
    `Logged in as ${client.user.tag} in ${
      (await client.guilds.cache.array()).length
    } guilds`,
  )
  client.user.setActivity('t!info', { type: 'LISTENING' })
})

client.on('message', async msg => {
  messagesScannedSinceLastAnnounce++
  if (!msg.author || msg.author.id === process.env.BOT_ID) return
  if (!msg.guild || !msg.guild.available) return privateMessage(msg)
  if (msg.content.indexOf('t!sayToLeagueOfLosers') === 0)
    return sayToLeagueOfLosers(client, msg)
  return guildMessage(msg, client)
})

// added to a server
client.on('guildCreate', addedToServer)

// removed from a server
client.on('guildDelete', kickedFromServer)

// other user leaves a guild
client.on('guildMemberRemove', otherMemberLeaveServer)

client.login(process.env.DISCORD_TOKEN)
