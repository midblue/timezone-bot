const db = require('../db/firestore')
const timezoneCodeToLocation = require('./timezoneCodeToLocationData')
const {
  getUserInGuildFromText,
} = require('./commonFunctions')
const getTimezoneFromLocation = require('../actions/getTimezoneFromLocation')
const dayjs = require('dayjs')
const relativeTime = require('dayjs/plugin/relativeTime')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(relativeTime)

module.exports = async (timeString = '', msg) => {
  let dayOfWeek =
    /^(?:mon|tues?|wedn?e?s?|thur?s?|fri|satu?r?|sun)d?a?y?/gi.exec(
      timeString.toLowerCase(),
    )
  if (dayOfWeek) {
    dayOfWeek = dayOfWeek[0]
    timeString = timeString.substring(dayOfWeek.length + 1)
    dayOfWeek = [
      'sun',
      'mon',
      'tue',
      'wed',
      'thu',
      'fri',
      'sat',
    ].findIndex((d) => dayOfWeek.substring(0, 3) === d)
  }

  let tsMatch =
    /(\d{1,2}|now)?:?(\d{2})?\s*?(pm|am)?\s?(.*)?$/gi.exec(
      timeString.toLowerCase(),
    )
  let [unused, hours, minutes, pmAm, userOrLocation] =
    tsMatch || []

  if (!userOrLocation && msg)
    userOrLocation = msg.author.username
  if (!userOrLocation) return { error: 'no user/location' }

  let now = false
  if (!hours || hours === 'now') now = true

  if (!now) {
    if (!minutes) minutes = '00'
    minutes = parseInt(minutes) || 0
    if (minutes > 59) minutes = 59
    if (minutes < 0) minutes = 0
    if (minutes <= 9) minutes = `0${minutes}`

    hours = parseInt(hours || -1)
    if (pmAm === 'am' && hours === 12) hours = 0
    if (pmAm === 'pm' && hours < 12) hours += 12 // since 12pm is already correct

    if (hours > 24 || hours < 0)
      return { error: 'invalid time' }
  }

  let knownTimezoneDataForEnteredUserOrLocation,
    username = false

  // * first, check for a timezone code
  const timezoneCodeLocationData =
    timezoneCodeToLocation(userOrLocation)
  if (timezoneCodeLocationData) {
    timezoneCodeLocationData.location =
      timezoneCodeLocationData.location
    knownTimezoneDataForEnteredUserOrLocation =
      timezoneCodeLocationData
  }

  let targetUser
  if (!timezoneCodeLocationData && msg) {
    // * if it wasn't a timezone code, check for a username
    targetUser = await getUserInGuildFromText(
      msg,
      userOrLocation,
    )
  }
  // * if it was a username, use their data
  if (targetUser && msg) {
    username =
      targetUser.nickname || targetUser.user.username
    knownTimezoneDataForEnteredUserOrLocation =
      await db.getUserInGuildFromId({
        guildId: msg.guild.id,
        userId: targetUser.user.id,
      })

    if (!knownTimezoneDataForEnteredUserOrLocation)
      return { error: 'no timezone set' }
  }
  // * fallback to check for a typed location name
  else {
    knownTimezoneDataForEnteredUserOrLocation =
      await getTimezoneFromLocation(userOrLocation)

    if (!knownTimezoneDataForEnteredUserOrLocation)
      return { error: 'unrecognized location' }
  }

  let enteredDateAsObject = dayjs()
  enteredDateAsObject =
    knownTimezoneDataForEnteredUserOrLocation.utcOffset !==
    undefined
      ? enteredDateAsObject.utcOffset(
          knownTimezoneDataForEnteredUserOrLocation.utcOffset,
        )
      : enteredDateAsObject.tz(
          knownTimezoneDataForEnteredUserOrLocation.location,
          true,
        )
  if (!now) {
    enteredDateAsObject = enteredDateAsObject
      .minute(parseInt(minutes))
      .hour(parseInt(hours))
    if (dayOfWeek !== null)
      enteredDateAsObject =
        enteredDateAsObject.day(dayOfWeek)
  }

  return {
    username,
    enteredDateAsObject,
    now,
    locationName: userOrLocation,
    knownTimezoneDataForEnteredUserOrLocation,
  }
}
