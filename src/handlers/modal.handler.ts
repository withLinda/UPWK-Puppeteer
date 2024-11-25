import { Page } from 'puppeteer';
import { delay, getRandomDelayFromTuple } from '../utils/delay';
import { TIMING, SELECTORS } from '../config';
import { InputService } from '../services/input.service';

export async function handleSecurityQuestionModal(
    page: Page,
    securityAnswer: string
): Promise<boolean> {
    try {
        const inputService = new InputService(page);

        await page.waitForSelector(SELECTORS.LOGIN.SECURITY_QUESTION_INPUT, {
            visible: true,
            timeout: TIMING.ELEMENT_WAIT_TIMEOUT,
        });

        console.log("Security question detected");

        await inputService.handleInput(SELECTORS.LOGIN.SECURITY_QUESTION_INPUT, securityAnswer, {
            isPassword: false,
            preTypeDelay: TIMING.DELAYS.MEDIUM,
            postTypeDelay: TIMING.DELAYS.MEDIUM,
        });

        try {
            const keepLoggedInCheckbox = await page.$(SELECTORS.LOGIN.KEEP_LOGGED_IN_CHECKBOX);
            if (keepLoggedInCheckbox) {
                await inputService.moveMouseNaturally(keepLoggedInCheckbox);
                await page.click(SELECTORS.LOGIN.KEEP_LOGGED_IN_CHECKBOX);
                await delay(getRandomDelayFromTuple(TIMING.DELAYS.SHORT));
            }
        } catch (error) {
            console.log("Could not find or interact with 'Keep me logged in' checkbox");
        }

        const continueButton = await page.$(SELECTORS.LOGIN.PASSWORD_CONTINUE_BUTTON);
        if (continueButton) {
            await inputService.moveMouseNaturally(continueButton);
            await page.click(SELECTORS.LOGIN.PASSWORD_CONTINUE_BUTTON);
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

export async function handleProfileCompletionModal(page: Page): Promise<void> {
    try {
        console.log("Checking for profile completion modal...");

        await page.waitForSelector(SELECTORS.MODALS.PROFILE_MODAL, {
            visible: true,
            timeout: TIMING.ELEMENT_WAIT_TIMEOUT,
        });

        const inputService = new InputService(page);

        for (const selector of SELECTORS.MODALS.CLOSE_BUTTONS) {
            try {
                const closeButton = await page.$(selector);
                if (closeButton) {
                    console.log(`Found close button with selector: ${selector}`);
                    await inputService.moveMouseNaturally(closeButton);
                    await page.click(selector);
                    await delay(getRandomDelayFromTuple(TIMING.DELAYS.MEDIUM));

                    const modalStillVisible = await page.evaluate((modalSel: string): boolean => {
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
