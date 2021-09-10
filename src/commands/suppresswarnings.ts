import db from '../db/firestore'
import { send } from '../actions/replyInChannel'
import type { ActionProps } from '../../@types/command'

export default {
  admin: true,
  regex(settings: Settings) {
    return new RegExp(
      `^${settings.prefix}(?:suppresswarnings)$`,
      `gi`,
    )
  },
  async action({ msg, settings, match }: ActionProps) {
    const turnOff = settings.suppressWarnings === true
    console.log(
      `${
        msg.guild ? msg.guild.name : `Private Message`
      } - Toggle suppress warnings > ${
        turnOff ? `off` : `on`
      } (${msg.author.username}) `,
    )

    await db.setGuildSettings(
      {
        suppressWarnings: !turnOff,
      },
      msg.guild?.id,
    )

    send(
      msg,
      `Admin warnings have been ${
        turnOff ? `turned on` : `suppressed`
      }.`,
      false,
      settings,
    )
  },
}
