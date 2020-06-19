const db = require('../db/firestore')
const {
  currentTimeAt,
  getUserInGuildFromId,
  getLightEmoji,
  standardizeTimezoneName,
} = require('../scripts/commonFunctions')
const { send } = require('../actions/replyInChannel')

module.exports = {
  regex(settings) {
    return new RegExp(`^${settings.prefix}(?:all|users|u|a)$`, 'gi')
  },
  async action({ msg, settings, match, typedUser }) {
    console.log(`${msg.guild.name} - All users (${msg.author.username})`)

    const allUsers = await db.getGuildUsers(msg.guild.id)

    const timezonesWithUsers = await Object.keys(allUsers).reduce(
      async (acc, id) => {
        acc = await acc
        const userStub = allUsers[id]
        const timezoneName = standardizeTimezoneName(userStub.timezoneName)
        if (!acc[timezoneName]) {
          acc[timezoneName] = {
            timezoneName,
            locale: userStub.location,
            usernames: [],
            offset: userStub.offset,
          }
        }
        const userObject = await getUserInGuildFromId(msg.guild, id)
        acc[timezoneName].usernames.push(
          userObject.nickname || userObject.user.username,
        )
        return acc
      },
      {},
    )

    const timezonesWithUsersAsSortedArray = Object.values(
      await timezonesWithUsers,
    ).sort((a, b) => a.offset - b.offset)

    let outputString = timezonesWithUsersAsSortedArray.reduce(
      (acc, timezone) => {
        const header = `${getLightEmoji(timezone.locale)}${currentTimeAt(
          timezone.locale,
          true,
        )} - ${timezone.timezoneName} (UTC${timezone.offset >= 0 ? '+' : ''}${
          timezone.offset
        })`
        const body =
          '\n     ' +
          timezone.usernames.sort((a, b) => (b > a ? -1 : 1)).join('\n     ') +
          '\n\n'
        return acc + header + body
      },
      '',
    )
    outputString = outputString.substring(0, outputString.length - 2)

    if (!outputString)
      return send(
        msg,
        `No users in this server have added their timezone yet. Use \`${settings.prefix}set <city or country name>\` to set your timezone.`,
      )

    send(msg, outputString, true)
  },
}
