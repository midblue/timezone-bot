import db from '../db/firestore'
import timezoneCodeToLocation from './timezoneCodeToLocationData'
import { getUserInGuildFromText } from './commonFunctions'
import * as Discord from 'discord.js-light'
import getTimezoneFromLocation from '../actions/getTimezoneFromLocation'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(relativeTime)

export default async function (
  timeString = ``,
  msg: Discord.Message,
) {
  let dayOfWeekRegexRes =
    /^(?:mon|tues?|wedn?e?s?|thur?s?|fri|satu?r?|sun)d?a?y?/gi.exec(
      timeString.toLowerCase(),
    )
  let dayOfWeek: number | null = null
  if (dayOfWeekRegexRes) {
    const stringDayOfWeek = dayOfWeekRegexRes[0]
    timeString = timeString.substring(
      stringDayOfWeek.length + 1,
    )
    dayOfWeek = [
      `sun`,
      `mon`,
      `tue`,
      `wed`,
      `thu`,
      `fri`,
      `sat`,
    ].findIndex(
      (d) => stringDayOfWeek.substring(0, 3) === d,
    )
  }

  let tsMatch =
    /(\d{1,2}|now)?:?(\d{2})?\s*?(pm|am)?\s?(.*)?$/gi.exec(
      timeString.toLowerCase(),
    )
  let [
    unused,
    hoursString,
    minutesString,
    pmAm,
    userOrLocation,
  ] = tsMatch || []

  if (!userOrLocation && msg)
    userOrLocation = msg.author.username
  if (!userOrLocation) return { error: `no user/location` }

  let now = false
  if (!hoursString || hoursString === `now`) now = true

  let hours, minutes

  if (!now) {
    if (!minutesString) minutesString = `00`
    minutes = parseInt(minutesString) || 0
    if (minutes > 59) minutes = 59
    if (minutes < 0) minutes = 0
    if (minutes <= 9) minutes = `0${minutes}`

    hours = parseInt(hoursString || `-1`)
    if (pmAm === `am` && hours === 12) hours = 0
    if (pmAm === `pm` && hours < 12) hours += 12 // since 12pm is already correct

    if (hours > 24 || hours < 0)
      return { error: `invalid time` }
  }

  let knownTimezoneDataForEnteredUserOrLocation:
      | LocationData
      | UserData
      | LocationDataWithUtc
      | null
      | undefined,
    username = ``

  // * first, check for a timezone code
  const timezoneCodeLocationData =
    timezoneCodeToLocation(userOrLocation)
  if (timezoneCodeLocationData) {
    knownTimezoneDataForEnteredUserOrLocation =
      timezoneCodeLocationData
  }

  let targetUser: Discord.GuildMember | undefined
  if (!timezoneCodeLocationData && msg)
    // * if it wasn't a timezone code, check for a username
    targetUser = await getUserInGuildFromText(
      msg,
      userOrLocation,
    )

  // * if it was a username, use their data
  if (targetUser && msg) {
    username =
      targetUser.nickname || targetUser.user.username
    knownTimezoneDataForEnteredUserOrLocation =
      await db.getUserInGuildFromId({
        guildId: msg.guild?.id || ``,
        userId: targetUser.user.id,
      })

    if (!knownTimezoneDataForEnteredUserOrLocation)
      return { error: `no timezone set`, username }
  }
  // * fallback to check for a typed location name
  else {
    knownTimezoneDataForEnteredUserOrLocation =
      await getTimezoneFromLocation(userOrLocation)

    if (!knownTimezoneDataForEnteredUserOrLocation)
      return {
        error: `unrecognized location`,
        locationName: userOrLocation,
      }
  }

  let enteredDateAsObject = dayjs()
  enteredDateAsObject =
    `utcOffset` in knownTimezoneDataForEnteredUserOrLocation
      ? enteredDateAsObject.utcOffset(
          parseInt(
            knownTimezoneDataForEnteredUserOrLocation.utcOffset,
          ),
        )
      : enteredDateAsObject.tz(
          knownTimezoneDataForEnteredUserOrLocation.location,
        )
  if (!now) {
    enteredDateAsObject = enteredDateAsObject
      .minute(parseInt(minutes ? `${minutes}` : `0`))
      .hour(parseInt(hours ? `${hours}` : `0`))
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
