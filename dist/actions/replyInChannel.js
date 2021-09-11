"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reply = exports.send = void 0;
const contactGuildAdmin_1 = __importDefault(require("./contactGuildAdmin"));
function send(msg, text, block = false, settings) {
    const messages = [];
    const prefix = block === `none` ? `` : block ? `\`\`\`` : `\``;
    if (typeof text === `object`)
        messages.push(text);
    else {
        let remainingText = text;
        while (remainingText.length > 0) {
            messages.push(`${prefix}${remainingText.substring(0, 1990)}${prefix}`);
            remainingText = remainingText.substring(1990);
        }
    }
    for (let message of messages)
        msg.channel
            .send(message)
            .then((sentMsg) => {
            if (settings && settings.deleteResponse) {
                setTimeout(async () => {
                    try {
                        const msgToDelete = await sentMsg.channel.messages.fetch(sentMsg.id);
                        msgToDelete.delete().catch((err) => {
                            if (!settings.suppressWarnings)
                                (0, contactGuildAdmin_1.default)({
                                    guild: msg.guild,
                                    message: `I failed to delete a message in your server. It's most likely because I don't have delete permissions on your server or in the channel I attempted to delete from. Make sure I have delete permissions in the channels where I'm used, or kick TimezoneBot and use this link to re-add with proper permissions. (Your settings and saved timezones will be saved) https://discord.com/api/oauth2/authorize?client_id=437598259330940939&permissions=75840&scope=bot`,
                                });
                            console.error(`Failed to delete!`, err.message);
                        });
                    }
                    catch (e) {
                        console.error(`Failed to delete!!`, e.message);
                    }
                }, typeof settings.deleteResponse === `number`
                    ? settings.deleteResponse * 1000
                    : 5 * 60 * 1000);
            }
        })
            .catch((err) => {
            if (!settings.suppressWarnings)
                (0, contactGuildAdmin_1.default)({
                    guild: msg.guild,
                    message: `I failed to send a message in your server. It's most likely because I don't have the right permissions on the server or in the channel I attempted to post in. Make sure I have post permissions in the channels where I'm used, or kick TimezoneBot and use this link to re-add with proper permissions. (Your settings and saved timezones will be saved) https://discord.com/api/oauth2/authorize?client_id=437598259330940939&permissions=75840&scope=bot`,
                });
            console.error(`Failed to send!`, err.message);
        });
}
exports.send = send;
function reply(msg, text, settings) {
    const messages = [];
    let remainingText = text;
    while (remainingText.length > 0) {
        messages.push(remainingText.substring(0, 1998));
        remainingText = remainingText.substring(1998);
    }
    for (let message of messages)
        msg.channel.send(message).catch((err) => {
            if (!settings.suppressWarnings)
                (0, contactGuildAdmin_1.default)({
                    guild: msg.guild,
                    message: `I failed to send a message in your server. It's most likely because I don't have the right permissions. Make sure I have post permissions in the channels where I'm used, or kick TimezoneBot and use this link to re-add with proper permissions. (Your settings and saved timezones will be saved) https://discord.com/api/oauth2/authorize?client_id=437598259330940939&permissions=75840&scope=bot`,
                });
            console.error(`Failed to reply!`, err.message);
        });
}
exports.reply = reply;
