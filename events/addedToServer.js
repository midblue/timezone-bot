const db = require('../db/firestore')
const { getGuildMembers } = require('../scripts/commonFunctions')

module.exports = async (guild) => {
  if (await db.hasGuild({ guildId: guild.id }))
    return console.log(
      '> > > > > >           Was re-added to a guild: ' + guild.name,
    )

  await db.addGuild({
    guildId: guild.id,
    guildName: guild.name,
  })
  console.log(
    '> > > > > >           Was added to a new guild:',
    guild.name,
    `(${(await getGuildMembers({ guild })).length} users)`,
    guild.members.size,
  )
}
