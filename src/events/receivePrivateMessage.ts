import timeIn from '../commands/timein'
import * as Discord from 'discord.js-light'
const defaultSettings = require(`../scripts/defaultServerSettings`)

export default async (msg: Discord.Message) => {
  await timeIn.action({
    msg,
    settings: defaultSettings,
    match: [``, ` `, msg.content],
  })

  // msg.channel.send(`I only work in a server channel for now.

  // If you're looking for the invite link, it's https://discord.com/api/oauth2/authorize?client_id=723017262369472603&permissions=75840&scope=bot`)
}
