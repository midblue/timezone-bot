import {
  currentTimeAt,
  getLightEmoji,
  standardizeTimezoneName,
} from '../scripts/commonFunctions'
import { send } from '../actions/replyInChannel'
import type { ActionProps } from '../../@types/command'
import getTimezoneFromLocation from '../actions/getTimezoneFromLocation'

export default {
  regex(settings: Settings) {
    return new RegExp(
      `^${settings.prefix}(?:timein|ti(?!m))( ?)(.*)$`,
      `gi`,
    )
  },
  async action({ msg, settings, match }: ActionProps) {
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
        `Use this command in the format \`${settings.prefix}timein <city or country name>\` to see the time in a specific location.`,
        `none`,
        settings,
      )

    // assuming it's a location
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
