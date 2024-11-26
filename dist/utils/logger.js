"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class Logger {
    constructor() {
        const logDir = path_1.default.join(process.cwd(), 'logs');
        if (!fs_1.default.existsSync(logDir)) {
            fs_1.default.mkdirSync(logDir);
        }
        this.logFile = path_1.default.join(logDir, `app-${new Date().toISOString().split('T')[0]}.log`);
        this.stream = fs_1.default.createWriteStream(this.logFile, { flags: 'a' });
    }
    formatMessage(message) {
        if (typeof message === 'string') {
            return message;
        }
        if (message instanceof Error) {
            return `${message.message}${message.stack ? `\nStack: ${message.stack}` : ''}`;
        }
        try {
            const stringified = JSON.stringify(message);
            if (stringified.length > Logger.MAX_OBJECT_LENGTH) {
                return stringified.substring(0, Logger.MAX_OBJECT_LENGTH) + '... [truncated]';
            }
            return stringified;
        }
        catch (error) {
            return String(message);
        }
    }
    log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        const formattedMessage = this.formatMessage(message);
        const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${formattedMessage}\n`;
        this.stream.write(logMessage);
    }
    error(message) {
        this.log(message, 'error');
    }
    warn(message) {
        this.log(message, 'warn');
    }
    info(message) {
        this.log(message, 'info');
    }
    close() {
        this.stream.end();
    }
}
Logger.MAX_OBJECT_LENGTH = 500;
exports.logger = new Logger();
//# sourceMappingURL=logger.js.map