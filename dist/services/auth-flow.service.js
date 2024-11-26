"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthFlowService = void 0;
const input_service_1 = require("./input.service");
const delay_1 = require("../utils/delay");
const save_auth_service_1 = require("./save-auth.service");
const load_auth_service_1 = require("./load-auth.service");
const login_check_service_1 = require("./login-check.service");
const config_1 = require("../config");
const errors_1 = require("../utils/errors");
const cookie_consent_handler_1 = require("../handlers/cookie-consent.handler");
const popup_handler_1 = require("../handlers/popup.handler");
const modal_handler_1 = require("../handlers/modal.handler");
const security_question_handler_1 = require("../handlers/security-question.handler");
const logger_1 = require("../utils/logger");
class AuthFlowService {
    constructor(page) {
        this.page = page;
        this.loginState = {
            emailVerified: false,
            passwordFieldReady: false,
            passwordEntered: false
        };
        this.inputService = new input_service_1.InputService(page);
        logger_1.logger.info('AuthFlowService initialized');
    }
    async elementExists(selector, timeout = config_1.TIMING.ELEMENT_WAIT_TIMEOUT) {
        try {
            const element = await this.page.waitForSelector(selector, {
                visible: true,
                timeout: timeout
            });
            const exists = element !== null;
            if (exists) {
                const elementState = await this.page.evaluate((sel) => {
                    const el = document.querySelector(sel);
                    if (!el)
                        return null;
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
                logger_1.logger.info({ elementCheck: { selector, exists, state: elementState } });
            }
            return exists;
        }
        catch (error) {
            logger_1.logger.info({ elementCheck: { selector, exists: false, error } });
            return false;
        }
    }
    async handleProfileModal() {
        logger_1.logger.info('Handling profile modal');
        await (0, modal_handler_1.handleProfileCompletionModal)(this.page);
    }
    async attemptStoredLogin() {
        logger_1.logger.info('Attempting stored login');
        try {
            const authLoaded = await (0, load_auth_service_1.loadAuthData)(this.page);
            if (!authLoaded) {
                logger_1.logger.info('No stored authentication data found');
                return false;
            }
            // Navigate directly to protected page to check login state
            await this.page.goto(config_1.URLS.DASHBOARD, {
                waitUntil: ["domcontentloaded", "networkidle0"],
            });
            // Wait a bit for any redirects
            await (0, delay_1.delay)(3000);
            const loginStatus = await (0, login_check_service_1.isLoggedIn)(this.page);
            logger_1.logger.info({ storedLoginVerification: loginStatus });
            return loginStatus;
        }
        catch (error) {
            logger_1.logger.error(error);
            return false;
        }
    }
    async performLogin(email, password, securityAnswer) {
        logger_1.logger.info({
            loginAttempt: {
                email: `${email.substring(0, 3)}...${email.substring(email.length - 3)}`,
                url: config_1.URLS.LOGIN
            }
        });
        try {
            // First try going directly to protected page
            await this.page.goto(config_1.URLS.DASHBOARD, {
                waitUntil: ["domcontentloaded", "networkidle0"],
            });
            // Wait a bit for any redirects
            await (0, delay_1.delay)(3000);
            // Check if we're already logged in
            const isAlreadyLoggedIn = await (0, login_check_service_1.isLoggedIn)(this.page);
            if (isAlreadyLoggedIn) {
                logger_1.logger.info('User is already logged in');
                return true;
            }
            // If not logged in, proceed with login flow
            await this.page.goto(config_1.URLS.LOGIN, {
                waitUntil: ["domcontentloaded", "networkidle0"],
            });
            await (0, cookie_consent_handler_1.handleCookieConsent)(this.page);
            await this.inputService.handleInput(config_1.SELECTORS.LOGIN.EMAIL_INPUT, email, {
                isPassword: false,
                preTypeDelay: config_1.TIMING.DELAYS.MEDIUM,
                postTypeDelay: config_1.TIMING.DELAYS.MEDIUM,
            });
            this.loginState.emailVerified = true;
            const continueButtonExists = await this.elementExists(config_1.SELECTORS.LOGIN.LOGIN_PASSWORD_CONTINUE_BUTTON);
            const passwordInputExists = await this.elementExists(config_1.SELECTORS.LOGIN.PASSWORD_INPUT);
            logger_1.logger.info({
                loginFlowState: {
                    continueButtonExists,
                    passwordInputExists,
                    loginState: this.loginState
                }
            });
            if (continueButtonExists && this.loginState.emailVerified) {
                await this.inputService.handleButton(config_1.SELECTORS.LOGIN.LOGIN_PASSWORD_CONTINUE_BUTTON, {
                    preClickDelay: config_1.TIMING.DELAYS.SHORT,
                    postClickDelay: config_1.TIMING.DELAYS.LONG,
                });
                const passwordInputAppeared = await this.page.waitForSelector(config_1.SELECTORS.LOGIN.PASSWORD_INPUT, {
                    visible: true,
                    timeout: config_1.TIMING.ELEMENT_WAIT_TIMEOUT
                });
                if (!passwordInputAppeared) {
                    throw new errors_1.AuthenticationError("Password input field did not appear after clicking continue button");
                }
                this.loginState.passwordFieldReady = true;
            }
            else if (passwordInputExists && !this.loginState.passwordFieldReady) {
                this.loginState.passwordFieldReady = true;
            }
            else if (!passwordInputExists) {
                throw new errors_1.AuthenticationError("Neither continue button nor password input field found");
            }
            if (this.loginState.passwordFieldReady) {
                await this.inputService.handleInput(config_1.SELECTORS.LOGIN.PASSWORD_INPUT, password, {
                    isPassword: true,
                    preTypeDelay: config_1.TIMING.DELAYS.MEDIUM,
                    postTypeDelay: config_1.TIMING.DELAYS.MEDIUM,
                });
                this.loginState.passwordEntered = true;
                await (0, delay_1.delay)(config_1.TIMING.DELAYS.LONG[1]);
            }
            try {
                const keepLoggedInCheckbox = await this.page.$(config_1.SELECTORS.LOGIN.KEEP_LOGGED_IN_CHECKBOX);
                if (keepLoggedInCheckbox) {
                    await this.inputService.handleCheckbox(config_1.SELECTORS.LOGIN.KEEP_LOGGED_IN_CHECKBOX, true);
                }
            }
            catch (error) {
                logger_1.logger.warn({ checkboxError: error });
            }
            if (this.loginState.passwordEntered) {
                await this.inputService.handleButton(config_1.SELECTORS.LOGIN.LOGIN_CONTROL_CONTINUE_BUTTON, {
                    preClickDelay: config_1.TIMING.DELAYS.SHORT,
                    postClickDelay: config_1.TIMING.DELAYS.LONG,
                    waitForNavigation: true
                });
                // Handle post-login checks in sequence, continuing regardless of individual results
                await (0, cookie_consent_handler_1.handleCookieConsent)(this.page);
                // Security question is optional, continue flow regardless of result
                await (0, security_question_handler_1.handleSecurityQuestion)(this.page, securityAnswer).catch(error => {
                    logger_1.logger.warn({
                        securityQuestionSkipped: {
                            message: error instanceof Error ? error.message : String(error)
                        }
                    });
                });
                // Continue with modal and popup checks
                await this.handleProfileModal().catch(error => {
                    logger_1.logger.warn({
                        profileModalSkipped: {
                            message: error instanceof Error ? error.message : String(error)
                        }
                    });
                });
                await (0, popup_handler_1.handlePopovers)(this.page).catch(error => {
                    logger_1.logger.warn({
                        popoversSkipped: {
                            message: error instanceof Error ? error.message : String(error)
                        }
                    });
                });
                // Navigate to protected page to verify login
                await this.page.goto(config_1.URLS.DASHBOARD, {
                    waitUntil: ["domcontentloaded", "networkidle0"],
                });
                // Wait a bit for any redirects
                await (0, delay_1.delay)(3000);
                const isLoginSuccessful = await (0, login_check_service_1.isLoggedIn)(this.page);
                logger_1.logger.info({ loginVerification: isLoginSuccessful });
                if (isLoginSuccessful) {
                    await (0, save_auth_service_1.saveAuthData)(this.page);
                    await this.page.screenshot({ path: "login-success.png" });
                    return true;
                }
            }
            throw new errors_1.AuthenticationError("Login verification failed");
        }
        catch (error) {
            logger_1.logger.error(error);
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
            logger_1.logger.error({
                loginError: {
                    url: currentUrl,
                    visibleElements
                }
            });
            throw new errors_1.AuthenticationError(`Login flow failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
exports.AuthFlowService = AuthFlowService;
//# sourceMappingURL=auth-flow.service.js.map