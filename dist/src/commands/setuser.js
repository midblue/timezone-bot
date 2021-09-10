"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firestore_1 = __importDefault(require("../db/firestore"));
const replyInChannel_1 = require("../actions/replyInChannel");
const { getLabelFromUser, getLightEmoji, currentTimeAt, } = require(`../scripts/commonFunctions`);
const getTimezoneFromLocation = require(`../actions/getTimezoneFromLocation`);
module.exports = {
    admin: true,
    regex(settings) {
        return new RegExp(`^${settings.prefix}(?:setuser|su) ([^\s]*) (.*)`, `gi`);
    },
    expectsUserInRegexSlot: 1,
    async action({ msg, match, settings, typedUser }) {
        console.log(`${msg.guild
            ? msg.guild.name.substring(0, 25).padEnd(25, ` `)
            : `Private Message`}${msg.guild ? ` (${msg.guild.id})` : ``} - Admin set user ${typedUser ? getLabelFromUser(typedUser) : match[1]} > ${match[2]} (${msg.author.username})`);
        if (!match[1] || !match[2]) {
            return (0, replyInChannel_1.send)(msg, `Use this command in the format ${settings.prefix}setuser <@user> <location name> to set that user's timezone.`, false, settings);
        }
        if (!typedUser) {
            return (0, replyInChannel_1.send)(msg, `I couldn't find a user by the name ${match[1]}.`, false, settings);
        }
        const foundTimezone = await getTimezoneFromLocation(match[2]);
        if (!foundTimezone)
            return (0, replyInChannel_1.send)(msg, `Sorry, I couldn't find a timezone for ${match[2]}.`, false, settings);
        await firestore_1.default.updateUserInGuild({
            guildId: msg.guild.id,
            guildName: msg.guild.name,
            userId: typedUser.id || typedUser.user.id,
            updatedInfo: foundTimezone,
        });
        (0, replyInChannel_1.send)(msg, `Timezone for ${getLabelFromUser(typedUser)} set to ${foundTimezone.timezoneName} by admin. (${getLightEmoji(foundTimezone.location)}${currentTimeAt(foundTimezone.location, false, settings.format24)})`, false, settings);
    },
};
