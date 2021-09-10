require(`dotenv`).config()
import * as Discord from 'discord.js-light'
const manager = new Discord.ShardingManager(
  `./dist/bot.js`,
  {
    token: process.env.DISCORD_TOKEN,
  },
)

manager.on(`shardCreate`, (shard: Discord.Shard) => {
  console.log(`Launched shard ${shard.id}`)
})

const shards = 5
console.log(`Launching with`, shards, `shards`)
manager.spawn({
  amount: shards,
  delay: 5000,
  timeout: 100000,
})
