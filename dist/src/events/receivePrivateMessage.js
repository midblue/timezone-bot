"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const timein_1 = __importDefault(require("../commands/timein"));
const defaultSettings = require(`../scripts/defaultServerSettings`);
exports.default = async (msg) => {
    await timein_1.default.action({
        msg,
        settings: defaultSettings,
        match: [``, ` `, msg.content],
    });
    // msg.channel.send(`I only work in a server channel for now.
    // If you're looking for the invite link, it's https://discord.com/api/oauth2/authorize?client_id=723017262369472603&permissions=75840&scope=bot`)
};
