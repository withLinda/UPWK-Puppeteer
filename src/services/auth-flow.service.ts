import { Page } from 'puppeteer';
import { InputService } from './input.service';
import { delay, getRandomDelayFromTuple } from '../utils/delay';
import { saveAuthData, loadAuthData, isLoggedIn } from './auth.service';
import { SELECTORS, TIMING, URLS } from '../config';
import { AuthenticationError } from '../utils/errors';

export class AuthFlowService {
    private inputService: InputService;

    constructor(private page: Page) {
        this.inputService = new InputService(page);
    }

    async handleCookieConsent(): Promise<void> {
        try {
            console.log("Starting cookie consent check...");

            // First check if the banner container exists and is visible
            console.log("Checking for cookie consent banner visibility...");
            const bannerVisible = await this.page.evaluate((): boolean => {
                console.log("Checking outer container (#onetrust-consent-sdk)...");
                const banner = document.querySelector<HTMLElement>('#onetrust-consent-sdk');
                if (!banner) {
                    console.log("Outer container not found");
                    return false;
                }

                console.log("Checking outer container visibility...");
                const bannerStyle = window.getComputedStyle(banner);
                if (bannerStyle.display === 'none' || bannerStyle.visibility === 'hidden') {
                    console.log("Outer container is hidden");
                    return false;
                }

                console.log("Checking inner banner (#onetrust-banner-sdk)...");
                const bannerSdk = banner.querySelector<HTMLElement>('#onetrust-banner-sdk');
                if (!bannerSdk) {
                    console.log("Inner banner not found");
                    return false;
                }

                console.log("Checking inner banner visibility...");
                const bannerSdkStyle = window.getComputedStyle(bannerSdk);
                const isVisible = bannerSdkStyle.display !== 'none' && bannerSdkStyle.visibility !== 'hidden';
                console.log(`Inner banner visibility: ${isVisible}`);
                return isVisible;
            });

            if (bannerVisible) {
                console.log("Cookie consent banner is visible and active");

                // Click the accept button
                console.log("Attempting to click 'Accept All' button...");
                const buttonClicked = await this.page.evaluate((): boolean => {
                    const acceptButton = document.querySelector<HTMLElement>(SELECTORS.COOKIE_CONSENT.ACCEPT_BUTTON);
                    if (acceptButton && acceptButton instanceof HTMLElement) {
                        console.log("'Accept All' button found, clicking...");
                        acceptButton.click();
                        return true;
                    }
                    console.log("'Accept All' button not found");
                    return false;
                });

                if (buttonClicked) {
                    console.log("'Accept All' button clicked successfully");

                    // Wait for banner to disappear
                    console.log("Waiting for banner to disappear...");
                    await this.page.waitForFunction(
                        (): boolean => {
                            console.log("Checking if banner is hidden...");
                            const banner = document.querySelector('#onetrust-consent-sdk');
                            if (!banner) {
                                console.log("Banner element no longer exists");
                                return true;
                            }

                            const bannerStyle = window.getComputedStyle(banner);
                            if (bannerStyle.display === 'none' || bannerStyle.visibility === 'hidden') {
                                console.log("Outer container is now hidden");
                                return true;
                            }

                            const bannerSdk = banner.querySelector('#onetrust-banner-sdk');
                            if (!bannerSdk) {
                                console.log("Inner banner no longer exists");
                                return true;
                            }

                            const bannerSdkStyle = window.getComputedStyle(bannerSdk);
                            const isHidden = bannerSdkStyle.display === 'none' || bannerSdkStyle.visibility === 'hidden';
                            console.log(`Inner banner hidden state: ${isHidden}`);
                            return isHidden;
                        },
                        { timeout: TIMING.ELEMENT_WAIT_TIMEOUT }
                    );

                    console.log("Cookie consent banner has been successfully hidden");
                } else {
                    console.log("Failed to click 'Accept All' button");
                }
            } else {
                console.log("No active cookie consent banner detected");
            }
        } catch (error) {
            console.log("Cookie consent handling error (non-critical):", error instanceof Error ? error.message : String(error));
        }
    }

