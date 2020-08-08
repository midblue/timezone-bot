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
    return new RegExp(`^${settings.prefix}(?:all|users|allusers|u|a)$`, 'gi')
  },
  async action({ msg, settings, match, typedUser }) {
    console.log(`${msg.guild.name} - All users (${msg.author.username})`)

    const allUsers = await db.getGuildUsers(msg.guild.id)

    // todo empty ones showing up
    const timezonesWithUsers = await Object.keys(allUsers).reduce(
      async (acc, id) => {
        acc = await acc
        const userStub = allUsers[id]
        const userObject = await getUserInGuildFromId(msg.guild, id)

        if (userObject) {
          const timezoneName = standardizeTimezoneName(userStub.timezoneName)
          if (!acc[timezoneName]) {
            acc[timezoneName] = {
              timezoneName,
              locale: userStub.location,
              usernames: [],
              offset: userStub.offset,
            }
          }
          acc[timezoneName].usernames.push(
            userObject.nickname || userObject.user.username,
          )
        }
        return acc
      },
      {},
    )

    const timezonesWithUsersAsSortedArray = Object.values(
      await timezonesWithUsers,
    ).sort((a, b) => a.offset - b.offset)

    //  character limit is 2000, so, batching.
    let outputStrings = [''],
      currentString = 0
    timezonesWithUsersAsSortedArray.forEach(timezone => {
      if (outputStrings[currentString].length >= 1500) {
        outputStrings[currentString] = outputStrings[currentString].substring(
          0,
          outputStrings[currentString].length - 2,
        )
        currentString++
        outputStrings[currentString] = ''
      }

      const header = `${getLightEmoji(timezone.locale)}${currentTimeAt(
        timezone.locale,
        true,
      )} - ${timezone.timezoneName}` // (UTC${timezone.offset >= 0 ? '+' : ''}${timezone.offset})
      const body =
        '\n     ' +
        timezone.usernames.sort((a, b) => (b > a ? -1 : 1)).join('\n     ') +
        '\n\n'
      return (outputStrings[currentString] += header + body)
    }, '')

    outputStrings[currentString] = outputStrings[currentString].substring(
      0,
      outputStrings[currentString].length - 2,
    )

    if (outputStrings[0] === '')
      return send(
        msg,
        `No users in this server have added their timezone yet. Use \`${settings.prefix}set <city or country name>\` to set your timezone.`,
      )

    outputStrings.forEach(s => send(msg, s, true))
  },
}
