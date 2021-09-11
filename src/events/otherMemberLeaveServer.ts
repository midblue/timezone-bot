import db from '../db/firestore'
import * as Discord from 'discord.js-light'

export default async (
  member: Discord.GuildMember | Discord.PartialGuildMember,
) => {
  const guildId = member.guild.id
  const userId = member.id || member.user?.id
  db.removeUserFromGuild({ guildId, userId })
}
