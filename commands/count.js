const allCommand = require('./all')

module.exports = {
  regex(settings) {
    return new RegExp(
      `^${settings.prefix}(?:counts?|c) ?(.*)?$`,
      'gi',
    )
  },
  async action({ msg, settings, match }) {
    allCommand.action({ msg, settings, match, count: true })
  },
}
