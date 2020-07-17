# timezone-bot

A simple timezone bot for Discord servers.

### [Click here to add it to your server!](https://discord.com/api/oauth2/authorize?client_id=437598259330940939&permissions=68672&scope=bot)

![](https://www.jasperstephenson.com/posts/timezonebot/full/1.png)  
Allows users to set their timezone, then passively notes timezones when appropriate.

> Read more about this project [here](https://www.jasperstephenson.com/posts/timezonebot).

## Commands:

- `t!time <user, city, or country name>` to see the current time for a specific user or in a specific place.
- `t!timein <city or country name>` to see the current time in a specific place.
- `t!set <city or country name>` to set your own timezone. (UTC codes work, e.g. 'UTC+3', 'UTC-8')
- `t!users` or `t!all` to see all users' set timezones.
- `t!removeme` to delete your set timezone.
- `t!help` to show a message listing all commands.

#### Admin-only commands:

- `t!prefix <t!/t-/t~>` to set the prefix for bot commands to one of these 3 options. Defaults to "t!"

(All commands can be run by using the first letter of the command, e.g. 't!s Chicago' to set. '!time' becomes 't!t'.)

---

## Setup:

If you want to run your own copy of this bot, there are several APIs you will need to set up.

Sign up for Google's apis at https://console.cloud.google.com/apis/, and activate the _Geocoding API_ and the _Timezone API_ for your project. Save your API key for later. You'll have to sign up for this with a credit card, but you can set hard limits in the API console to stop it from crossing into paid territory.

Also, sign up for a Discord developer account at https://discord.com/developers/applications/. Create a new bot, and name it whatever you want. The discord server owner must add the bot to the channel manually.  
A great guide for setting up a bot, getting a token, and adding it to a server can be found here: https://discordjs.guide/#/preparations/setting-up-a-bot-application

Next, create a file called `.env` in your project root. This is where you will keep your keys and logins. Structure this file according to .env_example in the repository. Make sure to fill in the appropriate information.

Then, run:

```
npm install
npm start
```
