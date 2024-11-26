"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const browser_service_1 = require("./services/browser.service");
const auth_flow_service_1 = require("./services/auth-flow.service");
const errors_1 = require("./utils/errors");
const config_1 = require("./config");
const logger_1 = require("./utils/logger");
dotenv_1.default.config();
async function main() {
    const browserService = new browser_service_1.BrowserService();
    try {
        const page = await browserService.initialize();
        const authFlow = new auth_flow_service_1.AuthFlowService(page);
        await browserService.navigateTo(config_1.URLS.DASHBOARD);
        // Check if we can use stored authentication
        const isStoredLoginSuccessful = await authFlow.attemptStoredLogin();
        if (!isStoredLoginSuccessful) {
            logger_1.logger.info("Stored login failed or not available, proceeding with full login flow");
            const { email, password, securityAnswer } = process.env;
            if (!email || !password || !securityAnswer) {
                throw new Error('Required environment variables are missing');
            }
            const isLoginSuccessful = await authFlow.performLogin(email, password, securityAnswer);
            if (!isLoginSuccessful) {
                throw new Error('Login failed');
            }
        }
        logger_1.logger.info("Successfully logged in and ready for automation");
    }
    catch (error) {
        (0, errors_1.handleError)(error);
    }
    finally {
        await browserService.cleanup();
        logger_1.logger.close();
    }
}
// Handle process termination
process.on('SIGINT', async () => {
    logger_1.logger.info('Received SIGINT. Cleaning up...');
    const browserService = new browser_service_1.BrowserService();
    await browserService.cleanup();
    logger_1.logger.close();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    logger_1.logger.info('Received SIGTERM. Cleaning up...');
    const browserService = new browser_service_1.BrowserService();
    await browserService.cleanup();
    logger_1.logger.close();
    process.exit(0);
});
process.on('unhandledRejection', (reason, promise) => {
    logger_1.logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
    logger_1.logger.close();
    process.exit(1);
});
main();
//# sourceMappingURL=index.js.map