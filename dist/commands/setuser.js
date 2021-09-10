"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firestore_1 = __importDefault(require("../db/firestore"));
const replyInChannel_1 = require("../actions/replyInChannel");
const commonFunctions_1 = require("../scripts/commonFunctions");
const getTimezoneFromLocation_1 = __importDefault(require("../actions/getTimezoneFromLocation"));
exports.default = {
    admin: true,
    regex(settings) {
        return new RegExp(`^${settings.prefix}(?:setuser|su) ([^\s]*) (.*)`, // eslint-disable-line
        `gi`);
    },
    expectsUserInRegexSlot: 1,
    async action({ msg, match, settings, typedUser, }) {
        var _a, _b, _c;
        console.log(`${((_a = msg.guild) === null || _a === void 0 ? void 0 : _a.name)
            ? msg.guild.name.substring(0, 25).padEnd(25, ` `)
            : `Private Message`}${msg.guild ? ` (${msg.guild.id})` : ``} - Admin set user ${typedUser ? (0, commonFunctions_1.getLabelFromUser)(typedUser) : match[1]} > ${match[2]} (${msg.author.username})`);
        if (!match[1] || !match[2]) {
            return (0, replyInChannel_1.send)(msg, `Use this command in the format ${settings.prefix}setuser <@user> <location name> to set that user's timezone.`, false, settings);
        }
        if (!typedUser) {
            return (0, replyInChannel_1.send)(msg, `I couldn't find a user by the name ${match[1]}.`, false, settings);
        }
        const foundTimezone = await (0, getTimezoneFromLocation_1.default)(match[2]);
        if (!foundTimezone)
            return (0, replyInChannel_1.send)(msg, `Sorry, I couldn't find a timezone for ${match[2]}.`, false, settings);
        await firestore_1.default.updateUserInGuild({
            guildId: (_b = msg.guild) === null || _b === void 0 ? void 0 : _b.id,
            guildName: (_c = msg.guild) === null || _c === void 0 ? void 0 : _c.name,
            userId: typedUser.id || typedUser.user.id,
            updatedInfo: foundTimezone,
        });
        (0, replyInChannel_1.send)(msg, `Timezone for ${(0, commonFunctions_1.getLabelFromUser)(typedUser)} set to ${foundTimezone.timezoneName} by admin. (${(0, commonFunctions_1.getLightEmoji)(foundTimezone.location)}${(0, commonFunctions_1.currentTimeAt)(foundTimezone.location, false, Boolean(settings.format24))})`, false, settings);
    },
};
