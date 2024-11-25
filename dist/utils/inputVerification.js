"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitForInputValue = void 0;
exports.handleInputField = handleInputField;
exports.handleEmailInput = handleEmailInput;
exports.handlePasswordInput = handlePasswordInput;
const delay_1 = require("./delay");
const input_1 = require("./input");
Object.defineProperty(exports, "waitForInputValue", { enumerable: true, get: function () { return input_1.waitForInputValue; } });
async function handleInputField(page, selector, value, options = {}) {
    const { preTypeDelay = [800, 1500], postTypeDelay = [1000, 2000], maxAttempts = 3, isPassword = false } = options;
    let attempts = 0;
    while (attempts < maxAttempts) {
        try {
            // Wait for the input element
            const element = await page.waitForSelector(selector, {
                visible: true,
                timeout: 10000,
            });
            if (!element) {
                throw new Error('Input element not found');
            }
            // Clear the input field
            await page.evaluate((sel) => {
                const input = document.querySelector(sel);
                if (input) {
                    input.value = "";
                    input.dispatchEvent(new Event("input", { bubbles: true }));
                }
            }, selector);
            // Pre-type delay
            await (0, delay_1.delay)((0, delay_1.randomDelay)(...preTypeDelay));
            // Move mouse and click
            await (0, input_1.moveMouseInNaturalWay)(page, element);
            await page.click(selector);
            await (0, delay_1.delay)((0, delay_1.randomDelay)(300, 600));
            // Type the value
            await (0, input_1.typeWithNaturalSpeed)(page, value, isPassword);
            // Verify input value
            const isValueSet = await (0, input_1.waitForInputValue)(page, selector, value, 10000);
            if (!isValueSet) {
                console.log(`${isPassword ? 'Password' : 'Input'} verification failed. Using fallback method...`);
                // Fallback method
                await page.evaluate((sel, text) => {
                    const input = document.querySelector(sel);
                    if (input) {
                        input.value = text;
                        input.dispatchEvent(new Event("input", { bubbles: true }));
                        input.dispatchEvent(new Event("change", { bubbles: true }));
                    }
                }, selector, value);
                await (0, delay_1.delay)(1000);
                // Verify one last time
                const finalValue = await page.evaluate((sel) => {
                    const input = document.querySelector(sel);
                    return input ? input.value : "";
                }, selector);
                if (isPassword) {
                    console.log("Final password value after fallback:", "*".repeat(finalValue.length));
                }
                else {
                    console.log("Final input value after fallback:", finalValue);
                }
                if (finalValue === value) {
                    return true;
                }
            }
            else {
                return true;
            }
            attempts++;
            if (attempts < maxAttempts) {
                console.log(`Retrying input... (Attempt ${attempts + 1}/${maxAttempts})`);
                await (0, delay_1.delay)(2000);
            }
        }
        catch (error) {
            console.error(`Error handling input field (Attempt ${attempts + 1}):`, error instanceof Error ? error.message : String(error));
            attempts++;
            if (attempts >= maxAttempts) {
                throw new Error(`Failed to handle input after ${maxAttempts} attempts: ${error instanceof Error ? error.message : String(error)}`);
            }
            await (0, delay_1.delay)(2000);
        }
    }
    throw new Error(`Failed to verify input after ${maxAttempts} attempts`);
}
async function handleEmailInput(page, selector, value, options = {}) {
    return handleInputField(page, selector, value, {
        ...options,
        isPassword: false
    });
}
async function handlePasswordInput(page, selector, value, options = {}) {
    return handleInputField(page, selector, value, {
        ...options,
        isPassword: true
    });
}
//# sourceMappingURL=inputVerification.js.map