    async handleSecurityQuestion(securityAnswer: string): Promise<boolean> {
        try {
            await this.page.waitForSelector('#login_answer', {
                visible: true,
                timeout: TIMING.ELEMENT_WAIT_TIMEOUT,
            });

            console.log("Security question detected");

            await this.inputService.handleInput('#login_answer', securityAnswer, {
                isPassword: true,
                preTypeDelay: TIMING.DELAYS.MEDIUM,
                postTypeDelay: TIMING.DELAYS.MEDIUM,
            });

            // Handle "Remember this device" checkbox
            try {
                const rememberDeviceCheckbox = await this.page.$('span[data-test="checkbox-input"]');
                if (rememberDeviceCheckbox) {
                    await this.inputService.moveMouseNaturally(rememberDeviceCheckbox);
                    await this.page.click('span[data-test="checkbox-input"]');
                    await delay(getRandomDelayFromTuple(TIMING.DELAYS.SHORT));
                }
            } catch (error) {
                console.log("Could not find or interact with 'Remember this device' checkbox");
            }

            const continueButton = await this.page.$(SELECTORS.LOGIN.PASSWORD_CONTINUE_BUTTON);
            if (continueButton) {
                await this.inputService.moveMouseNaturally(continueButton);
                await this.page.click(SELECTORS.LOGIN.PASSWORD_CONTINUE_BUTTON);
                await delay(getRandomDelayFromTuple(TIMING.DELAYS.LONG));
            }

            return true;
        } catch (error) {
            console.log(
                "No security question present or error handling it:",
                error instanceof Error ? error.message : String(error)
            );
            return false;
        }
    }

    async handleProfileModal(): Promise<void> {
        try {
            console.log("Checking for profile completion modal...");

            await this.page.waitForSelector(SELECTORS.MODALS.PROFILE_MODAL, {
                visible: true,
                timeout: TIMING.ELEMENT_WAIT_TIMEOUT,
            });

            for (const selector of SELECTORS.MODALS.CLOSE_BUTTONS) {
                try {
                    const closeButton = await this.page.$(selector);
                    if (closeButton) {
                        console.log(`Found close button with selector: ${selector}`);
                        await this.inputService.moveMouseNaturally(closeButton);
                        await this.page.click(selector);
                        await delay(getRandomDelayFromTuple(TIMING.DELAYS.MEDIUM));

                        const modalStillVisible = await this.page.evaluate((modalSel: string): boolean => {
                            const modal = document.querySelector(modalSel);
                            return modal ? window.getComputedStyle(modal).display !== "none" : false;
                        }, SELECTORS.MODALS.PROFILE_MODAL);

                        if (!modalStillVisible) {
                            console.log("Successfully closed profile completion modal");
                            break;
                        }
                    }
                } catch (err) {
                    console.log(
                        `Failed to close modal with selector ${selector}:`,
                        err instanceof Error ? err.message : String(err)
                    );
                }
            }
        } catch (error) {
            console.log(
                "No profile completion modal found or error closing it:",
                error instanceof Error ? error.message : String(error)
            );
        }
    }

    async handlePopovers(): Promise<void> {
        try {
            let keepTrying = true;
            let attempts = 0;
            const maxAttempts = 5;

            while (keepTrying && attempts < maxAttempts) {
                try {
                    console.log(`Checking for popovers (attempt ${attempts + 1})...`);

                    await this.page.waitForSelector(SELECTORS.POPOVERS.CLOSE_BUTTON, {
                        visible: true,
                        timeout: TIMING.ELEMENT_WAIT_TIMEOUT,
                    });

                    const closeButtons = await this.page.$$eval(
                        SELECTORS.POPOVERS.CLOSE_BUTTON,
                        (buttons: Element[]): number =>
                            buttons.filter((btn) => {
                                const style = window.getComputedStyle(btn);
                                return style.display !== "none" && style.visibility !== "hidden";
                            }).length
                    );

                    if (closeButtons === 0) {
                        console.log("No more visible popovers found");
                        keepTrying = false;
                        break;
                    }

                    for (let i = 0; i < closeButtons; i++) {
                        await this.page.evaluate(
                            (selector: string, index: number): void => {
                                const buttons = Array.from(document.querySelectorAll(selector));
                                const visibleButtons = buttons.filter((btn) => {
                                    const style = window.getComputedStyle(btn);
                                    return style.display !== "none" && style.visibility !== "hidden";
                                });
                                if (visibleButtons[index]) {
                                    (visibleButtons[index] as HTMLElement).click();
                                }
                            },
                            SELECTORS.POPOVERS.CLOSE_BUTTON,
                            i
                        );
                        await delay(getRandomDelayFromTuple(TIMING.DELAYS.SHORT));
                    }

                    try {
                        const gotItButton = await this.page.$(SELECTORS.POPOVERS.GOT_IT_BUTTON);
                        if (gotItButton) {
                            await this.inputService.moveMouseNaturally(gotItButton);
                            await this.page.click(SELECTORS.POPOVERS.GOT_IT_BUTTON);
                            await delay(getRandomDelayFromTuple(TIMING.DELAYS.SHORT));
                        }
                    } catch (e) {
                        console.log("No 'Got it' button found");
                    }
                } catch (error) {
                    console.log(`No popovers found on attempt ${attempts + 1}`);
                    keepTrying = false;
                }

                attempts++;
                await delay(getRandomDelayFromTuple(TIMING.DELAYS.MEDIUM));
            }

            const remainingPopovers = await this.page.$$(SELECTORS.POPOVERS.CLOSE_BUTTON);
            if (remainingPopovers.length > 0) {
                console.log("Warning: Some popovers might still be present");
            } else {
                console.log("All popovers successfully handled");
            }
        } catch (error) {
            console.log("Error handling popovers:", error instanceof Error ? error.message : String(error));
        }
    }

