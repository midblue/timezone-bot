"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const replyInChannel_1 = require("../actions/replyInChannel");
module.exports = {
    regex(settings) {
        return new RegExp(`^${settings.prefix}(?:support)$`, `gi`);
    },
    async action({ msg, settings, match }) {
        console.log(`${msg.guild ? msg.guild.name : `Private Message`} - Support (${msg.author.username}) `);
        (0, replyInChannel_1.send)(msg, `Join the TimezoneBot Support server here: <https://discord.gg/9MKpMCV>`, `none`, settings);
    },
};
