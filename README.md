# timezone-bot

A simple timezone bot for Discord servers.

### [Click here to add it to your server!](https://discord.com/api/oauth2/authorize?client_id=437598259330940939&permissions=75840&scope=bot)

![](https://www.jasperstephenson.com/posts/timezonebot/full/1.png)  
Allows users to set their timezone, then passively notes timezones when appropriate.

> Read more about this project [here](https://www.jasperstephenson.com/posts/timezonebot).

## Commands:

- `t!time <user or location name>` to see the current time for a specific user or in a specific place.
- `t!set <city or country name>` to set your own timezone. (UTC codes work, e.g. 'UTC+3', 'UTC-8')
- `t!users` or `t!all` to see all users' set timezones. (use `t!users here` to restrict to the current channel)
- `t!me` to see your set timezone.
- `t!removeme` to delete your set timezone.
- `t!info` or `t!help` to show a message listing all commands.

#### Admin-only commands:

- `t!prefix <new prefix>` to set the prefix for bot commands. Defaults to "t!"
- `t!setuser <@user> <location name>` - Set the timezone for a user in the server.
- `t!removeuser <@user>` - Remove the timezone for a user in the server.
- `t!autorespond` - Toggles auto-responses on/off.
- `t!adminonly` - Toggles admin mode on/off. (Only server admins can invoke most commands)
- `t!deletecommand` - Toggles bot command deletion on/off.
- `t!deleteresponse` - Toggles bot response deletion (after 5 minutes) on/off.

(Most commands can be run by using the first letter of the command, e.g. 't!s Chicago' to set. 't!time' becomes 't!t'.)
