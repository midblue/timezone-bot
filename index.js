require('dotenv').config()
const Discord = require('discord.js')
const client = new Discord.Client()
const addedToServer = require('./events/addedToServer')
const kickedFromServer = require('./events/kickedFromServer')
const privateMessage = require('./events/receivePrivateMessage')
const guildMessage = require('./events/receiveGuildMessage')
const otherMemberLeaveServer = require('./events/otherMemberLeaveServer')
const db = require('./db/firestore')

// const launchTime = Date.now()
let messagesScannedSinceLastNotification = 0
setInterval(() => {
  if (messagesScannedSinceLastNotification > 0) {
    console.log(`${messagesScannedSinceLastNotification} messages scanned.`)
  }
  messagesScannedSinceLastNotification = 0
}, 1 * 60 * 60 * 1000)

client.on('error', e => console.log('Discord.js error:', e.message))
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`)
  client.user.setActivity('t!help', { type: 'LISTENING' })
})

client.on('message', async msg => {
  messagesScannedSinceLastNotification++
  if (!msg.author || msg.author.id === process.env.BOT_ID) return
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

// discordClient.on('message', async msg => {
//   if (msg.author.id == BOT_ID) return

//   const isServer = msg.channel.guild !== undefined
//   if (isServer) msg.guild = msg.channel.guild

//   const senderUsername = isServer
//     ? msg.guild.members.find(member => member.user.id === msg.author.id)
//         .nickname || msg.author.username
//     : msg.author.username

//   let userTimezoneOffset
//   if (db.lastSeen(msg.author.id)) {
//     const updatedUserData = db.update(msg.author.id, {
//       username: senderUsername,
//     })
//     userTimezoneOffset = updatedUserData.offset
//   }

//   // Respond to help command
//   if (msg.content.indexOf(`!help`) === 0 || msg.content.indexOf(`!h`) === 0)
//     return interact.help(msg)

//   // Respond to a request for a user's own timezone
//   if (msg.content.indexOf(`!me`) === 0 || msg.content.indexOf(`!m`) === 0)
//     return interact.me(msg, senderUsername)

//   // Delete self from the list
//   if (msg.content.indexOf(`!removeme`) === 0 || msg.content.indexOf(`!r`) === 0)
//     return interact.removeMe(msg, senderUsername)

//   // Respond to smooch
//   if (msg.content.indexOf(`!smooch`) === 0)
//     return msg.channel.send(`💋💋💋💋💋💋😘😘😘😘`)

//   // Note timezone for @'d user if relevant
//   const atsInMessage = get.ats(msg.content)
//   if (atsInMessage.length > 0)
//     return interact.at(msg, atsInMessage, userTimezoneOffset)

//   // Set user timezone
//   if (msg.content.indexOf(`!set`) === 0 || msg.content.indexOf(`!s`) === 0)
//     return interact.set(msg)

//   // List all users with timezones
//   if (
//     msg.content.indexOf(`!users`) === 0 ||
//     msg.content.indexOf(`!all`) === 0 ||
//     msg.content.indexOf(`!u`) === 0 ||
//     msg.content.indexOf(`!a`) === 0
//   )
//     return interact.listUsers(msg)

//   // Respond to location-only time query
//   if (msg.content.indexOf(`!timein`) === 0 || msg.content.indexOf(`!ti `) === 0)
//     return interact.timeIn(msg)

//   // Respond to location or user time query
//   if (msg.content.indexOf(`!time`) === 0 || msg.content.indexOf(`!t`) === 0)
//     return interact.time(msg)
// })
