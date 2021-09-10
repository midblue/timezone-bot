"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const all_1 = __importDefault(require("./all"));
exports.default = {
    regex(settings) {
        return new RegExp(`^${settings.prefix}(?:here|h)$`, `gi`);
    },
    async action({ msg, settings, match }) {
        all_1.default.action({ msg, settings, match, here: true });
    },
};
