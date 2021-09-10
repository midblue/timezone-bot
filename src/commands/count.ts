import allCommand from './all'
import type { ActionProps } from '../../@types/command'

export default {
  regex(settings: Settings) {
    return new RegExp(
      `^${settings.prefix}(?:counts?|c) ?(.*)?$`,
      `gi`,
    )
  },
  async action({ msg, settings, match }: ActionProps) {
    allCommand.action({ msg, settings, match, count: true })
  },
}
