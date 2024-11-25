"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadFromFile = exports.saveToFile = exports.ensureDirectoryExists = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const ensureDirectoryExists = (filePath) => {
    const dirname = path_1.default.dirname(filePath);
    if (!fs_1.default.existsSync(dirname)) {
        fs_1.default.mkdirSync(dirname, { recursive: true });
        console.log(`Created directory: ${dirname}`);
    }
};
exports.ensureDirectoryExists = ensureDirectoryExists;
const saveToFile = (filePath, data) => {
    try {
        (0, exports.ensureDirectoryExists)(filePath);
        fs_1.default.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true;
    }
    catch (error) {
        console.error(`Error saving to ${filePath}:`, error);
        return false;
    }
};
exports.saveToFile = saveToFile;
const loadFromFile = (filePath) => {
    try {
        if (!fs_1.default.existsSync(filePath))
            return null;
        const data = fs_1.default.readFileSync(filePath, "utf-8");
        return JSON.parse(data);
    }
    catch (error) {
        console.error(`Error loading from ${filePath}:`, error);
        return null;
    }
};
exports.loadFromFile = loadFromFile;
//# sourceMappingURL=storage.service.js.map