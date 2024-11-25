"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCookieConsent = handleCookieConsent;
exports.handlePopovers = handlePopovers;
const delay_1 = require("../utils/delay");
const input_1 = require("../utils/input");
async function handleCookieConsent(page) {
    try {
        await page.evaluate(() => {
            const button = document.querySelector("#onetrust-banner-sdk #onetrust-accept-btn-handler");
            if (button && button instanceof HTMLElement) {
                if (window.getComputedStyle(button).display !== "none") {
                    button.click();
                    return true;
                }
            }
            return false;
        });
        await page.waitForFunction(() => {
            const banner = document.querySelector("#onetrust-banner-sdk");
            return !banner || window.getComputedStyle(banner).display === "none";
        }, { timeout: 5000 });
    }
    catch (error) {
        console.log("Cookie consent handling error (non-critical):", error instanceof Error ? error.message : String(error));
    }
}
async function handlePopovers(page) {
    try {
        const popoverCloseSelector = "button[data-cy='nav-popover-close-btn']";
        let keepTrying = true;
        let attempts = 0;
        const maxAttempts = 5;
        while (keepTrying && attempts < maxAttempts) {
            try {
                console.log(`Checking for popovers (attempt ${attempts + 1})...`);
                await page.waitForSelector(popoverCloseSelector, {
                    visible: true,
                    timeout: 5000,
                });
                const closeButtons = await page.$$eval(popoverCloseSelector, (buttons) => buttons.filter((btn) => {
                    const style = window.getComputedStyle(btn);
                    return style.display !== "none" && style.visibility !== "hidden";
                }).length);
                if (closeButtons === 0) {
                    console.log("No more visible popovers found");
                    keepTrying = false;
                    break;
                }
                for (let i = 0; i < closeButtons; i++) {
                    await page.evaluate((selector, index) => {
                        const buttons = Array.from(document.querySelectorAll(selector));
                        const visibleButtons = buttons.filter((btn) => {
                            const style = window.getComputedStyle(btn);
                            return (style.display !== "none" && style.visibility !== "hidden");
                        });
                        if (visibleButtons[index]) {
                            visibleButtons[index].click();
                        }
                    }, popoverCloseSelector, i);
                    await (0, delay_1.delay)((0, delay_1.randomDelay)(500, 1000));
                }
                const gotItSelector = "button.air3-btn.air3-btn-primary";
                try {
                    const gotItButton = await page.$(gotItSelector);
                    if (gotItButton) {
                        await (0, input_1.moveMouseInNaturalWay)(page, gotItButton);
                        await page.click(gotItSelector);
                        await (0, delay_1.delay)((0, delay_1.randomDelay)(500, 1000));
                    }
                }
                catch (e) {
                    console.log("No 'Got it' button found");
                }
            }
            catch (error) {
                console.log(`No popovers found on attempt ${attempts + 1}`);
                keepTrying = false;
            }
            attempts++;
            await (0, delay_1.delay)((0, delay_1.randomDelay)(1000, 2000));
        }
        const remainingPopovers = await page.$$(popoverCloseSelector);
        if (remainingPopovers.length > 0) {
            console.log("Warning: Some popovers might still be present");
        }
        else {
            console.log("All popovers successfully handled");
        }
    }
    catch (error) {
        console.log("Error handling popovers:", error instanceof Error ? error.message : String(error));
    }
}
//# sourceMappingURL=popup.handler.js.map