const db = require('../db/firestore')
const {
  getUserInGuildFromId,
  currentTimeAt,
} = require('../scripts/commonFunctions')
const { send } = require('../actions/replyInChannel')
const { auth } = require('firebase-admin')

const onlyRespondIfLastSeenIsOlderThanMs = 2 * 60 * 60 * 1000
const onlyRespondIfNotAnnouncedInMs = 30 * 60 * 1000
const onlyRespondIfTimezoneOffsetDifferenceIsGreaterThanOrEqualTo = 2

let recentlyAnnounced = []

// todo other @ related stuff

module.exports = async msg => {
  const mentionedUserIds = msg.mentions.members.array().map(u => u.id)
  if (mentionedUserIds.length === 0) return

  const authorId = msg.author.id

  const savedUsers = await db.getGuildUsers(msg.guild.id)
  const authorTimezoneData = savedUsers[authorId]
  const matchedUsers = mentionedUserIds
    .map(id => (savedUsers[id] ? { ...savedUsers[id], id } : null))
    .filter(u => u)

  const userDataWithLastMessageTime = (await msg.guild.members.fetch())
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

  let usersToList = (await Promise.all(userDataWithLastMessageTime)).filter(
    u => u,
  )

  // filter out the author themselves
  usersToList = usersToList.filter(u => u.id !== authorId)

  // filter out anyone who has been recently announced
  usersToList = usersToList.filter(
    u => !recentlyAnnounced.find(id => id === u.id),
  )

  // filter out anyone who is active now
  usersToList = usersToList.filter(
    u =>
      new Date(u.lastMessageTime).getTime() <
      Date.now() - onlyRespondIfLastSeenIsOlderThanMs,
  )

  // filter out anyone whose timezone is very close to the author
  usersToList = usersToList.filter(
    u =>
      Math.abs(u.offset - authorTimezoneData.offset) >=
      onlyRespondIfTimezoneOffsetDifferenceIsGreaterThanOrEqualTo,
  )

  if (!usersToList.length) return

  // add to recently announced list
  usersToList
    .map(u => u.id)
    .forEach(id => {
      recentlyAnnounced.push(id)
      setTimeout(() => {
        recentlyAnnounced = recentlyAnnounced.filter(
          existingId => existingId !== id,
        )
      }, onlyRespondIfNotAnnouncedInMs)
    })

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
