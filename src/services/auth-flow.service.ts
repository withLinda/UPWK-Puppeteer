import { Page } from 'puppeteer';
import { InputService } from './input.service';
import { delay, getRandomDelayFromTuple } from '../utils/delay';
import { saveAuthData } from './save-auth.service';
import { loadAuthData } from './load-auth.service';
import { isLoggedIn } from './login-check.service';
import { SELECTORS, TIMING, URLS } from '../config';
import { AuthenticationError } from '../utils/errors';
import { handleCookieConsent } from '../handlers/cookie-consent.handler';
import { handlePopovers } from '../handlers/popup.handler';
import { handleProfileCompletionModal } from '../handlers/modal.handler';
import { handleSecurityQuestion } from '../handlers/security-question.handler';
import { logger } from '../utils/logger';

export class AuthFlowService {
    private inputService: InputService;
    private loginState = {
        emailVerified: false,
        passwordFieldReady: false,
        passwordEntered: false
    };

    constructor(private page: Page) {
        this.inputService = new InputService(page);
        logger.info('AuthFlowService initialized');
    }

    private async elementExists(selector: string, timeout = TIMING.ELEMENT_WAIT_TIMEOUT): Promise<boolean> {
        try {
            const element = await this.page.waitForSelector(selector, {
                visible: true,
                timeout: timeout
            });
            const exists = element !== null;

            if (exists) {
                const elementState = await this.page.evaluate((sel) => {
                    const el = document.querySelector(sel);
                    if (!el) return null;

                    const rect = el.getBoundingClientRect();
                    const styles = window.getComputedStyle(el);

                    return {
                        visible: styles.display !== 'none' &&
                            styles.visibility !== 'hidden' &&
                            styles.opacity !== '0',
                        position: {
                            top: rect.top,
                            left: rect.left,
                            bottom: rect.bottom,
                            right: rect.right
                        },
                        styles: {
                            display: styles.display,
                            visibility: styles.visibility,
                            opacity: styles.opacity,
                            zIndex: styles.zIndex
                        },
                        attributes: {
                            disabled: el.hasAttribute('disabled'),
                            ariaHidden: el.getAttribute('aria-hidden'),
                            ariaDisabled: el.getAttribute('aria-disabled')
                        }
                    };
                }, selector);

                logger.info({ elementCheck: { selector, exists, state: elementState } });
            }

            return exists;
        } catch (error) {
            logger.info({ elementCheck: { selector, exists: false, error } });
            return false;
        }
    }

    async handleProfileModal(): Promise<void> {
        logger.info('Handling profile modal');
        await handleProfileCompletionModal(this.page);
    }

    async attemptStoredLogin(): Promise<boolean> {
        logger.info('Attempting stored login');
        try {
            const authLoaded = await loadAuthData(this.page);
            if (!authLoaded) {
                logger.info('No stored authentication data found');
                return false;
            }

            // Navigate directly to protected page to check login state
            await this.page.goto(URLS.DASHBOARD, {
                waitUntil: ["domcontentloaded", "networkidle0"],
            });

            // Wait a bit for any redirects
            await delay(3000);

            const loginStatus = await isLoggedIn(this.page);
            logger.info({ storedLoginVerification: loginStatus });
            return loginStatus;
        } catch (error) {
            logger.error(error);
            return false;
        }
    }

