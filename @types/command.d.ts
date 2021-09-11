import Discord from 'discord.js'

interface ActionProps {
  msg: Discord.Message
  settings: Settings
  match: string[]
  here?: boolean
  users?: Discord.GuildMember[]
  prependText?: string
  count?: true
  senderIsAdmin?: boolean
  typedUser?: Discord.GuildMember
  client?: Discord.Client
}
