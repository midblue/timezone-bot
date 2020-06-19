const { send } = require('../actions/replyInChannel')
const defaultServerSettings = require('../scripts/defaultServerSettings')
const Discord = require('discord.js')

module.exports = {
  regex(settings) {
    return new RegExp(
      `^(?:${settings.prefix}|!|t!)(i|h|info|help|guide|about)`,
      'gi',
    )
  },
  async action({ msg, settings }) {
    console.log(
      `${msg.guild ? msg.guild.name : 'Private Message'} - Info (${
        msg.author.username
      })`,
    )
    settings = settings || defaultServerSettings

    const richEmbed = new Discord.MessageEmbed()
      .setColor('#7B6FE5')
      // .setTitle('TimezoneBot')
      // .setURL('https://github.com/midblue/timezone-bot')
      .setDescription(
        `Hi! I'm TimezoneBot. I let users set their timezone, then passively note timezones when appropriate.`,
      )
      .addFields(
        {
          name: `**I'll auto-respond to @s with the user's timezone if:**`,
          value: `- The user has a timezone set
- They're not actively sending messages in this server
- Their timezone is at least 2 hours away from yours (if yours is set), and
- Their timezone hasn't been announced in the past 30 minutes.`,
        },
        {
          name: '**Public commands:**',
          value: `\`${settings.prefix}time <user, city, or country name>\` - See the current time for a specific user or in a specific place.
\`${settings.prefix}timein <city or country name>\` - See the current time in a specific place.
\`${settings.prefix}set <city or country name>\` - Set your own timezone. (UTC codes work)
\`${settings.prefix}users\` - See all users' set timezones. (\`${settings.prefix}all\` also works)
\`${settings.prefix}removeme\` - Delete your set timezone.
\`${settings.prefix}info\` - Show this message. (\`${settings.prefix}help\` also works)`,
        },
        {
          name: '**Admin commands:**',
          value: `\`${settings.prefix}prefix <t!/t-/t~>\` - Set the prefix to one of these 3 options. Default is \`t!\`.`,
        },
        {
          name: `(All commands can also be used by their first letter, i.e. \`${settings.prefix}set\` > \`${settings.prefix}s\`).`,
          value: '\u200B',
        },
      )
      .setFooter(
        `Made by jasp#8169.
Feedback/Bugs: https://github.com/midblue/timezone-bot/issues`,
      )

    return send(msg, richEmbed)
  },
}
