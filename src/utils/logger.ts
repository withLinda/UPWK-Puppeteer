import fs from 'fs';
import path from 'path';

class Logger {
    private logFile: string;
    private stream: fs.WriteStream;
    private static MAX_OBJECT_LENGTH = 500;

    constructor() {
        const logDir = path.join(process.cwd(), 'logs');
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir);
        }

        this.logFile = path.join(logDir, `app-${new Date().toISOString().split('T')[0]}.log`);
        this.stream = fs.createWriteStream(this.logFile, { flags: 'a' });
    }

    private formatMessage(message: any): string {
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
        } catch (error) {
            return String(message);
        }
    }

    log(message: any, level: 'info' | 'error' | 'warn' = 'info') {
        const timestamp = new Date().toISOString();
        const formattedMessage = this.formatMessage(message);
        const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${formattedMessage}\n`;
        this.stream.write(logMessage);
    }

    error(message: any) {
        this.log(message, 'error');
    }

    warn(message: any) {
        this.log(message, 'warn');
    }

    info(message: any) {
        this.log(message, 'info');
    }

    close() {
        this.stream.end();
    }
}

export const logger = new Logger();
