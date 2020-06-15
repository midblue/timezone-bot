const db = require('../db/firestore')
const {
  currentTimeAt,
  getUserInGuildFromId,
} = require('../scripts/commonFunctions')
const { send } = require('../actions/replyInChannel')

module.exports = {
  regex(settings) {
    return new RegExp(`^${settings.prefix}(?:all|users|u|a)$`, 'gi')
  },
  async action({ msg, settings, match, typedUser }) {
    console.log(`${msg.guild.name} - All users`)

    const allUsers = await db.getGuildUsers(msg.guild.id)

    const timezonesWithUsers = await Object.keys(allUsers).reduce(
      async (acc, id) => {
        const userStub = allUsers[id]
        const timezoneName = userStub.timezoneName.replace(
          /(Standard |Daylight )/gi,
          '',
        )
        if (!acc[timezoneName]) {
          acc[timezoneName] = {
            timezoneName,
            locale: userStub.location,
            label: `${userStub.timezoneName} (UTC ${
              userStub.offset >= 0 ? '+' : ''
            }${userStub.offset})`,
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
      timezonesWithUsers,
    ).sort((a, b) => b.offset - a.offset)

    let outputString = timezonesWithUsersAsSortedArray.reduce(
      (acc, timezone) => {
        const header = `${currentTimeAt(
          timezone.locale,
          true,
        )} - ${timezone.label.replace(/(Standard |Daylight )/gi, '')}`
        const body =
          '\n  ' +
          timezone.usernames.sort((a, b) => (b > a ? -1 : 1)).join('\n  ') +
          '\n\n'
        return acc + header + body
      },
      '',
    )
    outputString = outputString.substring(0, outputString.length - 2)

    if (!outputString)
      return send(
        msg,
        `\`No users in this server have added their timezone yet. Use \`${settings.prefix}set <city or country name>\` to set your timezone.\``,
      )

    send(msg, `\`\`\`${outputString}\`\`\``)
  },
}
