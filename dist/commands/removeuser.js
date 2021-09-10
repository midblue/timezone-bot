"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firestore_1 = __importDefault(require("../db/firestore"));
const replyInChannel_1 = require("../actions/replyInChannel");
const commonFunctions_1 = require("../scripts/commonFunctions");
exports.default = {
    admin: true,
    regex(settings) {
        return new RegExp(`^${settings.prefix}(?:removeuser|ru) (.*)`, `gi`);
    },
    expectsUserInRegexSlot: 1,
    async action({ msg, match, typedUser, settings, }) {
        var _a, _b;
        console.log(`${((_a = msg.guild) === null || _a === void 0 ? void 0 : _a.name)
            ? msg.guild.name.substring(0, 25).padEnd(25, ` `)
            : `Private Message`}${msg.guild ? ` (${msg.guild.id})` : ``} - Admin remove user ${match[1]} (${msg.author.username})`);
        if (!match[1]) {
            return (0, replyInChannel_1.send)(msg, `Use this command in the format ${settings.prefix}removeuser <username> to remove that user's timezone.`, false, settings);
        }
        if (!typedUser) {
            return (0, replyInChannel_1.send)(msg, `I couldn't find a user by the name ${match[1]}.`, false, settings);
        }
        const success = await firestore_1.default.removeUserFromGuild({
            guildId: (_b = msg.guild) === null || _b === void 0 ? void 0 : _b.id,
            userId: typedUser.id || typedUser.user.id,
        });
        if (success === true)
            return (0, replyInChannel_1.send)(msg, `Removed ${await (0, commonFunctions_1.getLabelFromUser)(typedUser)} from timezone tracking.`, false, settings);
        else if (success)
            return (0, replyInChannel_1.send)(msg, success, false, settings);
        return (0, replyInChannel_1.send)(msg, `An unknown error occurred.`, false, settings);
    },
};
