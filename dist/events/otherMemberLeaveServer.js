"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firestore_1 = __importDefault(require("../db/firestore"));
exports.default = async (member) => {
    var _a;
    const guildId = member.guild.id;
    const userId = member.id || ((_a = member.user) === null || _a === void 0 ? void 0 : _a.id);
    firestore_1.default.removeUserFromGuild({ guildId, userId });
};
