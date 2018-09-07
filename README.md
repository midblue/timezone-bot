# timezone-bot
A simple timezone bot for Discord servers.  
  
![](https://www.jasperstephenson.com/posts/timezonebot/full/1.png)  
Allows users to set their timezone, then passively notes timezones when appropriate.  
Uses Redis and MYSQL to hold onto user, location, and timezone data.  

> Read more about this project [Here](https://www.jasperstephenson.com/posts/timezonebot).

## Setup:

There are several APIs you will need to set up.

Sign up for google's apis at https://console.cloud.google.com/apis/, and activate the *Geocoding API* and the *Timezone API* for your project. Save your API key for later. You'll have to sign up for this with a credit card, but there are hard limits built into the app to stop it from crossing into paid territory, so no worries. If you want to check for yourself, look in `scripts/googleapi.js`.

Also, sign up for a Discord developer account at https://discordapp.com/developers/applications/. Create a new bot, and name it whatever you want. The discord server owner must add the bot to the channel manually.  
A great guide for setting up a bot, getting a token, and adding it to a server can be found here: https://discordjs.guide/#/preparations/setting-up-a-bot-application

Next, create a file called `.env` in your project root. This is where you will keep your keys and logins. Structure this file as:
```
DISCORD_KEY=
BOT_ID=
GOOGLE_API_KEY=
DEBUG=true
```
Make sure to fill in the appropriate information.
`DISCORD_KEY` is your bot's token.
`BOT_ID` is the unique Client ID of your bot as listed on the Discord developer page for your bot.

Then, run:
```
npm install
npm start
```

## Commands:
- `!time <user, city, or country name>` to see the current time for a specific user or in a specific place.
- `!set <city or country name>` to set your own timezone.
- `!users` or `!all` to see all users' set timezones.
- `!help` to show a message listing all commands.
