const { send } = require('../actions/replyInChannel')
const defaultServerSettings = require('../scripts/defaultServerSettings')

module.exports = {
  regex(settings) {
    return new RegExp(
      `^(?:${settings.prefix}|!|t!)(i|h|info|help|guide|about)`,
      'gi',
    )
  },
  async action({ msg, settings }) {
    console.log(`${msg.guild ? msg.guild.name : 'Private Message'} - Info`)
    settings = settings || defaultServerSettings
    // todo make this a nice rich message object
    return send(
      msg,
      `**Public commands:**
\`${settings.prefix}time <user, city, or country name>\` - See the current time for a specific user or in a specific place.
\`${settings.prefix}timein <city or country name>\` - See the current time in a specific place.
\`${settings.prefix}set <city or country name>\` - Set your own timezone. (UTC codes work, e.g. 'UTC+3', 'UTC-8')
\`${settings.prefix}users\` - See all users' set timezones. (\`${settings.prefix}all\` also works)
\`${settings.prefix}removeme\` - Delete your set timezone.
\`${settings.prefix}help\` - Show this message.

**Admin commands:**
\`${settings.prefix}prefix <t!/t-/t~>\` - Set the prefix for bot commands to one of these 3 options. Defaults to "t!".

All commands can also be used in shorthand with their first letter, i.e. \`${settings.prefix}set\` can be used as \`${settings.prefix}s\`.

Made by jasp#8169.
Go to https://github.com/midblue/timezone-bot for feedback and bug reports!`,
    )
  },
}
