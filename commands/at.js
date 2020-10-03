const db = require('../db/firestore')
const {
  toTimeString,
  dateObjectAt,
  getUserInGuildFromId,
  getLightEmoji,
  standardizeTimezoneName,
} = require('../scripts/commonFunctions')
const { send } = require('../actions/replyInChannel')
const time = require('./time')
const Discord = require('discord.js')
const all = require('./all')
const { KOST } = require('../scripts/timezoneCodes')
const getTimezoneFromLocation = require('../actions/getTimezoneFromLocation')

module.exports = {
  regex(settings) {
    return new RegExp(`^${settings.prefix}(?:at) ?(h|here)? ?(.*)?$`, 'gi')
  },
  async action({ msg, settings, match }) {
    console.log(match)

    const onlyHere = (match[1] || '').toLowerCase().indexOf('h') === 0
    const timeString = match[2]

    console.log(
      `${msg.guild ? msg.guild.name.substring(0, 20) : 'Private Message'}${
        msg.guild ? ` (${msg.guild.id})` : ''
      } - Time at ${timeString} ${onlyHere ? `in #${msg.channel.name} ` : ''}(${
        msg.author.username
      })`,
    )

    if (!timeString)
      return send(
        msg,
        `The 'at' command compares your timezone to others'.
Use \`${settings.prefix}at <time & location>\` to see other users' times at a certain time for you.
Times can be in 12-hour or 24-hour format: i.e. "10PM Los Angeles" or "18:00 Cairo".
(Use \`${settings.prefix}at here <time & location>\` to restrict the command to users in the current channel.)`,
        'none',
        settings,
      )

    let [
      unused,
      hours,
      minutes,
      pmAm,
      location,
    ] = /(\d+):?(\d+)?\s*?(pm|am)?\s?(.*)?$/gi.exec(timeString.toLowerCase())
    if (!minutes) minutes = '00'
    minutes = parseInt(minutes) || 0
    if (minutes > 59) minutes = 59
    if (minutes < 0) minutes = 0
    if (minutes <= 9) minutes = `0${minutes}`

    const typedTime = hours + ':' + minutes + (pmAm ? ' ' + pmAm : '')
    hours = parseInt(hours || -1)

    if (pmAm === 'pm') hours += 12

    if (hours > 24 || hours < 0)
      return send(
        msg,
        `The 'at' command lists everyone's time at a certain time & location.
Use it with \`${settings.prefix}at <time & location>\`.
Times can be in 12-hour or 24-hour format: i.e. "10PM Raleigh" or "18:00 Jakarta". 
(Use \`${settings.prefix}at here <time & location>\` to restrict the command to users in the current channel.)`,
        'none',
        settings,
      )

    const allUsers = await db.getGuildUsers(msg.guild.id)
    let knownTimezoneDataForEnteredLocation = await getTimezoneFromLocation(
      location,
    )

    if (!knownTimezoneDataForEnteredLocation)
      return send(
        msg,
        `The 'at' command lists everyone's time at a certain time & location'. I didn't recognize the location you entered. (${location})`,
        'none',
        settings,
      )

    const currentTimeAtThatLocation = dateObjectAt(
      knownTimezoneDataForEnteredLocation.location,
    )
    const hoursDifference = hours - currentTimeAtThatLocation.getHours()

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
    send(
      msg,
      `At ${typedTime} in ${location}, it will be... ${
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
      const dateObjectInTimezone = dateObjectAt(timezone.locale)
      const currentHour = dateObjectInTimezone.getHours()
      let adjustedHour = currentHour + hoursDifference
      if (adjustedHour < 0) adjustedHour += 24
      if (adjustedHour > 23) adjustedHour -= 24
      dateObjectInTimezone.setHours(adjustedHour)
      dateObjectInTimezone.setMinutes(minutes)
      const timeString = toTimeString(dateObjectInTimezone, timezone.locale)

      const header = `${getLightEmoji(adjustedHour)}${timeString} - ${
        timezone.timezoneName
      }`
      const body = '\n'
      // +'    '
      // +        timezone.usernames.sort((a, b) => (b > a ? -1 : 1)).join('\n     ') +
      // '\n\n'
      return (outputStrings[currentString] += header + body)
    }, '')

    outputStrings[currentString] = outputStrings[currentString].substring(
      0,
      outputStrings[currentString].length - 1,
    )

    outputStrings.forEach((s) => send(msg, s, true, settings))
  },
}
