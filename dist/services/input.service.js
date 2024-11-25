"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InputService = void 0;
const delay_1 = require("../utils/delay");
const config_1 = require("../config");
const errors_1 = require("../utils/errors");
class InputService {
    constructor(page) {
        this.page = page;
    }
    async moveMouseNaturally(element) {
        try {
            const box = await element.boundingBox();
            if (!box) {
                throw new errors_1.InputError('Failed to get element bounding box');
            }
            const targetX = box.x + box.width / 2 + Math.random() * 20 - 10;
            const targetY = box.y + box.height / 2 + Math.random() * 10 - 5;
            const steps = Math.floor(Math.random() * 5) + 5;
            await this.page.mouse.move(targetX, targetY, { steps });
            await (0, delay_1.delay)((0, delay_1.getRandomDelayFromTuple)(config_1.TIMING.DELAYS.SHORT));
        }
        catch (error) {
            throw new errors_1.InputError(`Failed to move mouse: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async typeNaturally(text, isPassword = false) {
        try {
            console.log(`Starting to type ${isPassword ? "password" : "text"}...`);
            for (const char of text) {
                await this.page.keyboard.type(char);
                const delayRange = !isPassword && (char === "@" || char === ".")
                    ? config_1.TIMING.DELAYS.TYPE.SPECIAL_CHAR
                    : config_1.TIMING.DELAYS.TYPE.NORMAL_CHAR;
                await (0, delay_1.delay)((0, delay_1.getRandomDelayFromTuple)(delayRange));
            }
            console.log("Typing complete, waiting for input to settle...");
            await (0, delay_1.delay)((0, delay_1.getRandomDelayFromTuple)(config_1.TIMING.DELAYS.MEDIUM));
        }
        catch (error) {
            throw new errors_1.InputError(`Failed to type text: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async verifyInputValue(selector, expectedValue, timeout = config_1.INPUT_CONFIG.VERIFICATION_TIMEOUT) {
        const startTime = Date.now();
        let lastValue = "";
        while (Date.now() - startTime < timeout) {
            const currentValue = await this.page.evaluate((sel) => {
                const input = document.querySelector(sel);
                return input ? input.value : "";
            }, selector);
            if (currentValue === expectedValue) {
                return true;
            }
            if (currentValue !== lastValue) {
                console.log("Current input value:", currentValue);
                lastValue = currentValue;
            }
            await (0, delay_1.delay)(100);
        }
        return false;
    }
    async verifyCheckboxState(selector, expectedState = true, timeout = config_1.INPUT_CONFIG.VERIFICATION_TIMEOUT) {
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            const isChecked = await this.page.evaluate((sel) => {
                const checkbox = document.querySelector(sel);
                return checkbox ? checkbox.checked : false;
            }, selector);
            if (isChecked === expectedState) {
                console.log(`Checkbox state verified: ${isChecked}`);
                return true;
            }
            await (0, delay_1.delay)(100);
        }
        console.log(`Failed to verify checkbox state. Expected: ${expectedState}, Actual: ${await this.page.evaluate((sel) => {
            const checkbox = document.querySelector(sel);
            return checkbox ? checkbox.checked : false;
        }, selector)}`);
        return false;
    }
    async handleCheckbox(selector, expectedState = true) {
        try {
            const checkbox = await this.page.waitForSelector(selector, {
                visible: true,
                timeout: config_1.TIMING.ELEMENT_WAIT_TIMEOUT,
            });
            if (!checkbox) {
                throw new errors_1.InputError('Checkbox element not found');
            }
            const currentState = await this.page.evaluate((sel) => {
                const element = document.querySelector(sel);
                return element ? element.checked : false;
            }, selector);
            if (currentState !== expectedState) {
                await this.moveMouseNaturally(checkbox);
                await this.page.click(selector);
                await (0, delay_1.delay)((0, delay_1.getRandomDelayFromTuple)(config_1.TIMING.DELAYS.SHORT));
            }
            const isVerified = await this.verifyCheckboxState(selector, expectedState);
            if (!isVerified) {
                throw new errors_1.InputError('Failed to verify checkbox state after clicking');
            }
            return true;
        }
        catch (error) {
            throw new errors_1.InputError(`Failed to handle checkbox: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async handleInput(selector, value, options = {}) {
        const { preTypeDelay = config_1.TIMING.DELAYS.MEDIUM, postTypeDelay = config_1.TIMING.DELAYS.MEDIUM, maxAttempts = config_1.INPUT_CONFIG.MAX_ATTEMPTS, isPassword = false } = options;
        let attempts = 0;
        while (attempts < maxAttempts) {
            try {
                const element = await this.page.waitForSelector(selector, {
                    visible: true,
                    timeout: config_1.TIMING.ELEMENT_WAIT_TIMEOUT,
                });
                if (!element) {
                    throw new errors_1.InputError('Input element not found');
                }
                // Clear the field
                await this.page.evaluate((sel) => {
                    const input = document.querySelector(sel);
                    if (input) {
                        input.value = "";
                        input.dispatchEvent(new Event("input", { bubbles: true }));
                    }
                }, selector);
                await (0, delay_1.delay)((0, delay_1.getRandomDelayFromTuple)(preTypeDelay));
                await this.moveMouseNaturally(element);
                await this.page.click(selector);
                await (0, delay_1.delay)((0, delay_1.getRandomDelayFromTuple)(config_1.TIMING.DELAYS.SHORT));
                await this.typeNaturally(value, isPassword);
                const isValueSet = await this.verifyInputValue(selector, value);
                if (!isValueSet) {
                    console.log(`${isPassword ? 'Password' : 'Input'} verification failed. Using fallback...`);
                    // Fallback method
                    await this.page.evaluate((sel, text) => {
                        const input = document.querySelector(sel);
                        if (input) {
                            input.value = text;
                            input.dispatchEvent(new Event("input", { bubbles: true }));
                            input.dispatchEvent(new Event("change", { bubbles: true }));
                        }
                    }, selector, value);
                    await (0, delay_1.delay)(1000);
                    const finalValue = await this.page.evaluate((sel) => {
                        const input = document.querySelector(sel);
                        return input ? input.value : "";
                    }, selector);
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
                    await (0, delay_1.delay)((0, delay_1.getRandomDelayFromTuple)(config_1.TIMING.DELAYS.MEDIUM));
                }
            }
            catch (error) {
                console.error(`Error handling input field (Attempt ${attempts + 1}):`, error instanceof Error ? error.message : String(error));
                attempts++;
                if (attempts >= maxAttempts) {
                    throw new errors_1.InputError(`Failed to handle input after ${maxAttempts} attempts: ${error instanceof Error ? error.message : String(error)}`);
                }
                await (0, delay_1.delay)((0, delay_1.getRandomDelayFromTuple)(config_1.TIMING.DELAYS.MEDIUM));
            }
        }
        throw new errors_1.InputError(`Failed to verify input after ${maxAttempts} attempts`);
    }
    async fillForm(formData) {
        for (const { selector, value, isPassword } of formData) {
            try {
                await this.handleInput(selector, value, { isPassword });
            }
            catch (error) {
                throw new errors_1.InputError(`Failed to fill form field ${selector}: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        return true;
    }
}
exports.InputService = InputService;
//# sourceMappingURL=input.service.js.map