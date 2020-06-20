const db = require('../db/firestore')
const {
  getContactsOrOwnerOrModerator,
  getLabelFromUser,
} = require('../scripts/commonFunctions')

module.exports = async ({ guild, settings, message }) => {
  settings =
    settings ||
    (await db.getGuildSettings({
      guildId: guild.id,
    }))
  const currentGuildContacts = getContactsOrOwnerOrModerator({
    guild,
    contact: settings.contact,
  })

  if (!currentGuildContacts)
    return console.log('Failed to find contact points in server', guild.name)
  currentGuildContacts.forEach(singleContact =>
    singleContact.user.send(message.substring(0, 1999)).catch(err => {
      console.log(
        `Failed to contact admin ${getLabelFromUser(singleContact)}: ${
          err.message
        }`,
      )
    }),
  )
}
