"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const { getUserInGuildFromText, } = require('../scripts/commonFunctions');
const { send } = require('../actions/replyInChannel');
const defaultServerSettings = require('../scripts/defaultServerSettings');
const replyToAts = require('../actions/replyToAts');
const contactGuildAdmin = require('../actions/contactGuildAdmin');
// get all commands from files
const fs = __importStar(require("fs"));
// const { getUserInGuildFromId } = require('../db/firestore')
const commands = [];
fs.readdir('./src/commands', (err, files) => {
    files.forEach((file) => {
        if (!file.endsWith('.js') || file === 'index.js')
            return;
        commands.push(require(`./${file}`));
    });
});
module.exports = async function (msg, settings, client) {
    var _a;
    if (!settings)
        settings = defaultServerSettings;
    for (let command of commands) {
        const match = command.regex(settings, Settings).exec(msg.content);
        if (match) {
            const sender = await ((_a = msg.guild) === null || _a === void 0 ? void 0 : _a.members.fetch({
                user: msg.author,
            }));
            const senderIsAdmin = sender && sender.permissions.has('BAN_MEMBERS'); // was 'ADMINISTRATOR', sneakily switched
            if (settings.adminOnly === true &&
                !command.ignoreAdminOnly &&
                !senderIsAdmin) {
                send(msg, `This command is currently disabled for non-admins.`, false, settings);
                return true;
            }
            if (command.admin && !senderIsAdmin) {
                send(msg, `That command is only available to server admins.`, false, settings);
                return true;
            }
            // embedded user check
            let typedUser;
            if (command.expectsUserInRegexSlot &&
                match[command.expectsUserInRegexSlot]) {
                const usernameInPlainText = match[command.expectsUserInRegexSlot];
                typedUser = await getUserInGuildFromText(msg, usernameInPlainText);
            }
            // execute command
            await command.action({
                msg,
                settings: settings || defaultServerSettings,
                match,
                typedUser,
                senderIsAdmin,
                sender,
                client,
            });
            if (settings.deleteCommand && !command.doNotDelete)
                msg.delete().catch((e) => {
                    console.log('failed to delete message:', e.code);
                    if (!settings.suppressWarnings)
                        contactGuildAdmin({
                            guild: msg.guild,
                            message: `I don't have permission to delete messages on your server. Kick TimezoneBot and use this link to re-add with proper permissions. (Your settings and saved timezones will be saved) https://discord.com/api/oauth2/authorize?client_id=437598259330940939&permissions=75840&scope=bot`,
                        });
                });
            return true;
        }
    }
    if (settings.autoRespond !== false)
        await replyToAts(msg, settings);
};
