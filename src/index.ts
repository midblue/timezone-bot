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

console.log(`Launching with shards...`)

manager
  .spawn({
    // amount: shards,
    // delay: 5000,
    timeout: 100000,
  })
  .then((shardCollection) => {
    manager
      .fetchClientValues(`guilds.cache.size`)
      .then((results: any) => {
        if (results && Array.isArray(results))
          console.log(
            `***** Logged in in ${results.reduce(
              (acc: number, guildCount: number) =>
                acc + guildCount,
              0,
            )} total guilds *****`,
          )
      })
      .catch(console.error)
  })
