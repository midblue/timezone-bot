const allCommand = require('./all')

module.exports = {
  regex(settings) {
    return new RegExp(`^${settings.prefix}(?:here|h)$`, 'gi')
  },
  async action({ msg, settings, match }) {
    allCommand.action({ msg, settings, match, here: true })
  },
}
