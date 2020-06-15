const db = require('../db/firestore')
const {
  getUserInGuildFromId,
  currentTimeAt,
} = require('../scripts/commonFunctions')
const { send } = require('../actions/replyInChannel')

const onlyRespondIfLastSeenIsOlderThanMs = 2 * 60 * 60 * 1000

module.exports = async msg => {
  const mentionedUserIds = msg.mentions.members.array().map(u => u.id)
  if (mentionedUserIds.length === 0) return

  const savedUsers = await db.getGuildUsers(msg.guild.id)
  const matchedUsers = mentionedUserIds
    .map(id => (savedUsers[id] ? { ...savedUsers[id], id } : null))
    .filter(u => u)

  const fullUserData = (await msg.guild.members.fetch())
    .array()
    .map(async fullMember => {
      const found = matchedUsers.find(
        matched => matched.id === fullMember.user.id,
      )
      if (!found) return
      const lastMessage = await msg.channel.messages.fetch(
        fullMember.lastMessageID,
      )
      return {
        ...found,
        lastMessageTime: lastMessage.editedAt || lastMessage.createdAt,
      }
    })
  const usersToList = (await Promise.all(fullUserData))
    .filter(u => u)
    .filter(
      u =>
        new Date(u.lastMessageTime).getTime() <
        Date.now() - onlyRespondIfLastSeenIsOlderThanMs,
    )
  if (!usersToList.length) return

  let outputString = `\`It's `
  for (let index = 0; index < usersToList.length; index++) {
    const user = usersToList[index]
    const isLast = index === usersToList.length - 1
    const isNextToLast = index === usersToList.length - 2
    const currentGuildUser = await getUserInGuildFromId(msg.guild, user.id)
    outputString += `${currentTimeAt(user.location)} for ${
      currentGuildUser.nickname || currentGuildUser.user.username
    } (${user.timezoneName})`
    if (!isLast && usersToList.length > 2) outputString += ', '
    if (isNextToLast) outputString += ' and '
    if (!isLast && usersToList.length > 2) outputString += '\n'
  }
  outputString += '.`'
  send(msg, outputString)
}
