import dotenv from 'dotenv';
import { BrowserService } from './services/browser.service';
import { AuthFlowService } from './services/auth-flow.service';
import { handleError } from './utils/errors';
import { URLS } from './config';
import { logger } from './utils/logger';

dotenv.config();

async function main(): Promise<void> {
    const browserService = new BrowserService();

    try {
        const page = await browserService.initialize();
        const authFlow = new AuthFlowService(page);

        await browserService.navigateTo(URLS.DASHBOARD);

        // Check if we can use stored authentication
        const isStoredLoginSuccessful = await authFlow.attemptStoredLogin();

        if (!isStoredLoginSuccessful) {
            logger.info("Stored login failed or not available, proceeding with full login flow");

            const { email, password, securityAnswer } = process.env;

            if (!email || !password || !securityAnswer) {
                throw new Error('Required environment variables are missing');
            }

            const isLoginSuccessful = await authFlow.performLogin(
                email,
                password,
                securityAnswer
            );

            if (!isLoginSuccessful) {
                throw new Error('Login failed');
            }
        }

        logger.info("Successfully logged in and ready for automation");

    } catch (error) {
        handleError(error);
    } finally {
        await browserService.cleanup();
        logger.close();
    }
}

// Handle process termination
process.on('SIGINT', async () => {
    logger.info('Received SIGINT. Cleaning up...');
    const browserService = new BrowserService();
    await browserService.cleanup();
    logger.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM. Cleaning up...');
    const browserService = new BrowserService();
    await browserService.cleanup();
    logger.close();
    process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
    logger.close();
    process.exit(1);
});

main();
