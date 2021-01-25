const db = require('../db/firestore')

const {
  currentTimeAt,
  toTimeString,
  dateObjectAt,
  getUserInGuildFromId,
  getGuildMembers,
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
  async action({ msg, settings, match, here = false, users }) {
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
    const guildMembers = (users || (await getGuildMembers({ msg }))).filter(
      (guildMember) =>
        onlyHere ? msg.channel.members.get(guildMember.user.id) : true, // only members in this channel
    )

    for (let id of Object.keys(allUsers)) {
      const userObject = guildMembers.find((m) => m.user.id === id)
      if (!userObject) {
        // db.removeUserFromGuild({ guildId: msg.guild.id, userId: id })
        continue
      }

      const userStub = allUsers[id]

      const timezoneName = standardizeTimezoneName(userStub.timezoneName)
      if (!timezonesWithUsers[timezoneName]) {
        timezonesWithUsers[timezoneName] = {
          timezoneName,
          locale: userStub.location,
          currentTime: dateObjectAt(userStub.location, true, settings.format24),
          usernames: [],
          offset: userStub.offset,
        }
      }
      timezonesWithUsers[timezoneName].usernames.push(
        userObject.nickname || userObject.user.username,
      )
    }

    const timezonesWithUsersAsSortedArray = Object.values(
      timezonesWithUsers,
    ).sort((a, b) => a.currentTime.getTime() - b.currentTime.getTime())

    if (!timezonesWithUsersAsSortedArray.length)
      return send(
        msg,
        `No users with that criteria have added their timezone yet. Use \`${settings.prefix}set <city or country name>\` to set your timezone.`,
        'none',
        settings,
      )

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
        timezone.usernames
          .sort((a, b) => (a.toLowerCase() > b.toLowerCase() ? 1 : -1))
          .join('\n     ') +
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
