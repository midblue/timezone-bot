require('dotenv').config()
const { ShardingManager } = require('discord.js')
const manager = new ShardingManager('./bot.js', {
  token: process.env.DISCORD_TOKEN,
})

manager.on('shardCreate', (shard) => {
  console.log(`Launched shard ${shard.id}`)
})

manager.spawn('auto', 10000, false)
