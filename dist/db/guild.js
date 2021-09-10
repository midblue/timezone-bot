"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const defaultServerSettings_1 = __importDefault(require("../scripts/defaultServerSettings"));
const memo_1 = __importDefault(require("../scripts/memo"));
const memoedGuildData = (0, memo_1.default)(300);
let firestore = firebase_admin_1.default.firestore();
exports.default = {
    async hasGuild({ guildId }) {
        const document = firestore.doc(`guilds/${guildId}`);
        const doc = await document.get();
        if (doc.data())
            return true;
        return false;
    },
    async addGuild({ guildId, guildName, }) {
        if (!guildId || !guildName)
            return;
        const document = firestore.doc(`guilds/${guildId}`);
        const newData = {
            dateAdded: Date.now(),
            name: guildName,
            users: {},
            settings: defaultServerSettings_1.default,
        };
        memoedGuildData.set(guildId, newData);
        await document.set(newData);
        return newData;
        // console.log(`Added guild ${guildId}`)
    },
    async getGuildSettings({ guildId, }) {
        if (!guildId)
            return;
        const memoed = memoedGuildData.get(guildId);
        if (memoed)
            return memoed.settings;
        let data;
        try {
            const document = firestore.doc(`guilds/${guildId}`);
            const doc = await document.get();
            data = doc.data();
        }
        catch (e) { }
        if (!data)
            return defaultServerSettings_1.default;
        const settings = {
            ...defaultServerSettings_1.default,
            ...(data.settings || {}),
        };
        memoedGuildData.set(guildId, { ...data, settings });
        return settings;
    },
    async setGuildSettings(newSettings, guildId) {
        if (!guildId)
            return;
        const document = firestore.doc(`guilds/${guildId}`);
        const existingSettings = await this.getGuildSettings({
            guildId,
        });
        const finalSettings = existingSettings;
        if (newSettings.prefix !== undefined)
            finalSettings.prefix = newSettings.prefix;
        if (newSettings.autoRespond !== undefined)
            finalSettings.autoRespond = newSettings.autoRespond;
        if (newSettings.adminOnly !== undefined)
            finalSettings.adminOnly = newSettings.adminOnly;
        if (newSettings.deleteCommand !== undefined)
            finalSettings.deleteCommand =
                newSettings.deleteCommand;
        if (newSettings.format24 !== undefined)
            finalSettings.format24 = newSettings.format24;
        if (newSettings.repeatAnnounceTime !== undefined)
            finalSettings.repeatAnnounceTime =
                newSettings.repeatAnnounceTime;
        if (newSettings.deleteResponse !== undefined)
            finalSettings.deleteResponse =
                newSettings.deleteResponse;
        if (newSettings.suppressWarnings !== undefined)
            finalSettings.suppressWarnings =
                newSettings.suppressWarnings;
        if (newSettings.verboseAll !== undefined)
            finalSettings.verboseAll = newSettings.verboseAll;
        memoedGuildData.updateProp(guildId, `settings`, finalSettings);
        await document.update({ settings: finalSettings });
    },
    getGuildUsers,
    async getUserInGuildFromId({ guildId, userId, }) {
        if (!guildId)
            return null;
        const users = await getGuildUsers(guildId);
        return users[userId];
    },
    async updateUserInGuild({ guildId, guildName, userId, updatedInfo, }) {
        if (!guildId || !guildName)
            return;
        const guildDocRef = firestore.doc(`guilds/${guildId}`);
        const doc = await guildDocRef.get();
        let data = doc.data();
        // * had a bug where this was returning nothing
        if (!data)
            data = await this.addGuild({ guildId, guildName });
        if (!data)
            return;
        const users = data.users;
        users[userId] = updatedInfo;
        memoedGuildData.updateProp(guildId, `users`, users);
        await guildDocRef.update({ users });
    },
    async removeUserFromGuild({ guildId, userId, }) {
        if (!guildId || !userId)
            return;
        const guildDocRef = firestore.doc(`guilds/${guildId}`);
        const doc = await guildDocRef.get();
        const data = doc.data();
        if (!data)
            return;
        const users = data.users;
        if (!userId) {
            console.log(`Failed to remove user ${userId} from guild ${guildId}: No user ID supplied`);
            return;
        }
        if (!users[userId]) {
            console.log(`Failed to remove user ${userId} from guild ${guildId}: No user found by that ID`);
            return `No user found by that id.`;
        }
        delete users[userId];
        memoedGuildData.updateProp(guildId, `users`, users);
        await guildDocRef.update({ users });
        return true;
        // console.log(`Removed user ${userId} from guild ${guildId}`)
    },
};
async function getGuildUsers(guildId) {
    if (!guildId)
        return {};
    const memoed = memoedGuildData.get(guildId);
    if (memoed)
        return memoed.users;
    const guildDocRef = firestore.doc(`guilds/${guildId}`);
    const doc = await guildDocRef.get();
    const data = doc.data() || {};
    memoedGuildData.set(guildId, data);
    const users = data.users || {};
    return users;
}
