"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firestore_1 = __importDefault(require("../db/firestore"));
const { getLightEmoji, standardizeTimezoneName, currentTimeAt, } = require(`../scripts/commonFunctions`);
const replyInChannel_1 = require("../actions/replyInChannel");
module.exports = {
    ignoreAdminOnly: true,
    regex(settings) {
        return new RegExp(`^${settings.prefix}(?:me|m)$`, `gi`);
    },
    async action({ msg, settings, senderIsAdmin, }) {
        console.log(`${msg.guild
            ? msg.guild.name.substring(0, 25).padEnd(25, ` `)
            : `Private Message`}${msg.guild ? ` (${msg.guild.id})` : ``} - Me (${msg.author.username})`);
        const foundUser = await firestore_1.default.getUserInGuildFromId({
            guildId: msg.guild.id,
            userId: msg.author.id,
        });
        if (!foundUser) {
            if (settings.adminOnly && !senderIsAdmin)
                return (0, replyInChannel_1.send)(msg, `There's no timezone set for you.`, false, settings);
            return (0, replyInChannel_1.send)(msg, `You haven't set a timezone for yourself yet! Use "${settings.prefix}set <location name>" to set your timezone.`, false, settings);
        }
        return (0, replyInChannel_1.send)(msg, `Your timezone is set to ${standardizeTimezoneName(foundUser.timezoneName)}. (${getLightEmoji(foundUser.location)}${currentTimeAt(foundUser.location, false, settings.format24)})`, false, settings);
    },
};
