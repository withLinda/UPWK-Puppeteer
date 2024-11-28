import { Page } from 'puppeteer';
import { InputService } from './input.service';
import { delay } from '../utils/delay';
import { loadAuthData } from './load-auth.service';
import { isLoggedIn } from './login-check.service';
import { SELECTORS, TIMING, URLS } from '../config';
import { AuthenticationError } from '../utils/errors';
import { handleCookieConsent } from '../handlers/cookie-consent.handler';
import { logger } from '../utils/logger';
import { ElementCheckerService } from './element-checker.service';
import { LoginStateService } from './login-state.service';
import { PostLoginHandlerService } from './post-login-handler.service';

export class AuthFlowService {
    private inputService: InputService;
    private elementChecker: ElementCheckerService;
    private loginState: LoginStateService;
    private postLoginHandler: PostLoginHandlerService;

    constructor(private page: Page) {
        this.inputService = new InputService(page);
        this.elementChecker = new ElementCheckerService(page);
        this.loginState = new LoginStateService();
        this.postLoginHandler = new PostLoginHandlerService(page);
        logger.info('AuthFlowService initialized');
    }

    async attemptStoredLogin(): Promise<boolean> {
        logger.info('Attempting stored login');
        try {
            const authLoaded = await loadAuthData(this.page);
            if (!authLoaded) {
                logger.info('No stored authentication data found');
                return false;
            }

            await this.page.goto(URLS.DASHBOARD, {
                waitUntil: ["domcontentloaded", "networkidle0"],
            });

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
            // Check if already logged in
            await this.page.goto(URLS.DASHBOARD, {
                waitUntil: ["domcontentloaded", "networkidle0"],
            });
            await delay(3000);

            if (await isLoggedIn(this.page)) {
                logger.info('User is already logged in');
                return true;
            }

            // Start login flow
            await this.page.goto(URLS.LOGIN, {
                waitUntil: ["domcontentloaded", "networkidle0"],
            });

            await handleCookieConsent(this.page);

            // Handle email input
            await this.inputService.handleInput(SELECTORS.LOGIN.EMAIL_INPUT, email, {
                isPassword: false,
                preTypeDelay: TIMING.DELAYS.MEDIUM,
                postTypeDelay: TIMING.DELAYS.MEDIUM,
            });
            this.loginState.setEmailVerified(true);

            // Handle password step
            const continueButtonExists = await this.elementChecker.elementExists(SELECTORS.LOGIN.LOGIN_PASSWORD_CONTINUE_BUTTON);
            const passwordInputExists = await this.elementChecker.elementExists(SELECTORS.LOGIN.PASSWORD_INPUT);

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
                this.loginState.setPasswordFieldReady(true);
            } else if (passwordInputExists) {
                this.loginState.setPasswordFieldReady(true);
            } else {
                throw new AuthenticationError("Neither continue button nor password input field found");
            }

            // Handle password input
            if (this.loginState.passwordFieldReady) {
                await this.inputService.handleInput(SELECTORS.LOGIN.PASSWORD_INPUT, password, {
                    isPassword: true,
                    preTypeDelay: TIMING.DELAYS.MEDIUM,
                    postTypeDelay: TIMING.DELAYS.MEDIUM,
                });
                this.loginState.setPasswordEntered(true);
                await delay(TIMING.DELAYS.LONG[1]);
            }

            // Handle "Keep me logged in" checkbox
            try {
                const keepLoggedInCheckbox = await this.page.$(SELECTORS.LOGIN.KEEP_LOGGED_IN_CHECKBOX);
                if (keepLoggedInCheckbox) {
                    await this.inputService.handleCheckbox(SELECTORS.LOGIN.KEEP_LOGGED_IN_CHECKBOX, true);
                }
            } catch (error) {
                logger.warn({ checkboxError: error });
            }

            // Submit login
            if (this.loginState.passwordEntered) {
                await this.inputService.handleButton(SELECTORS.LOGIN.LOGIN_CONTROL_CONTINUE_BUTTON, {
                    preClickDelay: TIMING.DELAYS.SHORT,
                    postClickDelay: TIMING.DELAYS.LONG,
                    waitForNavigation: true
                });

                return await this.postLoginHandler.handlePostLoginFlow(securityAnswer);
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
