import db from '../db/firestore'
import {
  currentTimeAt,
  getLightEmoji,
  standardizeTimezoneName,
} from '../scripts/commonFunctions'
import { send } from '../actions/replyInChannel'
import type { ActionProps } from '../../@types/command'
import getTimezoneFromLocation from '../actions/getTimezoneFromLocation'
import timezoneCodeToLocation from '../scripts/timezoneCodeToLocationData'
import all from './all'
import role from './role'
import me from './me'

export default {
  expectsUserInRegexSlot: 2,
  regex(settings: Settings) {
    return new RegExp(
      `^${settings.prefix}(?:time(?!in)|t(?!i))( ?)(.*)$`,
      `gi`,
    )
  },
  async action({
    msg,
    settings,
    match,
    typedUser,
    senderIsAdmin,
  }: ActionProps) {
    console.log(
      `${
        msg.guild?.name
          ? msg.guild.name.substring(0, 25).padEnd(25, ` `)
          : `Private Message`
      }${
        msg.guild ? ` (${msg.guild.id})` : ``
      } - Time for ${match[2]} (${msg.author.username})`,
    )

    if (!match[1] || !match[2])
      return send(
        msg,
        `Use this command in the format \`${settings.prefix}time <user, role, city, or country name>\` to see the time in a specific location or for a specific user.`,
        `none`,
        settings,
      )

    // some people type "all" here expecting the time for all users. let's oblige them.
    if (
      match[2].toLowerCase() === `all` ||
      match[2].toLowerCase() === `users` ||
      match[2].toLowerCase() === `all users` ||
      match[2].toLowerCase() === `allusers` ||
      match[2].toLowerCase() === `everyone`
    )
      return all.action({ msg, settings, match, typedUser })

    // some people type "me" here expecting their own timezone. let's oblige them.
    if (match[2].toLowerCase() === `me`)
      return me.action({
        msg,
        settings,
        senderIsAdmin,
        match,
      })

    // escape hatch to role command
    if (match[2].substring(0, 3) === `<@&`)
      return role.action({ msg, settings, match })

    // first, check for a timezone code
    const timezoneCodeLocationData = timezoneCodeToLocation(
      match[2],
    )
    if (timezoneCodeLocationData) {
      return send(
        msg,
        `It's ${getLightEmoji(
          timezoneCodeLocationData.location,
        )}${currentTimeAt(
          timezoneCodeLocationData.location,
          false,
          Boolean(settings.format24),
        )} in ${match[2]}. (${standardizeTimezoneName(
          timezoneCodeLocationData.timezoneName,
        )})`,
        false,
        settings,
      )
    }

    // if they typed a username
    if (typedUser) {
      const username =
        typedUser.nickname || typedUser.user.username
      const foundUser = await db.getUserInGuildFromId({
        guildId: msg.guild?.id,
        userId: typedUser.user.id,
      })
      if (!foundUser)
        return send(
          msg,
          `It doesn't look like ${username} has set a timezone for themselves yet.`,
          false,
          settings,
        )
      return send(
        msg,
        `It's ${getLightEmoji(
          foundUser.location,
        )}${currentTimeAt(
          foundUser.location,
          false,
          Boolean(settings.format24),
        )} for ${username}. (${standardizeTimezoneName(
          foundUser.timezoneName,
        )})`,
        false,
        settings,
      )
    }

    // otherwise, default back to assuming it's a location
    const foundTimezone = await getTimezoneFromLocation(
      match[2],
    )
    if (!foundTimezone)
      return send(
        msg,
        `Sorry, I couldn't find a timezone for ${match[2]}.`,
        false,
        settings,
      )

    send(
      msg,
      `It's ${getLightEmoji(
        foundTimezone.location,
      )}${currentTimeAt(
        foundTimezone.location,
        false,
        Boolean(settings.format24),
      )} in ${match[2]}. (${standardizeTimezoneName(
        foundTimezone.timezoneName,
      )})`,
      false,
      settings,
    )
  },
}
