"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firestore_1 = __importDefault(require("../db/firestore"));
const commonFunctions_1 = require("../scripts/commonFunctions");
const replyInChannel_1 = require("../actions/replyInChannel");
exports.default = {
    ignoreAdminOnly: true,
    regex(settings) {
        return new RegExp(`^${settings.prefix}(?:me|m)$`, `gi`);
    },
    async action({ msg, settings, senderIsAdmin, }) {
        var _a, _b;
        console.log(`${msg.guild
            ? (_a = msg.guild.name) === null || _a === void 0 ? void 0 : _a.substring(0, 25).padEnd(25, ` `)
            : `Private Message`}${msg.guild ? ` (${msg.guild.id})` : ``} - Me (${msg.author.username})`);
        const foundUser = await firestore_1.default.getUserInGuildFromId({
            guildId: (_b = msg.guild) === null || _b === void 0 ? void 0 : _b.id,
            userId: msg.author.id,
        });
        if (!foundUser) {
            if (settings.adminOnly && !senderIsAdmin)
                return (0, replyInChannel_1.send)(msg, `There's no timezone set for you.`, false, settings);
            return (0, replyInChannel_1.send)(msg, `You haven't set a timezone for yourself yet! Use "${settings.prefix}set <location name>" to set your timezone.`, false, settings);
        }
        return (0, replyInChannel_1.send)(msg, `Your timezone is set to ${(0, commonFunctions_1.standardizeTimezoneName)(foundUser.timezoneName)}. (${(0, commonFunctions_1.getLightEmoji)(foundUser.location)}${(0, commonFunctions_1.currentTimeAt)(foundUser.location, false, Boolean(settings.format24))})`, false, settings);
    },
};
