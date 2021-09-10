"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firestore_1 = __importDefault(require("../db/firestore"));
const dayjs_1 = __importDefault(require("dayjs"));
const relativeTime_1 = __importDefault(require("dayjs/plugin/relativeTime"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
const timezone_1 = __importDefault(require("dayjs/plugin/timezone"));
dayjs_1.default.extend(utc_1.default);
dayjs_1.default.extend(timezone_1.default);
dayjs_1.default.extend(relativeTime_1.default);
const commonFunctions_1 = require("../scripts/commonFunctions");
const replyInChannel_1 = require("../actions/replyInChannel");
const timeFromString_1 = __importDefault(require("../scripts/timeFromString"));
exports.default = {
    regex(settings) {
        return new RegExp(`^${settings.prefix}(?:at) ?(he?r?e?)? ?(.*)?$`, `gi`);
    },
    async action({ msg, settings, match }) {
        var _a;
        const onlyHere = (match[1] || ``).toLowerCase().indexOf(`h`) === 0;
        let timeString = match[2];
        console.log(`${msg.guild
            ? msg.guild.name.substring(0, 25).padEnd(25, ` `)
            : `Private Message`}${msg.guild ? ` (${msg.guild.id})` : ``} - Time at ${timeString} ${onlyHere
            ? `in #${`name` in msg.channel
                ? msg.channel.name
                : `unknown channel`} `
            : ``}(${msg.author.username})`);
        const res = await (0, timeFromString_1.default)(timeString, msg);
        if (`error` in res) {
            let errorMessage;
            if (res.error === `invalid time`)
                errorMessage = `The 'at' command lists everyone's time at a certain time & location.
Use \`${settings.prefix}at <time> <location/user>\` to see other users' times at a certain time.
Times can be in 12-hour or 24-hour format, and can include days of the week: i.e. "10PM Los Angeles" or "tuesday 18:00 Cairo".
(Use \`${settings.prefix}at here <time> <location/user>\` to restrict the command to users in the current channel.)`;
            else if (res.error === `no user/location`)
                errorMessage = `The 'at' command lists everyone's time at a certain time & location.
Use \`${settings.prefix}at <time> <location/user>\` to see other users' times at a certain time.`;
            else if (res.error === `no timezone set`)
                errorMessage = `It doesn't look like ${res.username} has set a timezone for themselves yet.`;
            else if (res.error === `unrecognized location`)
                errorMessage = `The 'at' command lists everyone's time at a certain time & place. I didn't recognize the name or location you entered. (${res.locationName})`;
            if (errorMessage)
                (0, replyInChannel_1.send)(msg, errorMessage, `none`, settings);
            return;
        }
        const { username, locationName, now, enteredDateAsObject, knownTimezoneDataForEnteredUserOrLocation, } = res;
        const allUsers = await firestore_1.default.getGuildUsers((_a = msg.guild) === null || _a === void 0 ? void 0 : _a.id);
        if ((await Object.keys(allUsers)).length === 0)
            return (0, replyInChannel_1.send)(msg, `No other users in this server have added their timezone yet, so there's nothing to compare to.`, false, settings);
        const entries = {};
        const asyncFilter = async (arr, predicate) => Promise.all(arr.map(predicate)).then((results) => arr.filter((_v, index) => results[index]));
        const guildMembers = await asyncFilter(await (0, commonFunctions_1.getGuildMembers)({ msg }), async (guildMember) => {
            var _a;
            return onlyHere
                ? Boolean((_a = (await msg.channel.fetch()).members) === null || _a === void 0 ? void 0 : _a.get(guildMember.user.id))
                : true; // only members in this channel
        });
        for (let id of Object.keys(allUsers)) {
            const userObject = guildMembers.find((m) => m.user.id === id);
            if (!userObject)
                continue;
            const userStub = allUsers[id];
            const timezoneName = (0, commonFunctions_1.standardizeTimezoneName)(userStub.timezoneName);
            // ========= determine local time at the entered time =========
            let dateObjectInTimezone = enteredDateAsObject.tz(userStub.location);
            const textEntry = dateObjectInTimezone.format();
            if (!entries[textEntry])
                entries[textEntry] = {
                    names: [timezoneName],
                    localTimeObject: dateObjectInTimezone,
                };
            else if (!entries[textEntry].names.includes(timezoneName))
                entries[textEntry].names.push(timezoneName);
        }
        const entriesAsSortedArray = Object.values(entries).sort((a, b) => (0, commonFunctions_1.getOffset)(a.localTimeObject) -
            (0, commonFunctions_1.getOffset)(b.localTimeObject));
        const typedTime = enteredDateAsObject.format(settings.format24 ? `ddd H:mm` : `ddd h:mm A`);
        // (<t:${Math.round(
        // enteredDateAsObject.valueOf() / 1000,
        // )}:t> for you)
        (0, replyInChannel_1.send)(msg, `At ${typedTime} (<t:${Math.round(enteredDateAsObject.valueOf() / 1000)}:R>) ${username ? `for` : `in`} ${username
            ? username +
                ` (${(0, commonFunctions_1.standardizeTimezoneName)(knownTimezoneDataForEnteredUserOrLocation.timezoneName)})`
            : locationName.substring(0, 1).toUpperCase() +
                locationName.substring(1)}, it ${now ? `is` : `will be`}... ${onlyHere
            ? ` (for users in <#${msg.channel.id}>)`
            : ``}`, `none`, settings);
        //  character limit is 2000, so, batching.
        let outputStrings = [``], currentString = 0;
        entriesAsSortedArray.forEach((timezone) => {
            // ========= handle batching =========
            if (outputStrings[currentString].length >= 1500) {
                outputStrings[currentString] = outputStrings[currentString].substring(0, outputStrings[currentString].length - 2);
                currentString++;
                outputStrings[currentString] = ``;
            }
            // ========= add to string =========
            const timeString = (0, commonFunctions_1.toTimeString)(timezone.localTimeObject, true, Boolean(settings.format24));
            const header = `${(0, commonFunctions_1.getLightEmoji)(timezone.localTimeObject.hour())}${timeString} - ${timezone.names.join(`, `)}`;
            return (outputStrings[currentString] += header + `\n`);
        }, ``);
        outputStrings[currentString] = outputStrings[currentString].substring(0, outputStrings[currentString].length - 1);
        outputStrings.forEach((s) => (0, replyInChannel_1.send)(msg, s, true, settings));
    },
};
