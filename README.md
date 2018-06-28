# timezone-bot
😈 A passive timezone notifier bot for Discord.  
![](https://www.jasperstephenson.com/posts/timezonebot/full/1.png)
Uses Redis and MYSQL to hold onto user, location, and timezone data.  

## Setup:
First, install and start MYSQL. Then, simply run:
```
npm install
npm start
```

## Commands:
```
!time <user, city, or country name> to see the current time for a specific user or in a specific place.
!set <city or country name> to set your own timezone.
!users or !all to see all users' set timezones.
!help to show a message listing all commands.

```
