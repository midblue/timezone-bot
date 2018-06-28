# timezone-bot
![](https://www.jasperstephenson.com/posts/timezonebot/full/1.png)  
Allows users to set their timezone, then passively notes timezones when appropriate.  
Uses Redis and MYSQL to hold onto user, location, and timezone data.  

> Read more about this project [Here](https://www.jasperstephenson.com/posts/timezonebot).

## Setup:
First, install and start MYSQL. Then, simply run:
```
npm install
npm start
```

## Commands:
- `!time <user, city, or country name>` to see the current time for a specific user or in a specific place.
- `!set <city or country name>` to set your own timezone.
- `!users` or `!all` to see all users' set timezones.
- `!help` to show a message listing all commands.
