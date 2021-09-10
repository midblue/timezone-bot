import db from '../db/firestore'
import { send } from '../actions/replyInChannel'
import type { ActionProps } from '../../@types/command'

export default {
  regex(settings: Settings) {
    return new RegExp(
      `^${settings.prefix}(?:support)$`,
      `gi`,
    )
  },
  async action({ msg, settings, match }: ActionProps) {
    console.log(
      `${
        msg.guild ? msg.guild.name : `Private Message`
      } - Support (${msg.author.username}) `,
    )

    send(
      msg,
      `Join the TimezoneBot Support server here: <https://discord.gg/9MKpMCV>`,
      `none`,
      settings,
    )
  },
}
