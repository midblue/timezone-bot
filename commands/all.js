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
    return new RegExp(
      `^${settings.prefix}(?:all|users|allusers|list|u|a(?!t|ut|d)) ?(.*)?$`,
      'gi',
    )
  },
  async action({ msg, settings, match, here = false }) {
    const onlyHere =
      here ||
      (match[1] || '').toLowerCase() === 'here' ||
      (match[1] || '').toLowerCase() === 'h'

    console.log(
      `${msg.guild ? msg.guild.name.substring(0, 20) : 'Private Message'}${
        msg.guild ? ` (${msg.guild.id})` : ''
      } - All users ${onlyHere ? `in #${msg.channel.name} ` : ''}(${
        msg.author.username
      })`,
    )

    const allUsers = await db.getGuildUsers(msg.guild.id)

    if ((await Object.keys(allUsers)).length === 0)
      return send(
        msg,
        `No users in this server have added their timezone yet. Use \`${settings.prefix}set <city or country name>\` to set your timezone.`,
        false,
        settings,
      )

    const timezonesWithUsers = await Object.keys(allUsers)
      .filter((id) => (onlyHere ? msg.channel.members.get(id) : true)) // only members in this channel
      .reduce(async (acc, id) => {
        acc = await acc
        const userStub = allUsers[id]
        // todo we could do them all at once
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
      }, {})

    const timezonesWithUsersAsSortedArray = Object.values(
      await timezonesWithUsers,
    ).sort((a, b) => a.offset - b.offset)

    //  character limit is 2000, so, batching.
    if (onlyHere)
      send(
        msg,
        `Users with saved timezones in <#${msg.channel.id}>:`,
        'none',
        settings,
      )
    let outputStrings = [''],
      currentString = 0
    timezonesWithUsersAsSortedArray.forEach((timezone) => {
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
        settings.format24,
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

    outputStrings.forEach((s) => send(msg, s, true, settings))
  },
}