    async performLogin(email: string, password: string, securityAnswer: string): Promise<boolean> {
        logger.info({
            loginAttempt: {
                email: `${email.substring(0, 3)}...${email.substring(email.length - 3)}`,
                url: URLS.LOGIN
            }
        });

        try {
            // First try going directly to protected page
            await this.page.goto(URLS.DASHBOARD, {
                waitUntil: ["domcontentloaded", "networkidle0"],
            });

            // Wait a bit for any redirects
            await delay(3000);

            // Check if we're already logged in
            const isAlreadyLoggedIn = await isLoggedIn(this.page);
            if (isAlreadyLoggedIn) {
                logger.info('User is already logged in');
                return true;
            }

            // If not logged in, proceed with login flow
            await this.page.goto(URLS.LOGIN, {
                waitUntil: ["domcontentloaded", "networkidle0"],
            });

            await handleCookieConsent(this.page);

            await this.inputService.handleInput(SELECTORS.LOGIN.EMAIL_INPUT, email, {
                isPassword: false,
                preTypeDelay: TIMING.DELAYS.MEDIUM,
                postTypeDelay: TIMING.DELAYS.MEDIUM,
            });

            this.loginState.emailVerified = true;

            const continueButtonExists = await this.elementExists(SELECTORS.LOGIN.LOGIN_PASSWORD_CONTINUE_BUTTON);
            const passwordInputExists = await this.elementExists(SELECTORS.LOGIN.PASSWORD_INPUT);

            logger.info({
                loginFlowState: {
                    continueButtonExists,
                    passwordInputExists,
                    loginState: this.loginState
                }
            });

            if (continueButtonExists && this.loginState.emailVerified) {
                await this.inputService.handleButton(SELECTORS.LOGIN.LOGIN_PASSWORD_CONTINUE_BUTTON, {
                    preClickDelay: TIMING.DELAYS.SHORT,
                    postClickDelay: TIMING.DELAYS.LONG,
                });

                const passwordInputAppeared = await this.page.waitForSelector(SELECTORS.LOGIN.PASSWORD_INPUT, {
                    visible: true,
                    timeout: TIMING.ELEMENT_WAIT_TIMEOUT
                });

                if (!passwordInputAppeared) {
                    throw new AuthenticationError("Password input field did not appear after clicking continue button");
                }
                this.loginState.passwordFieldReady = true;
            } else if (passwordInputExists && !this.loginState.passwordFieldReady) {
                this.loginState.passwordFieldReady = true;
            } else if (!passwordInputExists) {
                throw new AuthenticationError("Neither continue button nor password input field found");
            }

            if (this.loginState.passwordFieldReady) {
                await this.inputService.handleInput(SELECTORS.LOGIN.PASSWORD_INPUT, password, {
                    isPassword: true,
                    preTypeDelay: TIMING.DELAYS.MEDIUM,
                    postTypeDelay: TIMING.DELAYS.MEDIUM,
                });
                this.loginState.passwordEntered = true;
                await delay(TIMING.DELAYS.LONG[1]);
            }

            try {
                const keepLoggedInCheckbox = await this.page.$(SELECTORS.LOGIN.KEEP_LOGGED_IN_CHECKBOX);
                if (keepLoggedInCheckbox) {
                    await this.inputService.handleCheckbox(SELECTORS.LOGIN.KEEP_LOGGED_IN_CHECKBOX, true);
                }
            } catch (error) {
                logger.warn({ checkboxError: error });
            }

            if (this.loginState.passwordEntered) {
                await this.inputService.handleButton(SELECTORS.LOGIN.LOGIN_CONTROL_CONTINUE_BUTTON, {
                    preClickDelay: TIMING.DELAYS.SHORT,
                    postClickDelay: TIMING.DELAYS.LONG,
                    waitForNavigation: true
                });

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
            }

            throw new AuthenticationError("Login verification failed");
        } catch (error) {
            logger.error(error);

            await this.page.screenshot({ path: "login-error.png" });
            const currentUrl = this.page.url();

            const visibleElements = await this.page.evaluate(() => {
                const elements = document.querySelectorAll('*');
                return Array.from(elements)
                    .filter(el => {
                        const style = window.getComputedStyle(el);
                        return style.display !== 'none' &&
                            style.visibility !== 'hidden' &&
                            style.opacity !== '0';
                    })
                    .map(el => ({
                        tag: el.tagName.toLowerCase(),
                        id: el.id,
                        classes: Array.from(el.classList),
                        type: el.getAttribute('type'),
                        value: el.getAttribute('value')
                    }));
            });

            logger.error({
                loginError: {
                    url: currentUrl,
                    visibleElements
                }
            });

            throw new AuthenticationError(
                `Login flow failed: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }
}
