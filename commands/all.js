const db = require('../db/firestore')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
dayjs.extend(utc)
dayjs.extend(timezone)

const {
  currentTimeAt,
  toTimeString,
  dateObjectAt,
  getOffset,
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
  async action({
    msg,
    settings,
    match,
    here = false,
    users,
    prependText,
    count,
  }) {
    const onlyHere =
      here ||
      (match[1] || '').toLowerCase() === 'here' ||
      (match[1] || '').toLowerCase() === 'h'

    console.log(
      `${
        msg.guild
          ? msg.guild.name.substring(0, 25).padEnd(25, ' ')
          : 'Private Message'
      }${
        msg.guild ? ` (${msg.guild.id})` : ''
      } - All users ${
        onlyHere ? `in #${msg.channel.name} ` : ''
      }(${msg.author.username})`,
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
    const guildMembers = (
      users || (await getGuildMembers({ msg }))
    ).filter(
      (guildMember) =>
        onlyHere
          ? msg.channel.members.get(guildMember.user.id)
          : true, // only members in this channel
    )
    let foundUsersCount = 0

    for (let id of Object.keys(allUsers)) {
      const userObject = guildMembers.find(
        (m) => m.user.id === id,
      )
      if (!userObject) {
        // db.removeUserFromGuild({ guildId: msg.guild.id, userId: id })
        continue
      }
      foundUsersCount++

      const userStub = allUsers[id]

      const timezoneUID =
        standardizeTimezoneName(userStub.timezoneName) +
        dayjs().tz(userStub.location).format('Z')
      if (!timezonesWithUsers[timezoneUID]) {
        timezonesWithUsers[timezoneUID] = {
          timezoneName: standardizeTimezoneName(
            userStub.timezoneName,
          ),
          locale: userStub.location,
          currentTime: dateObjectAt(
            userStub.location,
            true,
            settings.format24,
          ),
          usernames: [],
        }
      }

      let context = ''
      if (settings.verboseAll)
        context = userObject.roles.highest.name
      if (context === '@everyone') context = ''

      timezonesWithUsers[timezoneUID].usernames.push(
        (userObject.nickname || userObject.user.username) +
          (context ? ` (@${context})` : ''),
      )
    }

    const timezonesWithUsersAsSortedArray = Object.values(
      timezonesWithUsers,
    ).sort(
      (a, b) =>
        a.currentTime.valueOf() - b.currentTime.valueOf(),
    )

    if (!timezonesWithUsersAsSortedArray.length)
      return send(
        msg,
        `No users with that criteria have added their timezone yet. Use \`${settings.prefix}set <city or country name>\` to set your timezone.`,
        'none',
        settings,
      )

    send(
      msg,
      `${foundUsersCount} users with saved timezones${
        prependText ? ' ' + prependText : ''
      }${onlyHere ? ` in <#${msg.channel.id}>` : ''}:`,
      'none',
      settings,
    )

    //  character limit is 2000, so, batching.
    let outputStrings = [''],
      currentString = 0
    timezonesWithUsersAsSortedArray.forEach((timezone) => {
      if (outputStrings[currentString].length >= 1500) {
        outputStrings[currentString] = outputStrings[
          currentString
        ].substring(
          0,
          outputStrings[currentString].length - 2,
        )
        currentString++
        outputStrings[currentString] = ''
      }

      const header = `${getLightEmoji(
        timezone.locale,
      )}${toTimeString(
        timezone.currentTime,
        true,
        settings.format24,
      )} - ${timezone.timezoneName} (UTC${dayjs()
        .tz(timezone.locale)
        .format('Z')})`
      const body = count
        ? ' - ' +
          timezone.usernames.length +
          ` user${
            timezone.usernames.length === 1 ? '' : 's'
          }\n`
        : '\n     ' +
          timezone.usernames
            .sort((a, b) =>
              a.toLowerCase() > b.toLowerCase() ? 1 : -1,
            )
            .join('\n     ') +
          '\n\n'
      return (outputStrings[currentString] += header + body)
    }, '')

    outputStrings[currentString] = outputStrings[
      currentString
    ].substring(
      0,
      outputStrings[currentString].length - (count ? 1 : 2),
    )

    outputStrings.forEach((s) =>
      send(msg, s, true, settings),
    )
  },
}
