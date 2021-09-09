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
  getOffset,
  getGuildMembers,
  getUserInGuildFromText,
  getLightEmoji,
  standardizeTimezoneName,
} = require('../scripts/commonFunctions')
const { send } = require('../actions/replyInChannel')
const timeFromString = require('../scripts/timeFromString')

module.exports = {
  regex(settings) {
    return new RegExp(
      `^${settings.prefix}(?:at) ?(he?r?e?)? ?(.*)?$`,
      'gi',
    )
  },
  async action({ msg, settings, match }) {
    const onlyHere =
      (match[1] || '').toLowerCase().indexOf('h') === 0
    let timeString = match[2]

    console.log(
      `${
        msg.guild
          ? msg.guild.name.substring(0, 25).padEnd(25, ' ')
          : 'Private Message'
      }${
        msg.guild ? ` (${msg.guild.id})` : ''
      } - Time at ${timeString} ${
        onlyHere ? `in #${msg.channel.name} ` : ''
      }(${msg.author.username})`,
    )

    const res = await timeFromString(timeString, msg)
    if ('error' in res) {
      let errorMessage
      if (res.error === 'invalid time')
        errorMessage = `The 'at' command lists everyone's time at a certain time & location.
Use \`${settings.prefix}at <time> <location/user>\` to see other users' times at a certain time.
Times can be in 12-hour or 24-hour format, and can include days of the week: i.e. "10PM Los Angeles" or "tuesday 18:00 Cairo".
(Use \`${settings.prefix}at here <time> <location/user>\` to restrict the command to users in the current channel.)`
      else if (res.error === 'no user/location')
        errorMessage = `The 'at' command lists everyone's time at a certain time & location.
Use \`${settings.prefix}at <time> <location/user>\` to see other users' times at a certain time.`
      else if (res.error === 'no timezone set')
        errorMessage = `It doesn't look like ${username} has set a timezone for themselves yet.`
      else if (res.error === 'unrecognized location')
        errorMessage = `The 'at' command lists everyone's time at a certain time & place. I didn't recognize the name or location you entered. (${userOrLocation})`

      if (errorMessage)
        send(msg, errorMessage, 'none', settings)
      return
    }

    const {
      username,
      locationName,
      now,
      enteredDateAsObject,
      knownTimezoneDataForEnteredUserOrLocation,
    } = res

    const allUsers = await db.getGuildUsers(msg.guild.id)
    if ((await Object.keys(allUsers)).length === 0)
      return send(
        msg,
        `No other users in this server have added their timezone yet, so there's nothing to compare to.`,
        false,
        settings,
      )

    const entries = {}
    const guildMembers = (
      await getGuildMembers({ msg })
    ).filter(
      (guildMember) =>
        onlyHere
          ? msg.channel.members.get(guildMember.user.id)
          : true, // only members in this channel
    )

    for (let id of Object.keys(allUsers)) {
      const userObject = guildMembers.find(
        (m) => m.user.id === id,
      )
      if (!userObject) continue

      const userStub = allUsers[id]
      const timezoneName = standardizeTimezoneName(
        userStub.timezoneName,
      )

      // ========= determine local time at the entered time =========
      let dateObjectInTimezone = enteredDateAsObject.tz(
        userStub.location,
      )

      const textEntry = dateObjectInTimezone.format()

      if (!entries[textEntry])
        entries[textEntry] = {
          names: [timezoneName],
          localTimeObject: dateObjectInTimezone,
        }
      else if (
        !entries[textEntry].names.includes(timezoneName)
      )
        entries[textEntry].names.push(timezoneName)
    }

    const entriesAsSortedArray = Object.values(
      entries,
    ).sort(
      (a, b) =>
        getOffset(a.localTimeObject) -
        getOffset(b.localTimeObject),
    )

    const typedTime = enteredDateAsObject.format(
      settings.format24 ? 'ddd H:mm' : 'ddd h:mm A',
    )

    // (<t:${Math.round(
    // enteredDateAsObject.valueOf() / 1000,
    // )}:t> for you)
    send(
      msg,
      `At ${typedTime} (<t:${Math.round(
        enteredDateAsObject.valueOf() / 1000,
      )}:R>) ${username ? 'for' : 'in'} ${
        username
          ? username +
            ` (${standardizeTimezoneName(
              knownTimezoneDataForEnteredUserOrLocation.timezoneName,
            )})`
          : locationName.substring(0, 1).toUpperCase() +
            locationName.substring(1)
      }, it ${now ? 'is' : 'will be'}... ${
        onlyHere
          ? ` (for users in <#${msg.channel.id}>)`
          : ''
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
        outputStrings[currentString] = outputStrings[
          currentString
        ].substring(
          0,
          outputStrings[currentString].length - 2,
        )
        currentString++
        outputStrings[currentString] = ''
      }

      // ========= add to string =========
      const timeString = toTimeString(
        timezone.localTimeObject,
        true,
        settings.format24,
      )
      const header = `${getLightEmoji(
        timezone.localTimeObject.hour(),
      )}${timeString} - ${timezone.names.join(', ')}`
      return (outputStrings[currentString] += header + '\n')
    }, '')

    outputStrings[currentString] = outputStrings[
      currentString
    ].substring(0, outputStrings[currentString].length - 1)

    outputStrings.forEach((s) =>
      send(msg, s, true, settings),
    )
  },
}
