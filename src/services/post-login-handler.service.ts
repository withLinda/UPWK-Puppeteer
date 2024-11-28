import { Page } from 'puppeteer';
import { handleCookieConsent } from '../handlers/cookie-consent.handler';
import { handleSecurityQuestion } from '../handlers/security-question.handler';
import { handleProfileCompletionModal } from '../handlers/modal.handler';
import { handlePopovers } from '../handlers/popup.handler';
import { logger } from '../utils/logger';
import { delay } from '../utils/delay';
import { URLS } from '../config';
import { isLoggedIn } from './login-check.service';
import { saveAuthData } from './save-auth.service';

export class PostLoginHandlerService {
    constructor(private page: Page) { }

    async handleProfileModal(): Promise<void> {
        logger.info('Handling profile modal');
        await handleProfileCompletionModal(this.page);
    }

    async handlePostLoginFlow(securityAnswer: string): Promise<boolean> {
        try {
            // Handle post-login checks in sequence, continuing regardless of individual results
            await handleCookieConsent(this.page);

            // Security question is optional, continue flow regardless of result
            await handleSecurityQuestion(this.page, securityAnswer).catch(error => {
                logger.warn({
                    securityQuestionSkipped: {
                        message: error instanceof Error ? error.message : String(error)
                    }
                });
            });

            // Continue with modal and popup checks
            await this.handleProfileModal().catch(error => {
                logger.warn({
                    profileModalSkipped: {
                        message: error instanceof Error ? error.message : String(error)
                    }
                });
            });

            await handlePopovers(this.page).catch(error => {
                logger.warn({
                    popoversSkipped: {
                        message: error instanceof Error ? error.message : String(error)
                    }
                });
            });

            // Navigate to protected page to verify login
            await this.page.goto(URLS.DASHBOARD, {
                waitUntil: ["domcontentloaded", "networkidle0"],
            });

            // Wait a bit for any redirects
            await delay(3000);

            const isLoginSuccessful = await isLoggedIn(this.page);
            logger.info({ loginVerification: isLoginSuccessful });

            if (isLoginSuccessful) {
                await saveAuthData(this.page);
                await this.page.screenshot({ path: "login-success.png" });
                return true;
            }

            return false;
        } catch (error) {
            logger.error({ postLoginFlowError: error });
            return false;
        }
    }
}
