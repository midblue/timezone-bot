"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firestore_1 = __importDefault(require("../db/firestore"));
const replyInChannel_1 = require("../actions/replyInChannel");
module.exports = {
    admin: true,
    regex(settings) {
        return new RegExp(`^${settings.prefix}(?:verboseall)$`, `gi`);
    },
    async action({ msg, settings, match }) {
        const turnOff = settings.verboseAll === true;
        console.log(`${msg.guild ? msg.guild.name : `Private Message`} - Toggle verbose all > ${turnOff ? `off` : `on`} (${msg.author.username}) `);
        await firestore_1.default.setGuildSettings({
            guildId: msg.guild.id,
            verboseAll: !turnOff,
        });
        (0, replyInChannel_1.send)(msg, `Verbose listings in \'${settings.prefix}all\' and \'${settings.prefix}here\' have been ${turnOff ? `turned off` : `turned on`}.`, false, settings);
    },
};
