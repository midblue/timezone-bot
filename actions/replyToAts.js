const db = require('../db/firestore')
const {
  getUserInGuildFromId,
  getLightEmoji,
  currentTimeAt,
  standardizeTimezoneName,
} = require('../scripts/commonFunctions')
const { send } = require('./replyInChannel')
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
      if (fullMember.id === msg.author.id) return
      const found = matchedUsers.find(
        matched => matched.id === fullMember.user.id,
      )
      if (!found) return
      let lastMessage
      if (fullMember.lastMessageID) {
        try {
          lastMessage = await msg.channel.messages.fetch(
            fullMember.lastMessageID,
          )
        } catch (e) {
          console.log('Failed to get last message for', msg.author.username)
          // todo check permissions issue for this, seems to be appearing too often
          // todo and also for the sender???
        }
      }
      return {
        ...found,
        displayName: fullMember.nickname || fullMember.user.username,
        lastMessageTime: lastMessage
          ? lastMessage.editedAt || lastMessage.createdAt
          : 0,
      }
    })

  let usersToList = (await Promise.all(userDataWithLastMessageTime)).filter(
    u => u,
  )

  // todo double check that these work as they should

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
      !authorTimezoneData ||
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

  let outputString = `It's `
  for (let index = 0; index < usersToList.length; index++) {
    const user = usersToList[index]
    const isLast = index === usersToList.length - 1
    const isNextToLast = index === usersToList.length - 2
    outputString += `${getLightEmoji(user.location)}${currentTimeAt(
      user.location,
    )} for ${user.displayName} (${standardizeTimezoneName(user.timezoneName)})`
    if (!isLast && usersToList.length > 2) outputString += ', '
    if (isNextToLast) outputString += ' and '
    if (!isLast && usersToList.length > 2) outputString += '\n'
  }
  outputString += '.'

  console.log(
    `${msg.guild.name} - Responding to ${usersToList.length} user @${
      usersToList.length === 1 ? '' : 's'
    } (${msg.author.username} > ${usersToList
      .map(u => u.displayName)
      .join(', ')})`,
  )

  send(msg, outputString)
}
