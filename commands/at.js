const db = require('../db/firestore')
const dayjs = require('dayjs')
const relativeTime = require('dayjs/plugin/relativeTime')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(relativeTime)

const {
  toTimeString,
  dateObjectAt,
  getUserInGuildFromId,
  getGuildMembers,
  getUserInGuildFromText,
  getLightEmoji,
  standardizeTimezoneName,
} = require('../scripts/commonFunctions')
const { send } = require('../actions/replyInChannel')
const getTimezoneFromLocation = require('../actions/getTimezoneFromLocation')

module.exports = {
  regex(settings) {
    return new RegExp(`^${settings.prefix}(?:at) ?(he?r?e?)? ?(.*)?$`, 'gi')
  },
  async action({ msg, settings, match }) {
    const onlyHere = (match[1] || '').toLowerCase().indexOf('h') === 0
    let timeString = match[2]

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
        `The 'at' command lists everyone's time at a certain time & location'.
Use \`${settings.prefix}at <time> <location/user>\` to see other users' times at a certain time.
Times can be in 12-hour or 24-hour format, and can include days of the week: i.e. "10PM Los Angeles" or "tuesday 18:00 Cairo".
(Use \`${settings.prefix}at here <time> <location/user>\` to restrict the command to users in the current channel.)`,
        'none',
        settings,
      )

    let dayOfWeek = /^(?:mon|tues?|wedn?e?s?|thur?s?|fri|satu?r?|sun)d?a?y?/gi.exec(
      timeString.toLowerCase(),
    )
    if (dayOfWeek) {
      dayOfWeek = dayOfWeek[0]
      timeString = timeString.substring(dayOfWeek.length + 1)
      dayOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].findIndex(
        (d) => dayOfWeek.substring(0, 3) === d,
      )
    }

    let tsMatch = /(\d+):?(\d+)?\s*?(pm|am)?\s?(.*)?$/gi.exec(
      timeString.toLowerCase(),
    )
    let [unused, hours, minutes, pmAm, userOrLocation] = tsMatch || []

    if (!userOrLocation)
      return send(
        msg,
        `The 'at' command lists everyone's time at a certain time & location.
Use \`${settings.prefix}at <time> <location/user>\` to see other users' times at a certain time.`,
        'none',
        settings,
      )

    if (!minutes) minutes = '00'
    minutes = parseInt(minutes) || 0
    if (minutes > 59) minutes = 59
    if (minutes < 0) minutes = 0
    if (minutes <= 9) minutes = `0${minutes}`

    hours = parseInt(hours || -1)
    if (pmAm === 'am' && hours === 12) hours = 0
    if (pmAm === 'pm' && hours < 12) hours += 12 // since 12pm is already correct

    if (hours > 24 || hours < 0)
      return send(
        msg,
        `The 'at' command lists everyone's time at a certain time & location.
Use \`${settings.prefix}at <time> <location/user>\` to see other users' times at a certain time.
Times can be in 12-hour or 24-hour format, and can include days of the week: i.e. "10PM Los Angeles" or "tuesday 18:00 Cairo".
(Use \`${settings.prefix}at here <time> <location/user>\` to restrict the command to users in the current channel.)`,
        'none',
        settings,
      )

    //* awaiting discord fix, this is disabled... (re-enabled now!)
    // let targetUser
    // const mentionedUserIds = msg.mentions.members.array()
    // if (mentionedUserIds.length)
    //   targetUser = {
    //     ...(await getUserInGuildFromId({
    //       guildId: msg.guild.id,
    //       userId: mentionedUserIds[0].id,
    //     })),
    //     nickname:
    //       mentionedUserIds[0].nickname || mentionedUserIds[0].user.username,
    //     user: mentionedUserIds[0].user,
    //   }

    let knownTimezoneDataForEnteredUserOrLocation,
      username = false
    const targetUser = await getUserInGuildFromText(msg, userOrLocation)

    if (targetUser) {
      username = targetUser.nickname || targetUser.user.username
      knownTimezoneDataForEnteredUserOrLocation = await db.getUserInGuildFromId(
        {
          guildId: msg.guild.id,
          userId: targetUser.user.id,
        },
      )

      if (!knownTimezoneDataForEnteredUserOrLocation)
        return send(
          msg,
          `It doesn't look like ${username} has set a timezone for themselves yet.`,
          false,
          settings,
        )
    } else {
      knownTimezoneDataForEnteredUserOrLocation = await getTimezoneFromLocation(
        userOrLocation,
      )

      if (!knownTimezoneDataForEnteredUserOrLocation)
        return send(
          msg,
          `The 'at' command lists everyone's time at a certain time & place. I didn't recognize the name or location you entered. (${userOrLocation})`,
          false,
          settings,
        )
    }

    let enteredDateAsObject = dayjs()
      .tz(knownTimezoneDataForEnteredUserOrLocation.location, true)
      .minute(parseInt(minutes))
      .hour(parseInt(hours))
    if (dayOfWeek !== null)
      enteredDateAsObject = enteredDateAsObject.day(dayOfWeek)

    const allUsers = await db.getGuildUsers(msg.guild.id)
    if ((await Object.keys(allUsers)).length === 0)
      return send(
        msg,
        `No other users in this server have added their timezone yet, so there's nothing to compare to.`,
        false,
        settings,
      )

    const entries = {}
    const guildMembers = (await getGuildMembers({ msg })).filter(
      (guildMember) =>
        onlyHere ? msg.channel.members.get(guildMember.user.id) : true, // only members in this channel
    )

    for (let id of Object.keys(allUsers)) {
      const userObject = guildMembers.find((m) => m.user.id === id)
      if (!userObject) continue

      const userStub = allUsers[id]
      const timezoneName = standardizeTimezoneName(userStub.timezoneName)

      // ========= determine local time =========
      let dateObjectInTimezone = dayjs(enteredDateAsObject).tz(
        userStub.location,
      )

      const textEntry = dateObjectInTimezone.format()

      if (!entries[textEntry])
        entries[textEntry] = {
          names: [timezoneName],
          localTimeAt: dateObjectInTimezone,
        }
      else if (!entries[textEntry].names.includes(timezoneName))
        entries[textEntry].names.push(timezoneName)
    }

    const entriesAsSortedArray = Object.values(await entries).sort((a, b) =>
      a.localTimeAt.isBefore(b.localTimeAt) ? 1 : -1,
    )
    console.log(
      entriesAsSortedArray[0].localTimeAt.isBefore(
        entriesAsSortedArray[1].localTimeAt,
      ),
    )

    const typedTime = enteredDateAsObject.format(
      settings.format24 ? 'ddd H:mm' : 'ddd h:mm A',
    )

    send(
      msg,
      `At ${typedTime} ${username ? 'for' : 'in'} ${
        username
          ? username +
            ` (${standardizeTimezoneName(
              knownTimezoneDataForEnteredUserOrLocation.timezoneName,
            )})`
          : userOrLocation.substring(0, 1).toUpperCase() +
            userOrLocation.substring(1)
      }, it will be... ${
        onlyHere ? ` (for users in <#${msg.channel.id}>)` : ''
      }`,
      'none',
      settings,
    )

    //  character limit is 2000, so, batching.
    let outputStrings = [''],
      currentString = 0

    entriesAsSortedArray.forEach((timezone) => {
      // ========= handle batching =========
      if (outputStrings[currentString].length >= 1500) {
        outputStrings[currentString] = outputStrings[currentString].substring(
          0,
          outputStrings[currentString].length - 2,
        )
        currentString++
        outputStrings[currentString] = ''
      }

      // ========= add to string =========
      const timeString = toTimeString(
        timezone.localTimeAt,
        true,
        settings.format24,
      )
      const header = `${getLightEmoji(
        timezone.localTimeAt.hour(),
      )}${timeString} - ${timezone.names.join(', ')}`
      return (outputStrings[currentString] += header + '\n')
    }, '')

    outputStrings[currentString] = outputStrings[currentString].substring(
      0,
      outputStrings[currentString].length - 1,
    )

    outputStrings.forEach((s) => send(msg, s, true, settings))
  },
}
