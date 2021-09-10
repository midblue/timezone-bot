"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firestore_1 = __importDefault(require("../db/firestore"));
const commands = require(`../commands/index`);
exports.default = async (msg, client) => {
    var _a;
    await commands(msg, await firestore_1.default.getGuildSettings({ guildId: (_a = msg.guild) === null || _a === void 0 ? void 0 : _a.id }), client);
};
