const db = require('../db/firestore')
const {
  currentTimeAt,
  getUserInGuildFromId,
  getLightEmoji,
  standardizeTimezoneName,
} = require('../scripts/commonFunctions')
const { send } = require('../actions/replyInChannel')
const time = require('./time')
const Discord = require('discord.js')
const all = require('./all')

module.exports = {
  regex(settings) {
    return new RegExp(`^${settings.prefix}(?:at) ?(.*)?`, 'gi')
  },
  async action({ msg, settings, match }) {
    console.log(match)
    const onlyHere = (match[1] || '').toLowerCase().indexOf('h') >= 0

    console.log(
      `${msg.guild ? msg.guild.name.substring(0, 20) : 'Private Message'}${
        msg.guild ? ` (${msg.guild.id})` : ''
      } - Time at ${match[1]} ${onlyHere ? `in #${msg.channel.name} ` : ''}(${
        msg.author.username
      })`,
    )

    if (!match[1])
      return send(
        msg,
        `The 'at' command compares your timezone to others'.
Use \`${settings.prefix}at <time>\` to see other users' times at a certain time for you.
(Use \`${settings.prefix}at <time> here\` to restrict the command to users in the current channel.)`,
        'none',
        settings,
      )

    let [unused, hours, minutes, pmAm] = /(\d+):?(\d+)?\s*?(pm|am)?/gi.exec(
      match[1].toLowerCase(),
    )
    hours = parseInt(hours)
    if (!minutes) minutes = '00'

    if (pmAm === 'pm') hours += 12

    if (hours > 24 || hours < 0)
      return send(
        msg,
        `The 'at' command compares your timezone to others'.
Use \`${settings.prefix}at <time>\` to see other users' times at a certain time for you.
Times can be in 12-hour or 24-hour format: i.e. "10PM" or "18:00". 
(Use \`${settings.prefix}at <time> here\` to restrict the command to users in the current channel.)`,
        'none',
        settings,
      )

    const allUsers = await db.getGuildUsers(msg.guild.id)
    const senderTimezone = allUsers[msg.author.id]

    if (!senderTimezone)
      return send(
        msg,
        `The 'at' command compares your timezone to others'. Use \`${settings.prefix}set <city or country name>\` to set your timezone first, and then you can use this command.`,
        'none',
        settings,
      )

    delete allUsers[msg.author.id]

    if ((await Object.keys(allUsers)).length === 0)
      return send(
        msg,
        `No other users in this server have added their timezone yet, so there's nothing to compare to.`,
        false,
        settings,
      )

    const timezonesWithUsers = await Object.keys(allUsers)
      .filter((id) => (onlyHere ? msg.channel.members.get(id) : true)) // only members in this channel
      .reduce(async (acc, id) => {
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
              difference: senderTimezone.offset - userStub.offset,
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
        `At ${hours}:${minutes} in ${
          senderTimezone.timezoneName
        }, it will be... ${
          onlyHere ? ` (for users in <#${msg.channel.id}>)` : ''
        }`,
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
      const currentTimeInTimezone = currentTimeAt(timezone.locale)

      const header = `${getLightEmoji(
        timezone.locale,
      )}${currentTimeInTimezone} - ${timezone.timezoneName}`
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
