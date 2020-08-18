const { send } = require('../actions/replyInChannel')
const defaultServerSettings = require('../scripts/defaultServerSettings')
const Discord = require('discord.js')

module.exports = {
  ignoreAdminOnly: true,
  regex(settings) {
    return new RegExp(
      `^(?:${settings.prefix}|t!)(i|h|info|help|guide|about)`,
      'gi',
    )
  },
  async action({ msg, settings }) {
    console.log(
      `${msg.guild ? msg.guild.name.substring(0, 20) : 'Private Message'}${
        msg.guild ? ` (${msg.guild.id})` : ''
      } - Info (${msg.author.username})`,
    )
    settings = settings || defaultServerSettings

    const publicCommands = `\`${settings.prefix}time <user or location name>\` - See the current time for a specific user or in a specific place.
\`${settings.prefix}set <location name>\` - Set your own timezone. (UTC codes work, but location names work better.)
\`${settings.prefix}users\` - See timezones for all users. (\`${settings.prefix}all\` also works)
\`${settings.prefix}users here\` - See timezones for all users in the current channel.`

    const alwaysAvailableCommands = `\`${settings.prefix}me\` - See your set timezone.
\`${settings.prefix}removeme\` - Delete your set timezone.
\`${settings.prefix}info\` - Show this message.`

    const adminCommands = `\`${settings.prefix}prefix <new prefix>\` - Set the command prefix.
\`${settings.prefix}setuser <@user> <location name>\` - Set the timezone for a user in the server.
\`${settings.prefix}removeuser <@user>\` - Remove the timezone for a user in the server.
\`${settings.prefix}autorespond\` - Toggles auto-responses on/off.
\`${settings.prefix}adminonly\` - Toggles admin mode on/off. (Only server admins can invoke most commands)
\`${settings.prefix}deletecommand\` - Toggles bot command deletion on/off.`

    const fields = []

    if (settings.autoRespond)
      fields.push({
        name: `**I'll auto-respond to @s with the user's timezone if:**`,
        value: `- The user has a timezone set
- They're not actively sending messages in this server
- Their timezone is at least 2 hours away from yours (if yours is set), and
- Their timezone hasn't been announced in the past 30 minutes.`,
      })
    if (!settings.autoRespond)
      fields.push({
        name: `Auto-responding is **off.**`,
        value: `I won't reply to @s with users' timezones.`,
      })

    if (!settings.adminOnly)
      fields.push({
        name: `**Public commands:**`,
        value: publicCommands + '\n' + alwaysAvailableCommands,
      })
    else {
      fields.push({
        name: `Admin-only mode is **on.**`,
        value: 'Most commands are disabled for non-admins.',
      })
      fields.push({
        name: `**Public commands:**`,
        value: alwaysAvailableCommands,
      })
    }

    fields.push(
      {
        name: `**Admin commands:**`,
        value: settings.adminOnly
          ? publicCommands + '\n' + adminCommands
          : adminCommands,
      },
      {
        name: `(Most commands can also be used by their first letter, i.e. \`${settings.prefix}set\` → \`${settings.prefix}s\`).`,
        value: '\u200B',
      },
    )

    const richEmbed = new Discord.MessageEmbed()
      .setColor('#7B6FE5')
      // .setTitle('TimezoneBot')
      // .setURL('https://github.com/midblue/timezone-bot')
      .setDescription(
        `Hi! I'm TimezoneBot. I let users set their timezone, then passively note timezones when appropriate.`,
      )
      .addFields(...fields)
      .setFooter(
        `Made by jasp#8169.
Feedback/Bugs: https://github.com/midblue/timezone-bot/issues`,
      )

    return send(msg, richEmbed)
  },
}
