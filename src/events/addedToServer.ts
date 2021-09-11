import db from '../db/firestore'
import * as Discord from 'discord.js'
import { getGuildMembers } from '../scripts/commonFunctions'

export default async (guild: Discord.Guild) => {
  if (await db.hasGuild({ guildId: guild.id }))
    return console.log(
      `> > > > > >           Was re-added to a guild:`,
      guild.name,
      guild.id,
    )

  await db.addGuild({
    guildId: guild.id,
    guildName: guild.name,
  })
  console.log(
    `> > > > > >           Was added to a new guild:`,
    guild.name,
    guild.id,
    `(${(await getGuildMembers({ guild })).length} users)`,
  )
}
