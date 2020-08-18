const db = require('../db/firestore')

module.exports = async member => {
  const guildId = member.guild.id
  const memberId = member.id || member.user.id
  db.removeUserFromGuild(guildId, memberId)
}
