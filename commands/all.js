const db = require('../db/firestore')

const {
  currentTimeAt,
  toTimeString,
  dateObjectAt,
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

    const timezonesWithUsers = {}
    const promises = await Object.keys(allUsers)
      .filter((id) => (onlyHere ? msg.channel.members.get(id) : true)) // only members in this channel
      .map((id) => {
        return new Promise(async (resolve) => {
          const userStub = allUsers[id]
          const userObject = await getUserInGuildFromId(msg.guild, id)
          console.log(!!userObject)

          if (userObject) {
            const timezoneName = standardizeTimezoneName(userStub.timezoneName)
            if (!timezonesWithUsers[timezoneName]) {
              timezonesWithUsers[timezoneName] = {
                timezoneName,
                locale: userStub.location,
                currentTime: dateObjectAt(
                  userStub.location,
                  true,
                  settings.format24,
                ),
                usernames: [],
                offset: userStub.offset,
              }
            }
            timezonesWithUsers[timezoneName].usernames.push(
              userObject.nickname || userObject.user.username,
            )
            console.log(userObject.nickname || userObject.user.username)
          }

          return resolve()
        })
      })
    await Promise.all(promises)

    const timezonesWithUsersAsSortedArray = Object.values(
      await timezonesWithUsers,
    ).sort((a, b) => a.currentTime.getTime() - b.currentTime.getTime())
    console.log(timezonesWithUsersAsSortedArray.length)

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

      const header = `${getLightEmoji(timezone.locale)}${toTimeString(
        timezone.currentTime,
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
