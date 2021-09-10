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
        return new RegExp(`^${settings.prefix}(?:format)$`, `gi`);
    },
    async action({ msg, settings, match }) {
        const turnOff = settings.format24 === true;
        console.log(`${msg.guild ? msg.guild.name : `Private Message`} - Toggle format > ${turnOff ? `12-hour` : `24-hour`} (${msg.author.username}) `);
        await firestore_1.default.setGuildSettings({
            format24: !turnOff,
        }, msg.guild.id);
        (0, replyInChannel_1.send)(msg, `Times will now be shown in ${turnOff ? `12-hour AM/PM format` : `24-hour format`}.`, false, settings);
    },
};
