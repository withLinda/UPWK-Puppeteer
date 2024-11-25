"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOCALSTORAGE_PATH = exports.COOKIE_PATH = void 0;
const path_1 = __importDefault(require("path"));
exports.COOKIE_PATH = path_1.default.join(__dirname, "..", "data", "auth", "cookies", "auth_cookies.json");
exports.LOCALSTORAGE_PATH = path_1.default.join(__dirname, "..", "data", "auth", "localStorage", "auth_localStorage.json");
//# sourceMappingURL=paths.js.map