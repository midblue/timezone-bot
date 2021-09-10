"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firestore_1 = __importDefault(require("../db/firestore"));
const commonFunctions_1 = require("../scripts/commonFunctions");
const replyInChannel_1 = require("../actions/replyInChannel");
const getTimezoneFromLocation_1 = __importDefault(require("../actions/getTimezoneFromLocation"));
const timezoneCodeToLocationData_1 = __importDefault(require("../scripts/timezoneCodeToLocationData"));
const all_1 = __importDefault(require("./all"));
const role_1 = __importDefault(require("./role"));
const me_1 = __importDefault(require("./me"));
exports.default = {
    expectsUserInRegexSlot: 2,
    regex(settings) {
        return new RegExp(`^${settings.prefix}(?:time(?!in)|t(?!i))( ?)(.*)$`, `gi`);
    },
    async action({ msg, settings, match, typedUser, senderIsAdmin, }) {
        var _a;
        console.log(`${msg.guild
            ? msg.guild.name.substring(0, 25).padEnd(25, ` `)
            : `Private Message`}${msg.guild ? ` (${msg.guild.id})` : ``} - Time for ${match[2]} (${msg.author.username})`);
        if (!match[1] || !match[2])
            return (0, replyInChannel_1.send)(msg, `Use this command in the format \`${settings.prefix}time <user, role, city, or country name>\` to see the time in a specific location or for a specific user.`, `none`, settings);
        // some people type "all" here expecting the time for all users. let's oblige them.
        if (match[2].toLowerCase() === `all` ||
            match[2].toLowerCase() === `users` ||
            match[2].toLowerCase() === `all users` ||
            match[2].toLowerCase() === `allusers` ||
            match[2].toLowerCase() === `everyone`)
            return all_1.default.action({ msg, settings, match, typedUser });
        // some people type "me" here expecting their own timezone. let's oblige them.
        if (match[2].toLowerCase() === `me`)
            return me_1.default.action({
                msg,
                settings,
                senderIsAdmin,
                match,
            });
        // escape hatch to role command
        if (match[2].substring(0, 3) === `<@&`)
            return role_1.default.action({ msg, settings, match });
        // first, check for a timezone code
        const timezoneCodeLocationData = (0, timezoneCodeToLocationData_1.default)(match[2]);
        if (timezoneCodeLocationData) {
            return (0, replyInChannel_1.send)(msg, `It's ${(0, commonFunctions_1.getLightEmoji)(timezoneCodeLocationData.location)}${(0, commonFunctions_1.currentTimeAt)(timezoneCodeLocationData.location, false, Boolean(settings.format24))} in ${match[2]}. (${(0, commonFunctions_1.standardizeTimezoneName)(timezoneCodeLocationData.timezoneName)})`, false, settings);
        }
        // if they typed a username
        if (typedUser) {
            const username = typedUser.nickname || typedUser.user.username;
            const foundUser = await firestore_1.default.getUserInGuildFromId({
                guildId: (_a = msg.guild) === null || _a === void 0 ? void 0 : _a.id,
                userId: typedUser.user.id,
            });
            if (!foundUser)
                return (0, replyInChannel_1.send)(msg, `It doesn't look like ${username} has set a timezone for themselves yet.`, false, settings);
            return (0, replyInChannel_1.send)(msg, `It's ${(0, commonFunctions_1.getLightEmoji)(foundUser.location)}${(0, commonFunctions_1.currentTimeAt)(foundUser.location, false, Boolean(settings.format24))} for ${username}. (${(0, commonFunctions_1.standardizeTimezoneName)(foundUser.timezoneName)})`, false, settings);
        }
        // otherwise, default back to assuming it's a location
        const foundTimezone = await (0, getTimezoneFromLocation_1.default)(match[2]);
        if (!foundTimezone)
            return (0, replyInChannel_1.send)(msg, `Sorry, I couldn't find a timezone for ${match[2]}.`, false, settings);
        (0, replyInChannel_1.send)(msg, `It's ${(0, commonFunctions_1.getLightEmoji)(foundTimezone.location)}${(0, commonFunctions_1.currentTimeAt)(foundTimezone.location, false, Boolean(settings.format24))} in ${match[2]}. (${(0, commonFunctions_1.standardizeTimezoneName)(foundTimezone.timezoneName)})`, false, settings);
    },
};
