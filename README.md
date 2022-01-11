# timezone-bot

A simple timezone bot for Discord servers.

### Update Jan 2022:
> tl;dr the public TimezoneBot is shutting down because Discord neutered it.

> Discord changed their bot rules such that seeing message contents requires special permission. I applied for this permission, and was rejected with illogical reasoning. Since one of the primary purposes of this bot — to auto-reply to @messages — will become impossible, I've decided to shut down the publically hosted bot rather than continue to spend money on hosting a husk of the bot I've envisioned.

> But! The good news is, you're welcome to run your own copy of the bot, which will work fully as envisioned as long as you don't pass 100 servers! The guide for self-hosting is available here: https://github.com/midblue/timezone-bot/blob/master/instructions%20selfhosting.md

> Please be aware that I will not be actively developing the bot going forward. Feel free to fork your own versions for new features.

> I'd like to give a special shout out to all the fantastic people who have supported the bot's development, and all of the great folks on the support server and elsewhere who have given advice, input, and support along the way.
Thanks for understanding, and have a great day, wherever in the world you may be!

---

![](https://www.jasperstephenson.com/posts/timezonebot/full/1.png)  
Allows users to set their timezone, then passively notes timezones when appropriate.

## Commands:

- `t!time <user, role, or location name>` to see the current time for a specific user or in a specific place.
- `t!timein <location name>` to see the current time in a specific place.
- `t!set <city or country name>` to set your own timezone. (UTC codes also work, e.g. 'UTC+3', 'UTC-8')
- `t!users` or `t!all` to see all users' set timezones. (use `t!here` to restrict to the current channel)
- `t!count` to see timezone counts. (`t!count here` works)
- `t!role <@role or role name>`to see the timezones for all users in a role.
- `t!at <time> <user or location>` to see all users' times from the viewpoint of a specific time and place. Day of the week is optional. (i.e. `t!at Mon 5PM Cairo`. Use `t!at here <time> <user or location>` to restrict to the current channel.)
- `t!me` to see your set timezone.
- `t!removeme` to delete your set timezone.
- `t!stamp <time> <user or location>` - Generate copyable Discord timestamps.
- `t!info` or `t!help` to show a message listing all commands.

#### Admin-only commands:

- `t!prefix <new prefix>` to set the prefix for bot commands. Defaults to "t!"
- `t!setuser <@user> <location name>` - Set the timezone for a user in the server.
- `t!removeuser <@user>` - Remove the timezone for a user in the server.
- `t!format` - Toggles between 12 and 24-hour format.
- `t!autorespond` - Toggles auto-responses on/off.
- `t!adminonly` - Toggles admin mode on/off. (Only server admins can invoke most commands)
- `t!deletecommand` - Toggles bot command deletion on/off.
- `t!deleteresponse <number of seconds (optional)>` - Sets bot response deletion time. Don't add a number to turn off.
- `t!suppresswarnings` - Toggles bot admin warnings on/off.

(Most commands can be run by using the first letter of the command, e.g. 't!s Chicago' to set. 't!time' becomes 't!t'.)
