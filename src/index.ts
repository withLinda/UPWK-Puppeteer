import dotenv from 'dotenv';
import { BrowserService } from './services/browser.service';
import { AuthFlowService } from './services/auth-flow.service';
import { handleError } from './utils/errors';

dotenv.config();

async function main(): Promise<void> {
    const browserService = new BrowserService();

    try {
        const page = await browserService.initialize();
        const authFlow = new AuthFlowService(page);

        await browserService.navigateTo("https://www.upwork.com/nx/find-work/best-matches");

        // Check if we can use stored authentication
        const isStoredLoginSuccessful = await authFlow.attemptStoredLogin();

        if (!isStoredLoginSuccessful) {
            console.log("Stored login failed or not available, proceeding with full login flow");

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

        console.log("Successfully logged in and ready for automation");

    } catch (error) {
        handleError(error);
    } finally {
        await browserService.cleanup();
    }
}

// Handle process termination
process.on('SIGINT', async () => {
    console.log('Received SIGINT. Cleaning up...');
    const browserService = new BrowserService();
    await browserService.cleanup();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('Received SIGTERM. Cleaning up...');
    const browserService = new BrowserService();
    await browserService.cleanup();
    process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

main();
