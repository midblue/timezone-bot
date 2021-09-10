"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commonFunctions_1 = require("../scripts/commonFunctions");
const { send } = require(`../actions/replyInChannel`);
const defaultServerSettings_1 = __importDefault(require("../scripts/defaultServerSettings"));
const replyToAts = require(`../actions/replyToAts`);
const contactGuildAdmin = require(`../actions/contactGuildAdmin`);
const all_1 = __importDefault(require("./all"));
const at_1 = __importDefault(require("./at"));
const count_1 = __importDefault(require("./count"));
const deleteresponse_1 = __importDefault(require("./deleteresponse"));
const format_1 = __importDefault(require("./format"));
const here_1 = __importDefault(require("./here"));
const info_1 = __importDefault(require("./info"));
const invite_1 = __importDefault(require("./invite"));
const me_1 = __importDefault(require("./me"));
const removeme_1 = __importDefault(require("./removeme"));
const removeuser_1 = __importDefault(require("./removeuser"));
const role_1 = __importDefault(require("./role"));
const set_1 = __importDefault(require("./set"));
const setprefix_1 = __importDefault(require("./setprefix"));
const setRepeatAnnounceTime_1 = __importDefault(require("./setRepeatAnnounceTime"));
const setuser_1 = __importDefault(require("./setuser"));
const stamp_1 = __importDefault(require("./stamp"));
const support_1 = __importDefault(require("./support"));
const suppresswarnings_1 = __importDefault(require("./suppresswarnings"));
const time_1 = __importDefault(require("./time"));
const timein_1 = __importDefault(require("./timein"));
const toggleadminonly_1 = __importDefault(require("./toggleadminonly"));
const toggleautorespond_1 = __importDefault(require("./toggleautorespond"));
const toggledeletecommand_1 = __importDefault(require("./toggledeletecommand"));
const verboseAll_1 = __importDefault(require("./verboseAll"));
const commands = [
    all_1.default,
    at_1.default,
    count_1.default,
    deleteresponse_1.default,
    format_1.default,
    here_1.default,
    info_1.default,
    invite_1.default,
    me_1.default,
    removeme_1.default,
    removeuser_1.default,
    role_1.default,
    set_1.default,
    setprefix_1.default,
    setRepeatAnnounceTime_1.default,
    setuser_1.default,
    stamp_1.default,
    support_1.default,
    suppresswarnings_1.default,
    time_1.default,
    timein_1.default,
    toggleadminonly_1.default,
    toggleautorespond_1.default,
    toggledeletecommand_1.default,
    verboseAll_1.default,
];
module.exports = async function (msg, settings, client) {
    var _a, _b;
    if (!settings)
        settings = defaultServerSettings_1.default;
    for (let command of commands) {
        const match = command.regex(settings).exec(msg.content);
        if (match) {
            // preload full message data
            msg = await msg.fetch();
            const sender = await ((_a = msg.guild) === null || _a === void 0 ? void 0 : _a.members.fetch({
                user: msg.author,
            }));
            const senderIsAdmin = sender && sender.permissions.has(`BAN_MEMBERS`); // was 'ADMINISTRATOR', sneakily switched
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
                typedUser = await (0, commonFunctions_1.getUserInGuildFromText)(msg, usernameInPlainText);
            }
            // preload guild
            await ((_b = msg.guild) === null || _b === void 0 ? void 0 : _b.fetch());
            // execute command
            await command.action({
                msg,
                settings: settings || defaultServerSettings_1.default,
                match,
                typedUser,
                senderIsAdmin,
                sender,
                client,
            });
            if (settings.deleteCommand && !command.doNotDelete)
                msg.delete().catch((e) => {
                    console.log(`failed to delete message:`, e.code);
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
