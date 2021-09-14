"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firestore_1 = __importDefault(require("../db/firestore"));
const dayjs_1 = __importDefault(require("dayjs"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
const timezone_1 = __importDefault(require("dayjs/plugin/timezone"));
dayjs_1.default.extend(utc_1.default);
dayjs_1.default.extend(timezone_1.default);
const commonFunctions_1 = require("../scripts/commonFunctions");
const replyInChannel_1 = require("../actions/replyInChannel");
exports.default = {
    regex(settings) {
        return new RegExp(`^${settings.prefix}(?:all|users|allusers|list|u|a(?!t|ut|d)) ?(.*)?$`, `gi`);
    },
    async action({ msg, settings, match, here = false, users, prependText, count, }) {
        var _a, _b, _c;
        const onlyHere = here ||
            (match[1] || ``).toLowerCase() === `here` ||
            (match[1] || ``).toLowerCase() === `h`;
        console.log(`${((_a = msg.guild) === null || _a === void 0 ? void 0 : _a.name)
            ? msg.guild.name.substring(0, 25).padEnd(25, ` `)
            : `Private Message`}${msg.guild ? ` (${msg.guild.id})` : ``} - All users ${onlyHere
            ? `in #${`name` in msg.channel
                ? msg.channel.name
                : `unknown channel`} `
            : ``}(${msg.author.username})`);
        const allUsers = {
            ...(await firestore_1.default.getGuildUsers((_b = msg.guild) === null || _b === void 0 ? void 0 : _b.id)),
        };
        // remove irrelevant users if we're only interested in a few
        if (users)
            for (let key of Object.keys(allUsers))
                if (!users.find((u) => u.id === key))
                    delete allUsers[key];
        if ((await Object.keys(allUsers)).length === 0)
            return (0, replyInChannel_1.send)(msg, `No users in this ${users ? `role` : `server`} have added their timezone yet. Use \`${settings.prefix}set <city or country name>\` to set your timezone.`, `none`, settings);
        const timezonesWithUsers = {};
        const asyncFilter = async (arr, predicate) => Promise.all(arr.map(predicate)).then((results) => arr.filter((_v, index) => results[index]));
        const guildMembers = (await asyncFilter(await (0, commonFunctions_1.getGuildMembers)({ msg }), async (guildMember) => {
            var _a;
            return onlyHere
                ? Boolean((_a = (await msg.channel.fetch()).members) === null || _a === void 0 ? void 0 : _a.get(guildMember.user.id))
                : true; // only members in this channel
        }));
        let foundUsersCount = 0;
        // preload roles if they will be necessary
        if (settings.verboseAll) {
            await ((_c = msg.guild) === null || _c === void 0 ? void 0 : _c.roles.fetch());
        }
        for (let id of Object.keys(allUsers)) {
            const userObject = guildMembers.find((m) => m.user.id === id);
            if (!userObject) {
                // db.removeUserFromGuild({ guildId: msg.guild.id, userId: id })
                continue;
            }
            foundUsersCount++;
            const userStub = allUsers[id];
            const timezoneUID = (0, commonFunctions_1.standardizeTimezoneName)(userStub.timezoneName) +
                (0, dayjs_1.default)().tz(userStub.location).format(`Z`);
            if (!timezonesWithUsers[timezoneUID]) {
                timezonesWithUsers[timezoneUID] = {
                    timezoneName: (0, commonFunctions_1.standardizeTimezoneName)(userStub.timezoneName),
                    locale: userStub.location,
                    dateObject: (0, commonFunctions_1.dateObjectAt)(userStub.location),
                    usernames: [],
                };
            }
            let context = ``;
            if (settings.verboseAll) {
                context = userObject.roles.highest.name;
            }
            if (context === `@everyone`)
                context = ``;
            timezonesWithUsers[timezoneUID].usernames.push((userObject.nickname || userObject.user.username) +
                (context ? ` (@${context})` : ``));
        }
        const timezonesWithUsersAsSortedArray = Object.values(timezonesWithUsers).sort((a, b) => a.dateObject.utcOffset() - b.dateObject.utcOffset());
        if (!timezonesWithUsersAsSortedArray.length)
            return (0, replyInChannel_1.send)(msg, `No users with that criteria have added their timezone yet. Use \`${settings.prefix}set <city or country name>\` to set your timezone.`, `none`, settings);
        (0, replyInChannel_1.send)(msg, `${foundUsersCount} users with saved timezones${prependText ? ` ` + prependText : ``}${onlyHere ? ` in <#${msg.channel.id}>` : ``}:`, `none`, settings);
        //  character limit is 2000, so, batching.
        let outputStrings = [``], currentString = 0;
        timezonesWithUsersAsSortedArray.forEach((timezone) => {
            if (outputStrings[currentString].length >= 1500) {
                outputStrings[currentString] = outputStrings[currentString].substring(0, outputStrings[currentString].length - 2);
                currentString++;
                outputStrings[currentString] = ``;
            }
            const header = `${(0, commonFunctions_1.getLightEmoji)(timezone.locale)}${(0, commonFunctions_1.toTimeString)(timezone.dateObject, true, settings.format24)} - ${timezone.timezoneName} (UTC${(0, dayjs_1.default)()
                .tz(timezone.locale)
                .format(`Z`)})`;
            const body = count
                ? ` - ` +
                    timezone.usernames.length +
                    ` user${timezone.usernames.length === 1 ? `` : `s`}\n`
                : `\n     ` +
                    timezone.usernames
                        .sort((a, b) => a.toLowerCase() > b.toLowerCase() ? 1 : -1)
                        .join(`\n     `) +
                    `\n\n`;
            return (outputStrings[currentString] += header + body);
        }, ``);
        outputStrings[currentString] = outputStrings[currentString].substring(0, outputStrings[currentString].length - (count ? 1 : 2));
        outputStrings.forEach((s) => (0, replyInChannel_1.send)(msg, s, true, settings));
    },
};
