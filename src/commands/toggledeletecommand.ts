import db from '../db/firestore'
import { send } from '../actions/replyInChannel'
import type { ActionProps } from '../../@types/command'

export default {
  admin: true,
  regex(settings: Settings) {
    return new RegExp(
      `^${settings.prefix}(?:deletecommands?)$`,
      `gi`,
    )
  },
  async action({ msg, settings, match }: ActionProps) {
    const turnOff = settings.deleteCommand === true
    console.log(
      `${
        msg.guild ? msg.guild.name : `Private Message`
      } - Toggle deletecommand > ${
        turnOff ? `off` : `on`
      } (${msg.author.username}) `,
    )

    await db.setGuildSettings(
      {
        deleteCommand: !turnOff,
      },
      msg.guild?.id,
    )

    send(
      msg,
      `Bot command messages will ${
        turnOff ? `not ` : ``
      }be deleted.`,
      false,
      settings,
    )
  },
}
