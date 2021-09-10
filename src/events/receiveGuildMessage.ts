import db from '../db/firestore'
import * as Discord from 'discord.js-light'
const commands = require(`../commands/index`)

export default async (
  msg: Discord.Message,
  client: Discord.Client,
) => {
  await commands(
    msg,
    await db.getGuildSettings({ guildId: msg.guild?.id }),
    client,
  )
}
