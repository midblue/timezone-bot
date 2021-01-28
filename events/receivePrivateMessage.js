const timeIn = require('../commands/timein')
const defaultSettings = require('../scripts/defaultServerSettings')

module.exports = async (msg) => {
  await timeIn.action({
    msg,
    settings: defaultSettings,
    match: ['', ' ', msg.content],
  })

  // msg.channel.send(`I only work in a server channel for now.

  // If you're looking for the invite link, it's https://discord.com/api/oauth2/authorize?client_id=723017262369472603&permissions=75840&scope=bot`)
}
