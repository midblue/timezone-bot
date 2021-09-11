// const db = require('../db/firestore')
import * as Discord from 'discord.js'

export default (guild: Discord.Guild) => {
  // seems like there's no reason to delete their settings, they might readd later
  // db.removeGuild({ guildId: guild.id })
  if (guild.name)
    console.log(
      `< < < < < <           Was removed from a guild: ` +
        guild.name,
    )
}
