"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dayjs_1 = __importDefault(require("dayjs"));
const relativeTime_1 = __importDefault(require("dayjs/plugin/relativeTime"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
const timezone_1 = __importDefault(require("dayjs/plugin/timezone"));
dayjs_1.default.extend(utc_1.default);
dayjs_1.default.extend(timezone_1.default);
dayjs_1.default.extend(relativeTime_1.default);
const { standardizeTimezoneName, } = require(`../scripts/commonFunctions`);
const replyInChannel_1 = require("../actions/replyInChannel");
const timeFromString = require(`../scripts/timeFromString`);
module.exports = {
    regex(settings) {
        return new RegExp(`^${settings.prefix}(?:timestamp|stamp) ?(.*)?$`, `gi`);
    },
    async action({ msg, settings, match }) {
        const timeString = match[1];
        console.log(`${msg.guild
            ? msg.guild.name.substring(0, 25).padEnd(25, ` `)
            : `Private Message`}${msg.guild ? ` (${msg.guild.id})` : ``} - Timestamp for ${timeString} (${msg.author.username})`);
        const res = await timeFromString(timeString, msg);
        if (`error` in res) {
            let errorMessage;
            if (res.error === `invalid time`)
                errorMessage = `The 'stamp' command prints the code for a Discord timestamp at a certain time & location'.
Use \`${settings.prefix}stamp <time> <location/user>\` to print a timestamp.
Times can be in 12-hour or 24-hour format, and can include days of the week: i.e. "10PM Los Angeles" or "tuesday 18:00 Cairo".`;
            else if (res.error === `no user/location`)
                errorMessage = `The 'stamp' command prints the code for a Discord timestamp at a certain time & location'.
Use \`${settings.prefix}stamp <time> <location/user>\` to print a timestamp.`;
            else if (res.error === `no timezone set`)
                errorMessage = `It doesn't look like ${username} has set a timezone for themselves yet.`;
            else if (res.error === `unrecognized location`)
                errorMessage = `I didn't recognize the name or location you entered. (${userOrLocation})`;
            if (errorMessage)
                (0, replyInChannel_1.send)(msg, errorMessage, `none`, settings);
            return;
        }
        const { username, locationName, now, enteredDateAsObject, knownTimezoneDataForEnteredUserOrLocation, } = res;
        const typedTime = enteredDateAsObject.format(settings.format24 ? `ddd H:mm` : `ddd h:mm A`);
        const seconds = Math.round(enteredDateAsObject.valueOf() / 1000);
        (0, replyInChannel_1.send)(msg, `At ${typedTime} ${now ? `(now) ` : ``}${username ? `for` : `in`} ${username
            ? username +
                ` (${standardizeTimezoneName(knownTimezoneDataForEnteredUserOrLocation.timezoneName)})`
            : locationName.substring(0, 1).toUpperCase() +
                locationName.substring(1)}, the Discord timestamps are:
\`<t:${seconds}:t>\` → ${`<t:${seconds}:t>`}
\`<t:${seconds}:f>\` → ${`<t:${seconds}:f>`}
\`<t:${seconds}:F>\` → ${`<t:${seconds}:F>`}
\`<t:${seconds}:R>\` → ${`<t:${seconds}:R>`}`, `none`, settings);
    },
};