    async performLogin(email: string, password: string, securityAnswer: string): Promise<boolean> {
        try {
            await this.page.goto(URLS.LOGIN, {
                waitUntil: ["domcontentloaded", "networkidle0"],
            });

            await this.handleCookieConsent();

            // Handle email input
            await this.inputService.handleInput(SELECTORS.LOGIN.EMAIL_INPUT, email, {
                isPassword: false,
                preTypeDelay: TIMING.DELAYS.MEDIUM,
                postTypeDelay: TIMING.DELAYS.MEDIUM,
            });

            // Click continue after email
            const emailContinueButton = await this.page.$(SELECTORS.LOGIN.EMAIL_CONTINUE_BUTTON);
            if (emailContinueButton) {
                await this.inputService.moveMouseNaturally(emailContinueButton);
                await this.page.click(SELECTORS.LOGIN.EMAIL_CONTINUE_BUTTON);
                await delay(getRandomDelayFromTuple(TIMING.DELAYS.LONG));
            }

            // Handle password input
            await this.inputService.handleInput(SELECTORS.LOGIN.PASSWORD_INPUT, password, {
                isPassword: true,
                preTypeDelay: TIMING.DELAYS.MEDIUM,
                postTypeDelay: TIMING.DELAYS.MEDIUM,
            });

            // Handle "Keep me logged in" checkbox
            try {
                const keepLoggedInCheckbox = await this.page.$(SELECTORS.LOGIN.KEEP_LOGGED_IN_CHECKBOX);
                if (keepLoggedInCheckbox) {
                    await this.inputService.moveMouseNaturally(keepLoggedInCheckbox);
                    await this.page.click(SELECTORS.LOGIN.KEEP_LOGGED_IN_CHECKBOX);
                    await delay(getRandomDelayFromTuple(TIMING.DELAYS.SHORT));
                }
            } catch (error) {
                console.log("Could not find or interact with 'Keep me logged in' checkbox");
            }

            // Click continue after password
            const passwordContinueButton = await this.page.$(SELECTORS.LOGIN.PASSWORD_CONTINUE_BUTTON);
            if (passwordContinueButton) {
                await this.inputService.moveMouseNaturally(passwordContinueButton);
                await this.page.click(SELECTORS.LOGIN.PASSWORD_CONTINUE_BUTTON);
                await delay(getRandomDelayFromTuple(TIMING.DELAYS.LONG));
            }

            // Handle cookie consent again after password verification
            await this.handleCookieConsent();

            await this.handleSecurityQuestion(securityAnswer);
            await this.handleProfileModal();
            await this.handlePopovers();

            const isLoginSuccessful = await isLoggedIn(this.page);
            if (isLoginSuccessful) {
                await saveAuthData(this.page);
                await this.page.screenshot({ path: "login-success.png" });
                return true;
            }

            throw new AuthenticationError("Login verification failed");
        } catch (error) {
            console.error("Login flow failed:", error instanceof Error ? error.message : String(error));
            await this.page.screenshot({ path: "login-error.png" });
            throw new AuthenticationError(
                `Login flow failed: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    async attemptStoredLogin(): Promise<boolean> {
        try {
            const authLoaded = await loadAuthData(this.page);
            if (!authLoaded) {
                return false;
            }

            console.log("Auth data loaded, attempting to verify login status...");
            return await isLoggedIn(this.page);
        } catch (error) {
            throw new AuthenticationError(
                `Stored login attempt failed: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }
}
