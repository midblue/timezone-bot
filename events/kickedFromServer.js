// const db = require('../db/firestore')

module.exports = guild => {
  // seems like there's no reason to delete their settings, they might readd later
  // db.removeGuild({ guildId: guild.id })
  console.log('Was removed from a guild: ' + guild.name)
}
