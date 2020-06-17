const { send } = require('../actions/replyInChannel')
const defaultServerSettings = require('../scripts/defaultServerSettings')
const Discord = require('discord.js')

module.exports = {
  regex(settings) {
    return new RegExp(`^(?:${settings.prefix})(testcommand)`, 'gi')
  },
  async action({ msg, settings }) {
    console.log(
      `${msg.guild ? msg.guild.name : 'Private Message'} - Test Command`,
    )
    settings = settings || defaultServerSettings

    const richEmbed = new Discord.MessageEmbed()
      .setColor('#7B6FE5')
      .setTitle('TimezoneBot — Info')
      .setURL('https://github.com/midblue/timezone-bot')
      .setDescription(
        `Hi! I'm TimezoneBot, a simple bot that allows users to set their timezone, then passively notes timezones when appropriate.`,
      )
      .addFields(
        {
          name: `I'll auto-respond to @s with the user's timezone if:`,
          value: `- The user has a timezone set
- They're not actively sending messages in this server
- Their timezone is at least 2 hours away from yours (if yours is set), and
- Their timezone hasn't been announced in the past 30 minutes.`,
        },
        {
          name: '**Public commands:**',
          value: `\`${settings.prefix}time <user, city, or country name>\` - See the current time for a specific user or in a specific place.
\`${settings.prefix}timein <city or country name>\` - See the current time in a specific place.
\`${settings.prefix}set <city or country name>\` - Set your own timezone. (UTC codes work, e.g. 'UTC+3', 'UTC-8')
\`${settings.prefix}users\` - See all users' set timezones. (\`${settings.prefix}all\` also works)
\`${settings.prefix}removeme\` - Delete your set timezone.
\`${settings.prefix}info\` - Show this message. (\`${settings.prefix}help\` also works)`,
        },
        {
          name: '**Admin commands:**',
          value: `\`${settings.prefix}prefix <t!/t-/t~>\` - Set the prefix for bot commands to one of these 3 options. Defaults to "t!".`,
        },
        {
          name: `(All commands can also be used by their first letter, i.e. \`${settings.prefix}set\` > \`${settings.prefix}s\`).`,
        },
      )
      .setFooter(
        `Made by jasp#8169.
Feedback/Bugs > https://github.com/midblue/timezone-bot/issues`,
      )

    return send(msg, richEmbed)
  },
}
