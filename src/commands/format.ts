import db from '../db/firestore'
import { send } from '../actions/replyInChannel'
import type { ActionProps } from '../../@types/command'

export default {
  admin: true,
  regex(settings: Settings) {
    return new RegExp(
      `^${settings.prefix}(?:format)$`,
      `gi`,
    )
  },
  async action({ msg, settings, match }: ActionProps) {
    const turnOff = settings.format24 === true
    console.log(
      `${
        msg.guild ? msg.guild.name : `Private Message`
      } - Toggle format > ${
        turnOff ? `12-hour` : `24-hour`
      } (${msg.author.username}) `,
    )

    await db.setGuildSettings(
      {
        format24: !turnOff,
      },
      msg.guild?.id,
    )

    send(
      msg,
      `Times will now be shown in ${
        turnOff ? `12-hour AM/PM format` : `24-hour format`
      }.`,
      false,
      settings,
    )
  },
}
